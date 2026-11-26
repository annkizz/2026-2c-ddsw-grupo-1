import cron from "node-cron";

// Un solo lugar para todas las tareas programadas del backend. Cada tarea:
//  - corre según su expresión cron;
//  - nunca se superpone consigo misma (si la anterior sigue corriendo, se saltea esta);
//  - si falla, lo registra y sigue: no tira abajo el proceso ni frena las próximas corridas;
//  - deja en el log cuánto tardó, solo cuando hizo algo (la tarea devuelve un resumen).
export class Planificador {
  constructor({
    programador = cron,
    logger = console,
    reloj = () => Date.now(),
  } = {}) {
    this.programador = programador;
    this.logger = logger;
    this.reloj = reloj;
    this.tareas = new Map(); // nombre -> { expresionCron, ejecutar, ejecutando, programada }
  }

  agregar(nombre, expresionCron, ejecutar) {
    if (this.tareas.has(nombre))
      throw new Error(`La tarea "${nombre}" ya existe`);
    if (!this.programador.validate(expresionCron)) {
      throw new Error(
        `Expresión cron inválida para "${nombre}": ${expresionCron}`,
      );
    }
    this.tareas.set(nombre, {
      expresionCron,
      ejecutar,
      ejecutando: false,
      programada: null,
    });
    return this;
  }

  // Corre una tarea ya mismo (la usan los tests y sirve para forzarla a mano).
  async ejecutar(nombre) {
    const tarea = this.tareas.get(nombre);
    if (!tarea) throw new Error(`No existe la tarea "${nombre}"`);
    if (tarea.ejecutando) {
      this.logger.log(
        `[tareas] ${nombre}: la corrida anterior sigue en curso, se omite esta`,
      );
      return null;
    }
    tarea.ejecutando = true;
    const inicio = this.reloj();
    try {
      const resumen = await tarea.ejecutar();
      if (resumen)
        this.logger.log(
          `[tareas] ${nombre}: ${resumen} (${this.reloj() - inicio} ms)`,
        );
      return resumen;
    } catch (error) {
      this.logger.error(`[tareas] ${nombre} falló: ${error.message}`);
      return null;
    } finally {
      tarea.ejecutando = false; // se libera siempre, aunque la corrida falle
    }
  }

  iniciar() {
    for (const [nombre, tarea] of this.tareas) {
      tarea.programada = this.programador.schedule(tarea.expresionCron, () =>
        this.ejecutar(nombre),
      );
      this.logger.log(
        `[tareas] ${nombre} programada: "${tarea.expresionCron}"`,
      );
    }
    return () => this.detener();
  }

  detener() {
    for (const tarea of this.tareas.values()) tarea.programada?.stop();
  }
}
