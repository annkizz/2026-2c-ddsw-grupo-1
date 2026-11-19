## Despliegue

La aplicación se ejecuta con **Docker Compose** sobre una máquina virtual con Ubuntu (Google Cloud). Un solo comando
levanta MongoDB, carga la seed si todavía no se ejecutó en ese volumen, y luego inicia la API y el frontend.

Los `Dockerfile` construyen las imágenes de API y frontend; `docker-compose.yml` conecta los servicios, espera a que cada
uno esté listo y conserva la base en un volumen.

| Servicio   | Qué es                  | Notas                                                                                  |
| ---------- | ----------------------- | -------------------------------------------------------------------------------------- |
| `mongo`    | MongoDB 7               | Datos persistentes en `mongo-data`; puerto ligado solo a `127.0.0.1`.                  |
| `seed`     | Datos iniciales         | Corre antes de la API; carga la seed una sola vez por versión y base de datos.         |
| `api`      | Backend Express         | Espera a que termine la seed; healthcheck en `/healthcheck`; puerto local 3001.        |
| `frontend` | React servido por Nginx | Espera a que la API esté sana; proxy `/api` hacia la API; puerto web 3000 por defecto. |

### Requisitos en la VM

```bash
docker --version
docker compose version
```

Si falta Docker: `sudo apt update && sudo apt install -y docker.io docker-compose-v2` y
`sudo usermod -aG docker $USER` (después cerrar la sesión SSH y volver a entrar).

Además, el puerto **3000** de la VM tiene que estar abierto hacia afuera: en Google Cloud, una regla de firewall de
entrada para `tcp:3000` en la red de la VM. Es el frontend; la API se accede mediante su proxy `/api`. **No abrir nunca**
los puertos 27017 (Mongo) ni 3001 (API).

> La IP externa de la VM puede cambiar si se la apaga y se la vuelve a prender, salvo que se reserve como IP estática.
> La aplicación se sirve por **HTTP** (no HTTPS): `http://<IP>:3000`.

### Obtener el proyecto

```bash
git clone https://github.com/annkizz/2026-2c-ddsw-grupo-1.git
cd 2026-2c-ddsw-grupo-1
git checkout <rama-con-todo-integrado>
git pull
```

La VM despliega **lo que tenga la rama en la que está parada**. Antes de probar, confirmar con `git log --oneline -3`
que se ven los últimos commits del equipo.

### Configurar las variables (una sola vez)

El archivo `.env` va en la **raíz del proyecto**, al lado de `docker-compose.yml` (no en `packages/backend`: ese es solo
para correr el backend sin Docker). **No se sube a git** (está en `.gitignore`); crealo a partir de la plantilla:

```bash
cp .env.example .env
nano .env
```

Reemplazá la contraseña de ejemplo y los valores de Logto por los de tu tenant y el recurso de API.
`REACT_APP_LOGTO_RESOURCES` debe coincidir con `LOGTO_AUDIENCE`. En la VM, reemplazá también `ALLOWED_ORIGINS` por
`http://<IP-o-dominio>:3000`.

| Variable                        | Para qué sirve                                                                                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGO_USER` / `MONGO_PASSWORD` | Usuario administrador de Mongo. Se crea al inicializar el volumen.                                                                                                                  |
| `MONGODB_DB_NAME`               | Nombre de la base de datos.                                                                                                                                                         |
| `API_PORT`                      | Puerto local de la API (3001); queda ligado a `127.0.0.1`, no se expone a la red.                                                                                                    |
| `FRONTEND_PORT`                 | Puerto público del frontend (3000 por defecto).                                                                                                                                     |
| `ALLOWED_ORIGINS`               | Orígenes permitidos por CORS, separados por coma y **sin barra final**. Configurá el origen donde sirve el frontend.                                                                |
| `LOGTO_ISSUER`                  | Emisor OIDC de Logto, por ejemplo `https://tenant.logto.app/oidc`.                                                                                                                   |
| `LOGTO_JWKS_URL`                | URL de claves públicas de Logto, normalmente `https://tenant.logto.app/oidc/jwks`.                                                                                                   |
| `LOGTO_AUDIENCE`                | Identificador del recurso de API; debe coincidir con `REACT_APP_LOGTO_RESOURCES`.                                                                                                   |
| `LOGTO_ADMIN_IDS`               | IDs `sub` de Logto autorizados como administradores, separados por coma. Usá cuentas dedicadas sin un perfil previo de colectivo/colaboradora.                                        |
| `REACT_APP_LOGTO_ENDPOINT`      | Dominio de tu tenant de Logto, usado al compilar el frontend.                                                                                                                        |
| `REACT_APP_LOGTO_APP_ID`        | App ID pública de la aplicación frontend en Logto.                                                                                                                                  |
| `REACT_APP_LOGTO_RESOURCES`     | Recurso de API solicitado por el frontend; debe coincidir con `LOGTO_AUDIENCE`.                                                                                                     |

