import { z } from "zod";

const objectIdSchema = z.string().trim().regex(/^[\da-f]{24}$/i);

export const notificacionSchema = z
  .object({
    contenido: z.string().trim().min(4),
    idColectivo: objectIdSchema,
    idColaborador: objectIdSchema,
  })
  .strict();

export const notificacionFiltroSchema = z
  .object({
    idColectivo: objectIdSchema.optional(),
    idColaborador: objectIdSchema.optional(),
  })
  .strict();
