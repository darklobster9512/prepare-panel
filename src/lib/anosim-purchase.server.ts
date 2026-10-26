import { anosimFetch, AnosimError } from "./anosim.server";
import type { AnosimBooking, AnosimProductPrice } from "./anosim.server";

export const GERMANY_COUNTRY_ID = 98;
export const FULL_SERVICE_DURATION_MINUTES = 43200; // 30 Tage

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function findFullServiceProduct() {
  let match: AnosimProductPrice | undefined;
  for (const rentalTypeId of [2, 3, 1, 4]) {
    const products = await anosimFetch<AnosimProductPrice[]>("/ProductPrices", {
      countryId: GERMANY_COUNTRY_ID,
      rentalTypeId,
    });
    const list = Array.isArray(products) ? products : [];
    match = list.find(
      (p) =>
        p.rentalType === "RentalFull" && p.durationInMinutes === FULL_SERVICE_DURATION_MINUTES,
    );
    if (match) break;
  }
  if (!match) {
    throw new Error("Aktuell ist keine deutsche FullService-Nummer für 30 Tage verfügbar.");
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
}

/** Kauft eine Nummer und speichert sie (die neueste wird dem Vic zugewiesen). */
export async function purchaseNumber(
  supabase: any,
  productId: number,
  vicId: string | null,
  createdBy: string | null,
): Promise<string[]> {
  const loadBookings = async (): Promise<AnosimBooking[]> => {
    try {
      const result = await anosimFetch<AnosimBooking[]>("/OrderBookings");
      return Array.isArray(result) ? result : [];
    } catch (err) {
      if (err instanceof AnosimError && err.status === 400) return [];
      throw err;
    }
  };

  const before = await loadBookings();
  const knownIds = new Set(before.map((booking) => booking.id));

  const order = await anosimFetch<{ id?: number; bookings?: AnosimBooking[] }>(
    "/Orders",
    { productId, amount: 1, providerId: 0 },
    { method: "POST" },
  );

  let fresh: AnosimBooking[] = (order?.bookings ?? []).filter(
    (booking) => booking && typeof booking.id === "number",
  );

  for (let attempt = 0; attempt < 3 && fresh.length === 0; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1500));
    const after = await loadBookings();
    fresh = after.filter((booking) => !knownIds.has(booking.id));
  }

  if (fresh.length === 0) {
    throw new Error(
      "Der Kauf wurde ausgelöst, aber AnoSIM hat noch keine Nummer geliefert. Bitte die Liste unter Telefonnummern in einem Moment aktualisieren.",
    );
  }

  fresh.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const { error } = await supabase.from("anosim_numbers").upsert(
    fresh.map((booking, index) => ({
      order_booking_id: booking.id,
      number: booking.number,
      end_date: booking.endDate ?? null,
      vic_id: index === 0 ? vicId : null,
      created_by: createdBy,
    })),
    { onConflict: "order_booking_id" },
  );

  if (error) {
    throw new Error(
      `Nummer ${fresh[0]?.number ?? ""} wurde gekauft, konnte aber nicht gespeichert werden.`,
    );
  }
  for (const booking of fresh) {
    await ensureShareLinkForBooking(supabase, booking.id);
  }
  return fresh.map((booking) => booking.number);
}

/**
 * Erzeugt den AnoSIM-Share-Link einmalig und speichert ihn. Ein bereits
 * gespeicherter Link wird immer wiederverwendet (ein neuer Aufruf würde den
 * alten Token ungültig machen). Wirft nie.
 */
export async function ensureShareLinkForBooking(
  supabase: any,
  orderBookingId: number,
): Promise<string | null> {
  try {
    const { data: row } = await supabase
      .from("anosim_numbers")
      .select("id, share_link")
      .eq("order_booking_id", orderBookingId)
      .maybeSingle();
    if (!row) return null;
    if (row.share_link) return row.share_link as string;

    const res = await anosimFetch<{ weblink?: string }>(
      `/OrderBookingShare/${orderBookingId}`,
      {},
      { method: "POST" },
    );
    if (!res?.weblink) return null;
    const { error } = await supabase
      .from("anosim_numbers")
      .update({ share_link: res.weblink })
      .eq("id", row.id);
    if (error) {
      console.error("[anosim] share link speichern", error.message);
      return null;
    }
    return res.weblink;
  } catch (err) {
    console.error("[anosim] share link erzeugen", err);
    return null;
  }
}
