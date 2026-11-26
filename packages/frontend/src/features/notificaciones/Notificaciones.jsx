import React, { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, FormControlLabel } from '@mui/material';
import { FiBell, FiHome } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina.jsx';
import { EsqueletoLista } from '../../components/Esqueletos/Esqueletos.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { obtenerLocale, t } from '../../i18n/t';
import { obtenerNotificaciones } from '../../service/notificacionesService';
import { resolverInvitacion } from '../../service/proyectosService';
import { mensajeDeError } from '../../utils/mensajeDeError';
import { leerVistas, marcarVistas } from '../../hooks/useNotificacionesPendientes.js';
import './Notificaciones.css';

const LIMITE_POR_PAGINA = 8;

const tipoVisible = (tipo) => {
  const claves = {
    POSTULACION_ACEPTADA: 'notificaciones.postulacionAceptada',
    POSTULACION_RECHAZADA: 'notificaciones.postulacionRechazada',
    INVITACION_POSTULACION: 'notificaciones.invitacion',
    POSTULACION_RECIBIDA: 'notificaciones.postulacionRecibida',
    INVITACION_PROYECTO: 'notificaciones.invitacionProyecto',
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
    texto: date.toLocaleString(obtenerLocale(), { dateStyle: 'long', timeStyle: 'short' }),
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
  const [anonimas, setAnonimas] = useState({});
  const [resolviendo, setResolviendo] = useState(null);
  const [erroresRespuesta, setErroresRespuesta] = useState({});
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
          throw new Error(t('erroresInternos.notificacionesFormato'));
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
        throw new Error(t('erroresInternos.notificacionesFormato'));
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

  const responder = async (notificacion, decision) => {
    setResolviendo(notificacion.id);
    setErroresRespuesta((actual) => ({ ...actual, [notificacion.id]: null }));
    try {
      const token = await getAccessToken();
      const actualizada = await resolverInvitacion(
        token, notificacion.idProyecto, notificacion.id, decision, anonimas[notificacion.id] ?? true,
      );
      setNotificaciones((actuales) => actuales.map((item) =>
        item.id === notificacion.id ? { ...item, estadoInvitacion: actualizada.estadoInvitacion } : item,
      ));
    } catch (e) {
      setErroresRespuesta((actual) => ({ ...actual, [notificacion.id]: mensajeDeError(e) }));
    } finally {
      setResolviendo(null);
    }
  };

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
                const contraparte = esColectivo && notificacion.tipo === 'POSTULACION_RECIBIDA'
                  ? t('notificaciones.de', { nombre: notificacion.nombreColaborador || t('notificaciones.usuario') })
                  : esColectivo
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
                      <div className="notificaciones-cabecera">
                        <p className="notificaciones-contraparte">
                          {esNueva && <span className="insignia insignia--acento notificaciones-nueva">{t('notificaciones.nueva')}</span>}
                          {contraparte}
                        </p>
                        {fecha && <time dateTime={fecha.iso}>{fecha.texto}</time>}
                      </div>
                      {tipo && <p className="notificaciones-tipo">{tipo}</p>}
                      <p className="notificaciones-mensaje">{notificacion.contenido}</p>
                      {notificacion.tipo === 'INVITACION_PROYECTO' && (
                        <>
                          {notificacion.estadoInvitacion === 'PENDIENTE' && !esColectivo ? (
                            <>
                              <div className="notificaciones-preferencia">
                                <FormControlLabel
                                  control={<Checkbox checked={anonimas[notificacion.id] ?? true} onChange={(e) => setAnonimas((actual) => ({ ...actual, [notificacion.id]: e.target.checked }))} />}
                                  label={t('notificaciones.participacionAnonima')}
                                />
                              </div>
                              {erroresRespuesta[notificacion.id] && <Alert severity="error" role="alert">{erroresRespuesta[notificacion.id]}</Alert>}
                            </>
                          ) : (
                            <p>{t('notificaciones.invitacionEstado', {
                              estado: ['PENDIENTE', 'ACEPTADA', 'RECHAZADA'].includes(notificacion.estadoInvitacion)
                                ? t(`notificaciones.estadosInvitacion.${notificacion.estadoInvitacion}`)
                                : notificacion.estadoInvitacion?.toLowerCase() ?? '',
                            })}</p>
                          )}
                        </>
                      )}
                      {esColectivo && notificacion.envios?.length > 0 && (
                        <ul>
                          {notificacion.envios.map((envio, indice) => (
                            <li key={`${envio.tipoDeContacto}-${indice}`}>
                              {t('formatoTipoValor', {
                                tipo: ['EMAIL', 'WHATSAPP', 'SMS'].includes(envio.tipoDeContacto) ? t(`enviosNotificacion.${envio.tipoDeContacto}`) : envio.tipoDeContacto,
                                valor: ['ENVIADO', 'SIMULADO', 'FALLIDO'].includes(envio.estado) ? t(`enviosNotificacion.${envio.estado}`) : envio.estado,
                              })}
                              {envio.detalle ? ` — ${envio.detalle}` : ''}
                            </li>
                          ))}
                        </ul>
                      )}
                      {(accion || (notificacion.tipo === 'INVITACION_PROYECTO' && notificacion.estadoInvitacion === 'PENDIENTE' && !esColectivo)) && (
                        <div className="notificaciones-acciones">
                          {notificacion.tipo === 'INVITACION_PROYECTO' && notificacion.estadoInvitacion === 'PENDIENTE' && !esColectivo && (
                            <>
                              <Button variant="contained" disabled={Boolean(resolviendo)} onClick={() => responder(notificacion, 'ACEPTADA')}>{t('notificaciones.aceptar')}</Button>
                              <Button variant="outlined" disabled={Boolean(resolviendo)} onClick={() => responder(notificacion, 'RECHAZADA')}>{t('notificaciones.rechazar')}</Button>
                            </>
                          )}
                          {accion && <Link className="notificaciones-enlace" to={accion.href}>{accion.texto}</Link>}
                        </div>
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
