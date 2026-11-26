import { z } from "zod";

export const paginacionSchema = z.object({
  pag: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().min(1).max(6).default(6),
});
