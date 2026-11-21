import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { FiBell, FiHome } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina.jsx';
import { EsqueletoLista } from '../../components/Esqueletos/Esqueletos.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { t } from '../../i18n/t';
import { obtenerNotificaciones } from '../../service/notificacionesService';
import { mensajeDeError } from '../../utils/mensajeDeError';
import { leerVistas, marcarVistas } from '../../hooks/useNotificacionesPendientes.js';
import './Notificaciones.css';

const LIMITE_POR_PAGINA = 8;

const tipoVisible = (tipo) => {
  const claves = {
    POSTULACION_ACEPTADA: 'notificaciones.postulacionAceptada',
    POSTULACION_RECHAZADA: 'notificaciones.postulacionRechazada',
    INVITACION_POSTULACION: 'notificaciones.invitacion',
  };
  return claves[tipo] ? t(claves[tipo]) : null;
};

const enlaceAccion = (notificacion) => {
  if (
    notificacion.tipo === 'POSTULACION_ACEPTADA' ||
    notificacion.tipo === 'POSTULACION_RECHAZADA'
  ) {
    return {
      href: '/mis-colaboraciones',
      texto: t('notificaciones.verMisColaboraciones'),
    };
  }
  if (notificacion.idProyecto) {
    return {
      href: `/proyectos/${notificacion.idProyecto}`,
      texto: t('notificaciones.verProyecto'),
    };
  }
  return null;
};

const fechaVisible = (fecha) => {
  if (!fecha) return null;
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return null;
  return {
    iso: date.toISOString(),
    texto: date.toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' }),
  };
};

