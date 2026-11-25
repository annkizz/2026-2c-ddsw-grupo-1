import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import { FiAlertCircle, FiArrowLeft, FiLock, FiPlus, FiSave, FiTrash2, FiEdit2, FiUsers } from 'react-icons/fi';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina.jsx';
import AlertaError from '../../components/AlertaError/AlertaError.jsx';
import EstadoVacio from '../../components/EstadoVacio/EstadoVacio.jsx';
import ResumenErrores from '../../components/ResumenErrores/ResumenErrores.jsx';
import Dialogo from '../../components/Dialogo/Dialogo.jsx';
import { EsqueletoGrilla } from '../../components/Esqueletos/Esqueletos.jsx';
import { useNotificar } from '../../components/Notificador/Notificador.jsx';
import '../../components/Card.css';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  obtenerProyectoPorId,
  obtenerPerfiles,
  crearPerfil,
  actualizarPerfil,
  eliminarPerfil,
} from '../../service/proyectosService';
import { obtenerHabilidades } from '../../service/habilidadesService';
import { t } from '../../i18n/t';
import {
  TIPOS_COMPROMISO,
  MODALIDADES,
  resumenCompromiso,
  etiquetaModalidad,
  textoCupo,
} from '../../utils/perfiles';
import './PerfilesProyecto.css';
import CampoMarkdown from '../../components/CampoMarkdown/CampoMarkdown.jsx';
import { MarkdownEnLinea } from '../../components/Markdown/Markdown.jsx';
import { markdownEnLineaATextoPlano } from '../../utils/markdown';

const PERFIL_VACIO = {
  descripcion: '',
  habilidadesRequeridas: [],
  habilidadesOpcionales: [],
  tipoCompromiso: 'MENSUALES',
  horas: '',
  tipoColaboracion: 'GRATUITA',
  limiteColaboraciones: '',
  tipoAceptacion: 'MANUAL',
};

export const construirPayloadPerfil = (form) => ({
  descripcion: form.descripcion.trim(),
  habilidadesRequeridas: form.habilidadesRequeridas,
  habilidadesOpcionales: form.habilidadesOpcionales,
  compromiso: {
    tipoCompromiso: form.tipoCompromiso,
    horas: Number(form.horas),
    tipoColaboracion: form.tipoColaboracion,
  },
  tipoAceptacion: form.tipoAceptacion,
  ...(form.tipoAceptacion !== 'SIN_LIMITE' && form.limiteColaboraciones !== ''
    ? { limiteColaboraciones: Number(form.limiteColaboraciones) }
    : {}),
});

export const validarLimiteColaboraciones = ({ tipoAceptacion, limiteColaboraciones }) => {
  if (tipoAceptacion === 'SIN_LIMITE') return '';
  if (tipoAceptacion === 'LLENAR_VACANTES' && limiteColaboraciones === '') {
    return t('perfilesProyecto.errLimiteRequerido');
  }
  if (limiteColaboraciones !== '') {
    const limite = Number(limiteColaboraciones);
    if (!Number.isInteger(limite) || limite < 1) return t('perfilesProyecto.errLimite');
  }
  return '';
};

