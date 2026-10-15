export class HabilidadProyecto {
  constructor(titulo, descripcion = "") {
    this.titulo = String(titulo ?? "").trim();
    this.descripcion = String(descripcion ?? "").trim();
  }
}
