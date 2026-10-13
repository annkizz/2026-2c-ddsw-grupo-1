import { z } from "zod";

export const celularRegex = /^\+\d{10,15}$/ ;

export const medioWhatsappSchema = z.object({
      tipoDeContacto: z.literal("WHATSAPP"),
      contacto: z.string().regex(celularRegex), // TODO: agregar mensaje de error
    });

export const medioSMSSchema = z.object({
      tipoDeContacto: z.literal("SMS"),
      contacto: z.string().regex(celularRegex),
    });

export const medioEmailSchema = z.object({
        tipoDeContacto: z.literal("SMS"),
        contacto: z.string().regex(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i),
    });

export const medioDeContactoSchema = 
    z.discriminatedUnion("tipoDeContacto", [
        medioWhatsappSchema,
        medioSMSSchema,
        medioEmailSchema,
      ]) ;
