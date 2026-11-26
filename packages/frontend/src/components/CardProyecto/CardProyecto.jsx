import { t } from "../../i18n/t";
import React from "react";
import PropTypes from "prop-types";
import { Button, Chip } from "@mui/material";
import {
  FiArrowRight,
  FiCheckCircle,
  FiFolder,
  FiMapPin,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import ChipEstado from "../ChipEstado/ChipEstado.jsx";
import "../Card.css";
import {
  markdownATextoPlano,
  markdownEnLineaATextoPlano,
} from "../../utils/markdown";
import { describirCompromiso, listarHabilidades } from "../../utils/perfiles";

// Card de proyecto: media → título → meta → CTA (patrón de grilla tipo marketplace).
export default function CardProyecto({ proyecto, nombreColectivo }) {
  const perfilesCompatibles =
    proyecto.coincidencia?.perfilesCompatibles ??
    proyecto.perfilesCompatibles ??
    [];
  const tieneCoincidencia = perfilesCompatibles.length > 0;
  const etiquetas = proyecto.etiquetas ?? [];
  const idTitulo = `card-proyecto-${proyecto.id}`;

  return (
    <li className="tarjeta" aria-labelledby={idTitulo}>
      <div className="tarjeta__media" aria-hidden="true">
        <FiFolder />
      </div>

      <div className="tarjeta__cuerpo">
        <div className="tarjeta__encabezado">
          <h3 id={idTitulo}>
            <Link className="tarjeta__enlace" to={`/proyectos/${proyecto.id}`}>
              {proyecto.titulo}
            </Link>
          </h3>
          {proyecto.estado && <ChipEstado estado={proyecto.estado} />}
        </div>

        {tieneCoincidencia && (
          <Chip
            className="tarjeta__chip-destacado"
            color="success"
            icon={<FiCheckCircle aria-hidden="true" />}
            label={t("comun.coincideConTuPerfil")}
          />
        )}

        {proyecto.descripcion && (
          <p className="tarjeta__descripcion">
            {markdownATextoPlano(proyecto.descripcion)}
          </p>
        )}

        {etiquetas.length > 0 && (
          <ul
            className="tarjeta__etiquetas"
            aria-label={t("tarjetas.etiquetas")}
          >
            {etiquetas.map((etiqueta) => (
              <li key={etiqueta}>
                <Chip label={etiqueta.replaceAll("_", " ")} />
              </li>
            ))}
          </ul>
        )}

        <div className="tarjeta__metas">
          {proyecto.ubicacion !== undefined && (
            <p className="tarjeta__meta">
              <FiMapPin aria-hidden="true" />
              <span>
                {proyecto.ubicacion
                  ? `${proyecto.ubicacion.nombreProvincia}${proyecto.ubicacion.ciudad ? ` · ${proyecto.ubicacion.ciudad}` : ""}`
                  : t("tarjetas.sinUbicacion")}
              </span>
            </p>
          )}
          {nombreColectivo && (
            <p className="tarjeta__meta">
              <FiUsers aria-hidden="true" />
              <span>
                {t("tarjetas.colectivo", { nombre: nombreColectivo })}
              </span>
            </p>
          )}
        </div>

        {tieneCoincidencia && (
          <div className="coincidencia">
            <h4 className="coincidencia__titulo">
              {t("comun.perfilesCompatibles")}
            </h4>
            <ul className="lista-perfiles">
              {perfilesCompatibles.map((perfil) => (
                <li key={perfil.id}>
                  <strong>
                    {markdownEnLineaATextoPlano(perfil.descripcion)}
                  </strong>{" "}
                  · {describirCompromiso(perfil.compromiso)}
                  <br />
                  {t("tarjetas.requeridasEnComun")}{" "}
                  {listarHabilidades(perfil.requeridasCoincidentes)}
                  <br />
                  {t("tarjetas.opcionalesEnComun")}{" "}
                  {listarHabilidades(perfil.opcionalesCoincidentes)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="tarjeta__acciones">
        <Button
          component={Link}
          to={`/proyectos/${proyecto.id}`}
          variant="outlined"
          endIcon={<FiArrowRight aria-hidden="true" />}
          aria-label={t("tarjetas.verProyectoTitulo", {
            titulo: proyecto.titulo,
          })}
        >
          {t("tarjetas.verProyecto")}
        </Button>
      </div>
    </li>
  );
}

CardProyecto.propTypes = {
  proyecto: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    titulo: PropTypes.string,
    descripcion: PropTypes.string,
    estado: PropTypes.string,
    etiquetas: PropTypes.arrayOf(PropTypes.string),
    ubicacion: PropTypes.shape({
      nombreProvincia: PropTypes.string,
      ciudad: PropTypes.string,
    }),
    coincidencia: PropTypes.shape({ perfilesCompatibles: PropTypes.array }),
    perfilesCompatibles: PropTypes.array,
  }).isRequired,
  nombreColectivo: PropTypes.string,
};
