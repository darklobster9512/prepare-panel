import type { AuftragStatus } from "@/lib/mitarbeiter.types";

export type VicAuftrag = {
  id: string;
  auftrag_id: string;
  auftrag_name: string;
  logo_path: string | null;
  login_name: string | null;
  password: string | null;
  status: AuftragStatus;
};
