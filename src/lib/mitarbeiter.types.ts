export type AuftragStatus = "offen" | "erfolgreich" | "fehlgeschlagen";

export type WorkAuftrag = {
  id: string;
  auftrag_id: string;
  name: string;
  logo_path: string | null;
  ident_type: "videoident" | "postident" | "email" | null;
  besonderheiten: string | null;
  images: string[];
  sort_order: number;
  login_name: string | null;
  password: string | null;
  status: AuftragStatus;
  used_login_name: string | null;
  used_password: string | null;
  webid_link: string | null;
  postident_link: string | null;
};

export type WorkItem = {
  id: string;
  first_name: string;
  last_name: string;
  birth_name: string | null;
  birth_date: string | null;
  birth_place: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  marital_status: string | null;
  tax_id: string | null;
  bank: string | null;
  notes: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  email_street: string | null;
  email_postal_code: string | null;
  email_city: string | null;
  email_birth_date: string | null;
  email_address: string | null;
  phone_number: string | null;
  phone_end_date: string | null;
  phone_order_booking_id: number | null;
  auftraege: WorkAuftrag[];
  created_at: string;
};
