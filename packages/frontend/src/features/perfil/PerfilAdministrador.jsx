import React, { useEffect, useState } from 'react';
import { Alert, Button, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import './PerfilAdministrador.css';

function urlCuenta(seccion, endpointLogto) {
  if (!endpointLogto) return '';

  const parametros = new URLSearchParams({
    redirect: `${window.location.origin}/perfil`,
    show_success: 'true',
    ui_locales: 'es',
  });
  return `${endpointLogto}/account/${seccion}?${parametros.toString()}`;
}

export default function PerfilAdministrador() {
  const { obtenerDatosCuenta, sesion } = useAuth();
  const endpointLogto = process.env.REACT_APP_LOGTO_ENDPOINT?.replace(/\/+$/, '');
  const [cuenta, setCuenta] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError('');

    obtenerDatosCuenta()
      .then((datos) => {
        if (vigente) setCuenta(datos);
      })
      .catch((fallo) => {
        if (vigente) {
          setError(
            fallo?.message ||
              'No pudimos consultar los datos de tu cuenta en Logto.',
          );
        }
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [obtenerDatosCuenta, intento]);

  const enlaces = [
    ['profile', 'Editar nombre'],
    ['email', 'Cambiar email'],
    ['password', 'Cambiar contraseña'],
  ];

  return (
    <section className="perfil-administrador">
      <Link to="/administrador/destacados" className="perfil-administrador__volver">
        ‹ Volver a proyectos destacados
      </Link>
      <header>
        <p className="perfil-administrador__eyebrow">Cuenta de administración</p>
        <h1>Mi perfil</h1>
        <p>Actualizá el nombre, el email y la contraseña de tu cuenta de acceso.</p>
      </header>

      {cargando ? (
        <div className="perfil-administrador__cargando" role="status">
          <CircularProgress size={24} />
          <span>Cargando datos de la cuenta…</span>
        </div>
      ) : (
        <section className="perfil-administrador__tarjeta" aria-labelledby="cuenta-titulo">
          <h2 id="cuenta-titulo">Datos de la cuenta</h2>
          {error && (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => setIntento((valor) => valor + 1)}>
                  Reintentar
                </Button>
              }
            >
              {error}
            </Alert>
          )}
          <dl>
            <div>
              <dt>Nombre</dt>
              <dd>{cuenta?.nombre || sesion?.nombreUsuario || 'Sin nombre configurado'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{cuenta?.email || 'No disponible'}</dd>
            </div>
          </dl>

          {!endpointLogto && (
            <Alert severity="error">
              Falta configurar REACT_APP_LOGTO_ENDPOINT para abrir la edición segura de la cuenta.
            </Alert>
          )}
          <div className="perfil-administrador__acciones">
            {enlaces.map(([seccion, etiqueta]) => (
              <Button
                key={seccion}
                variant={seccion === 'profile' ? 'contained' : 'outlined'}
                component="a"
                href={urlCuenta(seccion, endpointLogto) || undefined}
                disabled={!endpointLogto}
              >
                {etiqueta}
              </Button>
            ))}
          </div>
          <p className="perfil-administrador__ayuda">
            Logto verifica los cambios de email y contraseña y te devuelve a esta pantalla.
          </p>
        </section>
      )}
    </section>
  );
}
