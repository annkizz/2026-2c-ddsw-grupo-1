## Despliegue

El backend se ejecuta con **Docker Compose** sobre una máquina virtual con Ubuntu (Google Cloud). Compose levanta
dos contenedores permanentes, la API (Node/Express) y la base de datos MongoDB, y tiene una tarea opcional que carga
los datos iniciales (seed).

**Dockerfile y Compose se complementan, no se reemplazan:** el `Dockerfile` es la receta para construir la imagen de la
API, y `docker-compose.yml` describe cómo se levantan y conectan los contenedores (API + Mongo + volumen + variables).

| Servicio | Qué es | Notas |
|---|---|---|
| `mongo` | MongoDB 7 (imagen oficial) | Con usuario y contraseña. **No publica ningún puerto**: solo la API puede conectarse. Los datos viven en el volumen `mongo-data`. |
| `api` | Backend Express (se construye con el `Dockerfile`) | Espera a que Mongo esté sano, tiene healthcheck (`/healthcheck`) y se reinicia sola si se cae. Puerto 3000. |
| `seed` | Carga de datos iniciales | Tarea de una sola ejecución, se corre a mano. No arranca con `up`. |

### Requisitos en la VM

```bash
docker --version
docker compose version
```

Si falta Docker: `sudo apt update && sudo apt install -y docker.io docker-compose-v2` y
`sudo usermod -aG docker $USER` (después cerrar la sesión SSH y volver a entrar).

Además, el puerto **3000** de la VM tiene que estar abierto hacia afuera: en Google Cloud, una regla de firewall de
entrada para `tcp:3000` en la red de la VM. **No abrir nunca el 27017** (Mongo).

> La IP externa de la VM puede cambiar si se la apaga y se la vuelve a prender, salvo que se reserve como IP estática.
> La API se sirve por **HTTP** (no HTTPS): `http://<IP>:3000`.

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
para correr el backend sin Docker). **No se sube a git** (está en `.gitignore`), así que hay que crearlo en la VM:

```bash
cat > .env <<'EOF'
MONGO_USER=admin
MONGO_PASSWORD=admin1234
MONGODB_DB_NAME=codigo_a_voluntad
API_PORT=3000
ALLOWED_ORIGINS=
EOF
```

(Si el repositorio trae un `.env.example`, alcanza con `cp .env.example .env` y editarlo con `nano .env`).

| Variable | Para qué sirve |
|---|---|
| `MONGO_USER` / `MONGO_PASSWORD` | Usuario administrador de Mongo. Se crea al inicializar el volumen. |
| `MONGODB_DB_NAME` | Nombre de la base de datos. |
| `API_PORT` | Puerto de la VM por el que se accede a la API. |
| `ALLOWED_ORIGINS` | Orígenes permitidos por CORS, separados por coma y **sin barra final**. Vacío = cualquiera. Postman y Swagger no lo necesitan; solo importa cuando haya un frontend en otro origen. |

> La contraseña debe tener **solo letras y números**: se usa dentro de una URL de conexión y caracteres como `@ : / ?` la rompen.
> En un trabajo académico alcanza con una contraseña simple porque Mongo no es accesible desde fuera de Docker.

