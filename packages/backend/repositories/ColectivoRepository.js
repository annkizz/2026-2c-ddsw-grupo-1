export class ColectivoRepository {
  constructor() {
    this.colectivos = [];
  }

  obtenerTodos() {
    return this.colectivos;
  }

  encontrarPorId(id) {
    return this.colectivos.find((unColectivo) => unColectivo.id === id);
  }

  save(unColectivo) {
    const indice = this.colectivos.findIndex((p) => p.id === unColectivo.id);
    if (indice === -1) {
      this.colectivos.push(unColectivo);
      return unColectivo;
    }
    this.colectivos[indice] = unColectivo;
    return unColectivo;
  }
}
