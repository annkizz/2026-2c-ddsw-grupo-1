import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TextField } from '@mui/material';
import { FiAlertCircle } from 'react-icons/fi';
import AccionesRegistro from '../../components/AccionesRegistro/AccionesRegistro.jsx';
import ResumenErrores from '../../components/ResumenErrores/ResumenErrores.jsx';

const OBLIGATORIOS = ['nombreFantasia', 'usuarioGitHub', 'presentacion'];

const CAMPOS = {
  nombreFantasia: { label: 'Nombre público (obligatorio)', placeholder: 'Ej.: Luna Código', ayuda: 'Es el nombre que van a ver los colectivos.', error: 'Ingresá un nombre público' },
  usuarioGitHub: { label: 'Usuario de GitHub (obligatorio)', placeholder: 'Ej.: luna-codigo', ayuda: 'Sin la @ ni el enlace completo.', error: 'Ingresá tu usuario de GitHub' },
  nombre: { label: 'Nombre (opcional)', placeholder: 'Ej.: Lucía' },
  apellido: { label: 'Apellido (opcional)', placeholder: 'Ej.: Gómez' },
  pronombres: { label: 'Pronombres (opcional)', placeholder: 'Ej.: ella, elle', ayuda: 'Separalos con comas.' },
  presentacion: { label: 'Presentación (obligatoria)', placeholder: 'Ej.: Soy QA y quiero aportar a proyectos de salud.', ayuda: 'Contanos quién sos y qué te interesa.', error: 'Escribí una presentación breve' }
};

// Paso 1 de 3: datos personales
const DatosColaboradora = ({ datos, setDatos, onVolver, onSiguiente }) => {
  const [faltantes, setFaltantes] = useState([]);
  const [intento, setIntento] = useState(0);

  const setValorDe = (campo) => (e) => {
    setDatos({ ...datos, [campo]: e.target.value });
    setFaltantes(faltantes.filter((f) => f !== campo));
  };

  const propsDe = (campo) => {
    const { label, placeholder, ayuda, error } = CAMPOS[campo];
    const conError = faltantes.includes(campo);
    return {
      id: `colaboradora-${campo}`,
      label,
      placeholder,
      value: datos[campo],
      onChange: setValorDe(campo),
      onBlur: () => {
        if (OBLIGATORIOS.includes(campo) && datos[campo].trim() === '' && intento > 0) {
          setFaltantes((actual) => (actual.includes(campo) ? actual : [...actual, campo]));
        }
      },
      error: conError,
      helperText: conError ? (
        <>
          <FiAlertCircle aria-hidden="true" />
          <span>{error}</span>
        </>
      ) : (
        ayuda
      ),
      required: OBLIGATORIOS.includes(campo),
      fullWidth: true
    };
  };

  const siguiente = (e) => {
    e.preventDefault();
    const sinCompletar = OBLIGATORIOS.filter((campo) => datos[campo].trim() === '');
    setFaltantes(sinCompletar);
    setIntento((n) => n + 1);
    if (sinCompletar.length === 0) onSiguiente();
  };

  return (
    <form onSubmit={siguiente} noValidate>
      <ResumenErrores
        errores={faltantes.map((campo) => ({ campoId: `colaboradora-${campo}`, mensaje: CAMPOS[campo].error }))}
        intento={intento}
      />
      <section className="registro-card" aria-labelledby="paso-datos-titulo">
        <h2 id="paso-datos-titulo">Tus datos</h2>
        <p className="registro-card__intro">Los campos obligatorios están indicados.</p>
        <TextField {...propsDe('nombreFantasia')} />
        <TextField {...propsDe('usuarioGitHub')} />
        <TextField {...propsDe('nombre')} />
        <TextField {...propsDe('apellido')} />
        <TextField {...propsDe('pronombres')} />
        <TextField multiline minRows={3} {...propsDe('presentacion')} />
      </section>
      <AccionesRegistro onVolver={onVolver} />
    </form>
  );
};

DatosColaboradora.propTypes = {
  datos: PropTypes.object.isRequired,
  setDatos: PropTypes.func.isRequired,
  onVolver: PropTypes.func,
  onSiguiente: PropTypes.func.isRequired
};

export default DatosColaboradora;
