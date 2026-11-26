import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Alert, Snackbar } from "@mui/material";
import { t } from "../../i18n/t";

import PropTypes from "prop-types";
// Confirmaciones breves de acciones (crear, editar, eliminar, postularse...).
// Uso: const notificar = useNotificar(); notificar({ mensaje: 'Proyecto creado' });
const NotificadorContext = createContext(() => {});

export const NotificadorProvider = ({ children }) => {
  const [actual, setActual] = useState(null);
  const [abierto, setAbierto] = useState(false);

  const notificar = useCallback(
    ({ mensaje, severidad = "success", duracion = 6000 }) => {
      if (!mensaje) return;
      setActual({ mensaje, severidad, duracion, id: Date.now() });
      setAbierto(true);
    },
    [],
  );

  const cerrar = (_evento, motivo) => {
    if (motivo === "clickaway") return;
    setAbierto(false);
  };

  const valor = useMemo(() => notificar, [notificar]);

  return (
    <NotificadorContext.Provider value={valor}>
      {children}
      <Snackbar
        key={actual?.id}
        open={abierto}
        autoHideDuration={actual?.duracion}
        onClose={cerrar}
        sx={{ zIndex: "var(--z-snackbar)" }}
      >
        {actual ? (
          <Alert
            onClose={cerrar}
            severity={actual.severidad}
            role={actual.severidad === "error" ? "alert" : "status"}
            slotProps={{
              closeButton: { "aria-label": t("comun.cerrarAviso") },
            }}
            sx={{
              boxShadow: "var(--shadow-md)",
              minWidth: "min(var(--card-min-width), 100%)",
            }}
          >
            {actual.mensaje}
          </Alert>
        ) : undefined}
      </Snackbar>
    </NotificadorContext.Provider>
  );
};

export const useNotificar = () => useContext(NotificadorContext);

NotificadorProvider.propTypes = { children: PropTypes.node };
