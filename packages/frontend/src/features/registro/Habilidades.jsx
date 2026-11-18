import { useState } from 'react';
import { Alert, Button, Card } from '@mui/material';
import AccionesRegistro from '../../components/AccionesRegistro/AccionesRegistro.jsx';
import CustomSelect from '../../components/CustomSelect/CustomSelect';
import { useListado } from '../../hooks/useListado';

// Paso 2 de 3: habilidades (el backend exige al menos una del catálogo).
const Habilidades = ({ datos, setDatos, onVolver, onSiguiente }) => {
  const [error, setError] = useState(false);
  const habilidadesState = useListado('/habilidades');
  const opciones = habilidadesState.datos.map((habilidad) => ({
    valor: habilidad.titulo,
    etiqueta: habilidad.titulo
  }));

  const alternar = (habilidad) => {
    setDatos((actual) => ({
      ...actual,
      habilidades: actual.habilidades.includes(habilidad)
        ? actual.habilidades.filter((una) => una !== habilidad)
        : [...actual.habilidades, habilidad]
    }));
    setError(false);
  };

  const siguiente = (e) => {
    e.preventDefault();
    if (habilidadesState.cargando) return;
    if (habilidadesState.error || opciones.length === 0 || datos.habilidades.length === 0) {
      setError(true);
      return;
    }
    onSiguiente();
  };

  return (
    <form onSubmit={siguiente} noValidate>
      <Card variant="outlined" className="registro-card">
        <h2>Indicá tus habilidades</h2>
        <CustomSelect
          id="registro-habilidades"
          etiqueta="Habilidades"
          opciones={opciones}
          seleccion={datos.habilidades}
          multiple
          onSeleccionar={alternar}
          placeholder={
            habilidadesState.cargando ? 'Cargando habilidades…' : 'Buscá una habilidad disponible'
          }
          textoVacio={
            habilidadesState.cargando
              ? 'Cargando habilidades…'
              : 'No hay habilidades con ese texto.'
          }
        />
        {habilidadesState.error && (
          <Alert
            severity="error"
            action={<Button onClick={habilidadesState.recargar}>Reintentar</Button>}
          >
            No pudimos cargar las habilidades disponibles. Volvé a intentarlo antes de continuar.
          </Alert>
        )}
        {error && !habilidadesState.error && (
          <Alert severity="warning">
            {opciones.length === 0
              ? 'No hay habilidades disponibles para registrar el perfil.'
              : 'Elegí al menos una habilidad disponible.'}
          </Alert>
        )}
      </Card>
      <AccionesRegistro onVolver={onVolver} siguiente="Siguiente" />
    </form>
  );
};

export default Habilidades;
