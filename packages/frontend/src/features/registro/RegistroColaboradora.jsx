import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { crearColaboradora } from '../../service/colaboradorasService';
import { mensajeDeError } from '../../service/api';
import { borrarTipo } from './tipoElegido';
import DatosColaboradora from './DatosColaboradora.jsx';
import Habilidades from './Habilidades.jsx';
import MediosDeContacto from './MediosDeContacto.jsx';
import './Registro.css';

const DATOS_INICIALES = {
  nombreFantasia: '',
  usuarioGitHub: '',
  nombre: '',
  apellido: '',
  pronombres: '',
  presentacion: '',
  habilidades: [],
  medios: [],
  aceptaMensajeria: false
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

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      const token = await getAccessToken();
      await crearColaboradora(token, datos);
      await recargarSesion();
      borrarTipo();
      navigate('/registro/listo');
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="registro">
      <h1>Registrar Colaboradora</h1>
      {paso === 1 && (
        <DatosColaboradora
          datos={datos}
          setDatos={setDatos}
          onVolver={() => navigate('/registro/tipo')}
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
          guardando={guardando}
          error={error}
        />
      )}
    </div>
  );
};

export default RegistroColaboradora;
