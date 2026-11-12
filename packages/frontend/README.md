# Frontend (React + MUI + Logto)

Estructura (la misma idea que el cliente de Megasuper):

```
src/
  components/   piezas reutilizables (headers, footer, LoadingSplash, AccionesRegistro, RequiereAuth, RequiereRol, Callback)
  features/     una carpeta por pantalla (home, registro, proyectos, ...)
  hooks/        useAuth.jsx (AuthProvider + useAuth)
  service/      api.js + un service por entidad del backend
```

## De dónde sale cada cosa
| Pieza | Referencia |
|---|---|
| `service/api.js` (instancia de axios, `mensajeDeError`) y services con conversión de datos | Megasuper |
| Formularios con `useState`, `setValorDe`, `try/catch/finally`, `Alert`, `TextField`, `MenuItem` | Megasuper (`NuevoProducto.jsx`) |
| `Layout` con `Outlet`, `createTheme`/`ThemeProvider` | Megasuper |
| Datos compartidos entre pasos por props (`datos`, `setDatos`) | Megasuper (el `carrito`) |
| `AuthProvider`/`useAuth`, `Callback`, `RequiereAuth`, `RequiereRol`, `LoadingSplash` | TP de turnos (g1) |
| Token pasado a cada llamada de los services (`conToken`) | TP de turnos (g1) |

## Correr
1. `cp .env.example .env` y completar los datos de Logto.
2. `npm install` en la raíz del monorepo y `npm run start:frontend`.
3. En la app de Logto: redirect `http://localhost:3000/callback` y post sign-out `http://localhost:3000`.
4. En el backend: `ALLOWED_ORIGINS` con `http://localhost:3000`.
