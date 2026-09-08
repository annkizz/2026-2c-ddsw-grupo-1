const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Código a Voluntad API",
    version: "1.0.0",
    description: "API de la plataforma Código a Voluntad",
  },
  servers: [
    {
      url: "http://localhost:3001",
    },
  ],
};

const swaggerSpec = {
  ...swaggerDefinition,
  paths: {
    "/colectivos": {
      get: {
        summary: "Obtiene todos los colectivos",
        responses: {
          200: {
            description: "Lista de colectivos",
          },
        },
      },
      post: {
        summary: "Crea un colectivo",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nombre", "descripcion", "tipoDeColectivo"],
                properties: {
                  nombre: {
                    type: "string",
                    example: "Asamblea Barrial",
                  },
                  descripcion: {
                    type: "string",
                    example: "Organización comunitaria",
                  },
                  tipoDeColectivo: {
                    type: "string",
                    enum: [
                      "FUNDACIONES",
                      "ASOCIACIONES_BARRIALES",
                      "ONG",
                      "ASAMBLEA",
                    ],
                  },
                  ubicacion: {
                    type: "object",
                    properties: {
                      pais: { type: "string" },
                      provincia: { type: "string" },
                      ciudad: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Colectivo creado",
          },
          400: {
            description: "Datos inválidos",
          },
        },
      },
    },
  },
};

export default swaggerSpec;
