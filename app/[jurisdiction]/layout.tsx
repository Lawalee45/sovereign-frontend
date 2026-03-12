import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getJurisdictionConfig } from "@/lib/jurisdictions";

export default function JurisdictionLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { jurisdiction: string };
}) {
  const { jurisdiction } = params;

  if (!["uk", "us", "uae"].includes(jurisdiction)) {
    redirect("/login");
  }

  // Accessing config here ensures invalid codes fallback is not relied on.
  getJurisdictionConfig(jurisdiction);

  return <>{children}</>;
}

