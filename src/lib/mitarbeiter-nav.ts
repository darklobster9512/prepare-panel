import { ClipboardList, GraduationCap, Info, Wallet } from "lucide-react";

import type { NavItem } from "@/components/panel-shell";

export function mitarbeiterNav(onboardingEnabled?: boolean): NavItem[] {
  const nav: NavItem[] = [
    { label: "Aufträge", icon: ClipboardList, to: "/mitarbeiter/auftraege" },
    { label: "Abrechnung", icon: Wallet, to: "/mitarbeiter/abrechnung" },
    { label: "Informationen", icon: Info, to: "/mitarbeiter/informationen" },
  ];
  if (onboardingEnabled) {
    nav.push({
      label: "Onboarding",
      icon: GraduationCap,
      to: "/mitarbeiter/onboarding",
    });
  }
  return nav;
}
