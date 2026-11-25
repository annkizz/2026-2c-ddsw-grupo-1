import React, { useEffect, useState } from 'react';
import { Alert, Button, TextField } from '@mui/material';
import { Link } from 'react-router-dom';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina.jsx';
import AlertaError from '../../components/AlertaError/AlertaError.jsx';
import { EsqueletoGrilla } from '../../components/Esqueletos/Esqueletos.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useListado } from '../../hooks/useListado';
import { configurarDestacado } from '../../service/proyectosService';
import { markdownATextoPlano } from '../../utils/markdown';
import { t } from '../../i18n/t';
import './ProyectosDestacados.css';

const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000;

function fechaParaInput(fecha) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return '';
  return new Date(valor.getTime() - valor.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function fechaInicial(proyecto) {
  const vencimiento = new Date(proyecto.destacadoHasta).getTime();
  return fechaParaInput(vencimiento > Date.now() ? vencimiento : Date.now() + SIETE_DIAS);
}

function mostrarFecha(fecha) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fecha));
}

export default function ProyectosDestacados() {
  const { getAccessToken } = useAuth();
  const listado = useListado('/proyectos?estado=ACTIVO');
  const [fechas, setFechas] = useState({});
  const [guardandoId, setGuardandoId] = useState(null);
  const [error, setError] = useState(null);
  const [validacion, setValidacion] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    setFechas((actuales) => {
      const siguientes = { ...actuales };
      listado.datos.forEach((proyecto) => {
        if (siguientes[proyecto.id] === undefined) {
          siguientes[proyecto.id] = fechaInicial(proyecto);
        }
      });
      return siguientes;
    });
  }, [listado.datos]);

  const actualizar = async (proyecto, datos) => {
    setGuardandoId(proyecto.id);
    setError(null);
    setValidacion('');
    setMensaje('');
    try {
      const token = await getAccessToken();
      await configurarDestacado(token, proyecto.id, datos);
      setMensaje(t(datos.destacado ? 'destacados.destacadoExito' : 'destacados.quitadoExito', { titulo: proyecto.titulo }));
      if (!datos.destacado) {
        setFechas((actuales) => ({ ...actuales, [proyecto.id]: fechaParaInput(Date.now() + SIETE_DIAS) }));
      }
      listado.recargar();
    } catch (fallo) {
      setError(fallo);
    } finally {
      setGuardandoId(null);
    }
  };

  const guardar = (evento, proyecto) => {
    evento.preventDefault();
    const fecha = new Date(fechas[proyecto.id]);
    if (!fechas[proyecto.id] || Number.isNaN(fecha.getTime()) || fecha <= new Date()) {
      setError(null);
      setMensaje('');
      setValidacion(t('destacados.fechaInvalida'));
      return;
    }
    actualizar(proyecto, { destacado: true, destacadoHasta: fecha.toISOString() });
  };

  return (
    <div className="contenedor-pagina panel-destacados">
      <EncabezadoPagina
        antetitulo={t('destacados.administracion')}
        titulo={t('destacados.titulo')}
        subtitulo={t('destacados.descripcionPanel')}
      />
      {error && <AlertaError error={error} titulo={t('destacados.errorActualizar')} />}
      {validacion && <Alert severity="error" role="alert">{validacion}</Alert>}
      {mensaje && <Alert severity="success" role="status">{mensaje}</Alert>}

      {listado.cargando ? (
        <EsqueletoGrilla etiqueta={t('destacados.cargandoActivos')} />
      ) : listado.error ? (
        <AlertaError error={listado.error} titulo={t('proyectos.noPudimosCargarLosProyectos')} onReintentar={listado.recargar} />
      ) : listado.datos.length === 0 ? (
        <p>{t('destacados.sinActivos')}</p>
      ) : (
        <ul className="panel-destacados__lista">
          {listado.datos.map((proyecto) => {
            const fecha = new Date(proyecto.destacadoHasta);
            const fechaValida = proyecto.destacadoHasta && !Number.isNaN(fecha.getTime());
            const vigente = proyecto.destacado && fechaValida && fecha > new Date();
            return (
              <li className="panel-destacados__proyecto" key={proyecto.id}>
                <div>
                  <h2><Link to={`/proyectos/${proyecto.id}`}>{proyecto.titulo}</Link></h2>
                  <p>{markdownATextoPlano(proyecto.descripcion)}</p>
                  {proyecto.destacado && (
                    <p className="panel-destacados__estado">
                      {vigente
                        ? t('destacados.vigenteHasta', { fecha: mostrarFecha(fecha) })
                        : fechaValida
                          ? t('destacados.vencidoEl', { fecha: mostrarFecha(fecha) })
                          : t('destacados.sinFechaValida')}
                    </p>
                  )}
                </div>
                <form className="panel-destacados__formulario" onSubmit={(evento) => guardar(evento, proyecto)}>
                  <TextField
                    label={t('destacados.fechaDeProyecto', { titulo: proyecto.titulo })}
                    type="datetime-local"
                    size="small"
                    required
                    disabled={guardandoId !== null}
                    value={fechas[proyecto.id] ?? ''}
                    onChange={(evento) => setFechas((actuales) => ({ ...actuales, [proyecto.id]: evento.target.value }))}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <Button type="submit" variant="contained" disabled={guardandoId !== null}>
                    {guardandoId === proyecto.id ? t('destacados.guardando') : vigente ? t('destacados.actualizar') : t('destacados.destacar')}
                  </Button>
                  {proyecto.destacado && (
                    <Button type="button" variant="outlined" disabled={guardandoId !== null} onClick={() => actualizar(proyecto, { destacado: false })}>
                      {t('destacados.quitar')}
                    </Button>
                  )}
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
