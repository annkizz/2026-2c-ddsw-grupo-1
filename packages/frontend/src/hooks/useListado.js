import { useCallback, useEffect, useState } from "react";
import api from "../service/api";

export function useListado(url) {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(Boolean(url));
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!url) {
      setDatos([]);
      setCargando(false);
      setError(null);
      return undefined;
    }

    let cancelado = false;
    setDatos([]);
    setCargando(true);
    setError(null);

    api
      .get(url)
      .then((respuesta) => {
        if (!cancelado) setDatos(respuesta.data);
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
  }, [url, intento]);

  const recargar = useCallback(() => setIntento((actual) => actual + 1), []);

  return { datos, cargando, error, recargar };
}
