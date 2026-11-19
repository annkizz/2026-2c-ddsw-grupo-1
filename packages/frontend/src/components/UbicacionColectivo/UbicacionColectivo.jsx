import { useEffect, useState } from 'react';
import { Alert, Autocomplete, MenuItem, TextField } from '@mui/material';
import { PROVINCIAS } from '../../data/provincias';

const PROVINCIAS_ARGENTINAS = PROVINCIAS.filter(({ codigo }) => codigo !== 'AR-C');
const URL_LOCALIDADES = 'https://apis.datos.gob.ar/georef/api/localidades';
const OTRO_PAIS = '__otro__';

const envolverCampo = (label, id, labelsAbove, control) => {
  if (!labelsAbove) return control;

  return (
    <div className="registro-campo">
      <label className="registro-campo__label" id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      {control}
    </div>
  );
};

const UbicacionColectivo = ({
  pais,
  provincia,
  ciudad,
  onChange,
  labelsAbove = false,
  idPrefix = 'ubicacion-colectivo',
}) => {
  const [otroPaisElegido, setOtroPaisElegido] = useState(false);
  const [ciudades, setCiudades] = useState([]);
  const [cargandoCiudades, setCargandoCiudades] = useState(false);
  const [errorCiudades, setErrorCiudades] = useState(null);
  const paisSeleccionado =
    pais === 'Argentina' ? 'Argentina' : pais || otroPaisElegido ? OTRO_PAIS : '';
  const ids = {
    pais: `${idPrefix}-pais`,
    provincia: `${idPrefix}-provincia`,
    ciudad: `${idPrefix}-ciudad`,
  };

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
      {envolverCampo(
        'País (opcional)',
        ids.pais,
        labelsAbove,
        <TextField
          id={ids.pais}
          select
          label={labelsAbove ? undefined : 'País (opcional)'}
          slotProps={{
            select: {
              labelId: labelsAbove ? `${ids.pais}-label` : undefined,
              displayEmpty: true
            }
          }}
          value={paisSeleccionado}
          onChange={cambiarPais}
          fullWidth
        >
          <MenuItem value="">
            <span className="select-placeholder">Seleccioná un país</span>
          </MenuItem>
          <MenuItem value="Argentina">Argentina</MenuItem>
          <MenuItem value={OTRO_PAIS}>Otro país</MenuItem>
        </TextField>,
      )}

      {paisSeleccionado === 'Argentina' && (
        <>
          {envolverCampo(
            'Provincia (opcional)',
            ids.provincia,
            labelsAbove,
            <TextField
              id={ids.provincia}
              select
              label={labelsAbove ? undefined : 'Provincia (opcional)'}
              slotProps={{
                select: {
                  labelId: labelsAbove ? `${ids.provincia}-label` : undefined,
                  displayEmpty: true
                }
              }}
              value={provincia}
              onChange={(evento) => onChange({ provincia: evento.target.value, ciudad: '' })}
              fullWidth
            >
              <MenuItem value="">
                <span className="select-placeholder">Seleccioná una provincia</span>
              </MenuItem>
              {PROVINCIAS_ARGENTINAS.map(({ codigo, nombre }) => (
                <MenuItem key={codigo} value={nombre}>
                  {nombre}
                </MenuItem>
              ))}
            </TextField>,
          )}
          {provincia && (
            <>
              {errorCiudades ? (
                <>
                  <Alert severity="warning">{errorCiudades}</Alert>
                  {envolverCampo(
                    'Ciudad o localidad (opcional)',
                    ids.ciudad,
                    labelsAbove,
                    <TextField
                      id={ids.ciudad}
                      label={labelsAbove ? undefined : 'Ciudad o localidad (opcional)'}
                      value={ciudad}
                      onChange={(evento) => onChange({ ciudad: evento.target.value })}
                      helperText={labelsAbove ? 'Ej.: Rosario' : undefined}
                      fullWidth
                    />,
                  )}
                </>
              ) : (
                envolverCampo(
                  'Ciudad o localidad (opcional)',
                  ids.ciudad,
                  labelsAbove,
                  <Autocomplete
                    id={ids.ciudad}
                    options={ciudades}
                    value={ciudad || null}
                    onChange={(_, nuevaCiudad) => onChange({ ciudad: nuevaCiudad ?? '' })}
                    loading={cargandoCiudades}
                    disabled={cargandoCiudades || ciudades.length === 0}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        id={ids.ciudad}
                        label={labelsAbove ? undefined : 'Ciudad o localidad (opcional)'}
                        placeholder={
                          cargandoCiudades ? 'Cargando ciudades…' : 'Elegí una ciudad o localidad'
                        }
                        helperText={labelsAbove ? 'Ej.: Rosario' : undefined}
                      />
                    )}
                  />,
                )
              )}
            </>
          )}
        </>
      )}

      {paisSeleccionado === OTRO_PAIS && (
        <>
          {envolverCampo(
            'País (opcional)',
            ids.pais,
            labelsAbove,
            <TextField
              id={ids.pais}
              label={labelsAbove ? undefined : 'País (opcional)'}
              placeholder="Escribí el país"
              value={pais}
              onChange={(evento) => onChange({ pais: evento.target.value })}
              helperText={labelsAbove ? 'Ej.: Uruguay' : undefined}
              fullWidth
            />,
          )}
          {envolverCampo(
            'Provincia o región (opcional)',
            ids.provincia,
            labelsAbove,
            <TextField
              id={ids.provincia}
              label={labelsAbove ? undefined : 'Provincia o región (opcional)'}
              placeholder="Escribí la provincia o región"
              value={provincia}
              onChange={(evento) => onChange({ provincia: evento.target.value })}
              helperText={labelsAbove ? 'Ej.: Canelones' : undefined}
              fullWidth
            />,
          )}
          {envolverCampo(
            'Ciudad (opcional)',
            ids.ciudad,
            labelsAbove,
            <TextField
              id={ids.ciudad}
              label={labelsAbove ? undefined : 'Ciudad (opcional)'}
              placeholder="Escribí la ciudad"
              value={ciudad}
              onChange={(evento) => onChange({ ciudad: evento.target.value })}
              helperText={labelsAbove ? 'Ej.: Montevideo' : undefined}
              fullWidth
            />,
          )}
        </>
      )}
    </>
  );
};

export default UbicacionColectivo;
