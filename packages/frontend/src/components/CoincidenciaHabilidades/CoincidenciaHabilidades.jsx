import React from "react";
import PropTypes from "prop-types";
import { FiCheck, FiX } from "react-icons/fi";
import { compararHabilidades } from "../../utils/habilidades";
import { t } from "../../i18n/t";

// Muestra las habilidades de un perfil y, si se conocen las de la persona, cuáles cumple y cuáles no.
const Lista = ({ titulo, items, conPersona }) => (
  <div className="coincidencias__grupo">
    <p className="perfil-buscado__etiqueta">{titulo}</p>
    {items.length === 0 ? (
      <p className="texto-secundario">{t("coincidencias.ninguna")}</p>
    ) : (
      <ul className="coincidencias__lista">
        {items.map(({ nombre, cumple }) => (
          <li
            key={nombre}
            className={`hab-match${conPersona ? (cumple ? " hab-match--si" : " hab-match--no") : ""}`}
          >
            {conPersona &&
              (cumple ? (
                <FiCheck aria-hidden="true" />
              ) : (
                <FiX aria-hidden="true" />
              ))}
            <span className="hab-match__texto">{nombre}</span>
            {conPersona && (
              <span className="visualmente-oculto">
                {" "}
                {cumple ? t("coincidencias.cumple") : t("coincidencias.falta")}
              </span>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
);

Lista.propTypes = {
  titulo: PropTypes.node.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({ nombre: PropTypes.string, cumple: PropTypes.bool }),
  ).isRequired,
  conPersona: PropTypes.bool,
};

const CoincidenciaHabilidades = ({
  perfil,
  habilidadesPersona,
  sujeto = "persona",
  className = "",
}) => {
  const conPersona = Array.isArray(habilidadesPersona);
  const comparacion = compararHabilidades(
    perfil,
    conPersona ? habilidadesPersona : [],
  );
  const resumen = conPersona
    ? t(
        sujeto === "vos"
          ? "coincidencias.resumenVos"
          : "coincidencias.resumenPersona",
        {
          cumple: comparacion.cumpleRequeridas,
          total: comparacion.totalRequeridas,
          opcionales: comparacion.cumpleOpcionales,
          totalOpcionales: comparacion.totalOpcionales,
        },
      )
    : null;

  return (
    <div className={`coincidencias ${className}`.trim()}>
      {resumen && <p className="coincidencias__resumen">{resumen}</p>}
      <Lista
        titulo={t("detalleProyecto.habilidadesRequeridas")}
        items={comparacion.requeridas}
        conPersona={conPersona}
      />
      <Lista
        titulo={t("detalleProyecto.habilidadesOpcionales")}
        items={comparacion.opcionales}
        conPersona={conPersona}
      />
    </div>
  );
};

CoincidenciaHabilidades.propTypes = {
  perfil: PropTypes.shape({
    habilidadesRequeridas: PropTypes.array,
    habilidadesOpcionales: PropTypes.array,
  }),
  // undefined/null: no se conocen las habilidades de la persona (solo se listan las del perfil)
  habilidadesPersona: PropTypes.array,
  sujeto: PropTypes.oneOf(["vos", "persona"]),
  className: PropTypes.string,
};

export default CoincidenciaHabilidades;
