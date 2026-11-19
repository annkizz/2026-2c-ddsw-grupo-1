import { paginacionSchema } from "../schemas/zod/paginacionSchema.js";
import { BadRequestError } from "../errors/AppError.js";

export class MatchingController {
  constructor(matchingService) {
    this.matchingService = matchingService;
  }

  buscarColaboradoras = async (req, res) => {
    let pag;
    let limite;
    if (req.query.pag !== undefined || req.query.limite !== undefined) {
      const paginacion = paginacionSchema.safeParse(req.query);
      if (!paginacion.success) {
        throw new BadRequestError(
          "Los parámetros de paginación son inválidos",
          "PAGINACION_INVALIDA",
        );
      }
      pag = paginacion.data.pag;
      limite = paginacion.data.limite;
    }
    const { idProyecto, id } = req.params;
    const resultados = await this.matchingService.buscarColaboradorasParaPerfil(
      idProyecto,
      id,
      pag,
      limite,
    );
    res.status(200).json(resultados);
  };

  buscarProyectos = async (req, res) => {
    let pag;
    let limite;
    if (req.query.pag !== undefined || req.query.limite !== undefined) {
      const paginacion = paginacionSchema.safeParse(req.query);
      if (!paginacion.success) {
        throw new BadRequestError(
          "Los parámetros de paginación son inválidos",
          "PAGINACION_INVALIDA",
        );
      }
      pag = paginacion.data.pag;
      limite = paginacion.data.limite;
    }
    const resultados =
      await this.matchingService.buscarProyectosParaColaboradora(
        req.params.id,
        pag,
        limite,
      );
    res.status(200).json(resultados);
  };
}
