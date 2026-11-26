import { Planificador } from "./Planificador.js";

// Todas las tareas programadas del backend y cada cuánto corren. Cada horario se puede cambiar
// con una variable de entorno (formato cron: minuto hora día mes día-de-la-semana).
export const HORARIOS_POR_DEFECTO = {
  // Las fechas de cierre se eligen por día: revisar una vez por hora alcanza (antes: cada minuto).
  CRON_CIERRE_AUTOMATICO: "5 * * * *",
  // Revisa la cola de cambios del matching. Si no hay nada, es una sola consulta.
  // Procesa cuando se juntan MATCHING_UMBRAL_CAMBIOS cambios o pasan MATCHING_ESPERA_MAXIMA_MIN.
  CRON_MATCHING: "*/5 * * * *",
  // Reconstrucción completa de seguridad, una vez por semana (domingo 4 AM) en vez de todas las noches.
  CRON_MATCHING_COMPLETO: "0 4 * * 0",
};

const horario = (config, clave) => config[clave] || HORARIOS_POR_DEFECTO[clave];

export function crearTareasProgramadas(
  { proyectoService, matchingService },
  { config = process.env, ...opcionesPlanificador } = {},
) {
  return new Planificador(opcionesPlanificador)
    .agregar("cierre automático de proyectos", horario(config, "CRON_CIERRE_AUTOMATICO"), async () => {
      const { cerrados, fallidos } = await proyectoService.cerrarProyectosVencidos();
      for (const { idProyecto, error } of fallidos) {
        console.error(`[tareas] Error cerrando el proyecto ${idProyecto}: ${error}`);
      }
      return cerrados.length > 0 ? `cerrados ${cerrados.join(", ")}` : null;
    })
    .agregar("matching: procesar cambios", horario(config, "CRON_MATCHING"), async () => {
      const resultado = await matchingService.procesarCambiosPendientes();
      if (!resultado.procesado) return null;
      return `${resultado.perfiles} perfiles y ${resultado.colaboradoras} colaboradoras recalculados`;
    })
    .agregar("matching: reconstrucción semanal", horario(config, "CRON_MATCHING_COMPLETO"), async () => {
      await matchingService.reconstruirTodo();
      return "completa";
    });
}
