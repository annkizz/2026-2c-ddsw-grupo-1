import React from "react";
import PropTypes from "prop-types";
import { Button } from "@mui/material";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { t } from "../../i18n/t";
import "./AccionesRegistro.css";

// Botones de cada paso del registro: secundario "Volver" y primario de avance (con estado de carga).
const AccionesRegistro = ({
  onVolver,
  siguiente = t("registro.siguiente"),
  guardando = false,
}) => (
  <div className="acciones-registro">
    {onVolver && (
      <Button
        variant="outlined"
        type="button"
        onClick={onVolver}
        startIcon={<FiArrowLeft aria-hidden="true" />}
      >
        {t("comun.volver")}
      </Button>
    )}
    <Button
      variant="contained"
      type="submit"
      loading={guardando}
      endIcon={guardando ? null : <FiArrowRight aria-hidden="true" />}
    >
      {guardando ? t("registro.guardando") : siguiente}
    </Button>
  </div>
);

AccionesRegistro.propTypes = {
  onVolver: PropTypes.func,
  siguiente: PropTypes.node,
  guardando: PropTypes.bool,
};

export default AccionesRegistro;
