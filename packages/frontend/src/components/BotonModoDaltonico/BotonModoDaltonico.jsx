import React from "react";
import { Button } from "@mui/material";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useModoColor } from "../../theme/ModoColorContext.jsx";
import { t } from "../../i18n/t";

import PropTypes from "prop-types";
// Interruptor del modo daltónico. El estado se comunica con aria-pressed,
// ícono y texto (no solo con color). El anuncio lo hace ModoColorProvider.
const BotonModoDaltonico = ({ className, onAlternar }) => {
  const { esDaltonico, alternarModo } = useModoColor();

  const alternar = () => {
    alternarModo();
    onAlternar?.();
  };

  return (
    <Button
      type="button"
      variant="outlined"
      className={className}
      aria-pressed={esDaltonico}
      startIcon={
        esDaltonico ? (
          <FiEyeOff aria-hidden="true" />
        ) : (
          <FiEye aria-hidden="true" />
        )
      }
      onClick={alternar}
    >
      {esDaltonico ? t("modoColor.botonActivado") : t("modoColor.boton")}
    </Button>
  );
};

BotonModoDaltonico.propTypes = {
  className: PropTypes.string,
  onAlternar: PropTypes.func,
};

export default BotonModoDaltonico;
