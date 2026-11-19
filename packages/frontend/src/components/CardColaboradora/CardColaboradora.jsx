import React, { useId, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useAuth } from "../../hooks/useAuth.jsx";
import { crearNotificacion } from "../../service/notificacionesService";
import "../Card.css";

const NOMBRE_SIN_ALIAS = "Colaboradora sin nombre público";

function nombreVisible(colaboradora) {
  return (
    colaboradora.nombreFantasia ??
    colaboradora.usuarioGitHub ??
    NOMBRE_SIN_ALIAS
  );
}

function listarHabilidades(habilidades) {
  return habilidades?.length > 0 ? habilidades.join(", ") : "ninguna";
}

export default function CardColaboradora({ colaboradora }) {
  const { getAccessToken } = useAuth();
  const dialogTitleId = `dialogo-contacto-${useId()}`;
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [contenido, setContenido] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);
  const aceptaMensajeria = colaboradora.aceptaMensajeria === true;

  const cerrarDialogo = () => {
    if (enviando) return;
    setDialogoAbierto(false);
    setContenido("");
    setError("");
    setResultado(null);
  };

  const enviarMensaje = async (event) => {
    event.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const token = await getAccessToken();
      const respuesta = await crearNotificacion(token, {
        idColaborador: colaboradora.id,
        contenido: contenido.trim(),
      });
      setResultado(respuesta);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error ??
          "No pudimos enviar el mensaje. Reintentá.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <li className="tarjeta">
      <div className="tarjeta__encabezado">
        <h3>{nombreVisible(colaboradora)}</h3>
        {colaboradora.tieneCoincidencia && (
          <span className="etiqueta-estado etiqueta-estado--coincide">
            Coincide
          </span>
        )}
      </div>

      {colaboradora.pronombres?.length > 0 && (
        <p className="tarjeta__meta">
          Pronombres: {colaboradora.pronombres.join(", ")}
        </p>
      )}
      {colaboradora.presentacion && <p>{colaboradora.presentacion}</p>}
      {colaboradora.usuarioGitHub && (
        <p className="tarjeta__meta">
          GitHub:{" "}
          <a
            href={`https://github.com/${colaboradora.usuarioGitHub}`}
            target="_blank"
            rel="noreferrer"
          >
            @{colaboradora.usuarioGitHub}
          </a>
        </p>
      )}

      <p className="tarjeta__meta">
        <strong>Requeridas en común:</strong>{" "}
        {listarHabilidades(colaboradora.requeridasCoincidentes)}
      </p>
      <p className="tarjeta__meta">
        <strong>Opcionales en común:</strong>{" "}
        {listarHabilidades(colaboradora.opcionalesCoincidentes)}
      </p>

      <div className="tarjeta__acciones">
        <button
          type="button"
          className="boton boton--secundario"
          disabled={!aceptaMensajeria}
          title={
            aceptaMensajeria
              ? "Enviar un mensaje interno"
              : "Esta persona no acepta mensajes internos"
          }
          onClick={() => setDialogoAbierto(true)}
        >
          {aceptaMensajeria ? "Contactar" : "No acepta mensajes"}
        </button>
      </div>

      <Dialog
        open={dialogoAbierto}
        onClose={cerrarDialogo}
        fullWidth
        maxWidth="sm"
        aria-labelledby={dialogTitleId}
      >
        <form onSubmit={enviarMensaje}>
          <DialogTitle id={dialogTitleId}>
            Contactar a {nombreVisible(colaboradora)}
          </DialogTitle>
          <DialogContent>
            {resultado ? (
              <Alert severity="success" role="status">
                El mensaje quedó enviado dentro de la plataforma.
                {resultado.envios?.length > 0 && (
                  <ul>
                    {resultado.envios.map((envio) => (
                      <li key={envio.tipoDeContacto}>
                        {envio.tipoDeContacto}: {envio.estado}
                      </li>
                    ))}
                  </ul>
                )}
              </Alert>
            ) : (
              <>
                <p>
                  El mensaje se guardará en la bandeja de la persona. Sus medios
                  de contacto permanecen privados.
                </p>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField
                  autoFocus
                  required
                  fullWidth
                  multiline
                  minRows={4}
                  label="Mensaje"
                  value={contenido}
                  onChange={(event) => setContenido(event.target.value)}
                  slotProps={{ htmlInput: { maxLength: 2000 } }}
                  helperText={`${contenido.length}/2000`}
                  disabled={enviando}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            {resultado ? (
              <Button onClick={cerrarDialogo}>Cerrar</Button>
            ) : (
              <>
                <Button onClick={cerrarDialogo} disabled={enviando}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={enviando || contenido.trim().length < 4}
                >
                  {enviando ? "Enviando…" : "Enviar mensaje"}
                </Button>
              </>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </li>
  );
}
