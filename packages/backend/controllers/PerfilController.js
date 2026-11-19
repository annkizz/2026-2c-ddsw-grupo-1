import { z } from "zod";
import { PerfilService } from "../services/PerfilService.js";

export const perfilBaseSchema = z
  .object({
    descripcion: z.string().min(1),
    habilidadesRequeridas: z.array(z.string()).min(1),
    habilidadesOpcionales: z.array(z.string()).default([]), // si no pone nada, el array es vacio
    limiteColaboraciones: z.int().min(1).nullable().default(null),
    compromiso: z.object({
      tipoCompromiso: z.enum(["TOTALES", "MENSUALES", "SEMANALES"]),
      horas: z.int().min(1),
      tipoColaboracion: z.enum(["GRATUITA", "INCENTIVO", "CONTRATACION"]),
    }),
  });

export const perfilSchema = z.discriminatedUnion("tipoAceptacion", [
        perfilBaseSchema.extend({ 
          tipoAceptacion: z.literal("LLENAR_VACANTES"),
          limiteColaboraciones: z.int().positive().min(1),}),
        
        perfilBaseSchema.extend({
          tipoAceptacion: z.literal("SIN_LIMITE"),
          limiteColaboraciones: z.null().default(null),
        }),

        perfilBaseSchema.extend({
          tipoAceptacion: z.literal("MANUAL"),
          limiteColaboraciones: z.int().positive().default(null),})

]);

export class PerfilController {
  constructor(perfilService = new PerfilService()) {
    this.perfilService = perfilService;
  }

  obtener = async (req, res) => {
    const perfiles = await this.perfilService.obtenerTodos(
      req.params.idProyecto,
    );
    res.status(200).json(perfiles);
  };

  crear = async (req, res) => {
    const perfilNuevo = await this.perfilService.crear(
      req.params.idProyecto,
      req.body,
      req.usuario,
    );
    res.status(201).json(perfilNuevo);
  };

  eliminar = async (req, res) => {
    await this.perfilService.eliminar(
      req.params.idProyecto,
      req.params.id,
      req.usuario,
    );
    res.status(204).send();
  };

  obtenerPorId = async (req, res) => {
    const perfil = await this.perfilService.obtenerPorId(
      req.params.idProyecto,
      req.params.id,
    );
    res.status(200).json(perfil);
  };

  actualizar = async (req, res) => {
    const perfil = await this.perfilService.actualizar(
      req.params.idProyecto,
      req.params.id,
      req.body,
      req.usuario,
    );
    res.status(200).json(perfil);
  };
}
