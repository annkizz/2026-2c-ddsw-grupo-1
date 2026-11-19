import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { obtenerColectivoPorId, TIPOS_COLECTIVO } from '../../service/colectivosService';
import { etiquetaLegible } from '../../utils/etiquetas';
import PerfilPublicoVista from '../perfil/PerfilPublicoVista.jsx';

const PerfilColectivo = () => {
  const { id } = useParams();
  const [colectivo, setColectivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);
    obtenerColectivoPorId(id)
      .then((perfil) => {
        if (vigente) setColectivo(perfil);
      })
      .catch((fallo) => {
        if (vigente) setError(fallo);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [id, intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  const tipo = TIPOS_COLECTIVO.find((opcion) => opcion.valor === colectivo?.tipoDeColectivo);
  const ubicacion = [colectivo?.ubicacion?.ciudad, colectivo?.ubicacion?.provincia, colectivo?.ubicacion?.pais]
    .filter(Boolean)
    .join(', ');

  return (
    <PerfilPublicoVista
      tipo="Colectivo"
      cargando={cargando}
      error={error}
      encontrado={Boolean(colectivo)}
      onReintentar={reintentar}
      titulo={colectivo?.nombre}
      datos={[tipo?.texto ?? null, ubicacion || null, colectivo?.descripcion || null]}
      seccionTitulo="Habilidades y áreas de trabajo"
      chips={(colectivo?.etiquetas ?? []).map(etiquetaLegible)}
      textoSinChips="Aún no agregó áreas de trabajo."
    />
  );
};

export default PerfilColectivo;
