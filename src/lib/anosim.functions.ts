import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const GERMANY_COUNTRY_ID = 98;
export const FULL_SERVICE_DURATION_MINUTES = 43200; // 30 Tage

export type AnosimNumberRow = {
  orderBookingId: number;
  number: string;
  country: string;
  rentalType: string;
  service: string;
  startDate: string;
  endDate: string;
  durationInMinutes: number;
  priceInUSD: number | null;
  state: string;
  note: string | null;
};

export type AnosimSmsRow = {
  simCardNumber: string;
  messageDate: string;
  messageSender: string;
  messageText: string;
};

export type AnosimProductInfo = {
  productId: number;
  price: number;
  availableCount: number;
  country: string;
  durationInMinutes: number;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) throw new Error("Rolle konnte nicht geprüft werden.");
  if (!data) throw new Error("Kein Adminzugriff.");
}

export const getAnosimBalance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ balance: number }> => {
    await assertAdmin(context.supabase, context.userId);
    const { anosimFetch } = await import("./anosim.server");
    const data = await anosimFetch<{ accountBalanceInUSD: number }>("/Balance");
    return { balance: Number(data?.accountBalanceInUSD ?? 0) };
  });

export const listAnosimNumbers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnosimNumberRow[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { anosimFetch, AnosimError } = await import("./anosim.server");

    let bookings: import("./anosim.server").AnosimBooking[] | null = null;
    try {
      bookings = await anosimFetch<import("./anosim.server").AnosimBooking[]>(
        "/OrderBookings",
      );
    } catch (err) {
      // Ein leeres Konto meldet AnoSIM mit 400 "No OrderBooking found".
      if (
        err instanceof AnosimError &&
        err.status === 400 &&
        err.detail.toLowerCase().includes("no orderbooking")
      ) {
        bookings = [];
      } else {
        throw err;
      }
    }

    const list = Array.isArray(bookings) ? bookings : [];


    const { data: notes } = await context.supabase
      .from("anosim_numbers")
      .select("order_booking_id, note");

    const noteMap = new Map<number, string | null>(
      (notes ?? []).map((row: { order_booking_id: number; note: string | null }) => [
        Number(row.order_booking_id),
        row.note,
      ]),
    );

    return list
      .map((booking) => ({
        orderBookingId: booking.id,
        number: booking.number,
        country: booking.country,
        rentalType: booking.rentalType,
        service: booking.service ?? "",
        startDate: booking.startDate,
        endDate: booking.endDate,
        durationInMinutes: booking.durationInMinutes,
        priceInUSD: booking.priceInUSD ?? null,
        state: booking.state,
        note: noteMap.get(booking.id) ?? null,
      }))
      .sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      );
  });

export const listAnosimSms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ orderBookingId: z.number().int().positive() }).parse(data),
  )
  .handler(async ({ data, context }): Promise<AnosimSmsRow[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { anosimFetch, AnosimError } = await import("./anosim.server");
    try {
      const sms = await anosimFetch<import("./anosim.server").AnosimSms[]>(
        `/Sms/${data.orderBookingId}`,
      );
      return Array.isArray(sms) ? sms : [];
    } catch (err) {
      if (err instanceof AnosimError && err.status === 400) return [];
      throw err;
    }
  });


export const getAnosimFullServiceProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnosimProductInfo> => {
    await assertAdmin(context.supabase, context.userId);
    const { anosimFetch } = await import("./anosim.server");

    type ProductPrice = import("./anosim.server").AnosimProductPrice;

    const isFullService = (product: ProductPrice) =>
      product.rentalType === "RentalFull" &&
      product.durationInMinutes === FULL_SERVICE_DURATION_MINUTES;

    let match: ProductPrice | undefined;

    for (const rentalTypeId of [2, 3, 1, 4]) {
      const products = await anosimFetch<ProductPrice[]>("/ProductPrices", {
        countryId: GERMANY_COUNTRY_ID,
        rentalTypeId,
      });
      const list = Array.isArray(products) ? products : [];
      match = list.find(isFullService);
      if (match) break;
    }


    if (!match) {
      throw new Error(
        "Aktuell ist keine deutsche FullService-Nummer für 30 Tage verfügbar.",
      );
    }

    const available = match.priceMap?.reduce((sum, entry) => {
      const any = entry.providers?.find((provider) => provider.providerId === 0);
      return sum + (any?.availableCount ?? 0);
    }, 0);

    return {
      productId: match.id,
      price: Number(match.basePrice ?? 0),
      availableCount: Number(available ?? match.totalCount ?? 0),
      country: match.country,
      durationInMinutes: match.durationInMinutes,
    };
  });

export const buyAnosimNumber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ productId: z.number().int().positive() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { anosimFetch } = await import("./anosim.server");

    const order = await anosimFetch<{
      id: number;
      priceInUSD: number;
      bookings: import("./anosim.server").AnosimBooking[];
    }>(
      "/Orders",
      { productId: data.productId, amount: 1, providerId: 0 },
      { method: "POST" },
    );

    const bookings = order?.bookings ?? [];

    if (bookings.length > 0) {
      await context.supabase.from("anosim_numbers").upsert(
        bookings.map((booking) => ({
          order_booking_id: booking.id,
          number: booking.number,
          created_by: context.userId,
        })),
        { onConflict: "order_booking_id" },
      );
    }

    return {
      ok: true,
      numbers: bookings.map((booking) => booking.number),
    };
  });

export const setAnosimNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        orderBookingId: z.number().int().positive(),
        number: z.string().trim().max(50).optional(),
        note: z.string().max(5000).nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { error } = await context.supabase.from("anosim_numbers").upsert(
      {
        order_booking_id: data.orderBookingId,
        number: data.number ?? null,
        note: data.note,
        created_by: context.userId,
      },
      { onConflict: "order_booking_id" },
    );

    if (error) throw new Error("Notiz konnte nicht gespeichert werden.");
    return { ok: true };
  });
