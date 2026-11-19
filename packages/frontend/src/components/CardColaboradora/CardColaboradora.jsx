import React from "react";
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
          disabled
          title="Requiere sesión y mensajería (próxima entrega)"
        >
          Contactar
        </button>
      </div>
    </li>
  );
}
