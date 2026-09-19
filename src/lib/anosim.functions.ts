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

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

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
    const data = await anosimFetch<{ accountBalanceInUSD: number | string }>(
      "/Balance",
    );
    return { balance: toNumber(data?.accountBalanceInUSD) ?? 0 };
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
        priceInUSD: toNumber(booking.priceInUSD),
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

    const available = (match.priceMap ?? []).reduce((sum, entry) => {
      const any = entry.providers?.find((provider) => provider.providerId === 0);
      return sum + (toNumber(any?.availableCount) ?? 0);
    }, 0);

    return {
      productId: match.id,
      price: toNumber(match.basePrice) ?? 0,
      availableCount: available || (toNumber(match.totalCount) ?? 0),
      country: match.country,
      durationInMinutes: match.durationInMinutes,
    };
  });

export const listAssignableNumbers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{ orderBookingId: number; number: string; endDate: string }[]> => {
      await assertAdmin(context.supabase, context.userId);
      const { anosimFetch, AnosimError } = await import("./anosim.server");

      let bookings: import("./anosim.server").AnosimBooking[] = [];
      try {
        const result = await anosimFetch<import("./anosim.server").AnosimBooking[]>(
          "/OrderBookings",
        );
        bookings = Array.isArray(result) ? result : [];
      } catch (err) {
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

      const { data: rows } = await context.supabase
        .from("anosim_numbers")
        .select("order_booking_id, vic_id")
        .not("vic_id", "is", null);

      const taken = new Set<number>(
        (rows ?? []).map((row: { order_booking_id: number }) =>
          Number(row.order_booking_id),
        ),
      );

      const now = Date.now();
      return bookings
        .filter(
          (booking) =>
            !taken.has(booking.id) &&
            (!booking.endDate || new Date(booking.endDate).getTime() > now),
        )
        .map((booking) => ({
          orderBookingId: booking.id,
          number: booking.number,
          endDate: booking.endDate,
        }));
    },
  );

export const assignNumberToVic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        vicId: z.string().uuid(),
        orderBookingId: z.number().int().positive(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { data: existing } = await context.supabase
      .from("anosim_numbers")
      .select("id, vic_id")
      .eq("order_booking_id", data.orderBookingId)
      .maybeSingle();

    if (existing?.vic_id && existing.vic_id !== data.vicId) {
      throw new Error("Diese Nummer ist bereits einem anderen Datensatz zugewiesen.");
    }

    const { anosimFetch, AnosimError } = await import("./anosim.server");
    let number: string | null = null;
    let endDate: string | null = null;
    try {
      const bookings = await anosimFetch<import("./anosim.server").AnosimBooking[]>(
        "/OrderBookings",
      );
      const booking = (Array.isArray(bookings) ? bookings : []).find(
        (item) => item.id === data.orderBookingId,
      );
      number = booking?.number ?? null;
      endDate = booking?.endDate ?? null;
    } catch (err) {
      if (!(err instanceof AnosimError)) throw err;
    }

    const { error } = await context.supabase.from("anosim_numbers").upsert(
      {
        order_booking_id: data.orderBookingId,
        vic_id: data.vicId,
        created_by: context.userId,
        ...(number ? { number } : {}),
        ...(endDate ? { end_date: endDate } : {}),
      },
      { onConflict: "order_booking_id" },
    );

    if (error) throw new Error("Nummer konnte nicht zugewiesen werden.");
    return { ok: true, number, endDate };
  });

export const unassignNumberFromVic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ vicId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { error } = await context.supabase
      .from("anosim_numbers")
      .update({ vic_id: null })
      .eq("vic_id", data.vicId);

    if (error) throw new Error("Zuweisung konnte nicht entfernt werden.");
    return { ok: true };
  });

export const buyAnosimNumber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        productId: z.number().int().positive(),
        vicId: z.string().uuid().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { anosimFetch, AnosimError } = await import("./anosim.server");

    type Booking = import("./anosim.server").AnosimBooking;

    const loadBookings = async (): Promise<Booking[]> => {
      try {
        const result = await anosimFetch<Booking[]>("/OrderBookings");
        return Array.isArray(result) ? result : [];
      } catch (err) {
        if (err instanceof AnosimError && err.status === 400) return [];
        throw err;
      }
    };

    const before = await loadBookings();
    const knownIds = new Set(before.map((booking) => booking.id));

    const order = await anosimFetch<{
      id?: number;
      bookings?: Booking[];
    }>(
      "/Orders",
      { productId: data.productId, amount: 1, providerId: 0 },
      { method: "POST" },
    );

    // Die Kaufantwort ist je nach Produkt unterschiedlich aufgebaut – deshalb
    // wird die Buchung anschließend zuverlässig aus der Kontoliste geholt.
    let fresh: Booking[] = (order?.bookings ?? []).filter(
      (booking) => booking && typeof booking.id === "number",
    );

    if (fresh.length === 0) {
      for (let attempt = 0; attempt < 3 && fresh.length === 0; attempt += 1) {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
        const after = await loadBookings();
        fresh = after.filter((booking) => !knownIds.has(booking.id));
      }
    }

    if (fresh.length === 0) {
      throw new Error(
        "Der Kauf wurde ausgelöst, aber AnoSIM hat noch keine Nummer geliefert. Bitte die Liste unter Telefonnummern in einem Moment aktualisieren.",
      );
    }

    fresh.sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );

    const { error } = await context.supabase.from("anosim_numbers").upsert(
      fresh.map((booking, index) => ({
        order_booking_id: booking.id,
        number: booking.number,
        end_date: booking.endDate ?? null,
        vic_id: index === 0 ? (data.vicId ?? null) : null,
        created_by: context.userId,
      })),
      { onConflict: "order_booking_id" },
    );

    if (error) {
      throw new Error(
        `Nummer ${fresh[0]?.number ?? ""} wurde gekauft, konnte aber nicht gespeichert werden.`,
      );
    }

    return {
      ok: true,
      numbers: fresh.map((booking) => booking.number),
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
