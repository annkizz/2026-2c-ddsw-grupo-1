import { useState } from 'react';
import { Card, Chip, TextField } from '@mui/material';
import AccionesRegistro from '../../components/AccionesRegistro/AccionesRegistro.jsx';

// Paso 2 de 3: habilidades (el backend exige al menos una)
const Habilidades = ({ datos, setDatos, onVolver, onSiguiente }) => {
  const [texto, setTexto] = useState('');
  const [error, setError] = useState(false);

  // devuelve la lista nueva para poder usarla enseguida
  const agregar = () => {
    const nueva = texto.replace(/,/g, '').trim();
    setTexto('');
    const yaEsta = datos.habilidades.some((h) => h.toLowerCase() === nueva.toLowerCase());
    if (nueva === '' || yaEsta) return datos.habilidades;

    const lista = [...datos.habilidades, nueva];
    setDatos({ ...datos, habilidades: lista });
    setError(false);
    return lista;
  };

  const quitar = (habilidad) => {
    setDatos({ ...datos, habilidades: datos.habilidades.filter((h) => h !== habilidad) });
  };

  const alTeclear = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      agregar();
    }
  };

  const siguiente = (e) => {
    e.preventDefault();
    const lista = agregar();
    if (lista.length === 0) {
      setError(true);
      return;
    }
    onSiguiente();
  };

  return (
    <form onSubmit={siguiente} noValidate>
      <Card variant="outlined" className="registro-card">
        <h2>Indicá tus habilidades</h2>
        <TextField
          fullWidth
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={alTeclear}
          onBlur={agregar}
          placeholder="Ej: React (Enter para agregar)"
          error={error}
          helperText={error ? 'Agregá al menos una habilidad.' : ' '}
        />
        <div className="habilidades-lista">
          {datos.habilidades.map((habilidad) => (
            <Chip key={habilidad} label={habilidad} onDelete={() => quitar(habilidad)} />
          ))}
        </div>
      </Card>
      <AccionesRegistro onVolver={onVolver} siguiente="Listo" />
    </form>
  );
};

export default Habilidades;
