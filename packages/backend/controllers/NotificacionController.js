import { z } from "zod";

export const notificacionSchema = z .object ({
    fecha: z.string(), // TODO
    contenido: z.string.trim().min(4),
    idColectivo: z.string().length(36), 
    idColaborador: z.string().length(36),
    medioDeContacto: z.object({
            tipoDeContacto: z.string(),
            contacto: z.string().min(1)
        }).optional()
})