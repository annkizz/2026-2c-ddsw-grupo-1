const FECHA_RE = /^(\d{4})-(\d{2})-(\d{2})/;

const fechaLocal = (valor) => {
  if (!valor) return null;

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }

  const coincidencia = String(valor).match(FECHA_RE);
  if (coincidencia) {
    const [, anio, mes, dia] = coincidencia;
    const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
    if (
      fecha.getFullYear() !== Number(anio) ||
      fecha.getMonth() !== Number(mes) - 1 ||
      fecha.getDate() !== Number(dia)
    ) {
      return null;
    }
    return fecha;
  }

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
};

const fechaComoInput = (fecha) => {
  if (!fecha) return '';
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

export const formatearFecha = (valor) => {
  const fecha = fechaLocal(valor);
  if (!fecha) return null;
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
};

export const aInputFecha = (valor) => fechaComoInput(fechaLocal(valor));

export const aIso = (valor) => {
  const fecha = fechaLocal(valor);
  if (!fecha) return null;
  return `${fechaComoInput(fecha)}T00:00:00.000Z`;
};

export const esFechaFutura = (valor) => {
  const fecha = fechaLocal(valor);
  if (!fecha) return false;
  const hoy = fechaLocal(new Date());
  return fecha > hoy;
};
