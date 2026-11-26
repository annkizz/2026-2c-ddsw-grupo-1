import { t } from "../../i18n/t";
import React, { useState } from "react";
import PropTypes from "prop-types";
import { TextField } from "@mui/material";
import { FiAlertCircle } from "react-icons/fi";
import AccionesRegistro from "../../components/AccionesRegistro/AccionesRegistro.jsx";
import ResumenErrores from "../../components/ResumenErrores/ResumenErrores.jsx";
import CampoMarkdown from "../../components/CampoMarkdown/CampoMarkdown.jsx";

const OBLIGATORIOS = ["nombreFantasia", "usuarioGitHub", "presentacion"];

const crearCampos = () => ({
  nombreFantasia: {
    label: t("registro.nombrePublicoObligatorio"),
    placeholder: t("miPerfil.ejNombrePublico"),
    ayuda: t("registro.ayudaNombrePublico"),
    error: t("registro.ingresaUnNombrePublico"),
  },
  usuarioGitHub: {
    label: t("registro.usuarioDeGithubObligatorio"),
    placeholder: t("miPerfil.ejUsuarioGithub"),
    ayuda: t("registro.sinLaNiElEnlace"),
    error: t("registro.ingresaTuUsuarioDeGithub"),
  },
  nombre: {
    label: t("registro.nombreOpcional"),
    placeholder: t("miPerfil.ejLucia"),
  },
  apellido: {
    label: t("registro.apellidoOpcional"),
    placeholder: t("miPerfil.ejGomez"),
  },
  pronombres: {
    label: t("registro.pronombresOpcional"),
    placeholder: t("miPerfil.ejEllaElle"),
    ayuda: t("miPerfil.separalosConComas"),
  },
  presentacion: {
    label: t("registro.presentacionObligatoria"),
    placeholder: t("miPerfil.ejPresentacion"),
    ayuda: t("registro.contanosQuienSosYQue"),
    error: t("registro.escribiUnaPresentacionBreve"),
  },
});

// Paso 1 de 3: datos personales
const DatosColaboradora = ({ datos, setDatos, onVolver, onSiguiente }) => {
  const CAMPOS = crearCampos();
  const [faltantes, setFaltantes] = useState([]);
  const [intento, setIntento] = useState(0);

  const setValorDe = (campo) => (e) => {
    setDatos({ ...datos, [campo]: e.target.value });
    setFaltantes(faltantes.filter((f) => f !== campo));
  };

  const propsDe = (campo) => {
    const { label, placeholder, ayuda, error } = CAMPOS[campo];
    const conError = faltantes.includes(campo);
    return {
      id: `colaboradora-${campo}`,
      label,
      placeholder,
      value: datos[campo],
      onChange: setValorDe(campo),
      onBlur: () => {
        if (
          OBLIGATORIOS.includes(campo) &&
          datos[campo].trim() === "" &&
          intento > 0
        ) {
          setFaltantes((actual) =>
            actual.includes(campo) ? actual : [...actual, campo],
          );
        }
      },
      error: conError,
      helperText: conError ? (
        <>
          <FiAlertCircle aria-hidden="true" />
          <span>{error}</span>
        </>
      ) : (
        ayuda
      ),
      required: OBLIGATORIOS.includes(campo),
      fullWidth: true,
    };
  };

  const siguiente = (e) => {
    e.preventDefault();
    const sinCompletar = OBLIGATORIOS.filter(
      (campo) => datos[campo].trim() === "",
    );
    setFaltantes(sinCompletar);
    setIntento((n) => n + 1);
    if (sinCompletar.length === 0) onSiguiente();
  };

  return (
    <form onSubmit={siguiente} noValidate>
      <ResumenErrores
        errores={faltantes.map((campo) => ({
          campoId: `colaboradora-${campo}`,
          mensaje: CAMPOS[campo].error,
        }))}
        intento={intento}
      />
      <section className="registro-card" aria-labelledby="paso-datos-titulo">
        <h2 id="paso-datos-titulo">{t("registro.tusDatos")}</h2>
        <p className="registro-card__intro">
          {t("registro.obligatoriosIndicados")}
        </p>
        <TextField {...propsDe("nombreFantasia")} />
        <TextField {...propsDe("usuarioGitHub")} />
        <TextField {...propsDe("nombre")} />
        <TextField {...propsDe("apellido")} />
        <TextField {...propsDe("pronombres")} />
        <CampoMarkdown multiline minRows={3} {...propsDe("presentacion")} />
      </section>
      <AccionesRegistro onVolver={onVolver} />
    </form>
  );
};

DatosColaboradora.propTypes = {
  datos: PropTypes.object.isRequired,
  setDatos: PropTypes.func.isRequired,
  onVolver: PropTypes.func,
  onSiguiente: PropTypes.func.isRequired,
};

export default DatosColaboradora;
