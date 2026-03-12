export type VaultState = "LOCKED" | "CAPTURING" | "REVIEWED" | "EXPORT_READY";

export function deriveVaultState(
  isActive: boolean,
  blockCount: number,
  hasAudit: boolean,
  hasProfSignoff: boolean
): VaultState {
  if (!isActive || blockCount === 0) return "LOCKED";
  if (!hasAudit) return "CAPTURING";
  if (!hasProfSignoff) return "REVIEWED";
  return "EXPORT_READY";
}

