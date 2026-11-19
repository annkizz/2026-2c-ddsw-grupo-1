import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, CircularProgress } from '@mui/material';
import { FiArrowRight, FiCode, FiRepeat, FiUsers } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.jsx';
import TipoCuenta from '../registro/TipoCuenta.jsx';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { cargando, sesion, errorLogto, iniciarSesion, registrarse } = useAuth();
  const [eligiendoTipo, setEligiendoTipo] = useState(false);

  // Cada rol autenticado entra directamente a su espacio principal.
  useEffect(() => {
    if (sesion?.rol === 'ADMINISTRADOR') {
      navigate('/administrador/destacados', { replace: true });
    } else if (sesion?.tienePerfil) {
      const destino =
        sesion.rol === 'COLABORADOR' ? '/mis-colaboraciones' : '/perfil';
      navigate(destino, { replace: true });
    }
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
          disabled={cargando && !errorLogto}
          startIcon={cargando && !errorLogto ? <CircularProgress size={18} color="inherit" /> : null}
          endIcon={cargando && !errorLogto ? null : <FiArrowRight />}
        >
          {cargando && !errorLogto ? 'Ingresando…' : 'Ingresar'}
        </Button>
        {errorLogto && (
          <Alert severity="error" sx={{ marginTop: 2 }}>
            No pudimos abrir el inicio de sesión de Logto: {errorLogto.message}
          </Alert>
        )}
        <p className="home-cambio">
          ¿Primera vez acá?
          <button onClick={() => setEligiendoTipo(true)}>Crear una cuenta</button>
        </p>
      </section>

      {eligiendoTipo && (
        <TipoCuenta
          onCerrar={() => setEligiendoTipo(false)}
          onElegir={() => registrarse()}
        />
      )}
    </div>
  );
};

export default Home;