> La contraseña debe tener **solo letras y números**: se usa dentro de una URL de conexión y caracteres como `@ : / ?` la rompen.
> En un trabajo académico alcanza con una contraseña simple porque Mongo no es accesible desde fuera de Docker.

Para desarrollo local, copiá las variables `LOGTO_*` de `packages/backend/.env` y las `REACT_APP_LOGTO_*` de
`packages/frontend/.env` al `.env` de la raíz. Compose usa estas últimas al compilar el frontend.
En la consola de Logto, autorizá además la URL de callback `http://<IP-o-dominio>:3000/callback`.

Para habilitar la administración de proyectos destacados, agregá a `LOGTO_ADMIN_IDS` el ID de usuario de Logto
(claim `sub`) de cada cuenta administradora. El backend asigna `ADMINISTRADOR` al primer inicio de sesión de una
cuenta configurada que todavía no tenga rol; no se puede elegir ese rol desde el registro. En desarrollo sin Docker,
configurá la misma variable en `packages/backend/.env`.

La edición de nombre, email y contraseña se realiza en las páginas alojadas del Account Center de Logto. Habilitá
**Account API** en la consola y permití editar **Name**, **Primary email** y **Password**. Para cambiar el email,
Logto también requiere un conector de email con la plantilla `BindNewIdentifier`. La aplicación vuelve al perfil
después de cada operación.

### Levantar todo

```bash
docker compose up -d --build
docker compose ps -a
docker compose logs --tail 20 seed api frontend
```

- `--build` construye las imágenes de API y frontend. **Usalo cuando cambie el código.**
- `-d` deja todo corriendo de fondo.
- **Esperado:** `mongo`, `api` y `frontend` en `healthy`; `seed` termina con código 0. La API puede tardar hasta un minuto
  la primera vez, mientras carga los datos.

La API queda disponible localmente en `http://localhost:3001`; el frontend en `http://localhost:3000` y la API a través
de `http://localhost:3000/api`. En la VM solo se publica el frontend.

### Actualizar los datos iniciales (seed)

```bash
docker compose stop frontend api
docker compose build seed     # si cambió el código de la seed
docker compose run --rm -e SEED_FORCE=true seed
docker compose up -d
```

La seed se carga automáticamente en una base nueva y no se vuelve a aplicar en cada `up`, para no borrar datos de prueba.
El estado de carga se guarda en Mongo. `SEED_FORCE=true` vuelve a cargarla y reinicia los perfiles, colaboraciones y logros
de los proyectos demo; los proyectos creados por la API quedan intactos. Si se publica una versión nueva de los datos,
actualizá `idVersionSeed` en `packages/backend/seeds/seed.js` o forzá la carga en la VM.

**Esperado:** `Seed listo: 24 habilidades, 6 colectivos, 10 proyectos, 13 perfiles, 7 logros, 15 colaboradoras, 6 colaboraciones`.

Los datos incluyen proyectos activos y finalizados, búsquedas abiertas y cerradas, ubicaciones en varias provincias,
etiquetas, destacados vigentes y vencidos, avances, logros y colaboraciones anónimas y públicas.

- Habilidades, colectivos, proyectos y colaboradoras se guardan por id fijo (no se duplican).
- `seed-proyecto-4` («Laboratorio de pruebas») se **cierra solo** 5 minutos después de correr el seed (cierre automático).
  Para cambiar el tiempo al forzar la seed: `docker compose run --rm -e SEED_FORCE=true -e SEED_CIERRE_MINUTOS=2 seed`.
- Para probar postulaciones entre cuentas reales, registrá dos cuentas de Logto: una colaboradora y otra colectivo. Los
  perfiles demo de la seed no están asociados a cuentas de Logto.

Los IDs determinísticos, perfiles, logros y escenarios están definidos en `packages/backend/seeds/datosIniciales.js`.
La seed de integración de Jest usa el conjunto base y no incorpora automáticamente estos escenarios adicionales.

### Verificar el despliegue

Desde el navegador (reemplazar `<IP>` por la IP de la VM):

