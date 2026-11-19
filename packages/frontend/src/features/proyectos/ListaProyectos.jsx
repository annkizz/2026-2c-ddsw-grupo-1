import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  LinearProgress,
  TextField,
} from '@mui/material';
import { FiPlus, FiEye, FiEdit2, FiFolder, FiLock, FiSearch, FiXCircle, FiCheck, FiCalendar } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.jsx';
import { obtenerProyectos, cerrarProyecto } from '../../service/proyectosService';
import { t } from '../../i18n/t';
import { formatearFecha } from '../../utils/fechas';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina.jsx';
import AlertaError from '../../components/AlertaError/AlertaError.jsx';
import EstadoVacio from '../../components/EstadoVacio/EstadoVacio.jsx';
import ChipEstado from '../../components/ChipEstado/ChipEstado.jsx';
import Dialogo from '../../components/Dialogo/Dialogo.jsx';
import { EsqueletoGrilla } from '../../components/Esqueletos/Esqueletos.jsx';
import { useNotificar } from '../../components/Notificador/Notificador.jsx';
import '../../components/Card.css';
import './ListaProyectos.css';

const filtros = [
  { labelKey: 'proyectos.todos', value: 'TODOS' },
  { labelKey: 'proyectos.activos', value: 'ACTIVO' },
  { labelKey: 'proyectos.finalizados', value: 'FINALIZADO' },
];

const estadoDe = (proyecto) => (proyecto.estado === 'FINALIZADO' ? 'FINALIZADO' : 'ACTIVO');

