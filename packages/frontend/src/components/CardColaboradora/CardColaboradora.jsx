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
