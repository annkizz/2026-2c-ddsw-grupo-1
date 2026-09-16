export class ColaboradorRepository {
  constructor() {
    this.colaboradores = [];
  }

  obtenerTodos() {
    return this.colaboradores;
  }

  encontrarPorId(idColaborador) {
    return this.colaboradores.find(
      (colaborador) => colaborador.idColaborador === idColaborador,
    );
  }

  save(unColaborador) {
    const indice = this.colaboradores.findIndex(
      (colaborador) =>
        this.colaboradores.idColaborador === unColaborador.idColaborador,
    );

    if (indice === -1) {
      this.colaboradores.push(unColaborador);
      return unColaborador;
    }

    this.colaboradores[indice] = unColaborador;
    return unColaborador;
  }
}
