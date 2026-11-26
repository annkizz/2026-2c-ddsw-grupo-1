import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  obtenerColectivoPorId,
  TIPOS_COLECTIVO,
} from "../../service/colectivosService";
import { obtenerProyectos } from "../../service/proyectosService";
import CardProyecto from "../../components/CardProyecto/CardProyecto";
import "../../components/Card.css";
import { etiquetaLegible } from "../../utils/etiquetas";
import PerfilPublicoVista from "../perfil/PerfilPublicoVista.jsx";
import { t } from "../../i18n/t";

const PerfilColectivo = () => {
  const { id } = useParams();
  const [colectivo, setColectivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);
    obtenerColectivoPorId(id)
      .then((perfil) => {
        if (vigente) setColectivo(perfil);
      })
      .catch((fallo) => {
        if (vigente) setError(fallo);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [id, intento]);

  // Proyectos activos del colectivo: aprovechan el ancho y dan contexto a quien llega desde un proyecto.
  const [proyectos, setProyectos] = useState([]);
  useEffect(() => {
    let vigente = true;
    obtenerProyectos({ idColectivo: id, estado: "ACTIVO" })
      .then((datos) => {
        const lista = Array.isArray(datos)
          ? datos
          : (datos?.proyectos ?? datos?.items ?? []);
        if (vigente)
          setProyectos(
            lista.filter(
              (proyecto) =>
                String(proyecto.idColectivo ?? id) === String(id) &&
                proyecto.estado !== "FINALIZADO",
            ),
          );
      })
      .catch(() => {
        if (vigente) setProyectos([]);
      });
    return () => {
      vigente = false;
    };
  }, [id]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  const tipo = TIPOS_COLECTIVO.find(
    (opcion) => opcion.valor === colectivo?.tipoDeColectivo,
  );
  const ubicacion = [
    colectivo?.ubicacion?.ciudad,
    colectivo?.ubicacion?.provincia,
    colectivo?.ubicacion?.pais,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <PerfilPublicoVista
      tipo={t("perfilPublico.colectivo")}
      esColectivo
      cargando={cargando}
      error={error}
      encontrado={Boolean(colectivo)}
      onReintentar={reintentar}
      titulo={colectivo?.nombre}
      datos={[
        tipo ? t(tipo.textoKey) : null,
        ubicacion || null,
        colectivo?.descripcion || null,
      ]}
      seccionTitulo={t("miPerfil.habilidadesYAreas")}
      chips={(colectivo?.etiquetas ?? []).map(etiquetaLegible)}
      textoSinChips={t("perfilPublico.sinAreas")}
    >
      {proyectos.length > 0 && (
        <section
          className="perfil-publico__proyectos"
          aria-labelledby="perfil-colectivo-proyectos"
        >
          <h2 id="perfil-colectivo-proyectos">
            {t("perfilPublico.proyectosActivos", {
              cantidad: proyectos.length,
            })}
          </h2>
          <ul className="tarjetas">
            {proyectos.map((proyecto) => (
              <CardProyecto
                key={proyecto.id}
                proyecto={proyecto}
                nombreColectivo={colectivo?.nombre}
              />
            ))}
          </ul>
        </section>
      )}
    </PerfilPublicoVista>
  );
};

export default PerfilColectivo;
