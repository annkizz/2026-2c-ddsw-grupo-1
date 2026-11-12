import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Card, MenuItem, TextField } from '@mui/material';
import AccionesRegistro from '../../components/AccionesRegistro/AccionesRegistro.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { TIPOS_COLECTIVO, crearColectivo } from '../../service/colectivosService';
import { mensajeDeError } from '../../service/api';
import { borrarTipo } from './tipoElegido';
import './Registro.css';

const DATOS_INICIALES = {
  nombre: '',
  tipoDeColectivo: '',
  ubicacion: '',
  descripcion: ''
};
const OBLIGATORIOS = ['nombre', 'tipoDeColectivo', 'ubicacion', 'descripcion'];

const DatosColectivo = () => {
  const navigate = useNavigate();
  const { getAccessToken, recargarSesion } = useAuth();
  const [datos, setDatos] = useState(DATOS_INICIALES);
  const [faltantes, setFaltantes] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const setValorDe = (campo) => (e) => {
    setDatos({ ...datos, [campo]: e.target.value });
    setFaltantes(faltantes.filter((f) => f !== campo));
  };

  const propsDe = (campo) => ({
    value: datos[campo],
    onChange: setValorDe(campo),
    error: faltantes.includes(campo),
    helperText: faltantes.includes(campo) ? 'Completá este campo.' : ' ',
    fullWidth: true,
    required: true
  });

  const guardar = async (e) => {
    e.preventDefault();
    const sinCompletar = OBLIGATORIOS.filter((campo) => datos[campo].trim() === '');
    setFaltantes(sinCompletar);
    if (sinCompletar.length > 0) return;

    setGuardando(true);
    setError(null);
    try {
      const token = await getAccessToken();
      await crearColectivo(token, datos);
      await recargarSesion();
      borrarTipo();
      navigate('/registro/listo');
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
          <TextField label="Nombre" placeholder="Nombre" {...propsDe('nombre')} />
          <TextField select label="Tipo de colectivo" {...propsDe('tipoDeColectivo')}>
            {TIPOS_COLECTIVO.map((tipo) => (
              <MenuItem key={tipo.valor} value={tipo.valor}>
                {tipo.texto}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Ubicación" placeholder="Ciudad" {...propsDe('ubicacion')} />
          <TextField label="Descripción" placeholder="Descripción del colectivo" multiline minRows={3} {...propsDe('descripcion')} />
        </Card>

        {error && (
          <Alert severity="error" sx={{ marginTop: 2 }}>
            {error}
          </Alert>
        )}

        <AccionesRegistro onVolver={() => navigate('/registro/tipo')} guardando={guardando} />
      </form>
    </div>
  );
};

export default DatosColectivo;
