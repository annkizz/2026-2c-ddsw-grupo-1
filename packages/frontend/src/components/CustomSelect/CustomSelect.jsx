import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { IconButton, InputBase } from "@mui/material";
import { FiAlertCircle, FiCheck, FiChevronDown, FiX } from "react-icons/fi";
import { ETIQUETA_MAX, etiquetaLegible, normalizarEtiqueta } from "../../utils/etiquetas";
import { t } from "../../i18n/t";
import "./CustomSelect.css";

function normalizarTexto(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizarOpcion(opcion) {
  if (typeof opcion === "string") {
    return { valor: opcion, etiqueta: opcion };
  }
  return opcion;
}

export default function CustomSelect({
  id,
  etiqueta,
  opciones = [],
  seleccion = [],
  multiple = false,
  onSeleccionar,
  onQuitar,
  placeholder = t('selector.buscar'),
  textoVacio = t('selector.sinOpciones'),
  permiteCrear = false,
  maxSeleccion = Infinity,
  textoCrear = t('selector.crearEtiqueta'),
  className = "",
  ayuda,
  error,
}) {
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [creadas, setCreadas] = useState({});

  const opcionesNormalizadas = useMemo(
    () => opciones.map(normalizarOpcion),
    [opciones],
  );

  const alcanzoMaximo = seleccion.length >= maxSeleccion;
  const puedeQuitar = Boolean(onQuitar) || multiple;

  const seleccionadas = useMemo(
    () =>
      seleccion.filter((valor) => valor !== "" && valor != null).map(
        (valor) =>
          opcionesNormalizadas.find((opcion) => opcion.valor === valor) ?? {
            valor,
            etiqueta: creadas[valor] ?? etiquetaLegible(valor),
          },
      ),
    [creadas, opcionesNormalizadas, seleccion],
  );

  const filtradas = useMemo(() => {
    const texto = normalizarTexto(consulta.trim());
    if (texto === "") return opcionesNormalizadas;

    return opcionesNormalizadas.filter((opcion) =>
      normalizarTexto(`${opcion.etiqueta} ${opcion.secundario ?? ""}`).includes(
        texto,
      ),
    );
  }, [consulta, opcionesNormalizadas]);

  const codigoNuevo = useMemo(
    () => (permiteCrear ? normalizarEtiqueta(consulta) : ""),
    [consulta, permiteCrear],
  );
  //x si no existe 
  const opcionNueva = useMemo(() => {
    const texto = consulta.trim();
    if (!permiteCrear || texto === "" || codigoNuevo === "") return null;
    if (codigoNuevo.length > ETIQUETA_MAX || alcanzoMaximo) return null;

    const yaExiste = opcionesNormalizadas.some(
      (opcion) =>
        opcion.valor === codigoNuevo ||
        normalizarEtiqueta(opcion.etiqueta) === codigoNuevo,
    );
    if (yaExiste || seleccion.includes(codigoNuevo)) return null;

    return {
      valor: codigoNuevo,
      etiqueta: texto,
      esNueva: true,
    };
  }, [
    alcanzoMaximo,
    codigoNuevo,
    consulta,
    opcionesNormalizadas,
    permiteCrear,
    seleccion,
  ]);


  const opcionCoincidente = useMemo(() => {
    if (consulta.trim() === "" || codigoNuevo === "") return null;
    if (filtradas.some((opcion) => opcion.valor === codigoNuevo)) return null;

    return (
      opcionesNormalizadas.find(
        (opcion) =>
          opcion.valor === codigoNuevo ||
          normalizarEtiqueta(opcion.etiqueta) === codigoNuevo,
      ) ?? null
    );
  }, [codigoNuevo, consulta, filtradas, opcionesNormalizadas]);

  const visibles = useMemo(() => {
    if (opcionNueva) return [...filtradas, opcionNueva];
    if (opcionCoincidente) return [...filtradas, opcionCoincidente];
    return filtradas;
  }, [filtradas, opcionCoincidente, opcionNueva]);

  const seleccionar = (opcion) => {
    if (!opcion) return;
    if (!seleccion.includes(opcion.valor) && alcanzoMaximo) return;

    if (opcion.esNueva) {
      setCreadas((actual) => ({ ...actual, [opcion.valor]: opcion.etiqueta }));
    }
    onSeleccionar?.(opcion.valor);
    setConsulta("");
    setIndiceActivo(0);
    // La lista se cierra al elegir (también en selección múltiple): así se puede seguir con el
    // formulario sin tener que hacer clic afuera. Se vuelve a abrir al escribir, con ↓ o con un clic.
    setAbierto(false);
  };

  const alCambiarTexto = (evento) => {
    setConsulta(evento.target.value);
    setIndiceActivo(0);
    setAbierto(true);
  };

  const alPresionarTecla = (evento) => {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setAbierto(true);
      setIndiceActivo((actual) =>
        Math.min(actual + 1, Math.max(visibles.length - 1, 0)),
      );
      return;
    }

    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setAbierto(true);
      setIndiceActivo((actual) => Math.max(actual - 1, 0));
      return;
    }

    if (evento.key === "Enter") {
      if (!abierto) {
        setAbierto(true);
        return;
      }
      evento.preventDefault();
      seleccionar(visibles[indiceActivo]);
      return;
    }

    if (evento.key === "Escape") {
      setAbierto(false);
    }
  };

  const alPerderFoco = (evento) => {
    if (!evento.currentTarget.contains(evento.relatedTarget)) {
      setAbierto(false);
    }
  };

  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const describidoPor = [idError, idAyuda].filter(Boolean).join(" ") || undefined;

  return (
    <div
      className={["selector", error ? "selector--error" : "", className].filter(Boolean).join(" ")}
      onBlur={alPerderFoco}
    >
      <label className="selector__label" htmlFor={id}>
        {etiqueta}
      </label>

      <div className={`selector__caja${abierto ? " selector__caja--abierto" : ""}`}>
        <InputBase
          className="selector__input"
          value={consulta}
          placeholder={placeholder}
          onChange={alCambiarTexto}
          onFocus={() => setAbierto(true)}
          onClick={() => setAbierto(true)}
          onKeyDown={alPresionarTecla}
          inputProps={{
            id,
            type: "text",
            role: "combobox",
            "aria-autocomplete": "list",
            "aria-expanded": abierto,
            "aria-controls": `${id}-lista`,
            "aria-activedescendant":
              abierto && visibles[indiceActivo] ? `${id}-opcion-${indiceActivo}` : undefined,
            "aria-invalid": error ? true : undefined,
            "aria-describedby": describidoPor,
            autoComplete: "off",
          }}
        />
        <FiChevronDown className="selector__flecha" aria-hidden="true" />
      </div>

      {error && (
        <p className="selector__error" id={idError}>
          <FiAlertCircle aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {ayuda && (
        <p className="selector__ayuda" id={idAyuda}>
          {ayuda}
        </p>
      )}

      {seleccionadas.length > 0 && (
        <ul className="selector__seleccion" aria-live="polite" aria-label={t('selector.elegidasEn', { campo: typeof etiqueta === "string" ? etiqueta : t('selector.esteCampo') })}>
          {seleccionadas.map((opcion) => (
            <li key={opcion.valor} className="selector__seleccionada">
              <span>{opcion.etiqueta}</span>
              {puedeQuitar && (
                <IconButton
                  type="button"
                  className="selector__quitar"
                  aria-label={t('selector.quitar', { opcion: opcion.etiqueta })}
                  onClick={() => (onQuitar ?? onSeleccionar)?.(opcion.valor)}
                >
                  <FiX aria-hidden="true" />
                </IconButton>
              )}
            </li>
          ))}
        </ul>
      )}

      {abierto && (
        <ul
          className="selector__lista"
          id={`${id}-lista`}
          role="listbox"
          aria-multiselectable={multiple || undefined}
        >
          {visibles.length === 0 ? (
            <li className="selector__vacio">
              {alcanzoMaximo && permiteCrear ? t('selector.maximo', { cantidad: maxSeleccion }) : textoVacio}
            </li>
          ) : (
            visibles.map((opcion, indice) => {
              const activa = seleccion.includes(opcion.valor);
              return (
                <li
                  key={opcion.valor}
                  id={`${id}-opcion-${indice}`}
                  role="option"
                  aria-selected={activa}
                  className={`selector__opcion${indice === indiceActivo ? " selector__opcion--activa" : ""}${
                    activa ? " selector__opcion--elegida" : ""
                  }${opcion.esNueva ? " selector__opcion--nueva" : ""}`}
                  onMouseDown={(evento) => evento.preventDefault()}
                  onClick={() => seleccionar(opcion)}
                >
                  {opcion.esNueva ? (
                    <span>
                      {textoCrear} “{opcion.etiqueta}”
                    </span>
                  ) : (
                    <>
                      <span>{opcion.etiqueta}</span>
                      {opcion.secundario && <span className="selector__secundario">{opcion.secundario}</span>}
                    </>
                  )}
                  {activa && <FiCheck className="selector__tilde" aria-hidden="true" />}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

CustomSelect.propTypes = {
  id: PropTypes.string.isRequired,
  etiqueta: PropTypes.node.isRequired,
  opciones: PropTypes.array,
  seleccion: PropTypes.array,
  multiple: PropTypes.bool,
  onSeleccionar: PropTypes.func,
  onQuitar: PropTypes.func,
  placeholder: PropTypes.string,
  textoVacio: PropTypes.node,
  permiteCrear: PropTypes.bool,
  maxSeleccion: PropTypes.number,
  textoCrear: PropTypes.string,
  className: PropTypes.string,
  ayuda: PropTypes.node,
  error: PropTypes.node,
};
