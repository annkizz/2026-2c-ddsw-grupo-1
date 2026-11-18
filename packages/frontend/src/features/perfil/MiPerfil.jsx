import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  TextField
} from '@mui/material';
import { FiLock, FiSave, FiX } from 'react-icons/fi';
import CustomSelect from '../../components/CustomSelect/CustomSelect';
import LoadingSplash from '../../components/LoadingSplash/LoadingSplash.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useListado } from '../../hooks/useListado';
import {
  TIPOS_COLECTIVO,
  actualizarColectivo,
  obtenerColectivoPorId
} from '../../service/colectivosService';
import {
  TIPOS_CONTACTO,
  actualizarColaboradora,
  obtenerMiPerfilColaboradora
} from '../../service/colaboradorasService';
import { mensajeDeError } from '../../service/api';
import { ETIQUETAS_MAX } from '../../utils/etiquetas';
import '../registro/Registro.css';
import '../../components/AccionesRegistro/AccionesRegistro.css';

/* ------------------------------------------------------------------ */
/* Helpers compartidos                                                 */
/* ------------------------------------------------------------------ */

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const CELULAR_REGEX = /^\+\d{10,15}$/;

const REGLAS_CONTACTO = {
  EMAIL: {
    etiqueta: 'Dirección de email',
    ejemplo: 'nombre@dominio.com',
    esValido: (valor) => EMAIL_REGEX.test(valor.trim()),
    mensaje: 'Ingresá un email válido. Ej.: nombre@dominio.com.'
  },
  WHATSAPP: {
    etiqueta: 'Número de WhatsApp',
    ejemplo: '+54 9 11 4567 8901',
    esValido: (valor) => CELULAR_REGEX.test(valor.replace(/[\s-]/g, '')),
    mensaje: 'Ingresá un teléfono válido con código de país.'
  },
  SMS: {
    etiqueta: 'Número de celular',
    ejemplo: '+54 9 11 4567 8901',
    esValido: (valor) => CELULAR_REGEX.test(valor.replace(/[\s-]/g, '')),
    mensaje: 'Ingresá un teléfono válido con código de país.'
  }
};

// Carga el perfil propio con cancelación y reintento.
// `cargar` tiene que estar memorizada con useCallback.
const usePerfilPropio = (cargar) => {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);
    cargar()
      .then((datos) => {
        if (!cancelado) setPerfil(datos);
      })
      .catch((fallo) => {
        if (!cancelado) setError(mensajeDeError(fallo));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [cargar, intento]);

  const reintentar = useCallback(() => setIntento((actual) => actual + 1), []);

  return { perfil, setPerfil, cargando, error, reintentar };
};

const ErrorDeCarga = ({ mensaje, onReintentar }) => (
  <Alert
    severity="error"
    action={
      <Button color="inherit" size="small" onClick={onReintentar}>
        Reintentar
      </Button>
    }
  >
    No pudimos cargar tu perfil: {mensaje}
  </Alert>
);

const BotonGuardar = ({ guardando }) => (
  <div className="acciones-registro">
    <Button
      variant="contained"
      type="submit"
      disabled={guardando}
      startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : <FiSave />}
    >
      {guardando ? 'Guardando…' : 'Guardar cambios'}
    </Button>
  </div>
);

const Resultado = ({ error, exito }) => (
  <>
    {error && (
      <Alert severity="error" sx={{ marginTop: 2 }}>
        {error}
      </Alert>
    )}
    {exito && (
      <Alert severity="success" sx={{ marginTop: 2 }}>
        Tus cambios se guardaron correctamente.
      </Alert>
    )}
  </>
);

/* ------------------------------------------------------------------ */
/* Edición de Colectivo                                                */
/* ------------------------------------------------------------------ */

const OBLIGATORIOS_COLECTIVO = ['nombre', 'tipoDeColectivo', 'ubicacion', 'descripcion'];

const colectivoAFormulario = (colectivo) => ({
  nombre: colectivo.nombre ?? '',
  tipoDeColectivo: colectivo.tipoDeColectivo ?? '',
  ubicacion: colectivo.ubicacion?.ciudad ?? '',
  etiquetas: colectivo.etiquetas ?? [],
  descripcion: colectivo.descripcion ?? ''
});

