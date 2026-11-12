import { useState } from 'react';
import { Card, TextField } from '@mui/material';
import AccionesRegistro from '../../components/AccionesRegistro/AccionesRegistro.jsx';

const OBLIGATORIOS = ['nombreFantasia', 'usuarioGitHub', 'presentacion'];

// Paso 1 de 3: datos personales
const DatosColaboradora = ({ datos, setDatos, onVolver, onSiguiente }) => {
  const [faltantes, setFaltantes] = useState([]);

  const setValorDe = (campo) => (e) => {
    setDatos({ ...datos, [campo]: e.target.value });
    setFaltantes(faltantes.filter((f) => f !== campo));
  };

  const propsDe = (campo) => ({
    value: datos[campo],
    onChange: setValorDe(campo),
    error: faltantes.includes(campo),
    helperText: faltantes.includes(campo) ? 'Completá este campo.' : ' ',
    required: OBLIGATORIOS.includes(campo),
    fullWidth: true
  });

  const siguiente = (e) => {
    e.preventDefault();
    const sinCompletar = OBLIGATORIOS.filter((campo) => datos[campo].trim() === '');
    setFaltantes(sinCompletar);
    if (sinCompletar.length === 0) onSiguiente();
  };

  return (
    <form onSubmit={siguiente} noValidate>
      <Card variant="outlined" className="registro-card">
        <TextField label="Nombre Fantasía" placeholder="Nombre" {...propsDe('nombreFantasia')} />
        <TextField label="Usuario de Github" placeholder="Usuario" {...propsDe('usuarioGitHub')} />
        <TextField label="Nombre" placeholder="Nombre" {...propsDe('nombre')} />
        <TextField label="Apellido" placeholder="Apellido" {...propsDe('apellido')} />
        <TextField label="Pronombres" placeholder="Ej: ella, elle, él" {...propsDe('pronombres')} />
        <TextField label="Presentación" placeholder="Contanos quién sos y qué te interesa" multiline minRows={3} {...propsDe('presentacion')} />
      </Card>
      <AccionesRegistro onVolver={onVolver} />
    </form>
  );
};

export default DatosColaboradora;
