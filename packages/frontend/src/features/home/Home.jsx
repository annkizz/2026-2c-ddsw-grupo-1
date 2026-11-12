import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, CircularProgress } from '@mui/material';
import { FiArrowRight, FiCode, FiRepeat, FiUsers } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.jsx';
import TipoCuenta from '../registro/TipoCuenta.jsx';
import { leerTipo, rutaDeRegistro } from '../registro/tipoElegido';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { cargando, sesion, iniciarSesion, registrarse } = useAuth();
  const [eligiendoTipo, setEligiendoTipo] = useState(false);

  // Si ya hay sesión: con perfil va a su perfil; sin perfil sigue el registro
  useEffect(() => {
    if (!sesion) return;
    navigate(sesion.tienePerfil ? '/perfil' : rutaDeRegistro(leerTipo()), { replace: true });
  }, [sesion, navigate]);

  return (
    <div className="home">
      <section className="home-hero">
        <p className="home-eyebrow">Tecnología con propósito</p>
        <h1>El código es mejor cuando nos conecta.</h1>
        <p className="home-lead">Unimos a colectivos que necesitan software con personas que quieren colaborar.</p>
        <div className="home-pares">
          <span><FiCode /> Personas</span>
          <FiRepeat />
          <span><FiUsers /> Colectivos</span>
        </div>
        <small>Software compartido. Impacto colectivo.</small>
      </section>

      <section className="home-login">
        <h2>Iniciar sesión</h2>
        <p className="home-sub">Qué bueno encontrarte de nuevo.</p>
        {/* El email y la contraseña se piden en la pantalla de Logto */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={iniciarSesion}
          disabled={cargando}
          startIcon={cargando ? <CircularProgress size={18} color="inherit" /> : null}
          endIcon={cargando ? null : <FiArrowRight />}
        >
          {cargando ? 'Ingresando…' : 'Ingresar'}
        </Button>
        <p className="home-cambio">
          ¿Primera vez acá?
          <button onClick={() => setEligiendoTipo(true)}>Crear una cuenta</button>
        </p>
      </section>

      {eligiendoTipo && (
        <TipoCuenta
          onCerrar={() => setEligiendoTipo(false)}
          onElegir={() => registrarse()} // el tipo ya quedó guardado; al volver de Logto seguimos el registro
        />
      )}
    </div>
  );
};

export default Home;