const Notificaciones = () => {
  const { sesion, getAccessToken } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState(null);
  const [errorMas, setErrorMas] = useState(null);
  const [intento, setIntento] = useState(0);
  const [nuevasAlEntrar, setNuevasAlEntrar] = useState(0);
  const usuarioId = sesion?.usuarioId ?? sesion?.idColectivo ?? sesion?.idColaborador;

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      setCargando(true);
      setError(null);
      setErrorMas(null);
      try {
        const token = await getAccessToken();
        const resultado = await obtenerNotificaciones(token, {
          pag: 1,
          limite: LIMITE_POR_PAGINA,
        });
        if (
          !Array.isArray(resultado.notificaciones) ||
          !Number.isInteger(resultado.pag) ||
          !Number.isInteger(resultado.totalPags)
        ) {
          throw new Error('La respuesta de notificaciones no tiene el formato esperado.');
        }
        if (!vigente) return;
        setNotificaciones(resultado.notificaciones);
        setPagina(resultado.pag);
        setTotalPaginas(resultado.totalPags);
        // Las más recientes que todavía no habías visto se marcan como "Nueva" y el contador del header vuelve a 0.
        if (usuarioId && Number.isFinite(resultado.total)) {
          setNuevasAlEntrar(Math.max(0, resultado.total - leerVistas(usuarioId)));
          marcarVistas(usuarioId, resultado.total);
        }
      } catch (e) {
        if (vigente) setError(e);
      } finally {
        if (vigente) setCargando(false);
      }
    };

    cargar();
    return () => {
      vigente = false;
    };
  }, [getAccessToken, intento, usuarioId]);

  const cargarMas = async () => {
    if (cargandoMas || cargando || pagina >= totalPaginas) return;
    setCargandoMas(true);
    setErrorMas(null);
    try {
      const token = await getAccessToken();
      const resultado = await obtenerNotificaciones(token, {
        pag: pagina + 1,
        limite: LIMITE_POR_PAGINA,
      });
      if (
        !Array.isArray(resultado.notificaciones) ||
        !Number.isInteger(resultado.pag) ||
        !Number.isInteger(resultado.totalPags)
      ) {
        throw new Error('La respuesta de notificaciones no tiene el formato esperado.');
      }
      setNotificaciones((actuales) => [...actuales, ...resultado.notificaciones]);
      setPagina(resultado.pag);
      setTotalPaginas(resultado.totalPags);
    } catch (e) {
      setErrorMas(e);
    } finally {
      setCargandoMas(false);
    }
  };

  const esColectivo = sesion?.rol === 'COLECTIVO';

  return (
    <div className="contenedor-pagina notificaciones-pagina">
      <div className="notificaciones-contenedor">
        <EncabezadoPagina
          titulo={t('notificaciones.titulo')}
          migas={[
            { texto: t('navegacion.inicio'), to: '/' },
            { texto: t('notificaciones.titulo') },
          ]}
        />
        {cargando ? (
          <EsqueletoLista cantidad={4} etiqueta={t('notificaciones.cargando')} />
        ) : error ? (
          <div className="notificaciones-error-lista" role="alert">
            <p>{t('notificaciones.errorCarga', { mensaje: mensajeDeError(error) })}</p>
            <Button type="button" onClick={() => setIntento((actual) => actual + 1)}>
              {t('notificaciones.reintentar')}
            </Button>
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="notificaciones-vacias">
            <div>
              <FiBell aria-hidden="true" />
              <h2>{t('notificaciones.vacioTitulo')}</h2>
              <p>{t('notificaciones.vacioDescripcion')}</p>
              <Button
                component={Link}
                to="/"
                variant="outlined"
                startIcon={<FiHome aria-hidden="true" />}
              >
                {t('notificaciones.irAlInicio')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ul className="notificaciones-lista" aria-label={t('notificaciones.titulo')}>
              {notificaciones.map((notificacion, indice) => {
                const esNueva = indice < nuevasAlEntrar;
                const fecha = fechaVisible(notificacion.fecha);
                const accion = enlaceAccion(notificacion);
                const contraparte = esColectivo
                  ? t('notificaciones.para', {
                      nombre: notificacion.nombreColaborador || t('notificaciones.usuario'),
                    })
                  : t('notificaciones.de', {
                      nombre: notificacion.nombreColectivo || t('notificaciones.usuario'),
                    });
                const tipo = tipoVisible(notificacion.tipo);

                return (
                  <li
                    className={`notificaciones-item${esNueva ? ' notificaciones-item-no-leida' : ''}`}
                    key={notificacion.id}
                  >
                    <span className="notificaciones-avatar" aria-hidden="true">
                      {(esColectivo
                        ? notificacion.nombreColaborador
                        : notificacion.nombreColectivo
                      )?.slice(0, 1).toUpperCase() ?? <FiBell />}
                    </span>
                    <div className="notificaciones-contenido">
                      <p className="notificaciones-contraparte">
                        {esNueva && <span className="insignia insignia--acento notificaciones-nueva">{t('notificaciones.nueva')}</span>}
                        {contraparte}
                      </p>
                      {tipo && <p className="notificaciones-tipo">{tipo}</p>}
                      <p>{notificacion.contenido}</p>
                      {fecha && <time dateTime={fecha.iso}>{fecha.texto}</time>}
                      {esColectivo && notificacion.envios?.length > 0 && (
                        <ul>
                          {notificacion.envios.map((envio, indice) => (
                            <li key={`${envio.tipoDeContacto}-${indice}`}>
                              {envio.tipoDeContacto}: {envio.estado}
                              {envio.detalle ? ` — ${envio.detalle}` : ''}
                            </li>
                          ))}
                        </ul>
                      )}
                      {accion && (
                        <Link className="notificaciones-enlace" to={accion.href}>
                          {accion.texto}
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {errorMas && (
              <div className="notificaciones-error-lista" role="alert">
                <p>{t('notificaciones.errorCargaMas', { mensaje: mensajeDeError(errorMas) })}</p>
                <Button type="button" onClick={cargarMas}>
                  {t('notificaciones.reintentar')}
                </Button>
              </div>
            )}
            {pagina < totalPaginas && (
              <div className="notificaciones-cargar-mas">
                <Button type="button" disabled={cargandoMas} onClick={cargarMas}>
                  {cargandoMas
                    ? t('notificaciones.cargandoMas')
                    : t('notificaciones.cargarMas')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notificaciones;
