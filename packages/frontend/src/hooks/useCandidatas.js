import { useCallback, useEffect, useMemo, useState } from "react";
import { obtenerCandidatas } from "../service/proyectosService";

export function useCandidatas(perfiles, idPerfil, habilitado) {
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  const perfilesBuscados = useMemo(() => {
    if (!habilitado) return [];
    if (idPerfil !== "") {
      return perfiles.filter((perfil) => perfil.id === idPerfil);
    }
    return perfiles;
  }, [perfiles, idPerfil, habilitado]);

  useEffect(() => {
    if (!habilitado || perfilesBuscados.length === 0) {
      setGrupos([]);
      setCargando(false);
      setError(null);
      return undefined;
    }

    let cancelado = false;
    setCargando(true);
    setError(null);

    Promise.all(
      perfilesBuscados.map((perfil) =>
        obtenerCandidatas(perfil.idProyecto, perfil.id).then((candidatas) => ({
          perfil,
          candidatas,
        })),
      ),
    )
      .then((resultados) => {
        if (cancelado) return;
        setGrupos(resultados.filter((grupo) => grupo.candidatas.length > 0));
      })
      .catch(() => {
        if (cancelado) return;
        setGrupos([]);
        setError(
          new Error("No pudimos buscar colaboradores para los perfiles elegidos."),
        );
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [perfilesBuscados, habilitado, intento]);

  const recargar = useCallback(() => setIntento((actual) => actual + 1), []);

  return {
    grupos,
    cargando,
    error,
    recargar,
    cantidadPerfiles: perfilesBuscados.length,
  };
}
