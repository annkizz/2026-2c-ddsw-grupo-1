import cron from "node-cron";

export function iniciarRecalculoMatching(
  matchingService,
  { expresionCron = "0 3 * * *", programador = cron, logger = console } = {},
) {
  let ejecutando = false;

  const tick = async () => {
    if (ejecutando) {
      logger.log(
        "Recalculo de matching: la corrida anterior sigue en curso, se omite esta",
      );
      return;
    }

    ejecutando = true;
    try {
      await matchingService.recalcularTodas();
      logger.log("Recalculo de matching completado");
    } catch (error) {
      logger.error(`Error en el recalculo de matching: ${error.message}`);
    } finally {
      ejecutando = false;
    }
  };

  const tarea = programador.schedule(expresionCron, tick);
  return () => tarea.stop();
}
