import React from "react";
import { Link } from "react-router-dom";
import "../Card.css";

function describirCompromiso(compromiso) {
  if (!compromiso) return "Compromiso no informado";
  const horas = compromiso.horas ?? "?";
  const frecuencia = (compromiso.tipoCompromiso ?? "").toLowerCase();
  const colaboracion = (compromiso.tipoColaboracion ?? "").toLowerCase();
  return `${horas} ${horas === 1 ? "hora" : "horas"} ${frecuencia} · colaboración ${colaboracion}`;
}

function listarHabilidades(habilidades) {
  return habilidades?.length > 0 ? habilidades.join(", ") : "ninguna";
}

export default function CardProyecto({ proyecto, nombreColectivo }) {
  const perfilesCompatibles =
    proyecto.coincidencia?.perfilesCompatibles ??
    proyecto.perfilesCompatibles ??
    [];
  const tieneCoincidencia = perfilesCompatibles.length > 0;
  const etiquetas = proyecto.etiquetas ?? [];

  return (
    <li className="tarjeta">
      <div className="tarjeta__encabezado">
        <h3>
          <Link className="tarjeta__enlace" to={`/proyectos/${proyecto.id}`}>
            {proyecto.titulo}
          </Link>
        </h3>
        {proyecto.estado && (
          <span
            className={`etiqueta-estado ${
              proyecto.estado === "FINALIZADO"
                ? "etiqueta-estado--finalizado"
                : "etiqueta-estado--activo"
            }`}
          >
            {proyecto.estado}
          </span>
        )}
      </div>

      {tieneCoincidencia && (
        <p>
          <span className="etiqueta-estado etiqueta-estado--coincide">
            Coincide con tu perfil
          </span>
        </p>
      )}

      {proyecto.descripcion && <p>{proyecto.descripcion}</p>}

      {etiquetas.length > 0 && (
        <p className="tarjeta__etiquetas">
          {etiquetas.map((etiqueta) => (
            <span key={etiqueta} className="etiqueta">
              {etiqueta.replaceAll("_", " ")}
            </span>
          ))}
        </p>
      )}

      {proyecto.ubicacion !== undefined && (
        <p className="tarjeta__meta">
          {proyecto.ubicacion
            ? `${proyecto.ubicacion.nombreProvincia}${
                proyecto.ubicacion.ciudad
                  ? ` · ${proyecto.ubicacion.ciudad}`
                  : ""
              }`
            : "Sin ubicación"}
        </p>
      )}

      {nombreColectivo && (
        <p className="tarjeta__meta">Colectivo: {nombreColectivo}</p>
      )}

      {tieneCoincidencia && (
        <div className="coincidencia">
          <p className="tarjeta__meta">
            <strong>Perfiles compatibles:</strong>
          </p>
          <ul className="lista-perfiles">
            {perfilesCompatibles.map((perfil) => (
              <li key={perfil.id}>
                <strong>{perfil.descripcion}</strong> ·{" "}
                {describirCompromiso(perfil.compromiso)}
                <br />
                Requeridas en común:{" "}
                {listarHabilidades(perfil.requeridasCoincidentes)}
                <br />
                Opcionales en común:{" "}
                {listarHabilidades(perfil.opcionalesCoincidentes)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="tarjeta__acciones">
        <Link
          className="tarjeta__ver"
          to={`/proyectos/${proyecto.id}`}
          aria-label={`Ver proyecto: ${proyecto.titulo}`}
        >
          + Ver proyecto
        </Link>
      </div>
    </li>
  );
}
