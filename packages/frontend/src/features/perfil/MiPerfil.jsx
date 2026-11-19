import { t } from '../../i18n/t';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  TextField,
} from '@mui/material';
import PropTypes from 'prop-types';
import { FiAlertCircle, FiCheck, FiKey, FiLock, FiSave, FiTrash2 } from 'react-icons/fi';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina.jsx';
import AlertaError from '../../components/AlertaError/AlertaError.jsx';
import Dialogo from '../../components/Dialogo/Dialogo.jsx';
import { EsqueletoFormulario } from '../../components/Esqueletos/Esqueletos.jsx';
import { useNotificar } from '../../components/Notificador/Notificador.jsx';
import AgregarMedioContactoButton from '../../components/AgregarMedioContactoButton/AgregarMedioContactoButton';
import CustomSelect from '../../components/CustomSelect/CustomSelect';
import UbicacionColectivo from '../../components/UbicacionColectivo/UbicacionColectivo';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useListado } from '../../hooks/useListado';
import {
  actualizarColaboradora,
  obtenerMiPerfilColaboradora,
  TIPOS_CONTACTO,
} from '../../service/colaboradorasService';
import {
  actualizarColectivo,
  obtenerMiPerfilColectivo,
  TIPOS_COLECTIVO,
} from '../../service/colectivosService';
// Excepción documentada en CAMBIOS-UI.md: el error al guardar conserva el texto que verifica MiPerfil.test.jsx.
import { mensajeDeError } from '../../service/api';
import { camposFaltantesPerfilColaboradora } from '../../utils/perfilColaboradora';
import { ETIQUETAS_MAX, etiquetaLegible } from '../../utils/etiquetas';
import { camposFaltantesPerfilColectivo } from '../../utils/perfilColectivo';
import './MiPerfil.css';

const PERFIL_VACIO = {
  nombreFantasia: '',
  usuarioGitHub: '',
  nombre: '',
  apellido: '',
  pronombres: '',
  presentacion: '',
  habilidades: [],
  nombreColectivo: '',
  descripcion: '',
  tipoDeColectivo: '',
  pais: '',
  provincia: '',
  ciudad: '',
  etiquetas: [],
  medios: [],
  aceptaMensajeria: false,
};

const normalizarPerfil = (perfil, esColaboradora) => {
  const medios = (perfil.mediosDeContacto ?? []).map((medio) => ({
    tipo: medio.tipoDeContacto,
    valor: medio.contacto,
  }));
  if (esColaboradora) {
    return {
      ...PERFIL_VACIO,
      nombreFantasia: perfil.nombreFantasia ?? '',
      usuarioGitHub: perfil.usuarioGitHub ?? '',
      nombre: perfil.nombre ?? '',
      apellido: perfil.apellido ?? '',
      pronombres: (perfil.pronombres ?? []).join(', '),
      presentacion: perfil.presentacion ?? '',
      habilidades: perfil.habilidades ?? [],
      medios,
      aceptaMensajeria: Boolean(perfil.aceptaMensajeria),
    };
  }
  return {
    ...PERFIL_VACIO,
    nombreColectivo: perfil.nombre ?? '',
    descripcion: perfil.descripcion ?? '',
    tipoDeColectivo: perfil.tipoDeColectivo ?? '',
    pais: perfil.ubicacion?.pais ?? '',
    provincia: perfil.ubicacion?.provincia ?? '',
    ciudad: perfil.ubicacion?.ciudad ?? '',
    etiquetas: perfil.etiquetas ?? [],
    medios,
    aceptaMensajeria: Boolean(perfil.aceptaMensajeria),
  };
};

const EMAIL_VALIDO = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const DURACION_MINIMA_GUARDADO_MS = 600;

const validarMedio = (medio) => {
  const valor = medio.valor.trim();
  if (medio.tipo === 'EMAIL') return EMAIL_VALIDO.test(valor);
  return /^\+\d{10,15}$/.test(valor.replace(/[\s-]/g, ''));
};

