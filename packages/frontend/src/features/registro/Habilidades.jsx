import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Alert } from '@mui/material';
import AccionesRegistro from '../../components/AccionesRegistro/AccionesRegistro.jsx';
import AlertaError from '../../components/AlertaError/AlertaError.jsx';
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
      document.getElementById('registro-habilidades')?.focus();
      return;
    }
    onSiguiente();
  };

  const sinOpciones = error && !habilidadesState.error && opciones.length === 0;

  return (
    <form onSubmit={siguiente} noValidate>
      <section className="registro-card" aria-labelledby="paso-habilidades-titulo">
        <h2 id="paso-habilidades-titulo">Indicá tus habilidades</h2>
        <p className="registro-card__intro">Elegí al menos una. Las usamos para recomendarte proyectos.</p>
        <CustomSelect
          id="registro-habilidades"
          etiqueta="Habilidades"
          opciones={opciones}
          seleccion={datos.habilidades}
          multiple
          onSeleccionar={alternar}
          ayuda="Podés buscar escribiendo parte del nombre."
          error={error && !habilidadesState.error && !sinOpciones ? 'Elegí al menos una habilidad disponible.' : undefined}
          placeholder={habilidadesState.cargando ? 'Cargando habilidades…' : 'Ej.: React'}
          textoVacio={habilidadesState.cargando ? 'Cargando habilidades…' : 'No hay habilidades con ese texto.'}
        />
        {habilidadesState.error && (
          <AlertaError
            error={habilidadesState.error}
            titulo="No pudimos cargar las habilidades disponibles"
            onReintentar={habilidadesState.recargar}
          />
        )}
        {sinOpciones && (
          <Alert severity="warning" role="alert">
            No hay habilidades disponibles para registrar el perfil.
          </Alert>
        )}
      </section>
      <AccionesRegistro onVolver={onVolver} siguiente="Siguiente" />
    </form>
  );
};

Habilidades.propTypes = {
  datos: PropTypes.object.isRequired,
  setDatos: PropTypes.func.isRequired,
  onVolver: PropTypes.func,
  onSiguiente: PropTypes.func.isRequired
};

export default Habilidades;
