import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { mensajeDeError } from '../../service/api';
import { obtenerNotificacionesDeColaboradora } from '../../service/notificacionesService';
import './Notificaciones.css';

const LIMITE_POR_PAGINA = 8;

const Notificaciones = () => {
  const { sesion, getAccessToken } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState('');

  const cargarPagina = useCallback(async (paginaSolicitada = 1, anexar = false) => {
    setError('');
    if (anexar) {
      setCargandoMas(true);
    } else {
      setCargando(true);
    }

    try {
      if (!sesion?.idColaborador) {
        throw new Error('Las notificaciones están disponibles para cuentas colaboradoras.');
      }

      const token = await getAccessToken();
      if (!token) {
        throw new Error('No pudimos validar tu sesión. Volvé a iniciar sesión e intentá de nuevo.');
      }

      const resultado = await obtenerNotificacionesDeColaboradora(
        token,
        sesion.idColaborador,
        { pag: paginaSolicitada, limite: LIMITE_POR_PAGINA },
      );

      if (!Array.isArray(resultado?.notificaciones) || !Number.isInteger(resultado.totalPags)) {
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
  }, [getAccessToken, sesion?.idColaborador]);

  useEffect(() => {
    cargarPagina();
  }, [cargarPagina]);

  const hayMas = pagina < totalPaginas;

  return (
    <section className="notificaciones-pagina" aria-labelledby="notificaciones-titulo">
      <div className="notificaciones-contenedor">
        <header className="notificaciones-intro">
          <h1 id="notificaciones-titulo">Notificaciones</h1>
          <p>Invitaciones a proyectos y novedades de tus postulaciones.</p>
        </header>

        {cargando ? (
          <p className="notificaciones-mensaje" role="status">Cargando notificaciones...</p>
        ) : error && notificaciones.length === 0 ? (
          <div className="notificaciones-estado" role="alert">
            <p>{error}</p>
            {sesion?.idColaborador && (
              <button type="button" onClick={() => cargarPagina()}>
                Reintentar
              </button>
            )}
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="notificaciones-vacias">
            <div>
              <h2>Aún no tenés notificaciones</h2>
              <p>Cuando tengamos algo para comunicarte, te lo avisaremos por acá.</p>
            </div>
          </div>
        ) : (
          <>
            <ul className="notificaciones-lista">
              {notificaciones.map((notificacion) => {
                const contenido = notificacion.contenido || 'Nueva notificación';
                const noLeida = notificacion.leida === false;

                return (
                  <li
                    className={`notificaciones-item${noLeida ? ' notificaciones-item-no-leida' : ''}`}
                    key={notificacion.id || notificacion._id}
                  >
                    <span className="notificaciones-avatar" aria-hidden="true">
                      {contenido.trim().charAt(0).toLocaleUpperCase('es')}
                    </span>
                    <p>{contenido}</p>
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