const PerfilesProyecto = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { sesion, getAccessToken } = useAuth();
  const notificar = useNotificar();

  const [proyecto, setProyecto] = useState(null);
  const [perfiles, setPerfiles] = useState([]);
  const [habilidades, setHabilidades] = useState([]);
  const [errorHabilidades, setErrorHabilidades] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [perfilEditandoId, setPerfilEditandoId] = useState(null);
  const [form, setForm] = useState(PERFIL_VACIO);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);
  const [intentoResumen, setIntentoResumen] = useState(0);
  const [perfilAEliminar, setPerfilAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const [dataProyecto, dataPerfiles] = await Promise.all([
        obtenerProyectoPorId(id),
        obtenerPerfiles(id),
      ]);
      setProyecto(dataProyecto);
      setPerfiles(dataPerfiles);
    } catch (e) {
      setErrorCarga(e);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!cargando && proyecto && sesion?.idColectivo &&
        proyecto.idColectivo === sesion.idColectivo && location.state?.crearPerfil) {
      setModalAbierto(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [cargando, proyecto, sesion?.idColectivo, location, navigate]);

  const cargarHabilidades = useCallback(() => {
    setErrorHabilidades(null);
    obtenerHabilidades()
      .then((lista) =>
        setHabilidades(
          lista.map((h) => (typeof h === 'string' ? h : h.titulo)).filter(Boolean),
        ),
      )
      .catch((error) => setErrorHabilidades(error));
  }, []);

  useEffect(() => {
    cargarHabilidades();
  }, [cargarHabilidades]);

  const recargarPerfiles = async () => setPerfiles(await obtenerPerfiles(id));

  const abrirModalCrear = () => {
    setPerfilEditandoId(null);
    setForm(PERFIL_VACIO);
    setErrores({});
    setErrorGuardar(null);
    setIntentoResumen(0);
    setModalAbierto(true);
  };

  const abrirModalEditar = (perfil) => {
    setPerfilEditandoId(perfil.id);
    setForm({
      descripcion: perfil.descripcion,
      habilidadesRequeridas: perfil.habilidadesRequeridas,
      habilidadesOpcionales: perfil.habilidadesOpcionales,
      tipoCompromiso: perfil.compromiso.tipoCompromiso,
      horas: String(perfil.compromiso.horas),
      tipoColaboracion: perfil.compromiso.tipoColaboracion,
      limiteColaboraciones: perfil.limiteColaboraciones ? String(perfil.limiteColaboraciones) : '',
      tipoAceptacion: perfil.tipoAceptacion ?? 'MANUAL',
    });
    setErrores({});
    setErrorGuardar(null);
    setIntentoResumen(0);
    setModalAbierto(true);
  };

  const validar = () => {
    const errs = {};
    if (!form.descripcion.trim()) errs.descripcion = t('perfilesProyecto.errDescripcion');
    if (form.habilidadesRequeridas.length === 0) {
      errs.habilidadesRequeridas = t('perfilesProyecto.errHabilidadesRequeridas');
    }
    const horas = Number(form.horas);
    if (!form.horas || !Number.isInteger(horas) || horas < 1) {
      errs.horas = t('perfilesProyecto.errHoras');
    }
    const errorLimite = validarLimiteColaboraciones(form);
    if (errorLimite) errs.limiteColaboraciones = errorLimite;
    setErrores(errs);
    setIntentoResumen((n) => n + 1);
    return Object.keys(errs).length === 0;
  };

  const guardarPerfil = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    setGuardando(true);
    setErrorGuardar(null);
    try {
      const token = await getAccessToken();
      const payload = construirPayloadPerfil(form);

      if (perfilEditandoId) {
        await actualizarPerfil(token, id, perfilEditandoId, payload);
        notificar({ mensaje: t('perfilesProyecto.exitoEditado') });
      } else {
        await crearPerfil(token, id, payload);
        notificar({ mensaje: t('perfilesProyecto.exitoAgregado') });
      }

      setModalAbierto(false);
      setForm(PERFIL_VACIO);
      setPerfilEditandoId(null);
      await recargarPerfiles();
    } catch (err) {
      setErrorGuardar(err);
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminacion = async () => {
    if (!perfilAEliminar) return;
    setEliminando(true);
    setErrorEliminar(null);
    try {
      const token = await getAccessToken();
      await eliminarPerfil(token, id, perfilAEliminar.id);
      setPerfilAEliminar(null);
      notificar({ mensaje: t('perfilesProyecto.exitoEliminado') });
      await recargarPerfiles();
    } catch (err) {
      setErrorEliminar(err);
    } finally {
      setEliminando(false);
    }
  };

  const migas = [
    { texto: t('perfilesProyecto.migaProyectos'), to: '/proyectos' },
    ...(proyecto ? [{ texto: proyecto.titulo, to: `/proyectos/${id}` }] : []),
    { texto: t('perfilesProyecto.titulo') },
  ];

  const mensajeCampo = (error, ayuda) =>
    error ? (
      <>
        <FiAlertCircle aria-hidden="true" />
        <span>{error}</span>
      </>
    ) : (
      ayuda
    );

  const cambiarTipoAceptacion = (e) => {
    const tipoAceptacion = e.target.value;
    setForm((prev) => ({
      ...prev,
      tipoAceptacion,
      ...(tipoAceptacion === 'SIN_LIMITE' ? { limiteColaboraciones: '' } : {}),
    }));
    setErrores((prev) => ({ ...prev, limiteColaboraciones: '' }));
  };

  const IDS = {
    descripcion: 'perfil-descripcion',
    habilidadesRequeridas: 'perfil-requeridas',
    horas: 'perfil-horas',
    limiteColaboraciones: 'perfil-limite',
  };
  const listaErrores = Object.entries(errores)
    .filter(([, mensaje]) => mensaje)
    .map(([campo, mensaje]) => ({ campoId: IDS[campo], mensaje }));

  if (cargando) {
    return (
      <div className="contenedor-pagina">
        <EncabezadoPagina titulo={t('perfilesProyecto.titulo')} migas={migas} />
        <EsqueletoGrilla cantidad={3} etiqueta={t('comun.cargando')} />
      </div>
    );
  }

  if (errorCarga || !proyecto) {
    return (
      <div className="contenedor-pagina contenedor-pagina--lectura">
        <EncabezadoPagina titulo={t('perfilesProyecto.titulo')} migas={migas} />
        <AlertaError error={errorCarga} titulo={t('perfilesProyecto.errorCargaTitulo')} onReintentar={cargar} />
      </div>
    );
  }

  const esDueno = Boolean(sesion?.idColectivo) && proyecto.idColectivo === sesion.idColectivo;
  if (!esDueno) {
    return (
      <div className="contenedor-pagina contenedor-pagina--lectura">
        <EncabezadoPagina titulo={t('perfilesProyecto.titulo')} migas={migas} />
        <EstadoVacio
          icono={FiLock}
          titulo={t('perfilesProyecto.accesoTitulo')}
          descripcion={t('perfilesProyecto.soloDueno')}
          accion={
            <Button component={Link} to={`/proyectos/${id}`} variant="outlined" startIcon={<FiArrowLeft aria-hidden="true" />}>
              {t('perfilesProyecto.volverAlProyecto')}
            </Button>
          }
        />
      </div>
    );
  }

  const botonAgregar = (
    <Button variant="contained" onClick={abrirModalCrear} startIcon={<FiPlus aria-hidden="true" />}>
      {t('perfilesProyecto.agregarPerfilBtn')}
    </Button>
  );

  return (
    <div className="contenedor-pagina">
      <EncabezadoPagina
        titulo={t('perfilesProyecto.titulo')}
        antetitulo={proyecto.titulo}
        migas={migas}
        accion={botonAgregar}
      />

      {perfiles.length === 0 ? (
        <EstadoVacio
          icono={FiUsers}
          titulo={t('perfilesProyecto.sinPerfiles')}
          descripcion={t('perfilesProyecto.sinPerfilesDescripcion')}
          accion={
            <Button variant="outlined" onClick={abrirModalCrear} startIcon={<FiPlus aria-hidden="true" />}>
              {t('perfilesProyecto.agregarPerfilBtn')}
            </Button>
          }
        />
      ) : (
        <ul className="tarjetas">
          {perfiles.map((perfil) => (
            <li key={perfil.id} className="tarjeta" aria-labelledby={`admin-perfil-${perfil.id}`}>
              <div className="tarjeta__cuerpo">
                <h2 id={`admin-perfil-${perfil.id}`} className="tarjeta__titulo">
                  <MarkdownEnLinea texto={perfil.descripcion} />
                </h2>

                <div className="perfil-admin__bloque">
                  <p className="texto-secundario">{t('detalleProyecto.habilidadesRequeridas')}</p>
                  <ul className="lista-chips">
                    {perfil.habilidadesRequeridas.map((h) => (
                      <li key={h}>
                        <Chip color="primary" label={h} />
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="perfil-admin__bloque">
                  <p className="texto-secundario">{t('detalleProyecto.habilidadesOpcionales')}</p>
                  {perfil.habilidadesOpcionales.length > 0 ? (
                    <ul className="lista-chips">
                      {perfil.habilidadesOpcionales.map((h) => (
                        <li key={h}>
                          <Chip label={h} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="texto-secundario">{t('detalleProyecto.sinHabilidadesOpcionales')}</p>
                  )}
                </div>

                <dl className="perfil-admin__datos">
                  <div>
                    <dt>{t('detalleProyecto.compromiso')}</dt>
                    <dd>{resumenCompromiso(perfil.compromiso)}</dd>
                  </div>
                  <div>
                    <dt>{t('detalleProyecto.modalidad')}</dt>
                    <dd>{etiquetaModalidad(perfil.compromiso.tipoColaboracion)}</dd>
                  </div>
                  <div>
                    <dt>{t('detalleProyecto.cupo')}</dt>
                    <dd>{textoCupo(perfil.limiteColaboraciones)}</dd>
                  </div>
                </dl>
              </div>

              <div className="tarjeta__acciones">
                <Button
                  variant="outlined"
                  startIcon={<FiEdit2 aria-hidden="true" />}
                  onClick={() => abrirModalEditar(perfil)}
                  aria-label={t('formatoTipoValor', { tipo: t('perfilesProyecto.editarPerfil'), valor: markdownEnLineaATextoPlano(perfil.descripcion) })}
                >
                  {t('perfilesProyecto.editarPerfil')}
                </Button>
                <Button
                  variant="text"
                  color="error"
                  startIcon={<FiTrash2 aria-hidden="true" />}
                  onClick={() => {
                    setErrorEliminar(null);
                    setPerfilAEliminar(perfil);
                  }}
                  aria-label={t('formatoTipoValor', { tipo: t('perfilesProyecto.eliminarPerfil'), valor: markdownEnLineaATextoPlano(perfil.descripcion) })}
                >
                  {t('perfilesProyecto.eliminarPerfil')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Agregar / editar perfil */}
      <Dialogo
        open={modalAbierto}
        onClose={() => !guardando && setModalAbierto(false)}
        aria-labelledby="perfil-dialogo-titulo"
      >
        <form onSubmit={guardarPerfil} noValidate>
          <DialogTitle id="perfil-dialogo-titulo">
            {perfilEditandoId ? t('perfilesProyecto.modalEditarTitulo') : t('perfilesProyecto.modalAgregarTitulo')}
          </DialogTitle>
          <DialogContent className="dialogo-formulario">
            <ResumenErrores
              id="perfil-resumen-errores"
              errores={intentoResumen > 0 ? listaErrores : []}
              intento={intentoResumen}
            />

            <CampoMarkdown enLinea
              id="perfil-descripcion"
              label={t('perfilesProyecto.labelDescripcion')}
              placeholder={t('perfilesProyecto.placeholderDescripcion')}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              error={Boolean(errores.descripcion)}
              helperText={mensajeCampo(errores.descripcion)}
              disabled={guardando}
              required
              fullWidth
            />

            {errorHabilidades && (
              <Alert severity="warning">
                {t('perfilesProyecto.errorHabilidades')}
                <div className="alerta-acciones">
                  <Button variant="outlined" onClick={cargarHabilidades}>
                    {t('perfilesProyecto.reintentar')}
                  </Button>
                </div>
              </Alert>
            )}

            <Autocomplete
              id="perfil-requeridas"
              multiple
              filterSelectedOptions
              options={habilidades.filter((h) => !form.habilidadesOpcionales.includes(h))}
              value={form.habilidadesRequeridas}
              onChange={(_, valor) => setForm({ ...form, habilidadesRequeridas: valor })}
              disabled={guardando}
              noOptionsText={t('perfilesProyecto.noHayHabilidadesConEse')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('perfilesProyecto.requeridasObligatorio')}
                  placeholder={t('perfilesProyecto.placeholderHabilidades')}
                  error={Boolean(errores.habilidadesRequeridas)}
                  helperText={mensajeCampo(errores.habilidadesRequeridas)}
                  required
                />
              )}
            />

            <Autocomplete
              id="perfil-opcionales"
              multiple
              filterSelectedOptions
              options={habilidades.filter((h) => !form.habilidadesRequeridas.includes(h))}
              value={form.habilidadesOpcionales}
              onChange={(_, valor) => setForm({ ...form, habilidadesOpcionales: valor })}
              disabled={guardando}
              noOptionsText={t('perfilesProyecto.noHayHabilidadesConEse')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('perfilesProyecto.opcionalesOpcional')}
                  placeholder={t('perfilesProyecto.placeholderHabilidades')}
                  helperText={t('perfilesProyecto.ayudaOpcionales')}
                />
              )}
            />

            <div className="form-fila-2">
              <TextField
                id="perfil-tipo-compromiso"
                select
                label={t('perfilesProyecto.tipoCompromiso')}
                value={form.tipoCompromiso}
                onChange={(e) => setForm({ ...form, tipoCompromiso: e.target.value })}
                disabled={guardando}
                fullWidth
              >
                {TIPOS_COMPROMISO.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {t(`enumeraciones.tipoCompromiso.${tipo}`)}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                id="perfil-horas"
                type="number"
                label={t('perfilesProyecto.cantidadHoras')}
                placeholder={t('perfilesProyecto.placeholderHoras')}
                value={form.horas}
                onChange={(e) => setForm({ ...form, horas: e.target.value })}
                error={Boolean(errores.horas)}
                helperText={mensajeCampo(errores.horas, t('perfilesProyecto.ayudaHoras'))}
                disabled={guardando}
                required
                fullWidth
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
              />
            </div>

            <TextField
              id="perfil-modalidad"
              select
              label={t('perfilesProyecto.modalidadColaboracion')}
              value={form.tipoColaboracion}
              onChange={(e) => setForm({ ...form, tipoColaboracion: e.target.value })}
              disabled={guardando}
              fullWidth
            >
              {MODALIDADES.map((modalidad) => (
                <MenuItem key={modalidad} value={modalidad}>
                  {etiquetaModalidad(modalidad)}
                </MenuItem>
              ))}
            </TextField>

            <FormControl component="fieldset" disabled={guardando} fullWidth>
              <FormLabel component="legend">{t('perfilesProyecto.tipoAceptacion')}</FormLabel>
              <RadioGroup
                aria-label={t('perfilesProyecto.tipoAceptacion')}
                value={form.tipoAceptacion}
                onChange={cambiarTipoAceptacion}
                className="perfil-tipo-aceptacion"
              >
                <FormControlLabel
                  value="LLENAR_VACANTES"
                  control={<Radio />}
                  label={
                    <span className="perfil-tipo-aceptacion__opcion">
                      <strong>{t('perfilesProyecto.opcionLlenarVacantes')}</strong>
                      <span className="texto-secundario">{t('perfilesProyecto.ayudaLlenarVacantes')}</span>
                    </span>
                  }
                />
                <FormControlLabel
                  value="SIN_LIMITE"
                  control={<Radio />}
                  label={
                    <span className="perfil-tipo-aceptacion__opcion">
                      <strong>{t('perfilesProyecto.opcionSinLimite')}</strong>
                      <span className="texto-secundario">{t('perfilesProyecto.ayudaSinLimite')}</span>
                    </span>
                  }
                />
                <FormControlLabel
                  value="MANUAL"
                  control={<Radio />}
                  label={
                    <span className="perfil-tipo-aceptacion__opcion">
                      <strong>{t('perfilesProyecto.opcionManual')}</strong>
                      <span className="texto-secundario">{t('perfilesProyecto.ayudaManual')}</span>
                    </span>
                  }
                />
              </RadioGroup>
            </FormControl>

            {form.tipoAceptacion !== 'SIN_LIMITE' && (
              <TextField
                id="perfil-limite"
                type="number"
                label={t('perfilesProyecto.limiteColaboraciones')}
                placeholder={t('perfilesProyecto.placeholderCupo')}
                value={form.limiteColaboraciones}
                onChange={(e) => setForm({ ...form, limiteColaboraciones: e.target.value })}
                error={Boolean(errores.limiteColaboraciones)}
                helperText={mensajeCampo(
                  errores.limiteColaboraciones,
                  form.tipoAceptacion === 'LLENAR_VACANTES'
                    ? t('perfilesProyecto.ayudaCupoRequerido')
                    : t('perfilesProyecto.ayudaCupo'),
                )}
                disabled={guardando}
                required={form.tipoAceptacion === 'LLENAR_VACANTES'}
                fullWidth
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
              />
            )}

            {errorGuardar && (
              <AlertaError error={errorGuardar} titulo={t('perfilesProyecto.errorGuardarTitulo')}>
                <span> {t('perfilesProyecto.datosConservados')}</span>
              </AlertaError>
            )}
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" onClick={() => setModalAbierto(false)} disabled={guardando}>
              {t('perfilesProyecto.cancelar')}
            </Button>
            <Button type="submit" variant="contained" loading={guardando} startIcon={<FiSave aria-hidden="true" />}>
              {guardando
                ? t('perfilesProyecto.guardando')
                : errorGuardar
                  ? t('perfilesProyecto.reintentar')
                  : t('perfilesProyecto.guardarPerfil')}
            </Button>
          </DialogActions>
        </form>
      </Dialogo>

      {/* Confirmar eliminación */}
      <Dialogo
        open={Boolean(perfilAEliminar)}
        onClose={() => !eliminando && setPerfilAEliminar(null)}
        maxWidth="xs"
        aria-labelledby="eliminar-perfil-titulo"
        aria-describedby="eliminar-perfil-texto"
      >
        <DialogTitle id="eliminar-perfil-titulo">{t('perfilesProyecto.modalEliminarTitulo')}</DialogTitle>
        <DialogContent className="dialogo-formulario">
          <DialogContentText id="eliminar-perfil-texto">
            {perfilAEliminar && <strong><MarkdownEnLinea texto={perfilAEliminar.descripcion} />. </strong>}
            {t('perfilesProyecto.mensajeEliminar')}
          </DialogContentText>
          {errorEliminar && <AlertaError error={errorEliminar} titulo={t('perfilesProyecto.errorEliminarTitulo')} />}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setPerfilAEliminar(null)} disabled={eliminando}>
            {t('perfilesProyecto.cancelar')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmarEliminacion}
            loading={eliminando}
            startIcon={<FiTrash2 aria-hidden="true" />}
          >
            {eliminando ? t('perfilesProyecto.eliminando') : t('perfilesProyecto.confirmarEliminar')}
          </Button>
        </DialogActions>
      </Dialogo>
    </div>
  );
};

export default PerfilesProyecto;
