// src/mapper/types.ts
export interface OpRisk {
  id: string;
  title: string;
  description?: string;
  owner?: string;
  mitigation?: string;
  likelihood: number | string | null | undefined; // tolerate mixed inputs
  impact: number | string | null | undefined;     // tolerate mixed inputs
  loeId?: string | null;
  phaseId?: string | null;
}