### Levantar todo

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail 20 api
```

- `--build` construye la imagen de la API con el `Dockerfile`. **Hay que usarlo siempre que cambie el código.**
- `-d` deja todo corriendo de fondo.
- **Esperado:** `mongo` y `api` en `healthy` (la API puede tardar hasta 30 segundos). En los logs: «MongoDB conectado» y
  «Backend escuchando en puerto 3000».

### Cargar los datos iniciales (seed)

```bash
docker compose build          # solo si cambió el código del seed
docker compose run --rm seed
```

**Esperado:** `Seed listo: 12 habilidades, 3 colectivos, 4 proyectos, 5 perfiles, 3 logros, 7 colaboradoras, 2 colaboraciones`.

El seed se puede correr todas las veces que haga falta, y **deja las entidades del seed en un estado conocido**:
- Habilidades, colectivos, proyectos y colaboradoras se guardan por id fijo (no se duplican).
- De los 4 proyectos del seed se borran y recrean los perfiles, las colaboraciones y los logros (se limpia lo agregado
  probando). Los proyectos creados por la API quedan intactos.
- `seed-proyecto-4` («Laboratorio de pruebas») se **cierra solo** 5 minutos después de correr el seed (cierre automático).
  Para cambiar el tiempo: `docker compose run --rm -e SEED_CIERRE_MINUTOS=2 seed`. Al volver a correr el seed, se reabre.

**Ids fijos del seed:**

| Qué | Id |
|---|---|
| Colectivos | `seed-colectivo-1` a `seed-colectivo-3` |
| Proyectos | `seed-proyecto-1` a `seed-proyecto-4` (el 3 está `FINALIZADO`) |
| Colaboradoras | `seed-colaboradora-1` a `seed-colaboradora-7` |
| Perfil Tester / Analista de Datos (proyecto 1) | `5eed00000000000000000001` / `5eed00000000000000000002` |
| Perfil Frontend (proyecto 2) | `5eed00000000000000000003` |
| Perfil Backend (proyecto 3) | `5eed00000000000000000004` |
| Perfil Tester de carga (proyecto 4) | `5eed00000000000000000005` |
| Logros (proyectos 1 y 3) | `5eed00000000000000000101`, `...102`, `...103` |

Resultados esperados del matching con el seed:
Tester → Luna Código · Analista → Martín · Frontend → Sofía · Tester de carga → Probadora · Proyecto 3 → 409.
Kodama, Nico y Tomás no tienen proyectos sugeridos.

### Verificar el despliegue

Desde el navegador (reemplazar `<IP>` por la IP de la VM):

```text
http://<IP>:3000/healthcheck     -> {"status":"ok", ...}
http://<IP>:3000/api-docs        -> documentación Swagger
```

Desde Postman, con una variable `base = http://<IP>:3000`, probar `GET {{base}}/proyectos` (4 proyectos con el seed) y el
resto de los endpoints. Si se prefiere la terminal, desde la VM: `curl http://localhost:3000/proyectos`.

**Prueba de persistencia** (los datos deben sobrevivir):

```bash
docker compose restart api          # reinicia solo la API
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

| Colección | Contenido |
|---|---|
| `habilidades` | Catálogo de habilidades (título y código normalizado) |
| `colectivos` | Colectivos y los ids de sus proyectos |
| `proyectos` | Proyectos, estado, fecha límite y los ids de sus perfiles |
| `perfiles` | Perfiles de cada proyecto (habilidades y compromiso) |
| `logros` | Logros/hitos de cada proyecto |
| `colaboradoras` | Colaboradoras, habilidades, `aceptaMensajeria` y `mediosDeContacto` |
| `colaboraciones` | Quién colabora en qué proyecto, y si es anónima (`esAnonima`) |
| `notificaciones` | Mensajes internos y el resultado de cada envío externo (`envios`) |

**Lo que la API oculta pero la base conserva.** La anonimidad y los datos de contacto se protegen en la capa de la API
(los `GET` y los DTO), pero el registro real se guarda completo en la base:

```js
// Contribuciones anónimas: la base guarda quién fue; el GET público no lo muestra
db.colaboraciones.find({ esAnonima: true })

// Colaboradoras que aceptaron mensajería, con sus medios de contacto (nunca salen por la API)
db.colaboradoras.find(
  { aceptaMensajeria: true },
  { _id: 0, idColaborador: 1, nombreFantasia: 1, mediosDeContacto: 1 }
)

// Últimos mensajes enviados y el estado de cada canal
db.notificaciones.find().sort({ fecha: -1 }).limit(5)
```

> Los medios de contacto están guardados en texto plano. Por eso Mongo no se expone: solo se accede por SSH a la VM.

Consulta de una sola línea (sin entrar a `mongosh`):

```bash
docker compose exec mongo mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" --authenticationDatabase admin "$MONGODB_DB_NAME" \
  --quiet --eval 'db.colaboraciones.find({ esAnonima: true }).toArray()'
