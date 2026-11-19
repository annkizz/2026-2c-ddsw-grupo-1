import React, { useState } from 'react';
import { Button, Drawer, IconButton } from '@mui/material';
import { FiBell, FiCode, FiFileText, FiHelpCircle, FiHome, FiLogOut, FiMenu, FiUsers, FiUser, FiX } from 'react-icons/fi';
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

  const enlaces =
    esColectivo || esColaboradora
      ? [
          { to: '/', texto: t('navegacion.inicio'), icono: <FiHome aria-hidden="true" />, exacto: true },
          ...(esColaboradora ? [
            { to: '/mis-colaboraciones', texto: t('navegacion.misColaboraciones'), icono: <FiUsers aria-hidden="true" /> },
            { to: '/mis-postulaciones', texto: t('navegacion.misPostulaciones'), icono: <FiFileText aria-hidden="true" /> }
          ] : []),
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
            <FiCode />
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
