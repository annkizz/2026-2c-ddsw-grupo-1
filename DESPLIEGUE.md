## Despliegue

Se ejecuta con Docker Compose sobre una máquina virtual con Ubuntu. Compose levanta dos contenedores:
la API (Node/Express) y la base de datos MongoDB.

**Dockerfile y Compose se complementan:** el `Dockerfile` es la receta para construir la imagen de la API,
y `docker-compose.yml` describe cómo se levantan y conectan los contenedores (API + Mongo + volumen + variables).

### Requisitos en la VM

```bash
docker --version
docker compose version
```

Además, el puerto 3000 de la VM debe estar abierto hacia afuera (regla de firewall / grupo de seguridad del proveedor).

### Obtener el proyecto

```bash
git clone https://github.com/annkizz/2026-2c-ddsw-grupo-1.git
cd 2026-2c-ddsw-grupo-1
```

Si ya está clonado: `git pull`.

### Configurar las variables (una sola vez)

El archivo `.env` de la raíz **no se sube a git**: hay que crearlo en la VM a partir del ejemplo.

```bash
cp .env.example .env
nano .env        # poner una MONGO_PASSWORD propia (solo letras y números)
```

| Variable | Para qué sirve |
|---|---|
| `MONGO_USER` / `MONGO_PASSWORD` | Usuario administrador de Mongo (se crea al inicializar el volumen) |
| `MONGODB_DB_NAME` | Nombre de la base de datos |
| `API_PORT` | Puerto de la VM por el que se accede a la API |
| `ALLOWED_ORIGINS` | Orígenes permitidos por CORS (vacío = cualquiera) |

> La contraseña no puede tener caracteres como `@ : / ?` porque se arma una URL de conexión con ella.

### Levantar todo

```bash
docker compose up -d --build
```

- `--build` construye la imagen de la API con el `Dockerfile`.
- `-d` deja todo corriendo de fondo.
- Los datos de Mongo se guardan en el volumen `mongo-data` y sobreviven a reinicios y a nuevos despliegues.
- Mongo no se expone fuera de Docker: solo la API puede conectarse.

### Cargar los datos iniciales (seed)

Se hace una vez, y se puede repetir sin duplicar datos:

```bash
docker compose run --rm seed
```

### Verificar el despliegue

```bash
docker compose ps              # mongo y api deben figurar como "healthy"
docker compose logs api        # debe decir "MongoDB conectado" y "Backend escuchando en puerto 3000"
```

Prueba funcional de punta a punta (desde la VM; desde afuera, reemplazar `localhost` por la IP pública):

```bash
curl http://localhost:3000/healthcheck
curl http://localhost:3000/habilidades
curl http://localhost:3000/proyectos
# Perfiles del proyecto 1: copiar el idPerfil de "Tester"
curl http://localhost:3000/proyectos/seed-proyecto-1/perfiles
# Colaboradoras para ese perfil: debe aparecer "Luna Código" y nadie más
curl http://localhost:3000/proyectos/seed-proyecto-1/perfiles/<idPerfil>/colaboradoras
# Proyectos para dev-sofia (React): debe aparecer "Mapa de comedores comunitarios"
curl http://localhost:3000/colaboradoras/seed-colaboradora-2/proyectos
```

Y desde el navegador:

```text
http://<IPPUBLICA>:3000/healthcheck     -> {"status":"ok", ...}
http://<IPPUBLICA>:3000/api-docs        -> documentación Swagger
```

**Prueba de persistencia:** apagar y volver a levantar sin borrar datos; las consultas deben seguir devolviendo lo mismo.

```bash
docker compose down
docker compose up -d
curl http://localhost:3000/proyectos
```

### Actualizar el despliegue

```bash
git pull
docker compose up -d --build
```

### Apagar

```bash
docker compose down         # apaga los contenedores, conserva los datos
docker compose down -v      # CUIDADO: además borra los datos de Mongo
```

### Problemas frecuentes

- **La API no conecta / "Authentication failed":** el usuario de Mongo se crea solo la primera vez que se inicializa el volumen. Si antes se levantó sin usuario, o se cambió la contraseña, hay que recrear el volumen una vez: `docker compose down -v && docker compose up -d --build` (después, correr el seed de nuevo).
- **`mongo` se reinicia con "Illegal instruction":** la CPU de la VM no expone instrucciones AVX, que MongoDB 5+ necesita. Habilitar el modo "host passthrough" de CPU en el hipervisor, o usar `image: mongo:4.4` en el compose.
- **Desde afuera no responde pero desde la VM sí:** falta abrir el puerto 3000 en el firewall de la VM.
- **"Falta MONGO_PASSWORD en .env":** no existe el archivo `.env` en la raíz del proyecto (ver "Configurar las variables").
