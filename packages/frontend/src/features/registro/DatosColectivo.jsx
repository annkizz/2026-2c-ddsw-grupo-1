import { t } from '../../i18n/t';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, MenuItem, TextField } from '@mui/material';
import { FiAlertCircle } from 'react-icons/fi';
import EncabezadoPagina from '../../components/EncabezadoPagina/EncabezadoPagina.jsx';
import ResumenErrores from '../../components/ResumenErrores/ResumenErrores.jsx';
import AccionesRegistro from '../../components/AccionesRegistro/AccionesRegistro.jsx';
import CustomSelect from '../../components/CustomSelect/CustomSelect';
import UbicacionColectivo from '../../components/UbicacionColectivo/UbicacionColectivo';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useListado } from '../../hooks/useListado';
import { TIPOS_COLECTIVO, crearColectivo } from '../../service/colectivosService';
import { mensajeDeError } from '../../utils/mensajeDeError';
import { ETIQUETAS_MAX } from '../../utils/etiquetas';
import { borrarTipo } from './tipoElegido';
import './Registro.css';
import CampoMarkdown from '../../components/CampoMarkdown/CampoMarkdown.jsx';

const DATOS_INICIALES = {
  nombre: '',
  tipoDeColectivo: '',
  pais: '',
  provincia: '',
  ciudad: '',
  etiquetas: [],
  descripcion: ''
};
const OBLIGATORIOS = ['nombre', 'tipoDeColectivo', 'descripcion'];
const IDS = {
  nombre: 'registro-colectivo-nombre',
  tipoDeColectivo: 'registro-colectivo-tipo',
  descripcion: 'registro-colectivo-descripcion'
};

