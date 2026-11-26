import React from "react";
import PropTypes from "prop-types";
import { Button, LinearProgress } from "@mui/material";
import { FiArrowRight, FiUser } from "react-icons/fi";
import DashboardCard from "./DashboardCard.jsx";
import { t } from "../../../i18n/t";

const IndicadorProgresoPerfil = ({
  completados,
  total,
  faltantes,
  beneficio,
  onCompletar,
  titulo = t("inicio.completaTuPerfil"),
  accion = t("inicio.completarPerfil"),
}) => {
  const valor = total > 0 ? (completados / total) * 100 : 0;

  return (
    <DashboardCard className="dashboard-card--perfil" icon={<FiUser />}>
      <div className="dashboard-progreso-contenido">
        <h2>{titulo}</h2>
        <p>{t("inicio.progresoCompleto", { completados, total })}</p>
        <LinearProgress
          variant="determinate"
          value={valor}
          aria-label={t("inicio.progresoPerfil")}
          aria-valuetext={t("inicio.progresoDescripcion", {
            completados,
            total,
          })}
        />
        <p>
          {t("inicio.faltanDatos", {
            campos: faltantes
              .map(({ etiquetaKey }) => t(etiquetaKey))
              .join(", "),
          })}
        </p>
        {beneficio && <p>{beneficio}</p>}
      </div>
      <Button
        variant="outlined"
        onClick={onCompletar}
        endIcon={<FiArrowRight aria-hidden="true" />}
      >
        {accion}
      </Button>
    </DashboardCard>
  );
};

IndicadorProgresoPerfil.propTypes = {
  completados: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  faltantes: PropTypes.arrayOf(
    PropTypes.shape({ etiquetaKey: PropTypes.string.isRequired }),
  ).isRequired,
  beneficio: PropTypes.node,
  onCompletar: PropTypes.func,
  titulo: PropTypes.node,
  accion: PropTypes.node,
};

export default IndicadorProgresoPerfil;
