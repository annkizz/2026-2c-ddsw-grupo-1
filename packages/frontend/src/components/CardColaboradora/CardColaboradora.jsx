import React from 'react';
import PropTypes from 'prop-types';
import { Button, Chip } from '@mui/material';
import { FiCheckCircle, FiGithub, FiMail } from 'react-icons/fi';
import '../Card.css';

const NOMBRE_SIN_ALIAS = 'Colaboradora sin nombre público';

function nombreVisible(colaboradora) {
  return colaboradora.nombreFantasia ?? colaboradora.usuarioGitHub ?? NOMBRE_SIN_ALIAS;
}

function listarHabilidades(habilidades) {
  return habilidades?.length > 0 ? habilidades.join(', ') : 'ninguna';
}

const iniciales = (nombre) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');

export default function CardColaboradora({ colaboradora }) {
  const nombre = nombreVisible(colaboradora);
  const idTitulo = `card-colaboradora-${colaboradora.id ?? nombre}`;
  return (
    <li className="tarjeta" aria-labelledby={idTitulo}>
      <div className="tarjeta__media tarjeta__media--persona" aria-hidden="true">
        <span className="tarjeta__avatar">{iniciales(nombre)}</span>
      </div>

      <div className="tarjeta__cuerpo">
        <div className="tarjeta__encabezado">
          <h3 id={idTitulo}>{nombre}</h3>
          {colaboradora.tieneCoincidencia && (
            <Chip color="success" icon={<FiCheckCircle aria-hidden="true" />} label="Coincide" />
          )}
        </div>

        {colaboradora.pronombres?.length > 0 && (
          <p className="tarjeta__meta">Pronombres: {colaboradora.pronombres.join(', ')}</p>
        )}
        {colaboradora.presentacion && <p className="tarjeta__descripcion">{colaboradora.presentacion}</p>}
        {colaboradora.usuarioGitHub && (
          <p className="tarjeta__meta">
            <FiGithub aria-hidden="true" />
            <span>
              GitHub:{' '}
              <a href={`https://github.com/${colaboradora.usuarioGitHub}`} target="_blank" rel="noreferrer">
                @{colaboradora.usuarioGitHub}
                <span className="visualmente-oculto"> (se abre en una pestaña nueva)</span>
              </a>
            </span>
          </p>
        )}

        <div className="tarjeta__metas">
          <p className="tarjeta__meta">
            <span>
              <strong>Requeridas en común:</strong> {listarHabilidades(colaboradora.requeridasCoincidentes)}
            </span>
          </p>
          <p className="tarjeta__meta">
            <span>
              <strong>Opcionales en común:</strong> {listarHabilidades(colaboradora.opcionalesCoincidentes)}
            </span>
          </p>
        </div>
      </div>

      <div className="tarjeta__acciones">
        <Button variant="outlined" type="button" startIcon={<FiMail aria-hidden="true" />} disabled aria-describedby={`${idTitulo}-contacto`}>
          Contactar
        </Button>
        <span id={`${idTitulo}-contacto`} className="texto-secundario">
          Disponible en una próxima entrega.
        </span>
      </div>
      {invitacionEnviada && (
        <Alert severity="success" role="status">
          La invitación quedó en la bandeja de notificaciones de la persona.
        </Alert>
      )}
      {errorInvitacion && <Alert severity="error">{errorInvitacion}</Alert>}

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

CardColaboradora.propTypes = {
  colaboradora: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    nombreFantasia: PropTypes.string,
    usuarioGitHub: PropTypes.string,
    pronombres: PropTypes.arrayOf(PropTypes.string),
    presentacion: PropTypes.string,
    tieneCoincidencia: PropTypes.bool,
    requeridasCoincidentes: PropTypes.arrayOf(PropTypes.string),
    opcionalesCoincidentes: PropTypes.arrayOf(PropTypes.string)
  }).isRequired
};
