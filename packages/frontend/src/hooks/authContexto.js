import { createContext } from 'react';

// Contexto de sesión separado del proveedor (que depende de Logto), para que los componentes
// compartidos puedan leerlo de forma opcional sin arrastrar la librería de autenticación.
export const AuthContext = createContext(null);
