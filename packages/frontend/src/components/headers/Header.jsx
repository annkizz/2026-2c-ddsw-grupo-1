import { Link } from 'react-router-dom';
import { FiCode, FiHelpCircle } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.jsx';
import './Header.css';

const Header = () => {
  const { isAuthenticated, sesion, cerrarSesion } = useAuth();
  const conPerfil = isAuthenticated && sesion?.tienePerfil;

  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <span className="header-logo-mark">
          <FiCode />
        </span>
        <span className="header-logo-texto">Código a Voluntad</span>
      </Link>

      {conPerfil ? (
        <nav className="header-nav">
          <Link to="/proyectos">Proyectos</Link>
          <Link to="/notificaciones">Notificaciones</Link>
          <Link to="/perfil">Mi perfil</Link>
          <button onClick={cerrarSesion}>Salir</button>
        </nav>
      ) : (
        <a className="header-ayuda" href="#ayuda">
          <FiHelpCircle />
          <span>¿Necesitás ayuda?</span>
        </a>
      )}
    </header>
  );
};

export default Header;
