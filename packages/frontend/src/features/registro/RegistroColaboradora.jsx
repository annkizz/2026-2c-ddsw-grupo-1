import { t } from "../../i18n/t";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.jsx";
import { crearColaboradora } from "../../service/colaboradorasService";
import { mensajeDeError } from "../../utils/mensajeDeError";
import EncabezadoPagina from "../../components/EncabezadoPagina/EncabezadoPagina.jsx";
import PasosRegistro from "../../components/PasosRegistro/PasosRegistro.jsx";
import { borrarTipo } from "./tipoElegido";
import DatosColaboradora from "./DatosColaboradora.jsx";
import Habilidades from "./Habilidades.jsx";
import MediosDeContacto from "./MediosDeContacto.jsx";
import "./Registro.css";

const DATOS_INICIALES = {
  nombreFantasia: "",
  usuarioGitHub: "",
  nombre: "",
  apellido: "",
  pronombres: "",
  presentacion: "",
  habilidades: [],
  medios: [],
  aceptaMensajeria: false,
};

// Los 3 pasos comparten los datos: acá viven, y cada paso los recibe por props.
// Recién al terminar el último paso se hace un solo POST /colaboradoras.
const RegistroColaboradora = () => {
  const navigate = useNavigate();
  const { getAccessToken, recargarSesion } = useAuth();
  const [paso, setPaso] = useState(1);
  const [datos, setDatos] = useState(DATOS_INICIALES);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [registroCreado, setRegistroCreado] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      if (!registroCreado) {
        const token = await getAccessToken();
        await crearColaboradora(token, datos);
        setRegistroCreado(true);
      }

      const nuevaSesion = await recargarSesion();
      if (!nuevaSesion?.tienePerfil) {
        setError(t("registro.verificarPerfil"));
        return;
      }

      borrarTipo();
      navigate("/", { replace: true });
    } catch (e) {
      setError(mensajeDeError(e, t("registro.noPudimosCrearTuPerfil")));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="contenedor-pagina contenedor-pagina--formulario registro">
      <EncabezadoPagina
        titulo={t("registro.crearTuPerfilDeColaboradora")}
        subtitulo={t("registro.conEstosDatosLosColectivos")}
      >
        <PasosRegistro
          pasos={[
            t("registro.tusDatos"),
            t("registro.habilidades"),
            t("registro.contacto"),
          ]}
          actual={paso}
        />
      </EncabezadoPagina>
      {paso === 1 && (
        <DatosColaboradora
          datos={datos}
          setDatos={setDatos}
          onVolver={() => {
            borrarTipo();
            navigate("/");
          }}
          onSiguiente={() => setPaso(2)}
        />
      )}
      {paso === 2 && (
        <Habilidades
          datos={datos}
          setDatos={setDatos}
          onVolver={() => setPaso(1)}
          onSiguiente={() => setPaso(3)}
        />
      )}
      {paso === 3 && (
        <MediosDeContacto
          datos={datos}
          setDatos={setDatos}
          onVolver={() => setPaso(2)}
          onSiguiente={guardar}
          siguiente={
            registroCreado
              ? t("registro.verificarRegistro")
              : t("registro.crearMiPerfil")
          }
          guardando={guardando}
          error={error}
        />
      )}
    </div>
  );
};

export default RegistroColaboradora;
