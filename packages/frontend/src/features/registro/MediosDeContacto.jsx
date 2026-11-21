import { t } from '../../i18n/t';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Checkbox, FormControlLabel, IconButton, MenuItem, TextField } from '@mui/material';
import { FiAlertCircle, FiLock, FiTrash2 } from 'react-icons/fi';
import AgregarMedioContactoButton from '../../components/AgregarMedioContactoButton/AgregarMedioContactoButton';
import AccionesRegistro from '../../components/AccionesRegistro/AccionesRegistro.jsx';
import { TIPOS_CONTACTO } from '../../service/colaboradorasService';

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const CELULAR_REGEX = /^\+\d{10,15}$/; // igual que el backend, pero tolerando espacios y guiones

const REGLAS = {
  EMAIL: {
    etiqueta: 'Dirección de email',
    ejemplo: t('miPerfil.ejEmail'),
    esValido: (valor) => EMAIL_REGEX.test(valor.trim()),
    mensaje: t('registro.ingresaUnEmailValidoPor')
  },
  WHATSAPP: {
    etiqueta: 'Número de WhatsApp',
    ejemplo: t('miPerfil.ejTelefono'),
    esValido: (valor) => CELULAR_REGEX.test(valor.replace(/[\s-]/g, '')),
    mensaje: t('registro.ingresaUnTelefonoConCodigo')
  },
  SMS: {
    etiqueta: 'Número de celular',
    ejemplo: t('miPerfil.ejTelefono'),
    esValido: (valor) => CELULAR_REGEX.test(valor.replace(/[\s-]/g, '')),
    mensaje: t('registro.ingresaUnTelefonoConCodigo')
  }
};

// Paso 3 de 3: medios de contacto (opcional)
const MediosDeContacto = ({
  datos,
  setDatos,
  onVolver,
  onSiguiente,
  siguiente = 'Listo',
  guardando,
  error
}) => {
  const [conError, setConError] = useState([]); // posiciones de los medios inválidos

  const cambiarMedio = (posicion, cambios) => {
    const medios = datos.medios.map((medio, i) => (i === posicion ? { ...medio, ...cambios } : medio));
    setDatos({ ...datos, medios });
    setConError(conError.filter((i) => i !== posicion));
  };

  const agregarMedio = () => {
    const tipo = datos.medios.length === 0 ? 'EMAIL' : 'WHATSAPP';
    setDatos({ ...datos, medios: [...datos.medios, { tipo, valor: '' }] });
  };

  const quitarMedio = (posicion) => {
    setDatos({ ...datos, medios: datos.medios.filter((_, i) => i !== posicion) });
    setConError([]);
  };

  const terminar = (e) => {
    e.preventDefault();
    const invalidos = [];
    datos.medios.forEach((medio, i) => {
      if (!REGLAS[medio.tipo].esValido(medio.valor)) invalidos.push(i);
    });
    setConError(invalidos);
    if (invalidos.length > 0) {
      document.getElementById(`medio-valor-${invalidos[0]}`)?.focus();
      return;
    }
    onSiguiente();
  };

  return (
    <form onSubmit={terminar} noValidate>
      <section className="registro-card" aria-labelledby="paso-contacto-titulo">
        <h2 id="paso-contacto-titulo">Medios de contacto</h2>
        <p className="medios-contacto__intro">{t('medios.intro')}</p>
        <p className="medios-contacto__privado">
          <FiLock aria-hidden="true" /> {t('medios.privado')}
        </p>

        {datos.medios.length === 0 ? (
          <p className="medios-contacto__vacio">
            {t('medios.vacio')} <strong>{t('registro.mediosDeContactoOpcional')}</strong>
          </p>
        ) : (
          <ol className="medios-lista" aria-label={t('miPerfil.mediosDeContacto')}>
            {datos.medios.map((medio, i) => (
              <li className="medios-item" key={i}>
                <p className="medios-item__titulo">{t('medios.numero', { numero: i + 1 })}</p>
                <div className="medios-fila">
                  <TextField
                    id={`medio-tipo-${i}`}
                    select
                    label={t('medios.tipo')}
                    value={medio.tipo}
                    onChange={(e) => cambiarMedio(i, { tipo: e.target.value })}
                    fullWidth
                  >
                    {TIPOS_CONTACTO.map((tipo) => (
                      <MenuItem key={tipo.valor} value={tipo.valor}>
                        {tipo.texto}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    id={`medio-valor-${i}`}
                    label={REGLAS[medio.tipo].etiqueta}
                    placeholder={REGLAS[medio.tipo].ejemplo}
                    value={medio.valor}
                    onChange={(e) => cambiarMedio(i, { valor: e.target.value })}
                    onBlur={() => {
                      if (medio.valor && !REGLAS[medio.tipo].esValido(medio.valor) && !conError.includes(i)) {
                        setConError([...conError, i]);
                      }
                    }}
                    error={conError.includes(i)}
                    helperText={
                      conError.includes(i) ? (
                        <>
                          <FiAlertCircle aria-hidden="true" />
                          <span>{REGLAS[medio.tipo].mensaje}</span>
                        </>
                      ) : undefined
                    }
                    fullWidth
                  />
                  <IconButton aria-label={`Quitar medio de contacto ${i + 1}`} onClick={() => quitarMedio(i)}>
                    <FiTrash2 aria-hidden="true" />
                  </IconButton>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div>
          <AgregarMedioContactoButton onClick={agregarMedio} />
        </div>

        <FormControlLabel
          control={
            <Checkbox
              checked={datos.aceptaMensajeria}
              onChange={(e) => setDatos({ ...datos, aceptaMensajeria: e.target.checked })}
            />
          }
          label="Acepto recibir mensajes internos de la plataforma cuando haya proyectos relacionados con mis habilidades."
        />
      </section>

      {error && (
        <Alert severity="error" role="alert" className="registro-error">
          {error}
        </Alert>
      )}

      <AccionesRegistro onVolver={onVolver} siguiente={siguiente} guardando={guardando} />
    </form>
  );
};

MediosDeContacto.propTypes = {
  datos: PropTypes.object.isRequired,
  setDatos: PropTypes.func.isRequired,
  onVolver: PropTypes.func,
  onSiguiente: PropTypes.func.isRequired,
  siguiente: PropTypes.node,
  guardando: PropTypes.bool,
  error: PropTypes.node
};

export default MediosDeContacto;
