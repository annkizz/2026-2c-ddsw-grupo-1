import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, CircularProgress, TextField } from '@mui/material';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useListado } from '../../hooks/useListado';
import { configurarDestacado } from '../../service/proyectosService';
import { mensajeDeError } from '../../service/api';
import './ProyectosDestacados.css';

const DURACION_DESTACADO_DIAS = 7;

function fechaParaInput(fecha) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return '';
  const local = new Date(valor.getTime() - valor.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fechaPredeterminada() {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + DURACION_DESTACADO_DIAS);
  return fechaParaInput(fecha);
}

function formatoFecha(fecha) {
  if (!fecha) return '';
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(valor);
}

export default function ProyectosDestacados() {
  const { getAccessToken } = useAuth();
  const proyectosState = useListado('/proyectos?estado=ACTIVO');
  const [fechas, setFechas] = useState({});
  const [guardandoId, setGuardandoId] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (proyectosState.datos.length === 0) return;

    setFechas((actuales) => {
      const siguientes = { ...actuales };
      proyectosState.datos.forEach((proyecto) => {
        if (siguientes[proyecto.id] === undefined) {
          siguientes[proyecto.id] = fechaParaInput(
            proyecto.destacadoHasta ||
              new Date(Date.now() + DURACION_DESTACADO_DIAS * 24 * 60 * 60 * 1000),
          );
        }
      });
      return siguientes;
    });
  }, [proyectosState.datos]);

  const proyectos = useMemo(() => {
    const ahora = Date.now();
    return [...proyectosState.datos].sort((uno, otro) => {
      const vigenteUno =
        uno.destacado && new Date(uno.destacadoHasta).getTime() > ahora;
      const vigenteOtro =
        otro.destacado && new Date(otro.destacadoHasta).getTime() > ahora;
      return Number(vigenteOtro) - Number(vigenteUno);
    });
  }, [proyectosState.datos]);

  const guardar = async (evento, proyecto) => {
    evento.preventDefault();
    const valorFecha = fechas[proyecto.id];
    const fechaHasta = new Date(valorFecha);
    if (!valorFecha || Number.isNaN(fechaHasta.getTime()) || fechaHasta <= new Date()) {
      setError('Elegí una fecha y hora futuras para el vencimiento.');
      setMensaje('');
      return;
    }

    await actualizarDestacado(proyecto, {
      destacado: true,
      destacadoHasta: fechaHasta.toISOString(),
    });
  };

  const quitar = async (proyecto) => {
    await actualizarDestacado(proyecto, { destacado: false });
  };

  const actualizarDestacado = async (proyecto, datos) => {
    setGuardandoId(proyecto.id);
    setError('');
    setMensaje('');
    try {
      const token = await getAccessToken();
      await configurarDestacado(token, proyecto.id, datos);
      setMensaje(
        datos.destacado
          ? `“${proyecto.titulo}” quedó destacado hasta ${formatoFecha(datos.destacadoHasta)}.`
          : `Se quitó el destacado de “${proyecto.titulo}”.`,
      );
      if (!datos.destacado) {
        setFechas((actuales) => ({
          ...actuales,
          [proyecto.id]: fechaPredeterminada(),
        }));
      }
      proyectosState.recargar();
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setGuardandoId(null);
    }
  };

  return (
    <section className="panel-destacados">
      <header className="panel-destacados__cabecera">
        <p className="panel-destacados__eyebrow">Administración</p>
        <h1>Proyectos destacados</h1>
        <p>
          Elegí proyectos activos y definí hasta cuándo aparecerán primero en la búsqueda.
        </p>
      </header>

      {error && <Alert severity="error" role="alert">{error}</Alert>}
      {mensaje && <Alert severity="success" role="status">{mensaje}</Alert>}

      {proyectosState.cargando && (
        <div className="panel-destacados__estado" role="status">
          <CircularProgress size={24} />
          <span>Cargando proyectos activos…</span>
        </div>
      )}

      {proyectosState.error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={proyectosState.recargar}>
              Reintentar
            </Button>
          }
        >
          No pudimos cargar los proyectos activos.
        </Alert>
      )}

      {!proyectosState.cargando &&
        !proyectosState.error &&
        proyectos.length === 0 && (
          <div className="estado-bloque">
            <p className="estado">No hay proyectos activos para destacar.</p>
          </div>
        )}

      {!proyectosState.cargando &&
        !proyectosState.error &&
        proyectos.length > 0 && (
          <ul className="panel-destacados__lista">
            {proyectos.map((proyecto) => {
              const fecha = proyecto.destacadoHasta
                ? formatoFecha(proyecto.destacadoHasta)
                : '';
              const vencido =
                proyecto.destacado &&
                new Date(proyecto.destacadoHasta).getTime() <= Date.now();
              const guardando = guardandoId === proyecto.id;

              return (
                <li className="panel-destacados__proyecto" key={proyecto.id}>
                  <div className="panel-destacados__informacion">
                    <h2>{proyecto.titulo}</h2>
                    <p>{proyecto.descripcion}</p>
                    {proyecto.destacado && (
                      <p className={vencido ? 'panel-destacados__vencido' : 'panel-destacados__vigente'}>
                        {vencido
                          ? `El destacado venció ${fecha ? `el ${fecha}` : ''}.`
                          : `Destacado hasta ${fecha}.`}
                      </p>
                    )}
                  </div>

                  <form
                    className="panel-destacados__formulario"
                    onSubmit={(evento) => guardar(evento, proyecto)}
                  >
                    <TextField
                      label="Destacar hasta"
                      type="datetime-local"
                      size="small"
                      required
                      disabled={guardando}
                      value={fechas[proyecto.id] ?? ''}
                      onChange={(evento) =>
                        setFechas((actual) => ({
                          ...actual,
                          [proyecto.id]: evento.target.value,
                        }))
                      }
                    />
                    <Button type="submit" variant="contained" disabled={guardando}>
                      {guardando ? 'Guardando…' : proyecto.destacado && !vencido ? 'Actualizar' : 'Destacar'}
                    </Button>
                    {proyecto.destacado && (
                      <Button
                        type="button"
                        variant="outlined"
                        disabled={guardando}
                        onClick={() => quitar(proyecto)}
                      >
                        Quitar destacado
                      </Button>
                    )}
                  </form>
                </li>
              );
            })}
          </ul>
        )}
    </section>
  );
}
