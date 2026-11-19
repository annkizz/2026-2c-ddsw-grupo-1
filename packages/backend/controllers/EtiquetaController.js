import { EtiquetaService } from "../services/EtiquetaService.js";

export class EtiquetaController {
  constructor(etiquetaService = new EtiquetaService()) {
    this.etiquetaService = etiquetaService;
  }

  obtenerTodas = async (req, res) => {
    const etiquetas = await this.etiquetaService.obtenerTodas();
    res.status(200).json(etiquetas);
  };
}
