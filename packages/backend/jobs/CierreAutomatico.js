import cron from "node-cron";

export function iniciarCierreAutomatico(
  proyectoService,
  { expresionCron = "* * * * *", programador = cron, logger = console } = {},
) {
  let ejecutando = false;

  const tick = async () => {
    if (ejecutando) {
      logger.log("Cierre automático: la corrida anterior sigue en curso, se omite esta");
      return;
    }

    ejecutando = true;
    try {
      const { cerrados, fallidos } = await proyectoService.cerrarProyectosVencidos();

      if (cerrados.length > 0) {
        logger.log(`Cierre automático de proyectos: ${cerrados.join(", ")}`);
      }
      for (const { idProyecto, error } of fallidos) {
        logger.error(`Error cerrando el proyecto ${idProyecto}: ${error}`);
      }
    } catch (error) {
      // Un fallo no debe tirar abajo el proceso ni frenar las próximas corridas.
      logger.error(`Error en el cierre automático: ${error.message}`);
    } finally {
      ejecutando = false; // se libera siempre, aunque la corrida falle
    }
  };

  const tarea = programador.schedule(expresionCron, tick);

  return () => tarea.stop();
}