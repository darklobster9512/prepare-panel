const BASE_URL = "https://anosim.net/api/v1";

export async function anosimFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  init: RequestInit = {},
): Promise<T> {
  const apiKey = process.env["ANOSIM_API_KEY"];
  if (!apiKey) {
    throw new Error("AnoSIM-API-Schlüssel ist nicht hinterlegt.");
  }

  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new Error("AnoSIM ist derzeit nicht erreichbar.");
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error("AnoSIM-API-Schlüssel ist ungültig.");
  }

  const text = await response.text();

  if (!response.ok) {
    const detail = text.slice(0, 200).trim();
    throw new Error(
      detail
        ? `AnoSIM-Fehler (${response.status}): ${detail}`
        : `AnoSIM-Fehler (${response.status}).`,
    );
  }

  if (!text) return null as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Unerwartete Antwort von AnoSIM.");
  }
}

export type AnosimBooking = {
  id: number;
  number: string;
  country: string;
  rentalType: string;
  service: string;
  startDate: string;
  endDate: string;
  durationInMinutes: number;
  priceInUSD?: number;
  state: string;
  extentionForId?: number | null;
};

export type AnosimSms = {
  simCardNumber: string;
  messageDate: string;
  messageSender: string;
  messageText: string;
};

export type AnosimPriceMapEntry = {
  price: number;
  providers: { providerId: number; name: string; availableCount: number }[];
};

export type AnosimProductPrice = {
  id: number;
  country: string;
  rentalType: string;
  service: string;
  durationInMinutes: number;
  basePrice: number;
  totalCount: number;
  priceMap: AnosimPriceMapEntry[];
};