const validarPerfil = ({ datos, email, esColaboradora }) => {
  const errores = {};
  const agregar = (campo, etiqueta, mensaje, seccion, id) => {
    errores[campo] = { etiqueta, mensaje, seccion, id };
  };

  if (!email.trim()) {
    agregar('email', 'Email', 'No pudimos verificar el email de la cuenta en Logto.', 'cuenta', 'email-cuenta');
  } else if (!EMAIL_VALIDO.test(email.trim())) {
    agregar('email', 'Email', 'Ingresá un email válido en tu cuenta de Logto.', 'cuenta', 'email-cuenta');
  }

  if (esColaboradora) {
    const camposFaltantes = new Set(
      camposFaltantesPerfilColaboradora(datos).map(({ clave }) => clave),
    );
    if (camposFaltantes.has('nombreFantasia')) {
      agregar('nombreFantasia', 'Nombre de fantasía', 'El nombre de fantasía es obligatorio.', 'perfil', 'nombre-fantasia');
    }
    if (camposFaltantes.has('habilidades')) {
      agregar('habilidades', 'Habilidades', 'Elegí al menos una habilidad.', 'habilidades', 'mi-perfil-habilidades');
    }
  } else {
    const camposFaltantes = new Set(camposFaltantesPerfilColectivo(datos).map(({ clave }) => clave));
    if (camposFaltantes.has('nombreColectivo')) {
      agregar('nombreColectivo', 'Nombre del colectivo', 'El nombre del colectivo es obligatorio.', 'perfil', 'nombre-colectivo');
    }
    if (camposFaltantes.has('tipoDeColectivo')) {
      agregar('tipoDeColectivo', 'Tipo de colectivo', 'Elegí el tipo de colectivo.', 'perfil', 'tipo-colectivo');
    }
    if (camposFaltantes.has('descripcion')) {
      agregar('descripcion', 'Descripción', 'La descripción es obligatoria.', 'perfil', 'descripcion-colectivo');
    }
    if (datos.etiquetas.length > ETIQUETAS_MAX) {
      agregar(
        'etiquetas',
        'Áreas de trabajo',
        `Podés elegir hasta ${ETIQUETAS_MAX} áreas de trabajo.`,
        'areas',
        'mi-perfil-habilidades',
      );
    }
  }

  datos.medios.forEach((medio, indice) => {
    if (!validarMedio(medio)) {
      const tipo = TIPOS_CONTACTO.find((opcion) => opcion.valor === medio.tipo)?.texto ?? 'Contacto';
      const mensaje = medio.tipo === 'EMAIL'
        ? 'Ingresá un email válido.'
        : 'Ingresá un número válido con código de país, por ejemplo +5491145678901.';
      agregar(`medio-${indice}`, `${tipo}, contacto ${indice + 1}`, mensaje, 'contacto', `medio-contacto-${indice}`);
    }
  });

  return errores;
};

