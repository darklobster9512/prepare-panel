import { ClipboardList, GraduationCap } from "lucide-react";

import type { NavItem } from "@/components/panel-shell";

export function mitarbeiterNav(onboardingEnabled?: boolean): NavItem[] {
  const nav: NavItem[] = [
    { label: "Aufträge", icon: ClipboardList, to: "/mitarbeiter/auftraege" },
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
