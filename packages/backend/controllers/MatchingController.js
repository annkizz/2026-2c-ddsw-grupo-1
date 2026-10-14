export class MatchingController {
  constructor(matchingService) {
    this.matchingService = matchingService;
  }

  buscarColaboradoras = async (req, res) => {
    const { id, idPerfil } = req.params;
    const resultados = await this.matchingService.buscarColaboradorasParaPerfil(
      id,
      idPerfil,
    );
    res.status(200).json(resultados);
  };

  buscarProyectos = async (req, res) => {
    const resultados =
      await this.matchingService.buscarProyectosParaColaboradora(req.params.id);
    res.status(200).json(resultados);
  };
}