```text
http://<IP>:3000/                 -> frontend React
http://<IP>:3000/api/healthcheck  -> {"status":"ok", ...}
http://<IP>:3000/api/api-docs     -> documentación Swagger
```

Desde Postman, con una variable `base = http://<IP>:3000/api`, probar `GET {{base}}/proyectos` (10 proyectos con la seed
ampliada) y el resto de los endpoints. Si se prefiere la terminal, desde la VM:
`curl http://localhost:3000/api/proyectos`.

**Prueba de persistencia** (los datos deben sobrevivir):

```bash
docker compose restart api frontend # reinicia API y frontend
docker compose down                 # apaga todo, conserva los datos
docker compose up -d
```

Después de cada paso, un `GET /proyectos` y un `GET /colaboradoras` deben devolver lo mismo que antes.

### Ver los datos en MongoDB

Mongo no está expuesto fuera de Docker, así que se consulta **desde dentro de la VM** con `mongosh`:

```bash
cd ~/2026-2c-ddsw-grupo-1
set -a; . ./.env; set +a      # carga MONGO_USER, MONGO_PASSWORD y MONGODB_DB_NAME
docker compose exec mongo mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin "$MONGODB_DB_NAME"
```

Dentro de `mongosh` (se sale con `exit`):

```js
show collections
db.proyectos.find()
db.colaboraciones.countDocuments()
```

| Colección        | Contenido                                                           |
| ---------------- | ------------------------------------------------------------------- |
| `habilidades`    | Catálogo de habilidades (título y código normalizado)               |
| `colectivos`     | Colectivos y los ids de sus proyectos                               |
| `proyectos`      | Proyectos, estado, fecha límite y los ids de sus perfiles           |
| `perfiles`       | Perfiles de cada proyecto (habilidades y compromiso)                |
| `logros`         | Logros/hitos de cada proyecto                                       |
| `colaboradoras`  | Colaboradoras, habilidades, `aceptaMensajeria` y `mediosDeContacto` |
| `colaboraciones` | Quién colabora en qué proyecto, y si es anónima (`esAnonima`)       |
| `notificaciones` | Mensajes internos y el resultado de cada envío externo (`envios`)   |

**Lo que la API oculta pero la base conserva.** La anonimidad y los datos de contacto se protegen en la capa de la API
(los `GET` y los DTO), pero el registro real se guarda completo en la base:

```js
// Contribuciones anónimas: la base guarda quién fue; el GET público no lo muestra
db.colaboraciones.find({ esAnonima: true });

// Colaboradoras que aceptaron mensajería, con sus medios de contacto (nunca salen por la API)
db.colaboradoras.find(
  { aceptaMensajeria: true },
  { _id: 0, idColaborador: 1, nombreFantasia: 1, mediosDeContacto: 1 },
);

// Últimos mensajes enviados y el estado de cada canal
db.notificaciones.find().sort({ fecha: -1 }).limit(5);
```

> Los medios de contacto están guardados en texto plano. Mongo no se expone a la red; el puerto solo escucha en loopback.

Consulta de una sola línea (sin entrar a `mongosh`):

```bash
docker compose exec mongo mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin "$MONGODB_DB_NAME" \
  --quiet --eval 'db.colaboraciones.find({ esAnonima: true }).toArray()'
```

**Opcional: MongoDB Compass desde tu compu, con un túnel SSH.**

1. Desde tu compu (con `gcloud` instalado), abrir el túnel:
   ```bash
   gcloud compute ssh instancia-despliegue --zone southamerica-west1-b -- -N -L 27018:localhost:27017
   ```
2. En Compass conectarse a: `mongodb://<MONGO_USER>:<MONGO_PASSWORD>@localhost:27018/codigo_a_voluntad?authSource=admin`

El puerto está ligado a `127.0.0.1`: **nunca** cambiarlo a `0.0.0.0` ni abrir el 27017 en el firewall.

### Notificaciones

`POST /notificaciones` guarda el mensaje interno y lo replica por cada medio de contacto de la colaboradora (EMAIL, SMS,
WHATSAPP). **Por defecto el envío es simulado**: no hace falta configurar nada y cada intento queda en `envios` con
estado `SIMULADO`. En los logs aparece con el contacto enmascarado (`docker compose logs api | grep notificaciones`).

| Estado en `envios` | Significado                                         |
| ------------------ | --------------------------------------------------- |
| `SIMULADO`         | El canal no está configurado: no se envió nada real |
| `ENVIADO`          | El proveedor aceptó el mensaje                      |
| `FALLIDO`          | Falló el canal; el mensaje interno se guarda igual  |

