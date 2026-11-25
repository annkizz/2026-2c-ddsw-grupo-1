import { t } from '../../i18n/t';
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
        <h2 id="paso-habilidades-titulo">{t('registro.indicaHabilidades')}</h2>
        <p className="registro-card__intro">{t('registro.elegiAlMenosUnaLas')}</p>
        <CustomSelect
          id="registro-habilidades"
          etiqueta={t('registro.habilidades')}
          opciones={opciones}
          seleccion={datos.habilidades}
          multiple
          onSeleccionar={alternar}
          ayuda={t('registro.podesBuscarEscribiendoParteDel')}
          error={error && !habilidadesState.error && !sinOpciones ? t('registro.elegiHabilidadDisponible') : undefined}
          placeholder={habilidadesState.cargando ? t('registro.cargandoHabilidades') : t('perfilesProyecto.placeholderHabilidades')}
          textoVacio={habilidadesState.cargando ? t('registro.cargandoHabilidades') : t('registro.sinHabilidadesTexto')}
        />
        {habilidadesState.error && (
          <AlertaError
            error={habilidadesState.error}
            titulo={t('registro.noPudimosCargarLasHabilidades')}
            onReintentar={habilidadesState.recargar}
          />
        )}
        {sinOpciones && (
          <Alert severity="warning" role="alert">
            {t('registro.sinHabilidades')}
          </Alert>
        )}
      </section>
      <AccionesRegistro onVolver={onVolver} siguiente={t('registro.siguiente')} />
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