```

**Opcional: MongoDB Compass desde tu compu, con un túnel SSH.**

1. En `docker-compose.yml`, dentro del servicio `mongo`, agregar el puerto **solo para la propia VM**:
   ```yaml
       ports:
         - "127.0.0.1:27017:27017"
   ```
   y aplicar con `docker compose up -d`. **Nunca** usar `0.0.0.0` ni abrir el 27017 en el firewall.
2. Desde tu compu (con `gcloud` instalado), abrir el túnel:
   ```bash
   gcloud compute ssh instancia-despliegue --zone southamerica-west1-b -- -N -L 27018:localhost:27017
   ```
3. En Compass conectarse a: `mongodb://<MONGO_USER>:<MONGO_PASSWORD>@localhost:27018/codigo_a_voluntad?authSource=admin`

Cuando no se use más, sacar la línea `ports` y volver a hacer `docker compose up -d`.

### Notificaciones

`POST /notificaciones` guarda el mensaje interno y lo replica por cada medio de contacto de la colaboradora (EMAIL, SMS,
WHATSAPP). **Por defecto el envío es simulado**: no hace falta configurar nada y cada intento queda en `envios` con
estado `SIMULADO`. En los logs aparece con el contacto enmascarado (`docker compose logs api | grep notificaciones`).

| Estado en `envios` | Significado |
|---|---|
| `SIMULADO` | El canal no está configurado: no se envió nada real |
| `ENVIADO` | El proveedor aceptó el mensaje |
| `FALLIDO` | Falló el canal; el mensaje interno se guarda igual |

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

| Síntoma | Causa probable | Solución |
|---|---|---|
| `port is already allocated` al levantar | Un contenedor viejo (por ejemplo de la entrega anterior) ocupa el puerto 3000 | `docker ps`, y luego `docker stop NOMBRE` y `docker rm NOMBRE`. O cambiar `API_PORT` en el `.env` |
| `Error conectando a MongoDB: getaddrinfo EAI_AGAIN mongo` | La API no resuelve el nombre `mongo` en la red de Docker, típico tras un primer arranque fallido | `docker compose down` y `docker compose up -d` |
| La API queda en `health: starting` y se reinicia | El proceso se cierra al fallar | `docker compose logs --tail 30 api` y actuar según el error |
| `Authentication failed` | El volumen de Mongo se creó con otro usuario o contraseña (el usuario se crea solo la primera vez) | `docker compose down -v`, `docker compose up -d --build` y volver a correr el seed |
| `Falta MONGO_PASSWORD en .env` | No existe el `.env` en la raíz del proyecto | Crearlo al lado de `docker-compose.yml` |
| El seed falla con un error de validación (por ejemplo `proyecto is required`) | La imagen tiene una versión vieja del código | `git pull`, `docker compose build` y volver a correr el seed |
| `mongo` se reinicia con `Illegal instruction` | La CPU de la VM no expone instrucciones AVX, que MongoDB 5+ necesita | Habilitar el modo de CPU «host passthrough» o usar `image: mongo:4.4` |
| Responde desde la VM pero no desde afuera | Falta la regla de firewall para el puerto 3000, o se usó `https://` | Crear la regla `tcp:3000` y usar `http://` |
| `docker: command not found` / `permission denied` | Docker no está instalado, o el usuario no está en el grupo `docker` | Ver «Requisitos en la VM», o usar `sudo docker ...` |
| Las notificaciones salen siempre `SIMULADO` | Es lo esperado sin configuración | Ver «Notificaciones → envío real» |

### Consideraciones

- **Seguridad:** Mongo solo es accesible desde la red interna de Docker y con usuario y contraseña. La API se sirve sin
  HTTPS y sin autenticación (la autenticación corresponde a la entrega 3).
- **Node en el Dockerfile:** hoy usa `node:20-alpine`. Mongoose 9 exige Node 20.19 o superior y Node 20 ya no tiene soporte;
  conviene pasar a `node:22-alpine` y correr con `USER node`.
- **Economía:** una sola VM, imágenes oficiales y gratuitas. No hay réplica ni backups de Mongo: adecuado para un trabajo
  académico, no para producción.
- **Datos de prueba:** todo lo creado por la API sobrevive a los reinicios. Para volver al estado inicial, usar el
  reinicio desde cero de arriba.
