## Despliegue

Se va a ejecutar dentro de un contenedor Docker sobre una máquina virtual que utiliza Ubuntu.

### Obtener el proyecto

Clonar el repositorio y acceder a la carpeta:

```bash
git clone https://github.com/annkizz/2026-2c-ddsw-grupo-1.git
cd 2026-2c-ddsw-grupo-1
```

Si el proyecto ya se encuentra clonado, se debe actualizar con:

```bash
git pull
```

### Construir la imagen Docker

Desde la raíz del proyecto:

```bash
docker build -t codigo-a-voluntad .
```

### Ejecutar el contenedor

```bash
docker run -d --name api \
  -p 3000:3000 \
  -e SERVER_PORT=3000 \
  --restart unless-stopped \
  codigo-a-voluntad
```

Va a quedar disponible en el puerto `3000`.

### Verificar el despliegue

Para comprobar que el contenedor está ejecutándose:

```bash
docker ps
```

Para consultar los logs:

```bash
docker logs api
```

También se puede verificar el estado de la API accediendo al endpoint:

```text
http://34.176.212.196:3000/healthcheck
```

La API debería responder con un estado `ok`.

### Actualizar el despliegue

Cuando haya nuevos cambios en el repositorio:

```bash
git pull
docker build -t codigo-a-voluntad .
docker rm -f api
docker run -d --name api \
  -p 3000:3000 \
  -e SERVER_PORT=3000 \
  --restart unless-stopped \
  codigo-a-voluntad
```
