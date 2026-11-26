import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, CircularProgress, LinearProgress } from "@mui/material";
import { FiArrowRight, FiInfo, FiUserMinus } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth.jsx";
import { obtenerMisColaboraciones } from "../../service/colaboradorasService";
import { mensajeDeError } from "../../service/api";
import { formatearFecha } from "../../utils/fechas";
import { t } from "../../i18n/t";
import DialogoBajaColaboracion from "../../components/DialogoBajaColaboracion/DialogoBajaColaboracion.jsx";
import "./MisColaboraciones.css";
import { markdownATextoPlano } from "../../utils/markdown";

const MisColaboraciones = () => {
  const { getAccessToken, sesion } = useAuth();
  const navigate = useNavigate();
  const [colaboraciones, setColaboraciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [bajaSeleccionada, setBajaSeleccionada] = useState(null);
  const [avisoBaja, setAvisoBaja] = useState("");

  const cargarColaboraciones = useCallback(async () => {
    setCargando(true);
    setErrorCarga("");
    try {
      const token = await getAccessToken();
      const resultado = await obtenerMisColaboraciones(token);
      setColaboraciones(
        resultado.filter(({ proyecto }) => proyecto.estado === "ACTIVO"),
      );
    } catch (error) {
      setErrorCarga(mensajeDeError(error));
    } finally {
      setCargando(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    cargarColaboraciones();
  }, [cargarColaboraciones]);

  return (
    <section className="mis-colaboraciones">
      <header className="mis-colaboraciones-intro">
        <div>
          <h1>{t("misColaboraciones.titulo")}</h1>
        </div>
      </header>

      {avisoBaja && (
        <Alert severity="success" role="status">
          {avisoBaja}
        </Alert>
      )}
      {cargando ? (
        <div className="mis-colaboraciones-estado" role="status">
          <CircularProgress />
          <p>{t("misColaboraciones.cargando")}</p>
        </div>
      ) : errorCarga ? (
        <div className="mis-colaboraciones-estado">
          <Alert severity="error">{errorCarga}</Alert>
          <Button variant="outlined" onClick={cargarColaboraciones}>
            {t("misColaboraciones.reintentar")}
          </Button>
        </div>
      ) : colaboraciones.length === 0 ? (
        <div className="mis-colaboraciones-vacio">
          <FiInfo size={28} aria-hidden="true" />
          <h2>{t("misColaboraciones.vacioTitulo")}</h2>
          <p>{t("misColaboraciones.vacioDescripcion")}</p>
          <Button
            variant="contained"
            endIcon={<FiArrowRight />}
            onClick={() => navigate("/buscar-proyectos")}
          >
            {t("misColaboraciones.buscarProyectos")}
          </Button>
        </div>
      ) : (
        <>
          <p className="mis-colaboraciones-conteo" aria-live="polite">
            {colaboraciones.length === 1
              ? t("misColaboraciones.unaColaboracion")
              : t("misColaboraciones.variasColaboraciones", {
                  cantidad: colaboraciones.length,
                })}
          </p>
          <div className="mis-colaboraciones-grid">
            {colaboraciones.map(({ idProyecto, fecha, proyecto }) => {
              const avance = Math.min(
                100,
                Math.max(0, Number(proyecto.porcentajeConcrecion) || 0),
              );
              return (
                <article
                  key={idProyecto}
                  className="mis-colaboraciones-card"
                  aria-labelledby={`colaboracion-${idProyecto}`}
                >
                  <span className="mis-colaboraciones-badge activo">
                    <FiInfo />
                    {t("proyectos.activo")}
                  </span>
                  <h2 id={`colaboracion-${idProyecto}`}>{proyecto.titulo}</h2>
                  <p className="mis-colaboraciones-descripcion">
                    {markdownATextoPlano(proyecto.descripcion)}
                  </p>
                  <div className="mis-colaboraciones-avance">
                    <div>
                      <span>{t("misColaboraciones.avance")}</span>
                      <strong>{avance} %</strong>
                    </div>
                    <LinearProgress
                      variant="determinate"
                      value={avance}
                      aria-label={t("misColaboraciones.avance")}
                    />
                  </div>
                  <p className="mis-colaboraciones-fecha">
                    {formatearFecha(fecha)
                      ? t("misColaboraciones.participandoDesde", {
                          fecha: formatearFecha(fecha),
                        })
                      : t("misColaboraciones.sinFecha")}
                  </p>
                  <div className="mis-colaboraciones-acciones">
                    <Button
                      variant="outlined"
                      endIcon={<FiArrowRight />}
                      onClick={() =>
                        navigate(`/proyectos/${idProyecto}`, {
                          state: { volverA: "/mis-colaboraciones" },
                        })
                      }
                    >
                      {t("misColaboraciones.verDetalle")}
                    </Button>
                    <Button
                      color="error"
                      startIcon={<FiUserMinus aria-hidden="true" />}
                      disabled={!sesion?.idColaborador}
                      onClick={() => {
                        setAvisoBaja("");
                        setBajaSeleccionada({
                          idProyecto,
                          idColaborador: sesion.idColaborador,
                          nombre: proyecto.titulo,
                        });
                      }}
                    >
                      {t("bajaColaboracion.confirmarPropia")}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
      <DialogoBajaColaboracion
        propia
        seleccion={bajaSeleccionada}
        onCerrar={() => setBajaSeleccionada(null)}
        onConfirmada={({ idProyecto }) => {
          setColaboraciones((actuales) =>
            actuales.filter((item) => item.idProyecto !== idProyecto),
          );
          setAvisoBaja(t("bajaColaboracion.exitoPropia"));
        }}
      />
    </section>
  );
};

export default MisColaboraciones;