const EditarColectivo = ({ idColectivo }) => {
  const { getAccessToken } = useAuth();
  const etiquetasState = useListado('/etiquetas');

  const cargar = useCallback(() => obtenerColectivoPorId(idColectivo), [idColectivo]);
  const { perfil, setPerfil, cargando, error: errorCarga, reintentar } = usePerfilPropio(cargar);

  const [datos, setDatos] = useState(null);
  const [faltantes, setFaltantes] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  // cada vez que llega el perfil del servidor (carga inicial o después de guardar)
  useEffect(() => {
    if (perfil) setDatos(colectivoAFormulario(perfil));
  }, [perfil]);

  if (cargando && !datos) return <LoadingSplash message="Cargando los datos de tu colectivo…" />;
  if (errorCarga) return <ErrorDeCarga mensaje={errorCarga} onReintentar={reintentar} />;
  if (!datos) return null;

  const setValorDe = (campo) => (e) => {
    setDatos({ ...datos, [campo]: e.target.value });
    setFaltantes(faltantes.filter((f) => f !== campo));
    setExito(false);
  };

  const alternarEtiqueta = (etiqueta) => {
    setDatos((prev) => ({
      ...prev,
      etiquetas: prev.etiquetas.includes(etiqueta)
        ? prev.etiquetas.filter((una) => una !== etiqueta)
        : [...prev.etiquetas, etiqueta]
    }));
    setExito(false);
  };

  const propsDe = (campo) => ({
    value: datos[campo],
    onChange: setValorDe(campo),
    error: faltantes.includes(campo),
    helperText: faltantes.includes(campo) ? 'Completá este campo.' : ' ',
    fullWidth: true,
    required: true
  });

  const opcionesEtiquetas = etiquetasState.datos.map((etiqueta) => ({
    valor: etiqueta,
    etiqueta: etiqueta.replaceAll('_', ' ')
  }));

  const guardar = async (e) => {
    e.preventDefault();
    const sinCompletar = OBLIGATORIOS_COLECTIVO.filter((campo) => datos[campo].trim() === '');
    setFaltantes(sinCompletar);
    if (sinCompletar.length > 0) return;

    setGuardando(true);
    setError(null);
    setExito(false);
    try {
      const token = await getAccessToken();
      const actualizado = await actualizarColectivo(token, idColectivo, datos, perfil.ubicacion);
      setPerfil(actualizado);
      setExito(true);
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} noValidate>
      <Card variant="outlined" className="registro-card">
        <h2>Datos del colectivo</h2>
        <div className="registro-campos">
          <TextField label="Nombre" placeholder="Nombre" {...propsDe('nombre')} />

          <TextField select label="Tipo de colectivo" {...propsDe('tipoDeColectivo')}>
            {TIPOS_COLECTIVO.map((tipo) => (
              <MenuItem key={tipo.valor} value={tipo.valor}>
                {tipo.texto}
              </MenuItem>
            ))}
          </TextField>

          <TextField label="Ubicación" placeholder="Ciudad" {...propsDe('ubicacion')} />

          <CustomSelect
            id="perfil-colectivo-etiquetas"
            etiqueta="Etiquetas"
            opciones={opcionesEtiquetas}
            seleccion={datos.etiquetas}
            multiple
            maxSeleccion={ETIQUETAS_MAX}
            permiteCrear
            onSeleccionar={alternarEtiqueta}
            onQuitar={alternarEtiqueta}
            placeholder={etiquetasState.cargando ? 'Cargando etiquetas…' : 'Buscá o escribí una etiqueta'}
            textoVacio={
              etiquetasState.cargando
                ? 'Cargando etiquetas…'
                : 'No hay etiquetas con ese texto. Podés crear una nueva.'
            }
          />
          {etiquetasState.error && (
            <Alert severity="warning">
              No pudimos cargar las etiquetas existentes. Igual podés escribir etiquetas nuevas.
            </Alert>
          )}

          <TextField
            label="Descripción"
            placeholder="Descripción del colectivo"
            multiline
            minRows={3}
            {...propsDe('descripcion')}
          />
        </div>
      </Card>

      <Resultado error={error} exito={exito} />
      <BotonGuardar guardando={guardando} />
    </form>
  );
};

/* ------------------------------------------------------------------ */
/* Edición de Colaboradora                                             */
/* ------------------------------------------------------------------ */

const OBLIGATORIOS_COLABORADORA = ['nombreFantasia', 'usuarioGitHub', 'presentacion'];

