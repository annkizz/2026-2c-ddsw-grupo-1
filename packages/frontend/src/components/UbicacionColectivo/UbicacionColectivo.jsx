import { useEffect, useState } from 'react';
import { Alert, Autocomplete, MenuItem, TextField } from '@mui/material';
import { PROVINCIAS } from '../../data/provincias';

const PROVINCIAS_ARGENTINAS = PROVINCIAS.filter(({ codigo }) => codigo !== 'AR-C');
const URL_LOCALIDADES = 'https://apis.datos.gob.ar/georef/api/localidades';
const OTRO_PAIS = '__otro__';

const UbicacionColectivo = ({ pais, provincia, ciudad, onChange }) => {
  const [otroPaisElegido, setOtroPaisElegido] = useState(false);
  const [ciudades, setCiudades] = useState([]);
  const [cargandoCiudades, setCargandoCiudades] = useState(false);
  const [errorCiudades, setErrorCiudades] = useState(null);
  const paisSeleccionado =
    pais === 'Argentina' ? 'Argentina' : pais || otroPaisElegido ? OTRO_PAIS : '';

  useEffect(() => {
    if (pais !== 'Argentina' || !provincia) {
      setCiudades([]);
      setErrorCiudades(null);
      setCargandoCiudades(false);
      return undefined;
    }

    const provinciaElegida = PROVINCIAS_ARGENTINAS.find(({ nombre }) => nombre === provincia);
    if (!provinciaElegida) return undefined;

    const controller = new AbortController();
    const cargarCiudades = async () => {
      setCargandoCiudades(true);
      setErrorCiudades(null);
      try {
        const parametros = new URLSearchParams({
          provincia: provinciaElegida.nombre,
          campos: 'nombre',
          max: '5000'
        });
        const respuesta = await fetch(`${URL_LOCALIDADES}?${parametros}`, {
          signal: controller.signal
        });
        if (!respuesta.ok) throw new Error('No se pudieron cargar las localidades.');
        const resultado = await respuesta.json();
        if (!Array.isArray(resultado.localidades)) {
          throw new Error('La respuesta de localidades no tiene el formato esperado.');
        }
        setCiudades(resultado.localidades.map(({ nombre }) => nombre).sort((a, b) => a.localeCompare(b)));
      } catch (fallo) {
        if (fallo.name !== 'AbortError') {
          setCiudades([]);
          setErrorCiudades('No pudimos cargar las ciudades. Podés escribirla manualmente.');
        }
      } finally {
        if (!controller.signal.aborted) setCargandoCiudades(false);
      }
    };

    cargarCiudades();
    return () => controller.abort();
  }, [pais, provincia]);

  const cambiarPais = (evento) => {
    const nuevoPais = evento.target.value;
    setOtroPaisElegido(nuevoPais === OTRO_PAIS);
    let paisActualizado = '';
    if (nuevoPais === 'Argentina') {
      paisActualizado = 'Argentina';
    } else if (nuevoPais === OTRO_PAIS && pais !== 'Argentina') {
      paisActualizado = pais;
    }
    onChange({
      pais: paisActualizado,
      provincia: '',
      ciudad: ''
    });
  };

  return (
    <>
      <TextField
        select
        label="País (opcional)"
        value={paisSeleccionado}
        onChange={cambiarPais}
        fullWidth
      >
        <MenuItem value="">Sin especificar</MenuItem>
        <MenuItem value="Argentina">Argentina</MenuItem>
        <MenuItem value={OTRO_PAIS}>Otro país</MenuItem>
      </TextField>

      {paisSeleccionado === 'Argentina' && (
        <>
          <TextField
            select
            label="Provincia (opcional)"
            value={provincia}
            onChange={(evento) => onChange({ provincia: evento.target.value, ciudad: '' })}
            fullWidth
          >
            <MenuItem value="">Sin especificar</MenuItem>
            {PROVINCIAS_ARGENTINAS.map(({ codigo, nombre }) => (
              <MenuItem key={codigo} value={nombre}>
                {nombre}
              </MenuItem>
            ))}
          </TextField>
          {provincia && (
            <>
              {errorCiudades ? (
                <>
                  <Alert severity="warning">{errorCiudades}</Alert>
                  <TextField
                    label="Ciudad o localidad (opcional)"
                    value={ciudad}
                    onChange={(evento) => onChange({ ciudad: evento.target.value })}
                    fullWidth
                  />
                </>
              ) : (
                <Autocomplete
                  options={ciudades}
                  value={ciudad || null}
                  onChange={(_, nuevaCiudad) => onChange({ ciudad: nuevaCiudad ?? '' })}
                  loading={cargandoCiudades}
                  disabled={cargandoCiudades || ciudades.length === 0}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Ciudad o localidad (opcional)"
                      placeholder={
                        cargandoCiudades ? 'Cargando ciudades…' : 'Elegí una ciudad o localidad'
                      }
                    />
                  )}
                />
              )}
            </>
          )}
        </>
      )}

      {paisSeleccionado === OTRO_PAIS && (
        <>
          <TextField
            label="País (opcional)"
            placeholder="Escribí el país"
            value={pais}
            onChange={(evento) => onChange({ pais: evento.target.value })}
            fullWidth
          />
          <TextField
            label="Provincia o región (opcional)"
            value={provincia}
            onChange={(evento) => onChange({ provincia: evento.target.value })}
            fullWidth
          />
          <TextField
            label="Ciudad (opcional)"
            value={ciudad}
            onChange={(evento) => onChange({ ciudad: evento.target.value })}
            fullWidth
          />
        </>
      )}
    </>
  );
};

export default UbicacionColectivo;
