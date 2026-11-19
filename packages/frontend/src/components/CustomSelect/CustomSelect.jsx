import React, { useMemo, useState } from "react";
import { ETIQUETA_MAX, etiquetaLegible, normalizarEtiqueta } from "../../utils/etiquetas";
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
  placeholder = "Buscar...",
  textoVacio = "No hay opciones para mostrar.",
  permiteCrear = false,
  maxSeleccion = Infinity,
  textoCrear = "Crear etiqueta",
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
      seleccion.map(
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
    if (!multiple) setAbierto(false);
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

  return (
    <div className="selector" onBlur={alPerderFoco}>
      <label className="selector__label" htmlFor={id}>
        {etiqueta}
      </label>

      <div
        className={`selector__caja${abierto ? " selector__caja--abierto" : ""}`}
      >
        <input
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={abierto}
          aria-controls={`${id}-lista`}
          aria-activedescendant={
            abierto && visibles[indiceActivo]
              ? `${id}-opcion-${indiceActivo}`
              : undefined
          }
          autoComplete="off"
          value={consulta}
          placeholder={placeholder}
          onChange={alCambiarTexto}
          onFocus={() => setAbierto(true)}
          onKeyDown={alPresionarTecla}
        />
        <span className="selector__flecha" aria-hidden="true">
          ▾
        </span>
      </div>

      {seleccionadas.length > 0 && (
        <div className="selector__seleccion" aria-live="polite">
          {seleccionadas.map((opcion) => (
            <span className="selector__seleccionada" key={opcion.valor}>
              {opcion.etiqueta}
              {puedeQuitar && (
                <button
                  type="button"
                  className="selector__quitar"
                  aria-label={`Quitar ${opcion.etiqueta}`}
                  onClick={() => (onQuitar ?? onSeleccionar)?.(opcion.valor)}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
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
              {alcanzoMaximo && permiteCrear
                ? `Llegaste al máximo de ${maxSeleccion} etiquetas.`
                : textoVacio}
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
                  className={`selector__opcion${
                    indice === indiceActivo ? " selector__opcion--activa" : ""
                  }${activa ? " selector__opcion--elegida" : ""}${
                    opcion.esNueva ? " selector__opcion--nueva" : ""
                  }`}
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
                      {opcion.secundario && (
                        <span className="selector__secundario">
                          {opcion.secundario}
                        </span>
                      )}
                    </>
                  )}
                  {activa && (
                    <span className="selector__tilde" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
