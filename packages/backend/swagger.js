const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Código a Voluntad API",
    version: "1.0.0",
    description: "API de la plataforma Código a Voluntad",
  },
  servers: [
    {
      url: "http://localhost:8000",
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
    "/habilidades": {
      get: {
        summary: "Obtiene todas las habilidades",
        responses: {
          200: {
            description: "Lista de habilidades",
          },
        },
      },
      post: {
        summary: "Crea una habilidad",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["titulo"],
                properties: {
                  titulo: {
                    type: "string",
                    example: "Diseño gráfico",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Habilidad creada",
          },
          400: {
            description: "Datos inválidos",
          },
        },
      },
    },
        "/colaboradoras": {
      get: {
        summary: "Obtiene todas las personas colaboradoras",
        responses: {
          200: {
            description: "Lista de colaboradoras",
          },
        },
      },
      post: {
        summary: "Crea una persona colaboradora",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["habilidades"],
                properties: {
                  nombreFantasia: { type: "string", example: "Anon_42" },
                  usuarioGitHub: { type: "string", example: "cande-dev" },
                  nombre: { type: "string", example: "Candela" },
                  apellido: { type: "string", example: "Perez" },
                  presentacion: {
                    type: "string",
                    example: "Estudiante de Diseño Industral, disponible fines de semana",
                  },
                  pronombres: {
                    type: "array",
                    items: { type: "string" },
                    example: ["ella", "elle"],
                  },
                  habilidades: {
                    type: "array",
                    items: { type: "string" },
                    example: ["Modelado 3D"],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Colaboradora creada" },
          400: { description: "Datos inválidos" },
          404: { description: "Alguna habilidad indicada no existe" },
        },
      },
    },
  },
};



export default swaggerSpec;

