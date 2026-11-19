import React from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import MiPerfil from './MiPerfil.jsx';
import PerfilAdministrador from './PerfilAdministrador.jsx';

export default function PerfilCuenta() {
  const { sesion } = useAuth();

  return sesion?.rol === 'ADMINISTRADOR'
    ? <PerfilAdministrador />
    : <MiPerfil />;
}
