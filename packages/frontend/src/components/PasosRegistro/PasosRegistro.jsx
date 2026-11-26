import React from "react";
import PropTypes from "prop-types";
import { FiCheck } from "react-icons/fi";
import { t } from "../../i18n/t";
import "./PasosRegistro.css";

// Indicador de progreso del registro: "Paso 2 de 3" + lista de pasos con aria-current.
const PasosRegistro = ({ pasos, actual }) => (
  <nav className="pasos-registro" aria-label={t("registro.progreso")}>
    <p className="pasos-registro__texto">
      {t("registro.pasoDe", { actual, total: pasos.length })}{" "}
      <strong>{pasos[actual - 1]}</strong>
    </p>
    <ol className="pasos-registro__lista">
      {pasos.map((nombre, indice) => {
        const numero = indice + 1;
        const estado =
          numero < actual
            ? "hecho"
            : numero === actual
              ? "actual"
              : "pendiente";
        return (
          <li
            key={nombre}
            className={`pasos-registro__paso pasos-registro__paso--${estado}`}
            aria-current={estado === "actual" ? "step" : undefined}
          >
            <span className="pasos-registro__numero" aria-hidden="true">
              {estado === "hecho" ? <FiCheck /> : numero}
            </span>
            <span className="pasos-registro__nombre">
              {nombre}
              {estado === "hecho" && (
                <span className="visualmente-oculto">
                  {" "}
                  {t("registro.completo")}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  </nav>
);

PasosRegistro.propTypes = {
  pasos: PropTypes.arrayOf(PropTypes.string).isRequired,
  actual: PropTypes.number.isRequired,
};

export default PasosRegistro;
