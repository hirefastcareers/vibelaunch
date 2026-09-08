import { z } from "zod";

export const shipUpdateSchema = z.object({
  projectId: z.string().cuid(),
  update: z.string().min(1).max(500),
  tone: z.enum(["professional", "casual", "hype", "technical"]).optional(),
  /** When true, also publish the drafted post to X immediately. Default false. */
  publishToX: z.boolean().optional(),
});

export type ShipUpdateInput = z.infer<typeof shipUpdateSchema>;

/** Short changelog-style title from a founder update. */
export function deriveShipTitle(update: string): string {
  const trimmed = update.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Product update";
  const withoutTrail = trimmed.replace(/[.!?]+$/, "");
  if (withoutTrail.length <= 80) return withoutTrail;
  return `${withoutTrail.slice(0, 77).trimEnd()}...`;
}
