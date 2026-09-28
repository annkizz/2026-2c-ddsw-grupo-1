import {z}  from "zod";
import { PerfilService } from "../services/PerfilService.js";

export const perfilSchema = z
    .object({
        descripcion: z.string().min(1),
        habilidadesRequeridas: z.array(z.string()).min(1),
        habilidadesOpcionales: z.array(z.string()).default([]), // si no pone nada, el array es vacio
        compromiso: z.object({
            tipoCompromiso: z.enum(["TOTALES", "MENSUALES", "SEMANALES"]),
            horas: z.int(),
            tipoColaboracion: z.enum(["GRATUITA", "INCENTIVO", "CONTRATACION"])
        })
    })
    .strict();

export class PerfilController {
    constructor(perfilService = new PerfilService()) {
        this.perfilService = perfilService;
    }

    obtener = async (req,res) => {
        const perfiles = await this.perfilService.obtenerTodos(req.params.id)
        res.status(200).json(perfiles);
    }

    crear = async (req,res) => {
        const perfilNuevo = await this.perfilService.crear(req.params.id, req.body);
        res.status(201).json(perfilNuevo);
    }

    eliminar = async (req, res) => {
        await this.perfilService.eliminar(req.params.id, req.params.perfilId);
        res.status(204).send();
    }
}