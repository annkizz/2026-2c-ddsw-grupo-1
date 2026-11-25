import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Autocomplete, MenuItem, TextField } from '@mui/material';
import { PROVINCIAS } from '../../data/provincias';
import { t } from '../../i18n/t';

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
        if (!respuesta.ok) throw new Error(t('erroresInternos.localidadesCarga'));
        const resultado = await respuesta.json();
        if (!Array.isArray(resultado.localidades)) {
          throw new Error(t('erroresInternos.localidadesFormato'));
        }
        setCiudades(resultado.localidades.map(({ nombre }) => nombre).sort((a, b) => a.localeCompare(b)));
      } catch (fallo) {
        if (fallo.name !== 'AbortError') {
          setCiudades([]);
          setErrorCiudades(t('ubicacion.errorCiudades'));
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
        t('ubicacion.paisOpcional'),
        ids.pais,
        labelsAbove,
        <TextField
          id={ids.pais}
          select
          label={labelsAbove ? undefined : t('ubicacion.paisOpcional')}
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
            <span className="select-placeholder">{t('ubicacion.seleccionarPais')}</span>
          </MenuItem>
          <MenuItem value="Argentina">{t('ubicacion.argentina')}</MenuItem>
          <MenuItem value={OTRO_PAIS}>{t('ubicacion.otroPais')}</MenuItem>
        </TextField>,
      )}

      {paisSeleccionado === 'Argentina' && (
        <>
          {envolverCampo(
            t('ubicacion.provinciaOpcional'),
            ids.provincia,
            labelsAbove,
            <TextField
              id={ids.provincia}
              select
              label={labelsAbove ? undefined : t('ubicacion.provinciaOpcional')}
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
                <span className="select-placeholder">{t('ubicacion.seleccionarProvincia')}</span>
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
                  <Alert severity="warning" role="alert">{errorCiudades}</Alert>
                  {envolverCampo(
                    t('ubicacion.ciudadLocalidadOpcional'),
                    ids.ciudad,
                    labelsAbove,
                    <TextField
                      id={ids.ciudad}
                      label={labelsAbove ? undefined : t('ubicacion.ciudadLocalidadOpcional')}
                      value={ciudad}
                      onChange={(evento) => onChange({ ciudad: evento.target.value })}
                      placeholder={t('ubicacion.ejRosario')}
                      fullWidth
                    />,
                  )}
                </>
              ) : (
                envolverCampo(
                  t('ubicacion.ciudadLocalidadOpcional'),
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
                        label={labelsAbove ? undefined : t('ubicacion.ciudadLocalidadOpcional')}
                        placeholder={
                          cargandoCiudades ? t('ubicacion.cargandoCiudades') : t('ubicacion.elegiCiudad')
                        }
                        
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
            t('ubicacion.paisOpcional'),
            ids.pais,
            labelsAbove,
            <TextField
              id={ids.pais}
              label={labelsAbove ? undefined : t('ubicacion.paisOpcional')}
              placeholder={t('ubicacion.ejUruguay')}
              value={pais}
              onChange={(evento) => onChange({ pais: evento.target.value })}
              
              fullWidth
            />,
          )}
          {envolverCampo(
            t('ubicacion.provinciaRegionOpcional'),
            ids.provincia,
            labelsAbove,
            <TextField
              id={ids.provincia}
              label={labelsAbove ? undefined : t('ubicacion.provinciaRegionOpcional')}
              placeholder={t('ubicacion.ejCanelones')}
              value={provincia}
              onChange={(evento) => onChange({ provincia: evento.target.value })}
              
              fullWidth
            />,
          )}
          {envolverCampo(
            t('ubicacion.ciudadOpcional'),
            ids.ciudad,
            labelsAbove,
            <TextField
              id={ids.ciudad}
              label={labelsAbove ? undefined : t('ubicacion.ciudadOpcional')}
              placeholder={t('ubicacion.ejMontevideo')}
              value={ciudad}
              onChange={(evento) => onChange({ ciudad: evento.target.value })}
              
              fullWidth
            />,
          )}
        </>
      )}
    </>
  );
};

UbicacionColectivo.propTypes = {
  pais: PropTypes.string,
  provincia: PropTypes.string,
  ciudad: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  labelsAbove: PropTypes.bool,
  idPrefix: PropTypes.string,
};

export default UbicacionColectivo;
