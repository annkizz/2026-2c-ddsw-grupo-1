import React, { useState } from 'react';
import { Divider, Drawer, IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material';
import {
  FiBell,
  FiChevronDown,
  FiCode,
  FiFileText,
  FiGlobe,
  FiLogOut,
  FiLink,
  FiMap,
  FiMenu,
  FiSearch,
  FiUser,
  FiUsers,
  FiX
} from 'react-icons/fi';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useNotificacionesPendientes } from '../../hooks/useNotificacionesPendientes.js';
import { cambiarIdioma, t, useIdioma } from '../../i18n/t';
import './Header.css';


const ETIQUETA_ROL = {
  COLECTIVO: 'navegacion.rolColectivo',
  COLABORADOR: 'navegacion.rolColaborador',
  ADMINISTRADOR: 'navegacion.rolAdministrador'
};

// El logo es el único acceso a Inicio (antes había un botón "Inicio" que hacía lo mismo).
// Lo personal (Mi perfil, Salir) vive en el menú de usuario; las notificaciones, en su botón.
const enlacesPorRol = (rol) => {
  if (rol === 'ADMINISTRADOR') {
    return [
      { to: '/administrador/destacados', texto: t('destacados.titulo'), icono: <FiFileText aria-hidden="true" /> }
    ];
  }
  if (rol === 'COLABORADOR') {
    return [
      { to: '/buscar-proyectos', texto: t('navegacion.buscarProyectos'), icono: <FiSearch aria-hidden="true" /> },
      { to: '/mis-colaboraciones', texto: t('navegacion.misColaboraciones'), icono: <FiUsers aria-hidden="true" /> },
      { to: '/mis-postulaciones', texto: t('navegacion.misPostulaciones'), icono: <FiFileText aria-hidden="true" /> }
    ];
  }
  if (rol === 'COLECTIVO') {
    return [
      { to: '/proyectos', texto: t('navegacion.misProyectos'), icono: <FiFileText aria-hidden="true" /> },
      { to: '/buscar-colaboradores', texto: t('navegacion.buscarColaboradoras'), icono: <FiSearch aria-hidden="true" /> },
      { to: '/integraciones/webhooks', texto: t('navegacion.integraciones'), icono: <FiLink aria-hidden="true" /> }
    ];
  }
  return [
    { to: '/proyectos', texto: t('navegacion.proyectos'), icono: <FiFileText aria-hidden="true" /> },
    { to: '/mapa', texto: t('navegacion.mapa'), icono: <FiMap aria-hidden="true" /> }
  ];
};

const iniciales = (texto) =>
  (texto || '')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('') || <FiUser aria-hidden="true" />;

const textoPendientes = (cantidad) =>
  cantidad === 0
    ? t('navegacion.notificaciones')
    : cantidad === 1
      ? t('navegacion.notificacionesUna')
      : t('navegacion.notificacionesVarias', { cantidad });

