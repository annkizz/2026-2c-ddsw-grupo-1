import React, { useState } from 'react';
import { Button, Drawer, IconButton } from '@mui/material';
import { FiBell, FiHelpCircle, FiHome, FiLogOut, FiMenu, FiUser, FiX } from 'react-icons/fi';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import BotonModoDaltonico from '../BotonModoDaltonico/BotonModoDaltonico.jsx';
import { t } from '../../i18n/t';
import './Header.css';

import { RUTA_AYUDA, irAAyuda } from '../../utils/rutasUI';

const Header = () => {
  const { isAuthenticated, sesion, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const conPerfil = isAuthenticated && sesion?.tienePerfil;
  const esColectivo = sesion?.rol === 'COLECTIVO';
  const esColaboradora = sesion?.rol === 'COLABORADOR';

  // Las funciones de cada rol se ofrecen desde el panel de Inicio (a 1 clic);
  // el header deja lo transversal: Inicio, Notificaciones y Mi perfil.
  const enlaces =
    esColectivo || esColaboradora
      ? [
          { to: '/', texto: t('navegacion.inicio'), icono: <FiHome aria-hidden="true" />, exacto: true },
          { to: '/notificaciones', texto: t('navegacion.notificaciones'), icono: <FiBell aria-hidden="true" /> },
          { to: '/perfil', texto: t('navegacion.miPerfil'), icono: <FiUser aria-hidden="true" /> }
        ]
      : [
          { to: '/proyectos', texto: t('navegacion.proyectos') },
          { to: '/buscar-proyectos', texto: t('navegacion.buscarProyectos') },
          { to: '/mapa', texto: t('navegacion.mapa') },
          { to: '/notificaciones', texto: t('navegacion.notificaciones') },
          { to: '/perfil', texto: t('navegacion.miPerfil') }
        ];

  const cerrarMenu = () => setMenuAbierto(false);
  const salir = () => {
    cerrarMenu();
    cerrarSesion();
  };

  const renderEnlaces = () =>
    enlaces.map(({ to, texto, icono, exacto }) => (
      <NavLink
        key={to}
        to={to}
        end={exacto}
        onClick={cerrarMenu}
        className={({ isActive }) => `header-nav-link${isActive ? ' activo' : ''}`}
      >
        {icono}
        {texto}
      </NavLink>
    ));

  const enlaceAyuda = (clase) => (
    <Link
      className={clase}
      to={RUTA_AYUDA}
      onClick={() => {
        cerrarMenu();
        irAAyuda();
      }}
    >
      <FiHelpCircle aria-hidden="true" />
      <span>{t('navegacion.ayuda')}</span>
    </Link>
  );

  return (
    <header className="header">
      <div className="header__contenido">
        <Link to="/" className="header-logo">
          <span className="header-logo-mark" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            >
              <path d="M12 2.5C7 2.5 5 3.6 4.6 6.2L4.3 8.1L3.3 8.4C2.6 8.6 2.3 9.1 2.3 10V11.8C2.3 12.6 2.7 13.1 3.4 13.3L4.2 13.5V17.8C4.2 18.8 4.8 19.4 5.8 19.5V21C5.8 21.8 6.3 22.2 7.2 22.2C8.1 22.2 8.6 21.8 8.6 21V19.6H15.4V21C15.4 21.8 15.9 22.2 16.8 22.2C17.7 22.2 18.2 21.8 18.2 21V19.5C19.2 19.4 19.8 18.8 19.8 17.8V13.5L20.6 13.3C21.3 13.1 21.7 12.6 21.7 11.8V10C21.7 9.1 21.4 8.6 20.7 8.4L19.7 8.1L19.4 6.2C19 3.6 17 2.5 12 2.5ZM8.5 4.2H15.5C16.1 4.2 16.5 4.5 16.5 5C16.5 5.5 16.1 5.8 15.5 5.8H8.5C7.9 5.8 7.5 5.5 7.5 5C7.5 4.5 7.9 4.2 8.5 4.2ZM6.8 7.2H17.2C18 7.2 18.4 7.7 18.5 8.6L18.9 12.5C19 13.4 18.5 13.9 17.6 13.9H6.4C5.5 13.9 5 13.4 5.1 12.5L5.5 8.6C5.6 7.7 6 7.2 6.8 7.2ZM7.2 18.1C8 18.1 8.7 17.4 8.7 16.6C8.7 15.8 8 15.1 7.2 15.1C6.4 15.1 5.7 15.8 5.7 16.6C5.7 17.4 6.4 18.1 7.2 18.1ZM16.8 18.1C17.6 18.1 18.3 17.4 18.3 16.6C18.3 15.8 17.6 15.1 16.8 15.1C16 15.1 15.3 15.8 15.3 16.6C15.3 17.4 16 18.1 16.8 18.1Z" />
            </svg>
          </span>
          <span className="header-logo-texto">Código a Voluntad</span>
        </Link>

        {conPerfil ? (
          <nav className="header-nav header-nav--desktop" aria-label={t('navegacion.principal')}>
            {renderEnlaces()}
          </nav>
        ) : (
          <div className="header-nav header-nav--desktop">{enlaceAyuda('header-ayuda')}</div>
        )}

        <div className="header-usuario header-usuario--desktop">
          <BotonModoDaltonico className="header-modo-color" />
          {conPerfil && (
            <Button
              className="header-nav-salir"
              variant="text"
              startIcon={<FiLogOut aria-hidden="true" />}
              onClick={cerrarSesion}
            >
              {t('navegacion.salir')}
            </Button>
          )}
        </div>

        <IconButton
          className="header-menu-toggle"
          aria-label={menuAbierto ? t('navegacion.cerrarMenu') : t('navegacion.abrirMenu')}
          aria-expanded={menuAbierto}
          aria-controls={menuAbierto ? 'header-navegacion-movil' : undefined}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          {menuAbierto ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
        </IconButton>
      </div>

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
            <h2 id="header-menu-titulo">{t('navegacion.menu')}</h2>
            <IconButton aria-label={t('navegacion.cerrarMenu')} onClick={cerrarMenu}>
              <FiX aria-hidden="true" />
            </IconButton>
          </div>
          <nav id="header-navegacion-movil" className="header-nav header-nav--mobile" aria-label={t('navegacion.principal')}>
            {conPerfil ? (
              <>
                {renderEnlaces()}
                <Button
                  className="header-nav-salir"
                  variant="text"
                  startIcon={<FiLogOut aria-hidden="true" />}
                  onClick={salir}
                >
                  {t('navegacion.salir')}
                </Button>
              </>
            ) : (
              enlaceAyuda('header-nav-link header-ayuda-movil')
            )}
          </nav>
          <div className="header-drawer-preferencias" role="group" aria-label={t('navegacion.preferencias')}>
            <BotonModoDaltonico className="header-modo-color" />
          </div>
        </div>
      </Drawer>
    </header>
  );
};

export default Header;