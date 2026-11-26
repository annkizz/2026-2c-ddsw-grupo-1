import { useCallback, useEffect, useState } from "react";
import api from "../service/api";

export function usePaginacion(url, claveDatos) {
  const [datos, setDatos] = useState([]);
  const [pag, setPag] = useState(1);
  const [totalPags, setTotalPags] = useState(0);
  const [cargando, setCargando] = useState(Boolean(url));
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!url) {
      setDatos([]);
      setPag(1);
      setTotalPags(0);
      setCargando(false);
      setError(null);
      return undefined;
    }

    let cancelado = false;
    setDatos([]);
    setPag(1);
    setCargando(true);
    setError(null);

    api
      .get(url, { params: { pag: 1, limite: 6 } })
      .then((respuesta) => {
        if (cancelado) return;
        const cuerpo = respuesta.data;
        setDatos(Array.isArray(cuerpo) ? cuerpo : (cuerpo[claveDatos] ?? []));
        setTotalPags(Array.isArray(cuerpo) ? 1 : (cuerpo.totalPags ?? 0));
      })
      .catch((fallo) => {
        if (!cancelado) {
          setDatos([]);
          setError(fallo);
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [url, claveDatos, intento]);

  const cargarMas = useCallback(async () => {
    if (!url || cargandoMas || pag >= totalPags) return;
    const siguiente = pag + 1;
    setCargandoMas(true);
    setError(null);
    try {
      const respuesta = await api.get(url, {
        params: { pag: siguiente, limite: 6 },
      });
      const cuerpo = respuesta.data;
      setDatos((actual) => [
        ...actual,
        ...(Array.isArray(cuerpo) ? cuerpo : (cuerpo[claveDatos] ?? [])),
      ]);
      setPag(siguiente);
      setTotalPags(
        Array.isArray(cuerpo) ? totalPags : (cuerpo.totalPags ?? totalPags),
      );
    } catch (fallo) {
      setError(fallo);
    } finally {
      setCargandoMas(false);
    }
  }, [url, claveDatos, pag, totalPags, cargandoMas]);

  const recargar = useCallback(() => setIntento((actual) => actual + 1), []);

  return {
    datos,
    cargando,
    cargandoMas,
    error,
    recargar,
    cargarMas,
    hayMas: pag < totalPags,
  };
}
