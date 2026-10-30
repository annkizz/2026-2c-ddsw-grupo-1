// Para los logs: nunca se escribe un mail o teléfono completo.
export function enmascarar(contacto = "") {
  if (contacto.length <= 5) return "***";
  return `${contacto.slice(0, 2)}***${contacto.slice(-3)}`;
}
