export type JurisdictionCode = "uk" | "us" | "uae";

export interface JurisdictionConfig {
  label: string;
  regime: string;
  benefitRate: number;
  currency: string;
  symbol: string;
  heroLabel: string;
  competentProfText: string;
  accentColor: string;
}

export const jurisdictions: Record<JurisdictionCode, JurisdictionConfig> = {
  uk: {
    label: "United Kingdom",
    regime: "HMRC R&D Tax Relief",
    benefitRate: 0.33,
    currency: "GBP",
    symbol: "£",
    heroLabel: "AI-Audited R&D Value",
    competentProfText:
      "I confirm I am a competent professional with relevant scientific or technical expertise and that the technical narrative in this report accurately reflects the R&D activities undertaken by this company.",
    accentColor: "#003153"
  },
  us: {
    label: "United States",
    regime: "IRS Section 41 R&D Credit",
    benefitRate: 0.2,
    currency: "USD",
    symbol: "$",
    heroLabel: "Qualified Research Expenditure",
    competentProfText:
      "I certify under penalty of perjury that the technical information contained in this report is true, correct, and complete to the best of my knowledge and belief.",
    accentColor: "#002868"
  },
  uae: {
    label: "UAE / Saudi Arabia",
    regime: "FTA Corporate Tax / ZATCA",
    benefitRate: 0.5,
    currency: "AED",
    symbol: "AED ",
    heroLabel: "Qualifying R&D Expenditure",
    competentProfText:
      "I confirm as technical director that the activities described herein represent genuine research and development expenditure qualifying under FTA Corporate Tax guidelines.",
    accentColor: "#003153"
  }
};

export function getJurisdictionConfig(code: string): JurisdictionConfig {
  return jurisdictions[code as JurisdictionCode] ?? jurisdictions.uk;
}

