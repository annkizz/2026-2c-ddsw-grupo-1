import { z } from "zod";

export const notificacionSchema = z
  .object({
    contenido: z.string().trim().min(4),
    idColectivo: z.string().trim().min(1),
    idColaborador: z.string().trim().min(1),
  })
  .strict();

export const notificacionFiltroSchema = z
  .object({
    idColectivo: z.string().trim().min(1).optional(),
    idColaborador: z.string().trim().min(1).optional(),
  })
  .strict();