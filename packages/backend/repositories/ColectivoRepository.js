export class ColectivoRepository {
  constructor() {
    this.colectivos = [];
  }

  obtenerTodos() {
    return this.colectivos;
  }

  encontrarPorId = (id) => {
    return this.colectivos.find((unColectivo) => unColectivo.idColectivo === id);
  }

  save(unColectivo) {
    const indice = this.colectivos.findIndex((p) => p.idColectivo === unColectivo.idColectivo);
    if (indice === -1) {
      this.colectivos.push(unColectivo);
      return unColectivo;
    }
    this.colectivos[indice] = unColectivo;
    return unColectivo;
  }
}
