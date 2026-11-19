import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Card, MenuItem, TextField } from '@mui/material';
import AccionesRegistro from '../../components/AccionesRegistro/AccionesRegistro.jsx';
import CustomSelect from '../../components/CustomSelect/CustomSelect';
import UbicacionColectivo from '../../components/UbicacionColectivo/UbicacionColectivo';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useListado } from '../../hooks/useListado';
import { TIPOS_COLECTIVO, crearColectivo } from '../../service/colectivosService';
import { mensajeDeError } from '../../service/api';
import { ETIQUETAS_MAX } from '../../utils/etiquetas';
import { borrarTipo } from './tipoElegido';
import './Registro.css';

const DATOS_INICIALES = {
  nombre: '',
  tipoDeColectivo: '',
  pais: '',
  provincia: '',
  ciudad: '',
  etiquetas: [],
  descripcion: ''
};
const OBLIGATORIOS = ['nombre', 'tipoDeColectivo', 'descripcion'];
const AYUDAS_CAMPOS = {
  nombre: 'Ej.: Colectivo La Semilla',
  descripcion: 'Ej.: Acompañamos a familias del barrio con talleres de apoyo.'
};

const DatosColectivo = () => {
  const navigate = useNavigate();
  const { getAccessToken, recargarSesion } = useAuth();
  const [datos, setDatos] = useState(DATOS_INICIALES);
  const [faltantes, setFaltantes] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [registroCreado, setRegistroCreado] = useState(false);
  const etiquetasState = useListado('/etiquetas');

  const setValorDe = (campo) => (e) => {
    setDatos({ ...datos, [campo]: e.target.value });
    setFaltantes(faltantes.filter((f) => f !== campo));
  };

  const alternarEtiqueta = (etiqueta) => {
    setDatos((prev) => ({
      ...prev,
      etiquetas: prev.etiquetas.includes(etiqueta)
        ? prev.etiquetas.filter((una) => una !== etiqueta)
        : [...prev.etiquetas, etiqueta]
    }));
  };

  const propsDe = (campo) => ({
    value: datos[campo],
    onChange: setValorDe(campo),
    error: faltantes.includes(campo),
    helperText: faltantes.includes(campo) ? 'Completá este campo.' : AYUDAS_CAMPOS[campo],
    fullWidth: true,
    required: true
  });

  const opcionesEtiquetas = etiquetasState.datos.map((etiqueta) => ({
    valor: etiqueta,
    etiqueta: etiqueta.replaceAll('_', ' ')
  }));

  const guardar = async (e) => {
    e.preventDefault();
    const sinCompletar = OBLIGATORIOS.filter((campo) => datos[campo].trim() === '');
    setFaltantes(sinCompletar);
    if (sinCompletar.length > 0) return;

    setGuardando(true);
    setError(null);
    try {
      if (!registroCreado) {
        const token = await getAccessToken();
        await crearColectivo(token, datos);
        setRegistroCreado(true);
      }

      const nuevaSesion = await recargarSesion();
      if (!nuevaSesion?.tienePerfil) {
        setError(
          'El servidor no confirmó el perfil. Podés volver a intentar verificarlo sin reenviar el formulario.'
        );
        return;
      }

      borrarTipo();
      navigate('/perfil');
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="registro">
      <h1>Registrar Colectivo</h1>
      <form onSubmit={guardar} noValidate>
        <Card variant="outlined" className="registro-card">
          <div className="registro-campos">
            <div className="registro-campo">
              <label
                className="registro-campo__label"
                htmlFor="registro-colectivo-nombre"
              >
                Nombre (obligatorio)
              </label>
              <TextField
                id="registro-colectivo-nombre"
                placeholder="Nombre del colectivo"
                {...propsDe('nombre')}
              />
            </div>
            <div className="registro-campo">
              <label
                className="registro-campo__label"
                id="registro-colectivo-tipo-label"
                htmlFor="registro-colectivo-tipo"
              >
                Tipo de colectivo (obligatorio)
              </label>
              <TextField
                id="registro-colectivo-tipo"
                select
                slotProps={{ select: { labelId: 'registro-colectivo-tipo-label' } }}
                {...propsDe('tipoDeColectivo')}
              >
                {TIPOS_COLECTIVO.map((tipo) => (
                  <MenuItem key={tipo.valor} value={tipo.valor}>
                    {tipo.texto}
                  </MenuItem>
                ))}
              </TextField>
            </div>

            <UbicacionColectivo
              pais={datos.pais}
              provincia={datos.provincia}
              ciudad={datos.ciudad}
              onChange={(cambios) => setDatos((prev) => ({ ...prev, ...cambios }))}
              labelsAbove
              idPrefix="registro-colectivo-ubicacion"
            />

            <div className="registro-campo">
              <CustomSelect
                id="colectivo-etiquetas"
                className="selector--registro"
                etiqueta="Etiquetas"
                opciones={opcionesEtiquetas}
                seleccion={datos.etiquetas}
                multiple
                maxSeleccion={ETIQUETAS_MAX}
                permiteCrear
                onSeleccionar={alternarEtiqueta}
                onQuitar={alternarEtiqueta}
                placeholder={
                  etiquetasState.cargando ? 'Cargando etiquetas…' : 'Buscá o escribí una etiqueta'
                }
                textoVacio={
                  etiquetasState.cargando
                    ? 'Cargando etiquetas…'
                    : 'No hay etiquetas con ese texto. Podés crear una nueva.'
                }
              />
              <small className="registro-ayuda">
                Buscá etiquetas existentes o creá las tuyas (hasta {ETIQUETAS_MAX}) para que tu
                colectivo aparezca en las búsquedas.
              </small>
            </div>
            {etiquetasState.error && (
              <Alert severity="warning">
                No pudimos cargar las etiquetas existentes. Igual podés escribir etiquetas nuevas.
              </Alert>
            )}

            <div className="registro-campo">
              <label className="registro-campo__label" htmlFor="registro-colectivo-descripcion">
                Descripción (obligatoria)
              </label>
              <TextField
                id="registro-colectivo-descripcion"
                placeholder="Describí el trabajo del colectivo"
                multiline
                minRows={3}
                {...propsDe('descripcion')}
              />
            </div>
          </div>
        </Card>

        {error && (
          <Alert severity="error" sx={{ marginTop: 2 }}>
            {error}
          </Alert>
        )}

        <AccionesRegistro
          onVolver={() => {
            borrarTipo();
            navigate('/');
          }}
          siguiente={registroCreado ? 'Verificar registro' : 'Listo'}
          guardando={guardando}
        />
      </form>
    </div>
  );
};

export default DatosColectivo;
