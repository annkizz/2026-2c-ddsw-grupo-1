import { useCallback, useEffect, useMemo, useState } from "react";
import { obtenerCandidatas } from "../service/proyectosService";
import { t } from "../i18n/t";

export function useCandidatas(perfiles, idPerfil, habilitado) {
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);
  const [pag, setPag] = useState(1);
  const [totalPags, setTotalPags] = useState(0);

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
        obtenerCandidatas(perfil.idProyecto, perfil.id, pag).then((cuerpo) => {
          const candidatas = Array.isArray(cuerpo)
            ? cuerpo
            : (cuerpo.colaboradoras ?? []);
          return {
            perfil,
            candidatas,
            totalPags: Array.isArray(cuerpo) ? 1 : (cuerpo.totalPags ?? 0),
          };
        }),
      ),
    )
      .then((resultados) => {
        if (cancelado) return;
        setGrupos((actual) => {
          if (pag === 1) {
            return resultados.filter((grupo) => grupo.candidatas.length > 0);
          }
          return actual.map((grupo) => {
            const siguiente = resultados.find(
              (resultado) => resultado.perfil.id === grupo.perfil.id,
            );
            if (!siguiente) return grupo;
            return {
              ...grupo,
              candidatas: [
                ...grupo.candidatas,
                ...siguiente.candidatas.filter(
                  (candidata) =>
                    !grupo.candidatas.some(
                      (actual) => actual.id === candidata.id,
                    ),
                ),
              ],
            };
          });
        });
        setTotalPags(
          resultados.reduce(
            (maximo, resultado) => Math.max(maximo, resultado.totalPags ?? 0),
            0,
          ),
        );
      })
      .catch(() => {
        if (cancelado) return;
        setGrupos([]);
        setError(new Error(t("erroresInternos.buscarCandidatas")));
      })
      .finally(() => {
        if (!cancelado) {
          setCargando(false);
          setCargandoMas(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [perfilesBuscados, habilitado, intento, pag]);

  const recargar = useCallback(() => {
    setPag(1);
    setTotalPags(0);
    setIntento((actual) => actual + 1);
  }, []);

  const cargarMas = useCallback(() => {
    if (cargandoMas || pag >= totalPags) return;
    setCargandoMas(true);
    setPag((actual) => actual + 1);
  }, [cargandoMas, pag, totalPags]);

  return {
    grupos,
    cargando,
    cargandoMas,
    error,
    recargar,
    cargarMas,
    hayMas: pag < totalPags,
    cantidadPerfiles: perfilesBuscados.length,
  };
}
