import type { AuftragStatus } from "@/lib/mitarbeiter.types";

export type VicAuftrag = {
  id: string;
  auftrag_id: string;
  auftrag_name: string;
  logo_path: string | null;
  admin_only: boolean;
  ident_type?: string | null;
  login_name: string | null;
  password: string | null;
  status: AuftragStatus;
  used_login_name: string | null;
  used_password: string | null;
  webid_link: string | null;
  postident_link: string | null;
  completed_at: string | null;
};
