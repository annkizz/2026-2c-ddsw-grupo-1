import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[\da-f]{24}$/i);

export const notificacionSchema = z
  .object({
    contenido: z.string().trim().min(4).max(2000),
    idColaborador: objectIdSchema,
  })
  .strict();

export const notificacionPaginasSchema = z
  .object({
    pag: z.coerce.number().int().positive().default(1),
    limite: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();
