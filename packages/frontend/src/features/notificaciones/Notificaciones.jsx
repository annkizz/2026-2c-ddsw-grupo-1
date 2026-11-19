import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { mensajeDeError } from '../../service/api';
import { obtenerNotificaciones } from '../../service/notificacionesService';
import './Notificaciones.css';

const LIMITE_POR_PAGINA = 8;
const ETIQUETAS_TIPO = {
  MENSAJE: 'Mensaje',
  POSTULACION_ACEPTADA: 'Postulación aceptada',
  POSTULACION_RECHAZADA: 'Postulación rechazada',
  INVITACION_POSTULACION: 'Invitación a postularse',
};

function mostrarFecha(fecha) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(valor);
}

const Notificaciones = () => {
  const { sesion, getAccessToken } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState('');
  const esColectivo = sesion?.rol === 'COLECTIVO';

  const cargarPagina = useCallback(async (paginaSolicitada = 1, anexar = false) => {
    setError('');
    if (anexar) {
      setCargandoMas(true);
    } else {
      setCargando(true);
    }

    try {
      if (!['COLECTIVO', 'COLABORADOR'].includes(sesion?.rol)) {
        throw new Error('Las notificaciones están disponibles para colectivos y personas colaboradoras.');
      }

      const token = await getAccessToken();
      const resultado = await obtenerNotificaciones(token, {
        pag: paginaSolicitada,
        limite: LIMITE_POR_PAGINA,
      });

      if (
        !Array.isArray(resultado?.notificaciones) ||
        !Number.isInteger(resultado.totalPags)
      ) {
        throw new Error('El servidor devolvió un formato de notificaciones inválido.');
      }

      setNotificaciones((actuales) =>
        anexar ? [...actuales, ...resultado.notificaciones] : resultado.notificaciones,
      );
      setPagina(resultado.pag || paginaSolicitada);
      setTotalPaginas(resultado.totalPags);
    } catch (errorCarga) {
      setError(errorCarga.response ? mensajeDeError(errorCarga) : errorCarga.message);
    } finally {
      setCargando(false);
      setCargandoMas(false);
    }
  }, [getAccessToken, sesion?.rol]);

  useEffect(() => {
    cargarPagina();
  }, [cargarPagina]);

  const hayMas = pagina < totalPaginas;
  const tituloBandeja = esColectivo
    ? 'Mensajes e invitaciones enviados'
    : 'Notificaciones recibidas';

  return (
    <section className="notificaciones-pagina" aria-labelledby="notificaciones-titulo">
      <div className="notificaciones-contenedor">
        <header className="notificaciones-intro">
          <h1 id="notificaciones-titulo">Notificaciones</h1>
          <p>{tituloBandeja}</p>
        </header>

        {cargando ? (
          <p className="notificaciones-mensaje" role="status">Cargando notificaciones...</p>
        ) : error && notificaciones.length === 0 ? (
          <div className="notificaciones-estado" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => cargarPagina()}>
              Reintentar
            </button>
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="notificaciones-vacias">
            <div>
              <h2>
                {esColectivo
                  ? 'Aún no enviaste mensajes ni invitaciones'
                  : 'Aún no recibiste notificaciones'}
              </h2>
              <p>
                {esColectivo
                  ? 'Cuando contactes o invites a una persona colaboradora, aparecerá acá.'
                  : 'Cuando un colectivo te escriba, te invite o resuelva tu postulación, aparecerá acá.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <ul className="notificaciones-lista">
              {notificaciones.map((notificacion) => {
                const contenido = notificacion.contenido || 'Nueva notificación';
                const tipo = notificacion.tipo || 'MENSAJE';
                const contraparte = esColectivo
                  ? notificacion.nombreColaborador || 'Persona colaboradora'
                  : notificacion.nombreColectivo || 'Colectivo';
                const noLeida = notificacion.leida === false;
                const enlace =
                  tipo === 'POSTULACION_ACEPTADA'
                    ? '/mis-colaboraciones'
                    : notificacion.idProyecto
                      ? `/proyectos/${notificacion.idProyecto}`
                      : null;

                return (
                  <li
                    className={`notificaciones-item${noLeida ? ' notificaciones-item-no-leida' : ''}`}
                    key={notificacion.id || notificacion._id}
                  >
                    <span className="notificaciones-avatar" aria-hidden="true">
                      {contraparte.trim().charAt(0).toLocaleUpperCase('es')}
                    </span>
                    <div className="notificaciones-contenido">
                      <p className="notificaciones-contraparte">
                        {esColectivo ? `Para ${contraparte}` : `De ${contraparte}`}
                      </p>
                      <p className="notificaciones-tipo">
                        {ETIQUETAS_TIPO[tipo] || 'Notificación'}
                      </p>
                      <p>{contenido}</p>
                      {enlace && (
                        <Link className="notificaciones-enlace" to={enlace}>
                          {tipo === 'POSTULACION_ACEPTADA'
                            ? 'Ver mis colaboraciones'
                            : 'Ver proyecto'}
                        </Link>
                      )}
                      {mostrarFecha(notificacion.fecha) && (
                        <time dateTime={notificacion.fecha}>
                          {mostrarFecha(notificacion.fecha)}
                        </time>
                      )}
                      {esColectivo && notificacion.envios?.length > 0 && (
                        <ul aria-label="Estado de envíos externos">
                          {notificacion.envios.map((envio) => (
                            <li key={envio.tipoDeContacto}>
                              {envio.tipoDeContacto}: {envio.estado}
                              {envio.detalle ? ` — ${envio.detalle}` : ''}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {noLeida && (
                      <span className="notificaciones-punto" aria-label="No leída" />
                    )}
                  </li>
                );
              })}
            </ul>

            {error && (
              <div className="notificaciones-error-lista" role="alert">
                <p>{error}</p>
                <button type="button" onClick={() => cargarPagina(pagina + 1, true)}>
                  Reintentar
                </button>
              </div>
            )}

            {hayMas && !error && (
              <div className="notificaciones-cargar-mas">
                <button
                  type="button"
                  onClick={() => cargarPagina(pagina + 1, true)}
                  disabled={cargandoMas}
                >
                  {cargandoMas ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Notificaciones;