const ListaProyectos = () => {
  const { sesion, getAccessToken } = useAuth();
  const navigate = useNavigate();
  const notificar = useNotificar();
  const idColectivo = sesion?.idColectivo;
  const esColectivo = Boolean(idColectivo);

  const [proyectos, setProyectos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [proyectoACerrar, setProyectoACerrar] = useState(null);
  const [cerrando, setCerrando] = useState(false);
  const [errorCierre, setErrorCierre] = useState(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      setProyectos(await obtenerProyectos());
    } catch (error) {
      setErrorCarga(error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Un colectivo con sesión ve los suyos; el resto ve todos
  const proyectosBase = useMemo(
    () => proyectos.filter((p) => !esColectivo || p.idColectivo === idColectivo),
    [proyectos, esColectivo, idColectivo],
  );

  const proyectosVisibles = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase('es');
    return proyectosBase.filter(
      (p) =>
        p.titulo.toLocaleLowerCase('es').includes(texto) &&
        (filtroEstado === 'TODOS' || estadoDe(p) === filtroEstado),
    );
  }, [proyectosBase, busqueda, filtroEstado]);

  const abrirCierre = (proyecto) => {
    setErrorCierre(null);
    setProyectoACerrar(proyecto);
  };

  const manejarCierreProyecto = async () => {
    if (!proyectoACerrar) return;
    setCerrando(true);
    setErrorCierre(null);
    try {
      const token = await getAccessToken();
      const actualizado = await cerrarProyecto(token, proyectoACerrar.id);
      setProyectos((actual) => actual.map((p) => (p.id === actualizado.id ? actualizado : p)));
      setProyectoACerrar(null);
      notificar({ mensaje: t('proyectos.exitoCierre') });
    } catch (error) {
      // El diálogo queda abierto con el error y la opción de reintentar.
      setErrorCierre(error);
    } finally {
      setCerrando(false);
    }
  };

  const botonCrear = esColectivo ? (
    <Button variant="contained" onClick={() => navigate('/proyectos/nuevo')} startIcon={<FiPlus aria-hidden="true" />}>
      {t('proyectos.crearProyecto')}
    </Button>
  ) : null;

  return (
    <div className="contenedor-pagina">
      <EncabezadoPagina
        titulo={esColectivo ? t('proyectos.titulo') : t('proyectos.tituloPublico')}
        subtitulo={esColectivo ? t('proyectos.subtitulo') : t('proyectos.subtituloPublico')}
        accion={botonCrear}
        migas={esColectivo ? [{ texto: t('navegacion.inicio'), to: '/' }, { texto: t('proyectos.titulo') }] : undefined}
      />

      <div className="filtros-barra" role="search" aria-label={t('proyectos.filtrarProyectos')}>
        <TextField
          id="busqueda-titulo"
          className="filtros-barra__busqueda"
          label={t('proyectos.buscarTitulo')}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={t('proyectos.placeholderBusqueda')}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <FiSearch aria-hidden="true" />
                </InputAdornment>
              ),
            },
          }}
        />
        <fieldset className="filtro-segmentado">
          <legend>{t('proyectos.estado')}</legend>
          <div className="filtro-segmentado__opciones">
            {filtros.map((filtro) => {
              const activo = filtroEstado === filtro.value;
              return (
                <Button
                  key={filtro.value}
                  variant="outlined"
                  className={`filtro-segmentado__opcion${activo ? ' filtro-segmentado__opcion--activa' : ''}`}
                  onClick={() => setFiltroEstado(filtro.value)}
                  aria-pressed={activo}
                  startIcon={activo ? <FiCheck aria-hidden="true" /> : null}
                >
                  {t(filtro.labelKey)}
                </Button>
              );
            })}
          </div>
        </fieldset>
      </div>

      {cargando ? (
        <EsqueletoGrilla etiqueta={t('proyectos.cargando')} />
      ) : errorCarga ? (
        <AlertaError error={errorCarga} titulo={t('proyectos.noPudimosCargarLosProyectos')} onReintentar={cargarDatos} />
      ) : proyectosBase.length === 0 ? (
        <EstadoVacio
          icono={FiFolder}
          titulo={esColectivo ? t('proyectos.sinProyectos') : t('proyectos.sinResultados')}
          descripcion={esColectivo ? t('proyectos.sinProyectosSub') : undefined}
          accion={
            esColectivo ? (
              <Button variant="outlined" onClick={() => navigate('/proyectos/nuevo')} startIcon={<FiPlus aria-hidden="true" />}>
                {t('proyectos.crearProyecto')}
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <p className="contador-resultados" aria-live="polite">
            {proyectosVisibles.length === 1
              ? t('proyectos.unProyecto')
              : t('proyectos.variosProyectos', { cantidad: proyectosVisibles.length })}
          </p>

          {proyectosVisibles.length === 0 ? (
            <EstadoVacio
              icono={FiSearch}
              titulo={t('proyectos.sinResultados')}
              descripcion={t('proyectos.probaConOtraPalabraO')}
              accion={
                <Button
                  variant="outlined"
                  onClick={() => {
                    setBusqueda('');
                    setFiltroEstado('TODOS');
                  }}
                >
                  Limpiar filtros
                </Button>
              }
            />
          ) : (
            <ul className="tarjetas">
              {proyectosVisibles.map((proyecto) => {
                const esFinalizado = estadoDe(proyecto) === 'FINALIZADO';
                const avance = Math.min(100, Math.max(0, Number(proyecto.porcentajeConcrecion) || 0));
                const cierre = formatearFecha(proyecto.fechaLimiteCierre);
                const esDueño = esColectivo && proyecto.idColectivo === idColectivo;
                const idTitulo = `lista-proyecto-${proyecto.id}`;

                return (
                  <li key={proyecto.id} className="tarjeta" aria-labelledby={idTitulo}>
                    <div className="tarjeta__cuerpo">
                      <div className="tarjeta__encabezado">
                        <h2 id={idTitulo} className="tarjeta__titulo">
                          {proyecto.titulo}
                        </h2>
                        <ChipEstado estado={esFinalizado ? 'FINALIZADO' : 'ACTIVO'} />
                      </div>
                      <div className="proyecto-progreso">
                        <div className="proyecto-progreso__cabecera">
                          <span>{t('proyectos.avance')}</span>
                          <span>{avance} %</span>
                        </div>
                        <LinearProgress variant="determinate" value={avance} aria-label={t('proyectos.avance')} />
                      </div>
                      <div className="tarjeta__metas">
                        <p className="tarjeta__meta">
                          {proyecto.busquedaVigente ? <FiFolder aria-hidden="true" /> : <FiLock aria-hidden="true" />}
                          <span>
                            {proyecto.busquedaVigente ? t('proyectos.busquedaAbierta') : t('proyectos.busquedaCerrada')}
                          </span>
                        </p>
                        <p className="tarjeta__meta">
                          <FiCalendar aria-hidden="true" />
                          <span>
                            {esFinalizado
                              ? t('proyectos.proyectoFinalizado')
                              : cierre
                                ? t('proyectos.cierreProgramado', { fecha: cierre })
                                : t('proyectos.sinCierreProgramado')}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="tarjeta__acciones">
                      <Button
                        variant="outlined"
                        onClick={() => navigate(`/proyectos/${proyecto.id}`)}
                        startIcon={<FiEye aria-hidden="true" />}
                        aria-label={`Ver proyecto: ${proyecto.titulo}`}
                      >
                        Ver proyecto
                      </Button>
                      {esDueño && (
                        <Button
                          variant="text"
                          onClick={() => navigate(`/proyectos/${proyecto.id}/editar`)}
                          startIcon={<FiEdit2 aria-hidden="true" />}
                          aria-label={t('proyectos.editarProyectoDe', { titulo: proyecto.titulo })}
                        >
                          Editar proyecto
                        </Button>
                      )}
                      {esDueño && !esFinalizado && (
                        <Button
                          variant="text"
                          color="error"
                          startIcon={<FiXCircle aria-hidden="true" />}
                          onClick={() => abrirCierre(proyecto)}
                          aria-label={t('proyectos.cerrarProyectoDe', { titulo: proyecto.titulo })}
                        >
                          {t('proyectos.cerrarProyecto')}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <Dialogo
        open={Boolean(proyectoACerrar)}
        onClose={() => !cerrando && setProyectoACerrar(null)}
        aria-labelledby="dialogo-cerrar-titulo"
        aria-describedby="dialogo-cerrar-descripcion"
      >
        <DialogTitle id="dialogo-cerrar-titulo">{t('proyectos.modalCerrarTitulo')}</DialogTitle>
        <DialogContent>
          <DialogContentText id="dialogo-cerrar-descripcion">
            {proyectoACerrar ? t('proyectos.mensajeCerrar', { titulo: proyectoACerrar.titulo }) : ''}{' '}
            <strong>{t('proyectos.advertenciaPermanente')}</strong>
          </DialogContentText>
          {errorCierre && (
            <AlertaError className="dialogo-alerta" error={errorCierre} titulo={t('proyectos.noPudimosCerrarElProyecto')} />
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setProyectoACerrar(null)} disabled={cerrando}>
            {t('proyectos.cancelar')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={manejarCierreProyecto}
            loading={cerrando}
            startIcon={<FiXCircle aria-hidden="true" />}
          >
            {cerrando ? t('proyectos.cerrando') : t('proyectos.cerrarProyecto')}
          </Button>
        </DialogActions>
      </Dialogo>
    </div>
  );
};

export default ListaProyectos;