**Opcional: envío real** (no es necesario para la entrega; Twilio y los servicios de mail con volumen pueden tener costo):

1. Instalar la dependencia de email, que hoy no está en el `package.json`, y subir los cambios:
   ```bash
   cd packages/backend && npm install nodemailer
   git add package.json ../../package-lock.json
   ```
2. En `docker-compose.yml`, agregar bajo `x-api-env` las variables que se quieran pasar al contenedor, cada una con
   el formato `NOMBRE: ${NOMBRE:-}`:
   `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_SECURE`,
   `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM`, `TWILIO_WHATSAPP_FROM`.
3. Completarlas en el `.env` de la VM (para probar el mail gratis sirve un servicio de pruebas como Mailtrap, o Gmail con
   contraseña de aplicación), y volver a levantar con `docker compose up -d --build`.

Sin esos tres pasos, las variables `SMTP_*` y `TWILIO_*` **no llegan** al contenedor y todo queda `SIMULADO`.

### Actualizar el despliegue

```bash
git pull
docker compose up -d --build
```

### Apagar y reiniciar desde cero

```bash
docker compose down         # apaga los contenedores, conserva los datos
docker compose down -v      # CUIDADO: además borra todos los datos de Mongo
```

Para volver a un entorno limpio: `docker compose down -v`, `docker compose up -d --build` y `docker compose run --rm seed`.

### Problemas frecuentes

| Síntoma                                                                       | Causa probable                                                                                     | Solución                                                                                          |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `port is already allocated` al levantar                                       | Un contenedor viejo (por ejemplo de la entrega anterior) ocupa el puerto 3000                      | `docker ps`, y luego `docker stop NOMBRE` y `docker rm NOMBRE`. O cambiar `API_PORT` en el `.env` |
| `Error conectando a MongoDB: getaddrinfo EAI_AGAIN mongo`                     | La API no resuelve el nombre `mongo` en la red de Docker, típico tras un primer arranque fallido   | `docker compose down` y `docker compose up -d`                                                    |
| La API queda en `health: starting` y se reinicia                              | El proceso se cierra al fallar                                                                     | `docker compose logs --tail 30 api` y actuar según el error                                       |
| `Authentication failed`                                                       | El volumen de Mongo se creó con otro usuario o contraseña (el usuario se crea solo la primera vez) | `docker compose down -v`, `docker compose up -d --build` y volver a correr el seed                |
| `Falta MONGO_PASSWORD en .env`                                                | No existe el `.env` en la raíz del proyecto                                                        | Crearlo al lado de `docker-compose.yml`                                                           |
| El seed falla con un error de validación (por ejemplo `proyecto is required`) | La imagen tiene una versión vieja del código                                                       | `git pull`, `docker compose build` y volver a correr el seed                                      |
| `mongo` se reinicia con `Illegal instruction`                                 | La CPU de la VM no expone instrucciones AVX, que MongoDB 5+ necesita                               | Habilitar el modo de CPU «host passthrough» o usar `image: mongo:4.4`                             |
| Responde desde la VM pero no desde afuera                                     | Falta la regla de firewall para el puerto 3000, o se usó `https://`                                | Crear la regla `tcp:3000` y usar `http://`                                                        |
| `docker: command not found` / `permission denied`                             | Docker no está instalado, o el usuario no está en el grupo `docker`                                | Ver «Requisitos en la VM», o usar `sudo docker ...`                                               |
| Las notificaciones salen siempre `SIMULADO`                                   | Es lo esperado sin configuración                                                                   | Ver «Notificaciones → envío real»                                                                 |

### Consideraciones

- **Seguridad:** Mongo solo es accesible desde la red interna de Docker y con usuario y contraseña. La API se sirve sin
  HTTPS y sin autenticación (la autenticación corresponde a la entrega 3).
- **Node en el Dockerfile:** hoy usa `node:20-alpine`. Mongoose 9 exige Node 20.19 o superior y Node 20 ya no tiene soporte;
  conviene pasar a `node:22-alpine` y correr con `USER node`.
- **Economía:** una sola VM, imágenes oficiales y gratuitas. No hay réplica ni backups de Mongo: adecuado para un trabajo
  académico, no para producción.
- **Datos de prueba:** todo lo creado por la API sobrevive a los reinicios. Para volver al estado inicial, usar el
  reinicio desde cero de arriba.
