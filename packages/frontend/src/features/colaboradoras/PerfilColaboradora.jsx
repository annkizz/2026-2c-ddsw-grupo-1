import { t } from "../../i18n/t";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { obtenerColaboradoraPorId } from "../../service/colaboradorasService";
import PerfilPublicoVista from "../perfil/PerfilPublicoVista.jsx";

const PerfilColaboradora = () => {
  const { id } = useParams();
  const [colaboradora, setColaboradora] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);
    obtenerColaboradoraPorId(id)
      .then((perfil) => {
        if (vigente) setColaboradora(perfil);
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
  const nombre = colaboradora
    ? [colaboradora.nombre, colaboradora.apellido].filter(Boolean).join(" ")
    : "";

  return (
    <PerfilPublicoVista
      tipo={t("perfilPublico.personaColaboradora")}
      cargando={cargando}
      error={error}
      encontrado={Boolean(colaboradora)}
      onReintentar={reintentar}
      titulo={
        colaboradora?.nombreFantasia ||
        nombre ||
        t("perfilPublico.perfilColaboradora")
      }
      datos={[
        nombre && colaboradora?.nombreFantasia ? nombre : null,
        colaboradora?.pronombres?.length > 0
          ? t("tarjetas.pronombres", {
              pronombres: colaboradora.pronombres.join(", "),
            })
          : null,
        colaboradora?.usuarioGitHub
          ? t("perfilPublico.usuarioCodigo", {
              usuario: colaboradora.usuarioGitHub,
            })
          : null,
        colaboradora?.presentacion || null,
      ]}
      seccionTitulo={t("registro.habilidades")}
      chips={colaboradora?.habilidades ?? []}
      textoSinChips={t("perfilPublico.sinHabilidades")}
    />
  );
};

export default PerfilColaboradora;
