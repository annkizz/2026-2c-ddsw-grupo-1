import { z } from "zod";
import { medioDeContactoSchema } from "../schemas/zod/medioDeContactoSchema";

export const notificacionSchema = z .object ({
    fecha: z.string(), // TODO
    contenido: z.string().trim().min(4),
    idColectivo: z.string().length(36), 
    idColaborador: z.string().length(36),
    medioDeContacto: medioDeContactoSchema
})