const colaboradoraAFormulario = (colaboradora) => ({
  nombreFantasia: colaboradora.nombreFantasia ?? '',
  usuarioGitHub: colaboradora.usuarioGitHub ?? '',
  nombre: colaboradora.nombre ?? '',
  apellido: colaboradora.apellido ?? '',
  pronombres: (colaboradora.pronombres ?? []).join(', '),
  presentacion: colaboradora.presentacion ?? '',
  habilidades: colaboradora.habilidades ?? [],
  aceptaMensajeria: Boolean(colaboradora.aceptaMensajeria),
  medios: (colaboradora.mediosDeContacto ?? []).map((medio) => ({
    tipo: medio.tipoDeContacto,
    valor: medio.contacto
  }))
});

const EditarColaboradora = () => {
  const { getAccessToken } = useAuth();
  const habilidadesState = useListado('/habilidades');

  const cargar = useCallback(async () => {
    const token = await getAccessToken();
    return obtenerMiPerfilColaboradora(token);
  }, [getAccessToken]);
  const { perfil, setPerfil, cargando, error: errorCarga, reintentar } = usePerfilPropio(cargar);

  const [datos, setDatos] = useState(null);
  const [faltantes, setFaltantes] = useState([]);
  const [errorHabilidades, setErrorHabilidades] = useState(false);
  const [mediosConError, setMediosConError] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    if (perfil) setDatos(colaboradoraAFormulario(perfil));
  }, [perfil]);

  if (cargando && !datos) return <LoadingSplash message="Cargando tu perfil…" />;
  if (errorCarga) return <ErrorDeCarga mensaje={errorCarga} onReintentar={reintentar} />;
  if (!datos) return null;

  const opcionesHabilidades = habilidadesState.datos
    .map((h) => (typeof h === 'string' ? h : h.titulo))
    .filter(Boolean);

  /* --- datos personales --- */
  const setValorDe = (campo) => (e) => {
    setDatos({ ...datos, [campo]: e.target.value });
    setFaltantes(faltantes.filter((f) => f !== campo));
    setExito(false);
  };

  const propsDe = (campo) => ({
    value: datos[campo],
    onChange: setValorDe(campo),
    error: faltantes.includes(campo),
    helperText: faltantes.includes(campo) ? 'Completá este campo.' : ' ',
    required: OBLIGATORIOS_COLABORADORA.includes(campo),
    fullWidth: true
  });

  /* --- habilidades --- */
  const cambiarHabilidades = (nuevas) => {
    const limpias = [];
    nuevas
      .map((h) => String(h).replace(/,/g, '').trim())
      .filter((h) => h !== '')
      .forEach((h) => {
        if (!limpias.some((una) => una.toLowerCase() === h.toLowerCase())) limpias.push(h);
      });
    setDatos({ ...datos, habilidades: limpias });
    if (limpias.length > 0) setErrorHabilidades(false);
    setExito(false);
  };

  /* --- medios de contacto --- */
  const cambiarMedio = (posicion, cambios) => {
    const medios = datos.medios.map((medio, i) => (i === posicion ? { ...medio, ...cambios } : medio));
    setDatos({ ...datos, medios });
    setMediosConError(mediosConError.filter((i) => i !== posicion));
    setExito(false);
  };

  const agregarMedio = () => {
    const tipo = datos.medios.length === 0 ? 'EMAIL' : 'WHATSAPP';
    setDatos({ ...datos, medios: [...datos.medios, { tipo, valor: '' }] });
    setExito(false);
  };

  const quitarMedio = (posicion) => {
    setDatos({ ...datos, medios: datos.medios.filter((_, i) => i !== posicion) });
    setMediosConError([]);
    setExito(false);
  };

  /* --- guardar --- */
  const guardar = async (e) => {
    e.preventDefault();

    const sinCompletar = OBLIGATORIOS_COLABORADORA.filter((campo) => datos[campo].trim() === '');
    const sinHabilidades = datos.habilidades.length === 0;
    const invalidos = [];
    datos.medios.forEach((medio, i) => {
      if (!REGLAS_CONTACTO[medio.tipo].esValido(medio.valor)) invalidos.push(i);
    });

    setFaltantes(sinCompletar);
    setErrorHabilidades(sinHabilidades);
    setMediosConError(invalidos);
    if (sinCompletar.length > 0 || sinHabilidades || invalidos.length > 0) return;

    setGuardando(true);
    setError(null);
    setExito(false);
    try {
      const token = await getAccessToken();
      const actualizada = await actualizarColaboradora(token, perfil.id, datos);
      setPerfil(actualizada);
      setExito(true);
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} noValidate>
      {/* Datos personales */}
      <Card variant="outlined" className="registro-card" sx={{ mb: 2 }}>
        <h2>Datos personales</h2>
        <TextField label="Nombre Fantasía" placeholder="Nombre" {...propsDe('nombreFantasia')} />
        <TextField label="Usuario de Github" placeholder="Usuario" {...propsDe('usuarioGitHub')} />
        <TextField label="Nombre" placeholder="Nombre" {...propsDe('nombre')} />
        <TextField label="Apellido" placeholder="Apellido" {...propsDe('apellido')} />
        <TextField label="Pronombres" placeholder="Ej: ella, elle, él" {...propsDe('pronombres')} />
        <TextField
          label="Presentación"
          placeholder="Contanos quién sos y qué te interesa"
          multiline
          minRows={3}
          {...propsDe('presentacion')}
        />
      </Card>

      {/* Habilidades */}
      <Card variant="outlined" className="registro-card" sx={{ mb: 2 }}>
        <h2>Habilidades</h2>
        <Autocomplete
          multiple
          freeSolo
          filterSelectedOptions
          options={opcionesHabilidades}
          value={datos.habilidades}
          onChange={(_, nuevas) => cambiarHabilidades(nuevas)}
          loading={habilidadesState.cargando}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tus habilidades"
              placeholder="Ej: React (Enter para agregar)"
              error={errorHabilidades}
              helperText={
                errorHabilidades
                  ? 'Agregá al menos una habilidad.'
                  : 'Elegí habilidades del catálogo de la plataforma.'
              }
            />
          )}
        />
        {habilidadesState.error && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            No pudimos cargar el catálogo de habilidades. Podés escribirlas igual.
          </Alert>
        )}
      </Card>

      {/* Medios de contacto */}
      <Card variant="outlined" className="registro-card">
        <h2>Medios de contacto</h2>
        <Alert severity="warning" icon={<FiLock />} sx={{ marginBottom: 2 }}>
          Tus medios de contacto son privados y no se muestran públicamente.
        </Alert>

        {datos.medios.length === 0 && (
          <p className="medios-vacio">Todavía no agregaste medios de contacto.</p>
        )}

        {datos.medios.map((medio, i) => (
          <div className="medios-fila" key={i}>
            <TextField
              select
              label="Tipo"
              value={medio.tipo}
              onChange={(e) => cambiarMedio(i, { tipo: e.target.value })}
            >
              {TIPOS_CONTACTO.map((tipo) => (
                <MenuItem key={tipo.valor} value={tipo.valor}>
                  {tipo.texto}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={REGLAS_CONTACTO[medio.tipo].etiqueta}
              placeholder={REGLAS_CONTACTO[medio.tipo].ejemplo}
              value={medio.valor}
              onChange={(e) => cambiarMedio(i, { valor: e.target.value })}
              error={mediosConError.includes(i)}
              helperText={mediosConError.includes(i) ? REGLAS_CONTACTO[medio.tipo].mensaje : ' '}
            />
            <IconButton aria-label="Quitar medio de contacto" onClick={() => quitarMedio(i)}>
              <FiX />
            </IconButton>
          </div>
        ))}

        <button type="button" className="medios-agregar" onClick={agregarMedio}>
          + Agregar medio de contacto
        </button>

        <FormControlLabel
          control={
            <Checkbox
              checked={datos.aceptaMensajeria}
              onChange={(e) => {
                setDatos({ ...datos, aceptaMensajeria: e.target.checked });
                setExito(false);
              }}
            />
          }
          label="Acepto recibir mensajes internos de la plataforma cuando haya proyectos relacionados con mis habilidades."
        />
      </Card>

      <Resultado error={error} exito={exito} />
      <BotonGuardar guardando={guardando} />
    </form>
  );
};

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

const MiPerfil = () => {
  const { sesion } = useAuth();

  // RequiereAuth ya garantiza sesión con perfil; esto es solo por seguridad
  if (!sesion) return <LoadingSplash message="Cargando tu perfil…" />;

  let contenido;
  if (sesion.rol === 'COLECTIVO' && sesion.idColectivo) {
    contenido = <EditarColectivo idColectivo={sesion.idColectivo} />;
  } else if (sesion.rol === 'COLABORADOR') {
    contenido = <EditarColaboradora />;
  } else {
    contenido = (
      <Alert severity="info">Tu cuenta no tiene un perfil editable desde esta pantalla.</Alert>
    );
  }

  return (
    <div className="registro">
      <h1>Mi perfil</h1>
      {contenido}
    </div>
  );
};

export default MiPerfil;