const DatosColectivo = () => {
  const AYUDAS_CAMPOS = {
    nombre: t('registro.ayudaNombreColectivo'),
    descripcion: t('registro.contaQueHacenYA')
  };
  const ERRORES_CAMPOS = {
    nombre: t('registro.ingresaElNombreDelColectivo'),
    tipoDeColectivo: t('registro.elegiUnTipoDeColectivo'),
    descripcion: t('registro.escribiUnaDescripcionDelColectivo')
  };
  const navigate = useNavigate();
  const { getAccessToken, recargarSesion } = useAuth();
  const [datos, setDatos] = useState(DATOS_INICIALES);
  const [faltantes, setFaltantes] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [registroCreado, setRegistroCreado] = useState(false);
  const [intento, setIntento] = useState(0);
  const etiquetasState = useListado('/etiquetas');

  const setValorDe = (campo) => (e) => {
    setDatos({ ...datos, [campo]: e.target.value });
    setFaltantes(faltantes.filter((f) => f !== campo));
  };

  const alternarEtiqueta = (etiqueta) => {
    setDatos((prev) => ({
      ...prev,
      etiquetas: prev.etiquetas.includes(etiqueta)
        ? prev.etiquetas.filter((una) => una !== etiqueta)
        : [...prev.etiquetas, etiqueta]
    }));
  };

  const propsDe = (campo) => ({
    value: datos[campo],
    onChange: setValorDe(campo),
    error: faltantes.includes(campo),
    helperText: faltantes.includes(campo) ? (
      <>
        <FiAlertCircle aria-hidden="true" />
        <span>{ERRORES_CAMPOS[campo]}</span>
      </>
    ) : (
      AYUDAS_CAMPOS[campo]
    ),
    fullWidth: true,
    required: true
  });

  const opcionesEtiquetas = etiquetasState.datos.map((etiqueta) => ({
    valor: etiqueta,
    etiqueta: etiqueta.replaceAll('_', ' ')
  }));

  const guardar = async (e) => {
    e.preventDefault();
    const sinCompletar = OBLIGATORIOS.filter((campo) => datos[campo].trim() === '');
    setFaltantes(sinCompletar);
    setIntento((n) => n + 1);
    if (sinCompletar.length > 0) return;

    setGuardando(true);
    setError(null);
    try {
      if (!registroCreado) {
        const token = await getAccessToken();
        await crearColectivo(token, datos);
        setRegistroCreado(true);
      }

      const nuevaSesion = await recargarSesion();
      if (!nuevaSesion?.tienePerfil) {
        setError(
          t('registro.verificarPerfil')
        );
        return;
      }

      borrarTipo();
      navigate('/', { replace: true });
    } catch (e) {
      setError(mensajeDeError(e, t('registro.noPudimosRegistrarElColectivo')));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="contenedor-pagina contenedor-pagina--formulario registro">
      <EncabezadoPagina
        titulo={t('registro.registrarTuColectivo')}
        subtitulo={t('registro.paso2De2Contanos')}
      />
      <form onSubmit={guardar} noValidate>
        <ResumenErrores
          errores={faltantes.map((campo) => ({ campoId: IDS[campo], mensaje: ERRORES_CAMPOS[campo] }))}
          intento={intento}
        />
        <section className="registro-card" aria-labelledby="registro-colectivo-datos">
          <h2 id="registro-colectivo-datos">{t('registro.datosDelColectivo')}</h2>
          <p className="registro-card__intro">{t('registro.obligatoriosIndicados')}</p>
          <TextField
            id="registro-colectivo-nombre"
            label={t('registro.nombreObligatorio')}
            placeholder={t('registro.nombreColectivoEjemplo')}
            {...propsDe('nombre')}
          />
          <TextField
            id="registro-colectivo-tipo"
            select
            label={t('registro.tipoColectivoObligatorio')}
            slotProps={{ select: { displayEmpty: true } }}
            {...propsDe('tipoDeColectivo')}
          >
            <MenuItem value="" disabled>
              <span className="select-placeholder">{t('registro.seleccionarTipoColectivo')}</span>
            </MenuItem>
            {TIPOS_COLECTIVO.map((tipo) => (
              <MenuItem key={tipo.valor} value={tipo.valor}>
                {t(tipo.textoKey)}
              </MenuItem>
            ))}
          </TextField>

          <UbicacionColectivo
            pais={datos.pais}
            provincia={datos.provincia}
            ciudad={datos.ciudad}
            onChange={(cambios) => setDatos((prev) => ({ ...prev, ...cambios }))}
            labelsAbove
            idPrefix="registro-colectivo-ubicacion"
          />

          <div>
            <CustomSelect
              id="colectivo-etiquetas"
              etiqueta={t('registro.etiquetasOpcional')}
              opciones={opcionesEtiquetas}
              seleccion={datos.etiquetas}
              multiple
              maxSeleccion={ETIQUETAS_MAX}
              permiteCrear
              onSeleccionar={alternarEtiqueta}
              onQuitar={alternarEtiqueta}
              ayuda={t('registro.ayudaEtiquetas', { maximo: ETIQUETAS_MAX })}
              placeholder={etiquetasState.cargando ? t('registro.cargandoEtiquetas') : t('formularioProyecto.placeholderEtiquetas')}
              textoVacio={
                etiquetasState.cargando ? t('registro.cargandoEtiquetas') : t('registro.sinEtiquetas')
              }
            />
            {etiquetasState.error && (
              <Alert severity="warning" className="registro-aviso">
                {t('registro.errorEtiquetas')}
              </Alert>
            )}
          </div>

          <CampoMarkdown
            id="registro-colectivo-descripcion"
            label={t('registro.descripcionObligatoria')}
            placeholder={t('miPerfil.ejDescripcionColectivo')}
            multiline
            minRows={4}
            {...propsDe('descripcion')}
          />
        </section>

        {error && (
          <Alert severity="error" role="alert" className="registro-error">
            {error}
          </Alert>
        )}

        <AccionesRegistro
          onVolver={() => {
            borrarTipo();
            navigate('/');
          }}
          siguiente={registroCreado ? t('registro.verificarRegistro') : t('registro.registrarColectivo')}
          guardando={guardando}
        />
      </form>
    </div>
  );
};

export default DatosColectivo;