const MiPerfil = () => {
  const {
    sesion,
    getAccessToken,
    obtenerEmailCuenta,
    cambiarContrasena,
  } = useAuth();
  const esColaboradora = sesion?.rol === 'COLABORADOR';
  const listado = useListado(esColaboradora ? '/habilidades' : '/etiquetas');
  const [datos, setDatos] = useState(PERFIL_VACIO);
  const [datosIniciales, setDatosIniciales] = useState(PERFIL_VACIO);
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [errorCarga, setErrorCarga] = useState(null);
  const [intentoCarga, setIntentoCarga] = useState(0);
  const [intentoResumen, setIntentoResumen] = useState(0);
  const notificar = useNotificar();
  const [avisoEmail, setAvisoEmail] = useState('');
  const [exito, setExito] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState('cuenta');
  const [confirmarDescartar, setConfirmarDescartar] = useState(false);
  const hayCambios = useMemo(
    () => JSON.stringify(datos) !== JSON.stringify(datosIniciales),
    [datos, datosIniciales],
  );

  const secciones = useMemo(
    () => [
      ['cuenta', 'Cuenta'],
      ['perfil', 'Perfil'],
      [esColaboradora ? 'habilidades' : 'areas', esColaboradora ? 'Habilidades' : 'Áreas de trabajo'],
      ['contacto', 'Contacto'],
    ],
    [esColaboradora],
  );

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      setCargando(true);
      setErrorServidor('');
      setErrorCarga(null);
      try {
        const token = await getAccessToken();
        const perfil = esColaboradora
          ? await obtenerMiPerfilColaboradora(token)
          : await obtenerMiPerfilColectivo(token);
        const formulario = normalizarPerfil(perfil, esColaboradora);
        if (!vigente) return;
        setDatos(formulario);
        setDatosIniciales(formulario);

        try {
          setEmail(await obtenerEmailCuenta());
        } catch {
          if (vigente) {
            setAvisoEmail(
              'No pudimos leer el email desde Logto. Verificá el permiso email de la aplicación y volvé a iniciar sesión.',
            );
          }
        }
      } catch (cargaError) {
        if (vigente) setErrorCarga(cargaError);
      } finally {
        if (vigente) setCargando(false);
      }
    };
    cargar();
    return () => {
      vigente = false;
    };
  }, [esColaboradora, getAccessToken, obtenerEmailCuenta, intentoCarga]);

  const cambiar = (campo, valor) => {
    setDatos((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actuales) => {
      const siguientes = { ...actuales };
      delete siguientes[campo];
      if (campo === 'medios') {
        Object.keys(siguientes)
          .filter((clave) => clave.startsWith('medio-'))
          .forEach((clave) => delete siguientes[clave]);
      }
      return siguientes;
    });
    setErrorServidor('');
    setExito(false);
  };

  const cambiarUbicacion = (cambios) => {
    setDatos((actual) => ({ ...actual, ...cambios }));
    setErrorServidor('');
    setExito(false);
  };

  const cambiarMedio = (indice, cambios) => {
    cambiar(
      'medios',
      datos.medios.map((medio, i) => (i === indice ? { ...medio, ...cambios } : medio)),
    );
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    const nuevosErrores = validarPerfil({ datos, email, esColaboradora });
    setErrores(nuevosErrores);
    setErrorServidor('');
    if (Object.keys(nuevosErrores).length > 0) {
      const primerError = Object.values(nuevosErrores)[0];
      setSeccionActiva(primerError.seccion);
      setIntentoResumen((n) => n + 1);
      return;
    }

    setGuardando(true);
    setExito(false);
    const inicioGuardado = Date.now();
    try {
      const token = await getAccessToken();
      const mediosDeContacto = datos.medios.map((medio) => ({
        tipoDeContacto: medio.tipo,
        contacto:
          medio.tipo === 'EMAIL'
            ? medio.valor.trim()
            : medio.valor.replace(/[\s-]/g, ''),
      }));
      if (esColaboradora) {
        await actualizarColaboradora(token, sesion.idColaborador, {
          nombreFantasia: datos.nombreFantasia.trim(),
          usuarioGitHub: datos.usuarioGitHub.trim() || undefined,
          nombre: datos.nombre.trim() || undefined,
          apellido: datos.apellido.trim() || undefined,
          pronombres: datos.pronombres
            .split(',')
            .map((pronombre) => pronombre.trim())
            .filter(Boolean),
          presentacion: datos.presentacion.trim() || undefined,
          habilidades: datos.habilidades,
          aceptaMensajeria: datos.aceptaMensajeria,
          mediosDeContacto,
        });
      } else {
        const ubicacion = Object.fromEntries(
          Object.entries({
            pais: datos.pais.trim(),
            provincia: datos.provincia.trim(),
            ciudad: datos.ciudad.trim(),
          }).filter(([, valor]) => valor),
        );
        await actualizarColectivo(token, sesion.idColectivo, {
          nombre: datos.nombreColectivo.trim(),
          descripcion: datos.descripcion.trim(),
          tipoDeColectivo: datos.tipoDeColectivo,
          ...(Object.keys(ubicacion).length ? { ubicacion } : {}),
          etiquetas: datos.etiquetas,
          aceptaMensajeria: datos.aceptaMensajeria,
          mediosDeContacto,
        });
      }
      const esperaRestante = DURACION_MINIMA_GUARDADO_MS - (Date.now() - inicioGuardado);
      if (esperaRestante > 0) {
        await new Promise((resolve) => setTimeout(resolve, esperaRestante));
      }
      setDatosIniciales(datos);
      setExito(true);
      notificar({ mensaje: t('miPerfil.perfilGuardado') });
    } catch (guardadoError) {
      setErrorServidor(mensajeDeError(guardadoError));
    } finally {
      setGuardando(false);
    }
  };

  const mensajeCampo = (error, ayuda) =>
    error ? (
      <>
        <FiAlertCircle aria-hidden="true" />
        <span>{error}</span>
      </>
    ) : (
      ayuda
    );

  const titulo = `Tu perfil de ${esColaboradora ? 'colaboradora' : 'colectivo'}`;
  const migas = [{ texto: t('navegacion.inicio'), to: '/' }, { texto: 'Mi perfil' }];

  if (cargando) {
    return (
      <div className="contenedor-pagina">
        <EsqueletoFormulario campos={5} etiqueta={t('miPerfil.cargandoTuPerfil')} />
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="contenedor-pagina contenedor-pagina--lectura">
        <EncabezadoPagina titulo={titulo} migas={migas} />
        <AlertaError
          error={errorCarga}
          titulo={t('miPerfil.noPudimosCargarTuPerfil')}
          onReintentar={() => setIntentoCarga((n) => n + 1)}
        />
      </div>
    );
  }

  const opcionesHabilidades = listado.datos.map((item) => ({
    valor: item.titulo,
    etiqueta: item.titulo,
  }));
  const opcionesAreas = listado.datos.map((item) => ({
    valor: item,
    etiqueta: etiquetaLegible(item),
  }));
  const etiquetas = esColaboradora ? datos.habilidades : datos.etiquetas;
  const cantidadErrores = Object.keys(errores).length;
  const errorSeleccion = errores.habilidades?.mensaje ?? errores.etiquetas?.mensaje;

  return (
    <div className={`contenedor-pagina mi-perfil${esColaboradora ? '' : ' mi-perfil--colectivo'}`}>
      <EncabezadoPagina
        titulo={titulo}
        subtitulo={t('miPerfil.manteneTusDatosAlDia')}
        migas={migas}
      />

      <div className={`mi-perfil-disposicion${esColaboradora ? '' : ' mi-perfil-disposicion--sin-nav'}`}>
        {esColaboradora && (
          <nav className="mi-perfil-nav" aria-label="Secciones de mi perfil">
            <p className="mi-perfil-nav__titulo">{t('miPerfil.miCuenta')}</p>
            {secciones.map(([id, etiqueta]) => (
              <Button
                variant="text"
                type="button"
                key={id}
                className={`mi-perfil-nav__opcion${seccionActiva === id ? ' activo' : ''}`}
                onClick={() => {
                  setSeccionActiva(id);
                  document.getElementById(`mi-perfil-${id}`)?.scrollIntoView?.({ block: 'start' });
                }}
                aria-current={seccionActiva === id ? 'location' : undefined}
              >
                {seccionActiva === id ? `✓ ${etiqueta} · Actual` : etiqueta}
              </Button>
            ))}
            <p className="texto-secundario">Tus datos, bajo tu control.</p>
          </nav>
        )}

        <div className="mi-perfil-contenido">
          {cantidadErrores > 0 && (
            <ResumenErroresPerfil
              errores={errores}
              cantidad={cantidadErrores}
              intento={intentoResumen}
              onIr={(detalle) => {
                setSeccionActiva(detalle.seccion);
                const campo = document.getElementById(detalle.id);
                campo?.scrollIntoView?.({ block: 'center' });
                campo?.focus();
              }}
            />
          )}

          <form className="mi-perfil-formulario" onSubmit={guardar} noValidate>
            <section className="mi-perfil-tarjeta" id="mi-perfil-cuenta" aria-labelledby="mi-perfil-cuenta-titulo">
              <h2 id="mi-perfil-cuenta-titulo">Cuenta</h2>
              <TextField
                id="email-cuenta"
                label="Email (obligatorio)"
                value={email}
                fullWidth
                disabled
                error={Boolean(errores.email)}
                helperText={mensajeCampo(
                  errores.email?.mensaje,
                  'Este email se usa para iniciar sesión. Se administra desde Logto.'
                )}
              />
              {avisoEmail && (
                <Alert severity="warning" role="alert">
                  {avisoEmail}
                </Alert>
              )}
              <div>
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<FiKey aria-hidden="true" />}
                  onClick={() => cambiarContrasena(email)}
                >
                  Cambiar contraseña
                </Button>
              </div>
            </section>

            <section className="mi-perfil-tarjeta" id="mi-perfil-perfil" aria-labelledby="mi-perfil-perfil-titulo">
              <h2 id="mi-perfil-perfil-titulo">Perfil</h2>
              {esColaboradora ? (
                <>
                  <TextField
                    id="nombre-fantasia"
                    label="Nombre de fantasía (obligatorio)"
                    placeholder={t('miPerfil.ejNombrePublico')}
                    value={datos.nombreFantasia}
                    onChange={(e) => cambiar('nombreFantasia', e.target.value)}
                    error={Boolean(errores.nombreFantasia)}
                    helperText={mensajeCampo(errores.nombreFantasia?.mensaje)}
                    required
                    fullWidth
                  />
                  <TextField
                    id="usuario-github"
                    label="Usuario de GitHub o GitLab (opcional)"
                    placeholder={t('miPerfil.ejUsuarioGithub')}
                    value={datos.usuarioGitHub}
                    onChange={(e) => cambiar('usuarioGitHub', e.target.value)}
                    helperText="Sin @ ni enlace al perfil."
                    fullWidth
                  />
                  <div className="mi-perfil-dos-columnas">
                    <TextField
                      id="nombre-persona"
                      label="Nombre (opcional)"
                      placeholder={t('miPerfil.ejLucia')}
                      value={datos.nombre}
                      onChange={(e) => cambiar('nombre', e.target.value)}
                      fullWidth
                    />
                    <TextField
                      id="apellido-persona"
                      label="Apellido (opcional)"
                      placeholder={t('miPerfil.ejGomez')}
                      value={datos.apellido}
                      onChange={(e) => cambiar('apellido', e.target.value)}
                      fullWidth
                    />
                  </div>
                  <TextField
                    id="pronombres"
                    label="Pronombres (opcional)"
                    placeholder={t('miPerfil.ejEllaElle')}
                    value={datos.pronombres}
                    onChange={(e) => cambiar('pronombres', e.target.value)}
                    helperText={t('miPerfil.separalosConComas')}
                    fullWidth
                  />
                  <TextField
                    id="presentacion"
                    label="Presentación breve (opcional)"
                    placeholder={t('miPerfil.ejPresentacion')}
                    value={datos.presentacion}
                    onChange={(e) => cambiar('presentacion', e.target.value)}
                    multiline
                    minRows={3}
                    slotProps={{ htmlInput: { maxLength: 280 } }}
                    helperText={`${datos.presentacion.length} de 280 caracteres`}
                    fullWidth
                  />
                </>
              ) : (
                <>
                  <TextField
                    id="nombre-colectivo"
                    label="Nombre del colectivo (obligatorio)"
                    placeholder="Ej.: Colectivo La Semilla"
                    value={datos.nombreColectivo}
                    onChange={(e) => cambiar('nombreColectivo', e.target.value)}
                    error={Boolean(errores.nombreColectivo)}
                    helperText={mensajeCampo(errores.nombreColectivo?.mensaje)}
                    required
                    fullWidth
                  />
                  <TextField
                    id="tipo-colectivo"
                    label="Tipo de colectivo (obligatorio)"
                    select
                    value={datos.tipoDeColectivo}
                    onChange={(e) => cambiar('tipoDeColectivo', e.target.value)}
                    error={Boolean(errores.tipoDeColectivo)}
                    helperText={mensajeCampo(errores.tipoDeColectivo?.mensaje)}
                    required
                    fullWidth
                  >
                    {TIPOS_COLECTIVO.map((tipo) => (
                      <MenuItem key={tipo.valor} value={tipo.valor}>
                        {tipo.texto}
                      </MenuItem>
                    ))}
                  </TextField>
                  <UbicacionColectivo
                    pais={datos.pais}
                    provincia={datos.provincia}
                    ciudad={datos.ciudad}
                    onChange={cambiarUbicacion}
                    labelsAbove
                    idPrefix="mi-perfil-ubicacion"
                  />
                  <TextField
                    id="descripcion-colectivo"
                    label="Descripción (obligatoria)"
                    placeholder={t('miPerfil.ejDescripcionColectivo')}
                    value={datos.descripcion}
                    onChange={(e) => cambiar('descripcion', e.target.value)}
                    error={Boolean(errores.descripcion)}
                    helperText={mensajeCampo(errores.descripcion?.mensaje)}
                    required
                    multiline
                    minRows={4}
                    fullWidth
                  />
                </>
              )}
            </section>

            <section
              className="mi-perfil-tarjeta"
              id={`mi-perfil-${esColaboradora ? 'habilidades' : 'areas'}`}
              aria-labelledby="mi-perfil-seleccion-titulo"
            >
              <h2 id="mi-perfil-seleccion-titulo">{esColaboradora ? 'Habilidades' : 'Habilidades y áreas de trabajo'}</h2>
              <p className="texto-secundario">
                {esColaboradora
                  ? 'Elegí las habilidades que querés aportar.'
                  : 'Agregá etiquetas para describir las áreas de trabajo de tu colectivo.'}
              </p>
              {listado.error && (
                <AlertaError
                  error={listado.error}
                  titulo={t('miPerfil.noPudimosCargarLasOpciones')}
                  onReintentar={listado.recargar}
                />
              )}
              <CustomSelect
                id="mi-perfil-habilidades"
                etiqueta={esColaboradora ? 'Habilidades (obligatorio)' : t('miPerfil.areasYEtiquetasOpcional')}
                opciones={esColaboradora ? opcionesHabilidades : opcionesAreas}
                seleccion={etiquetas}
                multiple
                maxSeleccion={esColaboradora ? undefined : ETIQUETAS_MAX}
                permiteCrear={!esColaboradora}
                error={errorSeleccion}
                onSeleccionar={(valor) => cambiar(esColaboradora ? 'habilidades' : 'etiquetas', [...etiquetas, valor])}
                onQuitar={(valor) =>
                  cambiar(
                    esColaboradora ? 'habilidades' : 'etiquetas',
                    etiquetas.filter((actual) => actual !== valor),
                  )
                }
                placeholder={listado.cargando ? 'Cargando opciones…' : t('perfilesProyecto.placeholderHabilidades')}
                textoVacio={listado.cargando ? 'Cargando opciones…' : 'No hay coincidencias.'}
              />
            </section>

            <section className="mi-perfil-tarjeta" id="mi-perfil-contacto" aria-labelledby="mi-perfil-contacto-titulo">
              <h2 id="mi-perfil-contacto-titulo">Contacto</h2>
              <Alert severity="info" icon={<FiLock aria-hidden="true" />}>
                Tus medios de contacto son privados y no se muestran públicamente.
              </Alert>
              {datos.medios.length > 0 && (
                <ul className="medios-lista" aria-label={t('miPerfil.mediosDeContacto')}>
                  {datos.medios.map((medio, indice) => (
                    <li className="medios-fila" key={`${indice}-${medio.tipo}`}>
                      <TextField
                        id={`medio-tipo-${indice}`}
                        label="Tipo"
                        select
                        value={medio.tipo}
                        onChange={(e) => cambiarMedio(indice, { tipo: e.target.value })}
                        fullWidth
                      >
                        {TIPOS_CONTACTO.map((tipo) => (
                          <MenuItem key={tipo.valor} value={tipo.valor}>
                            {tipo.texto}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        id={`medio-contacto-${indice}`}
                        label={medio.tipo === 'EMAIL' ? 'Dirección de email' : t('miPerfil.numeroConCodigoDePais')}
                        placeholder={medio.tipo === 'EMAIL' ? t('miPerfil.ejEmail') : t('miPerfil.ejTelefono')}
                        value={medio.valor}
                        onChange={(e) => cambiarMedio(indice, { valor: e.target.value })}
                        error={Boolean(errores[`medio-${indice}`])}
                        helperText={mensajeCampo(errores[`medio-${indice}`]?.mensaje)}
                        fullWidth
                      />
                      <IconButton
                        type="button"
                        aria-label={`Quitar medio de contacto ${indice + 1}`}
                        onClick={() => cambiar('medios', datos.medios.filter((_, i) => i !== indice))}
                      >
                        <FiTrash2 aria-hidden="true" />
                      </IconButton>
                    </li>
                  ))}
                </ul>
              )}
              <div>
                <AgregarMedioContactoButton
                  onClick={() => cambiar('medios', [...datos.medios, { tipo: 'EMAIL', valor: '' }])}
                />
              </div>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={datos.aceptaMensajeria}
                    onChange={(e) => cambiar('aceptaMensajeria', e.target.checked)}
                  />
                }
                label="Quiero recibir mensajes internos sobre proyectos relacionados con mi perfil."
              />
            </section>

            {errorServidor && (
              <Alert className="mi-perfil-estado" severity="error" role="alert">
                <span>{`No pudimos guardar los cambios: ${errorServidor}`}</span>
                <p className="texto-secundario">{t('miPerfil.tusDatosSiguenAcaPodes')}</p>
              </Alert>
            )}

            <div className="mi-perfil-acciones">
              <Button
                type="button"
                variant="outlined"
                disabled={guardando}
                onClick={() => {
                  if (hayCambios) {
                    setConfirmarDescartar(true);
                  } else {
                    setErrores({});
                    setErrorServidor('');
                    setExito(false);
                  }
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={Boolean(listado.error && esColaboradora)}
                loading={guardando}
                startIcon={<FiSave aria-hidden="true" />}
              >
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
            {exito && (
              <Alert className="mi-perfil-estado" severity="success" role="status" icon={<FiCheck aria-hidden="true" />}>
                Los cambios ya fueron aplicados.
              </Alert>
            )}
          </form>
        </div>
      </div>

      <Dialogo open={confirmarDescartar} onClose={() => setConfirmarDescartar(false)} aria-labelledby="descartar-cambios-titulo">
        <DialogTitle id="descartar-cambios-titulo">¿Descartar los cambios?</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('miPerfil.vasAPerderLosCambios')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmarDescartar(false)} variant="outlined">
            Seguir editando
          </Button>
          <Button
            onClick={() => {
              setDatos(datosIniciales);
              setErrores({});
              setErrorServidor('');
              setExito(false);
              setConfirmarDescartar(false);
            }}
            variant="contained"
            color="error"
            startIcon={<FiTrash2 aria-hidden="true" />}
          >
            Descartar cambios
          </Button>
        </DialogActions>
      </Dialogo>
    </div>
  );
};

// Resumen de errores de Mi perfil: conserva el título "Revisá N campos" y enlaza a cada campo.
const ResumenErroresPerfil = ({ errores, cantidad, intento, onIr }) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (intento > 0) ref.current?.focus();
  }, [intento]);
  return (
    <Alert severity="error" role="alert" ref={ref} tabIndex={-1} className="resumen-errores" aria-labelledby="mi-perfil-errores-titulo">
      <AlertTitle id="mi-perfil-errores-titulo" component="h2">
        Revisá {cantidad} {cantidad === 1 ? 'campo' : 'campos'}
      </AlertTitle>
      <p>Corregí los campos para guardar los cambios.</p>
      <ul className="resumen-errores__lista">
        {Object.entries(errores).map(([campo, detalle]) => (
          <li key={campo}>
            <a
              href={`#${detalle.id}`}
              onClick={(evento) => {
                evento.preventDefault();
                onIr(detalle);
              }}
            >
              {detalle.etiqueta}: {detalle.mensaje}
            </a>
          </li>
        ))}
      </ul>
    </Alert>
  );
};

ResumenErroresPerfil.propTypes = {
  errores: PropTypes.object.isRequired,
  cantidad: PropTypes.number.isRequired,
  intento: PropTypes.number.isRequired,
  onIr: PropTypes.func.isRequired,
};

export default MiPerfil;
