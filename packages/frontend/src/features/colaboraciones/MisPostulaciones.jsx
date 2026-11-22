import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, CircularProgress } from '@mui/material';
import { FiArrowRight, FiInfo } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.jsx';
import { obtenerMisPostulaciones } from '../../service/colaboradorasService';
import { mensajeDeError } from '../../service/api';
import { formatearFecha } from '../../utils/fechas';
import { t } from '../../i18n/t';
import './MisColaboraciones.css';
import { markdownATextoPlano } from '../../utils/markdown';

const estados = {
  PENDIENTE: 'misPostulaciones.pendiente',
  ACEPTADA: 'misPostulaciones.aceptada',
  RECHAZADA: 'misPostulaciones.rechazada',
};

const MisPostulaciones = () => {
  const { getAccessToken } = useAuth();
  const navigate = useNavigate();
  const [postulaciones, setPostulaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const cargarPostulaciones = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      const token = await getAccessToken();
      setPostulaciones(await obtenerMisPostulaciones(token));
    } catch (error) {
      setErrorCarga(mensajeDeError(error));
    } finally {
      setCargando(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    cargarPostulaciones();
  }, [cargarPostulaciones]);

  return (
    <section className="mis-colaboraciones">
      <header className="mis-colaboraciones-intro">
        <div>
          <h1>{t('misPostulaciones.titulo')}</h1>
        </div>
      </header>
      {cargando ? (
        <div className="mis-colaboraciones-estado" role="status">
          <CircularProgress />
          <p>{t('misPostulaciones.cargando')}</p>
        </div>
      ) : errorCarga ? (
        <div className="mis-colaboraciones-estado">
          <Alert severity="error">{errorCarga}</Alert>
          <Button variant="outlined" onClick={cargarPostulaciones}>
            {t('misColaboraciones.reintentar')}
          </Button>
        </div>
      ) : postulaciones.length === 0 ? (
        <div className="mis-colaboraciones-vacio">
          <FiInfo size={28} aria-hidden="true" />
          <h2>{t('misPostulaciones.vacioTitulo')}</h2>
          <p>{t('misPostulaciones.vacioDescripcion')}</p>
          <Button variant="contained" endIcon={<FiArrowRight />} onClick={() => navigate('/buscar-proyectos')}>
            {t('misColaboraciones.buscarProyectos')}
          </Button>
        </div>
      ) : (
        <div className="mis-colaboraciones-grid">
          {postulaciones.map((postulacion) => (
            <article key={postulacion.id} className="mis-colaboraciones-card">
              <span className={`mis-colaboraciones-badge postulacion-${postulacion.estado.toLowerCase()}`}>
                {estados[postulacion.estado] ? t(estados[postulacion.estado]) : postulacion.estado}
              </span>
              <h2>{postulacion.proyecto.titulo}</h2>
              <p className="mis-colaboraciones-descripcion">{markdownATextoPlano(postulacion.proyecto.descripcion)}</p>
              <p className="mis-colaboraciones-fecha">
                {formatearFecha(postulacion.fechaPostulacion)
                  ? t('misPostulaciones.fecha', { fecha: formatearFecha(postulacion.fechaPostulacion) })
                  : t('misPostulaciones.sinFecha')}
              </p>
              <div className="mis-colaboraciones-acciones">
                <Button variant="outlined" endIcon={<FiArrowRight />} onClick={() => navigate(`/proyectos/${postulacion.idProyecto}`)}>
                  {t('misPostulaciones.verDetalle')}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default MisPostulaciones;
