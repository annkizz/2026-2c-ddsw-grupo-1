import { z } from "zod";
import { BadRequestError } from "../errors/AppError.js";
import { ColaboradorService } from "../services/ColaboradorService.js";

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


export const colaboradorSchema = z
  .object({
    nombreFantasia: z.string().optional(),
    usuarioGitHub: z.string().optional(),
    nombre: z.string().optional(),
    apellido: z.string().optional(),
    presentacion: z.string().min(1),
    pronombres: z.array(z.string()).min(1),
    habilidades: z.array(z.string()).min(1),
    aceptaMensajeria: z.boolean(),
    mediosDeContacto: z.array(z.discriminatedUnion("tipoDeContacto", [
        medioWhatsappSchema,
        medioSMSSchema,
        medioEmailSchema,
      ])).default([]),
  })
  .strict();

export class ColaboradorController {
  constructor(colaboradorService = new ColaboradorService()) {
    this.colaboradorService = colaboradorService;
  }

  crear(req, res) {
    const colaboradorNuevo = this.colaboradorService.crear(req.body);
    res.status(201).json(colaboradorNuevo);
  }

  obtenerTodos = (req, res) => {
    const colaboradores = this.colaboradorService.obtenerTodos();
    res.status(200).json(colaboradores);
  };
}
