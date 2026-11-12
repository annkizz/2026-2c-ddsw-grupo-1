import { useState } from 'react';
import { Alert, Card, Checkbox, FormControlLabel, IconButton, MenuItem, TextField } from '@mui/material';
import { FiLock, FiX } from 'react-icons/fi';
import AccionesRegistro from '../../components/AccionesRegistro/AccionesRegistro.jsx';
import { TIPOS_CONTACTO } from '../../service/colaboradorasService';

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const CELULAR_REGEX = /^\+\d{10,15}$/; // igual que el backend, pero tolerando espacios y guiones

const REGLAS = {
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

// Paso 3 de 3: medios de contacto (opcional)
const MediosDeContacto = ({ datos, setDatos, onVolver, onSiguiente, guardando, error }) => {
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
    if (invalidos.length === 0) onSiguiente();
  };

  return (
    <form onSubmit={terminar} noValidate>
      <Card variant="outlined" className="registro-card">
        <h2>Cómo podemos contactarte</h2>
        <Alert severity="warning" icon={<FiLock />} sx={{ marginBottom: 2 }}>
          Tus medios de contacto son privados y no se muestran públicamente.
        </Alert>

        {datos.medios.length === 0 && (
          <>
            <strong>Medios de contacto (opcional)</strong>
            <p className="medios-vacio">
              Todavía no agregaste medios de contacto. Podés continuar sin completar este paso.
            </p>
          </>
        )}

        {datos.medios.map((medio, i) => (
          <div className="medios-fila" key={i}>
            <TextField select label="Tipo" value={medio.tipo} onChange={(e) => cambiarMedio(i, { tipo: e.target.value })}>
              {TIPOS_CONTACTO.map((tipo) => (
                <MenuItem key={tipo.valor} value={tipo.valor}>
                  {tipo.texto}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={REGLAS[medio.tipo].etiqueta}
              placeholder={REGLAS[medio.tipo].ejemplo}
              value={medio.valor}
              onChange={(e) => cambiarMedio(i, { valor: e.target.value })}
              error={conError.includes(i)}
              helperText={conError.includes(i) ? REGLAS[medio.tipo].mensaje : ' '}
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
              onChange={(e) => setDatos({ ...datos, aceptaMensajeria: e.target.checked })}
            />
          }
          label="Acepto recibir mensajes internos de la plataforma cuando haya proyectos relacionados con mis habilidades."
        />
      </Card>

      {error && (
        <Alert severity="error" sx={{ marginTop: 2 }}>
          {error}
        </Alert>
      )}

      <AccionesRegistro onVolver={onVolver} siguiente="Listo" guardando={guardando} />
    </form>
  );
};

export default MediosDeContacto;
