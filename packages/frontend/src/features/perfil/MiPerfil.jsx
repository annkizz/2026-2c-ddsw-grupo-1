import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Button,
  CircularProgress,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  TextField,
} from '@mui/material';
import { FiCheck, FiLock, FiPlus, FiX } from 'react-icons/fi';
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
        if (vigente) setErrorServidor(mensajeDeError(cargaError));
      } finally {
        if (vigente) setCargando(false);
      }
    };
    cargar();
    return () => {
      vigente = false;
    };
  }, [esColaboradora, getAccessToken, obtenerEmailCuenta]);

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
      document.getElementById(primerError.id)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
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
    } catch (guardadoError) {
      setErrorServidor(mensajeDeError(guardadoError));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="mi-perfil-cargando" role="status">
        <CircularProgress />
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

  return (
    <div className="mi-perfil">
      <Link to="/proyectos" className="mi-perfil-volver">‹ Volver a mi cuenta</Link>
      <header className="mi-perfil-cabecera">
        <h1>Tu perfil de {esColaboradora ? 'colaboradora' : 'colectivo'}</h1>
        <p>Mantené tus datos al día para que la comunidad pueda encontrarte.</p>
        <small>Los campos marcados como obligatorios deben completarse.</small>
      </header>

      {errorServidor && (
        <Alert className="mi-perfil-estado" severity="error" role="alert">
          No pudimos guardar los cambios: {errorServidor}
        </Alert>
      )}

      <div className="mi-perfil-disposicion">
        <nav className="mi-perfil-nav" aria-label="Secciones de mi perfil">
          <span>MI CUENTA</span>
          {secciones.map(([id, etiqueta]) => (
            <Button
              variant="text"
              type="button"
              key={id}
              className={seccionActiva === id ? 'activo' : ''}
              onClick={() => {
                setSeccionActiva(id);
                document.getElementById(`mi-perfil-${id}`)?.scrollIntoView?.({ behavior: 'smooth' });
              }}
              aria-current={seccionActiva === id ? 'location' : undefined}
            >
              {seccionActiva === id ? `✓ ${etiqueta} · Actual` : etiqueta}
            </Button>
          ))}
          <small>Tus datos, bajo tu control.</small>
        </nav>

        <div className="mi-perfil-contenido">
          {Object.keys(errores).length > 0 && (
            <section className="mi-perfil-resumen-errores" role="alert" aria-labelledby="mi-perfil-errores-titulo">
              <h2 id="mi-perfil-errores-titulo">
                Revisá {Object.keys(errores).length} {Object.keys(errores).length === 1 ? 'campo' : 'campos'}
              </h2>
              <p>Corregí los campos para guardar los cambios.</p>
              <ul>
                {Object.entries(errores).map(([campo, detalle]) => (
                  <li key={campo}>
                    <a
                      href={`#${detalle.id}`}
                      onClick={(evento) => {
                        evento.preventDefault();
                        setSeccionActiva(detalle.seccion);
                        document.getElementById(detalle.id)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                        document.getElementById(detalle.id)?.focus();
                      }}
                    >
                      {detalle.etiqueta}: {detalle.mensaje}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

        <form className="mi-perfil-formulario" onSubmit={guardar}>
          <section className="mi-perfil-tarjeta" id="mi-perfil-cuenta">
            <h2>Cuenta</h2>
            <TextField
              id="email-cuenta"
              label="Email (obligatorio)"
              value={email}
              fullWidth
              size="small"
              disabled
              error={Boolean(errores.email)}
              helperText={errores.email?.mensaje || 'Este email se usa para iniciar sesión. Se administra desde Logto.'}
            />
            {avisoEmail && <Alert severity="warning">{avisoEmail}</Alert>}
            <Button
              type="button"
              variant="outlined"
              onClick={() => cambiarContrasena(email)}
            >
              Cambiar contraseña
            </Button>
          </section>

          <section className="mi-perfil-tarjeta" id="mi-perfil-perfil">
            <h2>Perfil</h2>
            {esColaboradora ? (
              <>
                <TextField
                  id="nombre-fantasia"
                  label="Nombre de fantasía (obligatorio)"
                  value={datos.nombreFantasia}
                  onChange={(e) => cambiar('nombreFantasia', e.target.value)}
                  error={Boolean(errores.nombreFantasia)}
                  helperText={errores.nombreFantasia?.mensaje}
                  fullWidth
                />
                <TextField
                  label="Usuario de GitHub o GitLab (opcional)"
                  value={datos.usuarioGitHub}
                  onChange={(e) => cambiar('usuarioGitHub', e.target.value)}
                  helperText="Sin @ ni enlace al perfil."
                  fullWidth
                />
                <div className="mi-perfil-dos-columnas">
                  <TextField label="Nombre (opcional)" value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
                  <TextField label="Apellido (opcional)" value={datos.apellido} onChange={(e) => cambiar('apellido', e.target.value)} />
                </div>
                <TextField
                  label="Pronombres (opcional)"
                  value={datos.pronombres}
                  onChange={(e) => cambiar('pronombres', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Presentación breve (opcional)"
                  value={datos.presentacion}
                  onChange={(e) => cambiar('presentacion', e.target.value)}
                  multiline
                  minRows={3}
                  slotProps={{ htmlInput: { maxLength: 280 } }}
                  helperText={`${datos.presentacion.length}/280`}
                  fullWidth
                />
              </>
            ) : (
              <>
                <TextField
                  id="nombre-colectivo"
                  label="Nombre del colectivo (obligatorio)"
                  value={datos.nombreColectivo}
                  onChange={(e) => cambiar('nombreColectivo', e.target.value)}
                  error={Boolean(errores.nombreColectivo)}
                  helperText={errores.nombreColectivo?.mensaje}
                  fullWidth
                />
                <TextField
                  id="tipo-colectivo"
                  label="Tipo de colectivo (obligatorio)"
                  select
                  value={datos.tipoDeColectivo}
                  onChange={(e) => cambiar('tipoDeColectivo', e.target.value)}
                  error={Boolean(errores.tipoDeColectivo)}
                  helperText={errores.tipoDeColectivo?.mensaje}
                  fullWidth
                >
                  {TIPOS_COLECTIVO.map((tipo) => (
                    <MenuItem key={tipo.valor} value={tipo.valor}>{tipo.texto}</MenuItem>
                  ))}
                </TextField>
                <UbicacionColectivo
                  pais={datos.pais}
                  provincia={datos.provincia}
                  ciudad={datos.ciudad}
                  onChange={cambiarUbicacion}
                />
                <TextField
                  id="descripcion-colectivo"
                  label="Descripción (obligatoria)"
                  value={datos.descripcion}
                  onChange={(e) => cambiar('descripcion', e.target.value)}
                  error={Boolean(errores.descripcion)}
                  helperText={errores.descripcion?.mensaje}
                  multiline
                  minRows={4}
                  fullWidth
                />
              </>
            )}
          </section>

          <section className="mi-perfil-tarjeta" id={`mi-perfil-${esColaboradora ? 'habilidades' : 'areas'}`}>
            <h2>{esColaboradora ? 'Habilidades' : 'Habilidades y áreas de trabajo'}</h2>
            <p>
              {esColaboradora
                ? 'Elegí las habilidades que querés aportar.'
                : 'Agregá etiquetas para describir las áreas de trabajo de tu colectivo.'}
            </p>
            {listado.error && (
              <Alert severity="warning" action={<Button variant="text" onClick={listado.recargar}>Reintentar</Button>}>
                No pudimos cargar las opciones disponibles.
              </Alert>
            )}
            <CustomSelect
              id="mi-perfil-habilidades"
              etiqueta={esColaboradora ? 'Habilidades (obligatorio)' : 'Áreas y etiquetas'}
              opciones={esColaboradora ? opcionesHabilidades : opcionesAreas}
              seleccion={etiquetas}
              multiple
              maxSeleccion={esColaboradora ? undefined : ETIQUETAS_MAX}
              permiteCrear={!esColaboradora}
              onSeleccionar={(valor) => cambiar(esColaboradora ? 'habilidades' : 'etiquetas', [...etiquetas, valor])}
              onQuitar={(valor) =>
                cambiar(
                  esColaboradora ? 'habilidades' : 'etiquetas',
                  etiquetas.filter((actual) => actual !== valor),
                )
              }
              placeholder={listado.cargando ? 'Cargando opciones…' : 'Buscá una opción'}
              textoVacio={listado.cargando ? 'Cargando opciones…' : 'No hay coincidencias.'}
            />
            {errores.habilidades && (
              <p className="mi-perfil-error-campo" role="alert">{errores.habilidades.mensaje}</p>
            )}
            {errores.etiquetas && (
              <p className="mi-perfil-error-campo" role="alert">{errores.etiquetas.mensaje}</p>
            )}
          </section>

          <section className="mi-perfil-tarjeta" id="mi-perfil-contacto">
            <h2>Contacto</h2>
            <Alert severity="info" icon={<FiLock />}>
              Tus medios de contacto son privados y no se muestran públicamente.
            </Alert>
            {datos.medios.map((medio, indice) => (
              <div className="mi-perfil-contacto-fila" key={`${indice}-${medio.tipo}`}>
                <TextField
                  label="Tipo"
                  select
                  value={medio.tipo}
                  onChange={(e) => cambiarMedio(indice, { tipo: e.target.value })}
                  size="small"
                >
                  {TIPOS_CONTACTO.map((tipo) => (
                    <MenuItem key={tipo.valor} value={tipo.valor}>{tipo.texto}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  id={`medio-contacto-${indice}`}
                  label="Valor"
                  value={medio.valor}
                  onChange={(e) => cambiarMedio(indice, { valor: e.target.value })}
                  error={Boolean(errores[`medio-${indice}`])}
                  helperText={errores[`medio-${indice}`]?.mensaje}
                  size="small"
                />
                <IconButton
                  type="button"
                  aria-label="Quitar medio de contacto"
                  onClick={() => cambiar('medios', datos.medios.filter((_, i) => i !== indice))}
                >
                  <FiX />
                </IconButton>
              </div>
            ))}
            <Button
              type="button"
              variant="text"
              startIcon={<FiPlus />}
              onClick={() => cambiar('medios', [...datos.medios, { tipo: 'EMAIL', valor: '' }])}
            >
              Agregar medio de contacto
            </Button>
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
              disabled={guardando || (listado.error && esColaboradora)}
              startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
          {exito && (
            <Alert
              className="mi-perfil-estado-confirmacion"
              severity="success"
              role="status"
              icon={<FiCheck aria-hidden="true" />}
            >
              Los cambios ya fueron aplicados.
            </Alert>
          )}
        </form>
        </div>
      </div>

      <Dialog
        open={confirmarDescartar}
        onClose={() => setConfirmarDescartar(false)}
        aria-labelledby="descartar-cambios-titulo"
      >
        <DialogTitle id="descartar-cambios-titulo">¿Descartar los cambios?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vas a perder los cambios que no guardaste. Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions className="mi-perfil-dialogo-acciones">
          <Button onClick={() => setConfirmarDescartar(false)} variant="contained">
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
            variant="outlined"
          >
            Descartar cambios
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MiPerfil;