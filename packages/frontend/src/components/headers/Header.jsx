import React from 'react';
import { Link } from 'react-router-dom';
import { FiCode } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.jsx';
import './Header.css';

const Header = () => {
  const { isAuthenticated, sesion, cerrarSesion } = useAuth();
  const esAdministrador = sesion?.rol === 'ADMINISTRADOR';
  const conPerfil = isAuthenticated && (sesion?.tienePerfil || esAdministrador);
  const esColectivo = sesion?.rol === 'COLECTIVO';

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
          {esAdministrador ? (
            <Link to="/administrador/destacados">Proyectos destacados</Link>
          ) : esColectivo ? (
            <>
              <Link to="/proyectos">Proyectos</Link>
              <Link to="/buscar-colaboradores">Buscar colaboradores</Link>
            </>
          ) : (
            <>
              <Link to="/mis-colaboraciones">Mis colaboraciones</Link>
              <Link to="/buscar-proyectos">Buscar proyectos</Link>
              <Link to="/mapa">Mapa</Link>
            </>
          )}
          {!esAdministrador && <Link to="/notificaciones">Notificaciones</Link>}
          <Link to="/perfil">Mi perfil</Link>
          <button onClick={cerrarSesion}>Salir</button>
        </nav>
      ) : null}
    </header>
  );
};

export default Header;
