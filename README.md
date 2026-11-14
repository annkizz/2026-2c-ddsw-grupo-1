Este repositorio es la base para el Trabajo Práctico de la materia **Desarrollo de Software (DDS)** de la carrera **Ingeniería en Sistemas de Información** de la **UTN FRBA**. Se trata de un **monorepo** que integra una aplicación frontend con Create React App y un backend con Express, facilitando el desarrollo y la gestión de ambos proyectos en un único entorno.

## 📦 Estructura del Proyecto

El monorepo está organizado de la siguiente manera:

```
.
├── packages/
│   ├── backend/        # Servidor Express.js
│   └── frontend/       # Aplicación React (Create React App)
├── package.json        # Configuración del monorepo (root)
├── README.md           # Este archivo
└── .env.example        # Ejemplo de configuración de variables de entorno
```

## ⚙️ Paquetes

Este monorepo utiliza **`npm workspaces`** para gestionar los diferentes paquetes.

### Backend (`packages/backend`)

El backend está construido con Express.js y utiliza las siguientes dependencias:

- **`express`**: El framework web para Node.js, utilizado para construir la API.
- **`cors`**: Middleware para Express que habilita Cross-Origin Resource Sharing (CORS), necesario para permitir que el frontend acceda al backend desde un origen diferente.
- **`dotenv`**: Carga variables de entorno desde un archivo `.env` en `process.env`. Es crucial para configurar el puerto del servidor y los orígenes permitidos.

La idea es dar lo mínimo para levantar el servidor, y que durante el desarrollo del TP se vayan agregando las dependencias necesarias.

### Frontend (`packages/frontend`)

El frontend es una aplicación de React generada con Create React App.

## 🚀 Inicio Rápido

Seguí estos pasos para poner en marcha el proyecto:

### 1\. Instalación de Dependencias

Desde la raíz del monorepo, ejecutá:

```bash
npm install
```

Esto instalará todas las dependencias para la raíz y para los paquetes `frontend` y `backend`.

### 2\. Configuración de Variables de Entorno

Crea un archivo `.env` en el directorio `packages/backend` para ejecutar la API directamente. Usa `packages/backend/.env.example` como plantilla. Si ejecutás con Docker Compose, el archivo `.env` va en la raíz y podés partir de `.env.example`.

```
# packages/backend/.env
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SERVER_PORT=3001
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=codigo_a_voluntad
LOGTO_JWKS_URL=https://v0v3qk.logto.app/oidc/jwks
LOGTO_ISSUER=https://v0v3qk.logto.app/oidc
LOGTO_AUDIENCE=https://api.codigoavoluntad.com
```

- **`ALLOWED_ORIGINS`**: Define los orígenes permitidos para las solicitudes CORS. Asegurate de incluir la URL donde se ejecuta tu frontend (por defecto, `http://localhost:3000` para Create React App). Cuando se haga el despliegue en nube acá se deberá incluir la URL donde se desplegó el frontend.
- **`SERVER_PORT`**: El puerto en el que se ejecutará el servidor backend (por defecto, `3001` en desarrollo local).
- **`LOGTO_JWKS_URL`, `LOGTO_ISSUER`, `LOGTO_AUDIENCE`**: Configuración de la API de Logto. `LOGTO_AUDIENCE` debe coincidir con el recurso configurado en `REACT_APP_LOGTO_RESOURCES`. Son necesarias para verificar tokens en las rutas privadas; no subir archivos `.env`.

### 3\. Ejecución de la Aplicación

Podés iniciar el frontend y el backend por separado o ambos a la vez:

#### Ejecutar el Backend

```bash
npm run start:backend
```

Para el desarrollo con reinicio automático:

```bash
npm run dev:backend
```

#### Ejecutar el Frontend

```bash
npm run start:frontend
```

#### Ejecutar Ambos (Desarrollo)

Para iniciar el backend en modo `dev` y el frontend simultáneamente, usá:

```bash
npm run start:dev
```

### Probar postulaciones con Postman

En las rutas privadas, enviá el **access token** de Logto como `Authorization: Bearer <token>` y usá la audiencia configurada en `LOGTO_AUDIENCE`.

1. `GET /me` crea o devuelve la cuenta local. Antes de registrar un perfil, `rol` e IDs de perfil son nulos.
2. Registrá el perfil con `POST /colectivos` o `POST /colaboradoras`, usando el mismo token.
3. Con una cuenta `COLABORADOR`, creá una postulación con `POST /proyectos/{idProyecto}/perfiles/{idPerfil}/postulaciones`. El body puede ser `{ "esAnonima": false }`; **no** envíes `idColaborador`, porque el backend lo obtiene del perfil vinculado a la cuenta.
4. Con el token del colectivo dueño, consultá `GET /proyectos/{idProyecto}/postulaciones` y resolvé con `PATCH /proyectos/{idProyecto}/postulaciones/{idPostulacion}` y `{"decision":"ACEPTADA"}` o `{"decision":"RECHAZADA"}`.