const Header = () => {
  const idioma = useIdioma();
  const { isAuthenticated, sesion, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const { pendientes } = useNotificacionesPendientes();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [anclaUsuario, setAnclaUsuario] = useState(null);
  const [anclaIdioma, setAnclaIdioma] = useState(null);
  const esAdministrador = sesion?.rol === 'ADMINISTRADOR';
  const conPerfil = isAuthenticated && (sesion?.tienePerfil || esAdministrador);
  const enlaces = enlacesPorRol(sesion?.rol);
  const nombre = sesion?.nombreUsuario || t('navegacion.miCuenta');
  const rol = ETIQUETA_ROL[sesion?.rol] ? t(ETIQUETA_ROL[sesion.rol]) : '';
  const insignia = pendientes > 9 ? '9+' : pendientes;

  const cerrarMenu = () => setMenuAbierto(false);
  const cerrarUsuario = () => setAnclaUsuario(null);
  const ir = (ruta) => {
    cerrarUsuario();
    cerrarMenu();
    navigate(ruta);
  };
  const salir = () => {
    cerrarUsuario();
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
        <span>{texto}</span>
      </NavLink>
    ));

  // Notificaciones como botón visible (borde + texto en desktop), con el número de no vistas.
  // NavLink agrega aria-current="page" cuando estás en Notificaciones: así se marca la sección actual.
  const campana = (
    <NavLink
      to="/notificaciones"
      className="header-campana"
      aria-label={textoPendientes(pendientes)}
      onClick={cerrarMenu}
    >
      <FiBell aria-hidden="true" />
      <span className="header-campana__texto" aria-hidden="true">
        {t('navegacion.notificaciones')}
      </span>
      {pendientes > 0 && (
        <span className="insignia insignia--acento header-campana__numero" aria-hidden="true">
          {insignia}
        </span>
      )}
    </NavLink>
  );

  return (
    <header className="header">
      <div className="header__contenido">
        <Link to="/" className="header-logo" aria-label={t('navegacion.logoInicio')}>
          <span className="header-logo-mark" aria-hidden="true">
            <FiCode />
          </span>
          <span className="header-logo-texto" aria-hidden="true">
            Código <span className="header-logo-texto__acento">a Voluntad</span>
          </span>
        </Link>

        {conPerfil ? (
          <nav className="header-nav header-nav--desktop" aria-label={t('navegacion.principal')}>
            {renderEnlaces()}
          </nav>
        ) : (
          <div className="header-nav header-nav--desktop" />
        )}

        <button
          type="button"
          className="header-idioma"
          aria-label={t('navegacion.idioma')}
          aria-haspopup="menu"
          aria-expanded={Boolean(anclaIdioma)}
          aria-controls={anclaIdioma ? 'menu-idioma' : undefined}
          onClick={(evento) => setAnclaIdioma(evento.currentTarget)}
        >
          <FiGlobe aria-hidden="true" />
          <span>{idioma === 'pt' ? 'PT' : 'ES'}</span>
        </button>

        {conPerfil && (
          <div className="header-usuario">
            {!esAdministrador && campana}
            <button
              type="button"
              className="header-usuario__boton header-usuario--desktop"
              aria-haspopup="menu"
              aria-expanded={Boolean(anclaUsuario)}
              aria-controls={anclaUsuario ? 'menu-usuario' : undefined}
              onClick={(evento) => setAnclaUsuario(evento.currentTarget)}
            >
              <span className="header-avatar" aria-hidden="true">
                {iniciales(sesion?.nombreUsuario)}
              </span>
              <span className="header-usuario__textos">
                <span className="header-usuario__nombre">{nombre}</span>
                {rol && <span className="header-usuario__rol">{rol}</span>}
              </span>
              <FiChevronDown aria-hidden="true" className="header-usuario__chevron" />
              <span className="visualmente-oculto">{t('navegacion.menuUsuario')}</span>
            </button>
          </div>
        )}

        {conPerfil && (
        <IconButton
          className="header-menu-toggle"
          aria-label={menuAbierto ? t('navegacion.cerrarMenu') : t('navegacion.abrirMenu')}
          aria-expanded={menuAbierto}
          aria-controls={menuAbierto ? 'header-navegacion-movil' : undefined}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          {menuAbierto ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
        </IconButton>
        )}
      </div>

      <Menu
        id="menu-idioma"
        anchorEl={anclaIdioma}
        open={Boolean(anclaIdioma)}
        onClose={() => setAnclaIdioma(null)}
        slotProps={{ list: { 'aria-label': t('navegacion.idioma') } }}
      >
        {[
          { codigo: 'es', nombre: 'Español' },
          { codigo: 'pt', nombre: 'Português do Brasil (em revisão)' }
        ].map(({ codigo, nombre }) => (
          <MenuItem
            key={codigo}
            role="menuitemradio"
            aria-checked={idioma === codigo}
            selected={idioma === codigo}
            onClick={() => {
              cambiarIdioma(codigo);
              setAnclaIdioma(null);
            }}
            lang={codigo === 'pt' ? 'pt-BR' : 'es'}
          >
            {nombre}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        id="menu-usuario"
        anchorEl={anclaUsuario}
        open={Boolean(anclaUsuario)}
        onClose={cerrarUsuario}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ list: { 'aria-label': t('navegacion.menuUsuario') } }}
      >
        <li className="menu-usuario__cabecera" role="presentation">
          <strong>{nombre}</strong>
          {rol && <span>{rol}</span>}
        </li>
        <Divider component="li" role="presentation" />
        {!esAdministrador && <MenuItem onClick={() => ir('/perfil')}>
          <ListItemIcon>
            <FiUser aria-hidden="true" />
          </ListItemIcon>
          {t('navegacion.miPerfil')}
        </MenuItem>}
        {!esAdministrador && <Divider component="li" role="presentation" />}
        <MenuItem onClick={salir} className="menu-usuario__salir">
          <ListItemIcon>
            <FiLogOut aria-hidden="true" />
          </ListItemIcon>
          {t('navegacion.salir')}
        </MenuItem>
      </Menu>

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
          {conPerfil && (
            <div className="header-drawer-usuario">
              <span className="header-avatar" aria-hidden="true">
                {iniciales(sesion?.nombreUsuario)}
              </span>
              <span className="header-usuario__textos">
                <span className="header-usuario__nombre">{nombre}</span>
                {rol && <span className="header-usuario__rol">{rol}</span>}
              </span>
            </div>
          )}
          <nav id="header-navegacion-movil" className="header-nav header-nav--mobile" aria-label={t('navegacion.principal')}>
            {conPerfil && renderEnlaces()}
            {conPerfil && !esAdministrador && (
              <>
                <NavLink
                  to="/notificaciones"
                  onClick={cerrarMenu}
                  className={({ isActive }) => `header-nav-link${isActive ? ' activo' : ''}`}
                >
                  <FiBell aria-hidden="true" />
                  <span>{t('navegacion.notificaciones')}</span>
                  {pendientes > 0 && (
                    <span className="insignia insignia--acento">
                      {insignia}
                      <span className="visualmente-oculto"> {pendientes === 1 ? t('navegacion.sinVerUna') : t('navegacion.sinVer')}</span>
                    </span>
                  )}
                </NavLink>
                <NavLink
                  to="/perfil"
                  onClick={cerrarMenu}
                  className={({ isActive }) => `header-nav-link${isActive ? ' activo' : ''}`}
                >
                  <FiUser aria-hidden="true" />
                  <span>{t('navegacion.miPerfil')}</span>
                </NavLink>
              </>
            )}
            {conPerfil && (
              <button type="button" className="header-nav-link header-nav-salir" onClick={salir}>
                <FiLogOut aria-hidden="true" />
                <span>{t('navegacion.salir')}</span>
              </button>
            )}
          </nav>
        </div>
      </Drawer>
    </header>
  );
};

export default Header;
