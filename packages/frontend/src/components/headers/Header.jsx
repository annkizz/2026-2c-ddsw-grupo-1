import { useState } from 'react';
import { Button, Drawer, IconButton } from '@mui/material';
import { FiBell, FiCode, FiHelpCircle, FiMenu, FiUser, FiX } from 'react-icons/fi';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import './Header.css';

const Header = () => {
  const { isAuthenticated, sesion, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const conPerfil = isAuthenticated && sesion?.tienePerfil;
  const esColectivo = sesion?.rol === 'COLECTIVO';
  const esColaboradora = sesion?.rol === 'COLABORADOR';

  const enlaces = esColectivo || esColaboradora
    ? [
        { to: '/notificaciones', texto: 'Notificaciones', icono: <FiBell aria-hidden="true" /> },
        { to: '/perfil', texto: 'Mi perfil', icono: <FiUser aria-hidden="true" /> }
      ]
    : [
        { to: '/proyectos', texto: 'Proyectos' },
        { to: '/buscar-proyectos', texto: 'Buscar proyectos' },
        { to: '/mapa', texto: 'Mapa' },
        { to: '/notificaciones', texto: 'Notificaciones' },
        { to: '/perfil', texto: 'Mi perfil' }
      ];

  const cerrarMenu = () => setMenuAbierto(false);
  const salir = () => {
    cerrarMenu();
    cerrarSesion();
  };
  const renderEnlaces = () =>
    enlaces.map(({ to, texto, icono }) => (
      <NavLink
        key={to}
        to={to}
        onClick={cerrarMenu}
        className={({ isActive }) => `header-nav-link${isActive ? ' activo' : ''}`}
      >
        {icono}
        {texto}
      </NavLink>
    ));

  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <span className="header-logo-mark">
          <FiCode aria-hidden="true" />
        </span>
        <span className="header-logo-texto">Código a Voluntad</span>
      </Link>

      {conPerfil ? (
        <nav className="header-nav header-nav--desktop" aria-label="Navegación principal">
          {renderEnlaces()}
          <Button className="header-nav-salir" variant="text" onClick={cerrarSesion}>
            Salir
          </Button>
        </nav>
      ) : (
        <a className="header-ayuda header-ayuda--desktop" href="#ayuda">
          <FiHelpCircle aria-hidden="true" />
          <span>¿Necesitás ayuda?</span>
        </a>
      )}

      <IconButton
        className="header-menu-toggle"
        aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={menuAbierto}
        aria-controls={menuAbierto ? 'header-navegacion-movil' : undefined}
        onClick={() => setMenuAbierto((abierto) => !abierto)}
      >
        {menuAbierto ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
      </IconButton>

      <Drawer
        anchor="right"
        open={menuAbierto}
        onClose={cerrarMenu}
        classes={{ paper: 'header-drawer-paper' }}
        slotProps={{ paper: { 'aria-labelledby': 'header-menu-titulo' } }}
        sx={{ zIndex: 'var(--z-drawer)' }}
      >
        <div className="header-drawer">
          <div className="header-drawer-encabezado">
            <h2 id="header-menu-titulo">Menú</h2>
            <IconButton aria-label="Cerrar menú" onClick={cerrarMenu}>
              <FiX aria-hidden="true" />
            </IconButton>
          </div>
          <nav
            id="header-navegacion-movil"
            className="header-nav header-nav--mobile"
            aria-label="Navegación principal"
          >
            {conPerfil ? (
              <>
                {renderEnlaces()}
                <Button className="header-nav-salir" variant="text" onClick={salir}>
                  Salir
                </Button>
              </>
            ) : (
              <a className="header-nav-link header-ayuda-movil" href="#ayuda" onClick={cerrarMenu}>
                <FiHelpCircle aria-hidden="true" />
                <span>¿Necesitás ayuda?</span>
              </a>
            )}
          </nav>
        </div>
      </Drawer>
    </header>
  );
};

export default Header;
