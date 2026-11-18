import { agregarDocumentacionDeAuth } from "./swaggerAuth.js";
import { agregarDocumentacionDeWebhooks } from "./swaggerWebhooks.js";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Código a Voluntad API",
    version: "1.0.0",
    description: "API de la plataforma Código a Voluntad",
  },
  servers: [
    {
      url: "/",
    },
  ],
};
const swaggerSpec = {
  ...swaggerDefinition,
  paths: {
    "/colectivos": {
      get: {
        summary: "Obtiene todos los colectivos",
        parameters: [
          {
            name: "etiqueta",
            in: "query",
            required: false,
            schema: { type: "array", items: { type: "string" } },
            style: "form",
            explode: true,
            description:
              "req 34: opcional. Filtra resultados x etiqueta. Permite buscar varias etiquetas al mismo tiempo y devuelve los colectivos que tengan al menos una de las etiquetas especificadas.",
          },
        ],
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
                  etiquetas: {
                    type: "array",
                    maxItems: 10,
                    items: { type: "string", maxLength: 30 },
                    example: ["Accesibilidad Web", "Alimentos"],
                    description:
                      "req 34: Lista de etiquetas pesonalizadas (max 10, de 1 a 30 caracteres c/u). Normalizadas y sin duplicados",
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
    "/etiquetas": {
      get: {
        summary: "Lista todas las etiquetas en uso (req 34)",
        description:
          "Devuelve listado de las etiquetas en uso de proyectos y colectivos, ordenadas y sin duplicados",
        responses: {
          200: {
            description: "Lista de codigos de etiquetas",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { type: "string" },
                  example: ["accesibilidad_web", "alimentos", "salud"],
                },
              },
            },
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
                  descripcion: {
                    type: "string",
                    default: "",
                    example: "Diseño de piezas para medios digitales",
                  },
                },
                additionalProperties: false,
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
    "/proyectos/{idProyecto}/perfiles/{id}/colaboradoras": {
      get: {
        summary:
          "Busca colaboradoras candidatas para un perfil específico de un proyecto",
        description:
          "Exige al menos una de las habilidades requeridas y excluye personas ya anotadas. Las opcionales no son obligatorias. Las habilidades se guardan con los titulos canonicos del catalogo.",
        parameters: [
          {
            name: "idProyecto",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ID del proyecto",
          },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ID del perfil del proyecto",
          },
        ],
        responses: {
          200: {
            description:
              "Lista de colaboradoras compatibles con el perfil, ordenada por puntaje descendente",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      nombreFantasia: { type: "string" },
                      usuarioGitHub: { type: "string" },
                      pronombres: {
                        type: "array",
                        items: { type: "string" },
                      },
                      presentacion: { type: "string" },
                      tieneCoincidencia: { type: "boolean" },
                      puntaje: {
                        type: "integer",
                        description:
                          "2 por cada habilidad requerida en común + 1 por cada opcional",
                      },
                      puntajeMaximo: {
                        type: "integer",
                        description:
                          "Máximo posible del perfil: 2 por requerida + 1 por opcional",
                      },
                      porcentajeCobertura: {
                        type: "integer",
                        description:
                          "Puntaje alcanzado sobre el máximo posible del perfil",
                      },
                      requeridasCoincidentes: {
                        type: "array",
                        items: { type: "string" },
                      },
                      opcionalesCoincidentes: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "Proyecto o perfil no encontrado",
          },
          409: {
            description: "El proyecto está finalizado",
          },
        },
      },
    },
    "/colaboradoras/{id}/proyectos": {
      get: {
        summary:
          "Busca proyectos abiertos y compatibles con las habilidades de una colaboradora",
        description:
          "Excluye proyectos donde ya participa y exige al menos una de las habilidades requeridas de al menos un perfil. Las opcionales no son obligatorias. Las habilidades se guardan con los titulos canonicos del catalogo.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ID de la colaboradora",
          },
        ],
        responses: {
          200: {
            description:
              "Lista de proyectos compatibles, ordenada por puntaje descendente",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      titulo: { type: "string" },
                      descripcion: { type: "string" },
                      puntaje: {
                        type: "integer",
                        description:
                          "Suma del puntaje de todos los perfiles compatibles",
                      },
                      puntajeMaximo: {
                        type: "integer",
                        description:
                          "Suma del máximo posible de los perfiles con requeridas del proyecto",
                      },
                      porcentajeCobertura: {
                        type: "integer",
                        description:
                          "Puntaje alcanzado sobre el máximo posible del proyecto",
                      },
                      porcentajeRequeridas: {
                        type: "integer",
                        description:
                          "Habilidades requeridas cubiertas sobre el total de requeridas del proyecto",
                      },
                      perfilesCompatibles: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            descripcion: { type: "string" },
                            compromiso: {
                              type: "object",
                              additionalProperties: true,
                            },
                            puntaje: {
                              type: "integer",
                              description:
                                "2 por cada requerida en común + 1 por cada opcional",
                            },
                            puntajeMaximo: {
                              type: "integer",
                              description:
                                "Máximo posible del perfil: 2 por requerida + 1 por opcional",
                            },
                            porcentajeCobertura: {
                              type: "integer",
                              description:
                                "Puntaje alcanzado sobre el máximo posible del perfil",
                            },
                            requeridasCoincidentes: {
                              type: "array",
                              items: { type: "string" },
                            },
                            opcionalesCoincidentes: {
                              type: "array",
                              items: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          404: {
            description: "La colaboradora no existe",
          },
        },
      },
    },
    "/proyectos/{idProyecto}/perfiles": {
      get: {
        summary: "Obtiene los perfiles de un proyecto",
        parameters: [
          {
            name: "idProyecto",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Id del proyecto",
          },
        ],
        responses: {
          200: {
            description: "Lista de perfiles del proyecto",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Perfil" },
                },
              },
            },
          },
          404: { description: "Proyecto no encontrado" },
        },
      },
      post: {
        summary: "Crea un perfil dentro de un proyecto",
        parameters: [
          {
            name: "idProyecto",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Id del proyecto",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CrearPerfil",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Perfil creado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Perfil" },
              },
            },
          },
          400: { description: "Datos inválidos" },
          404: { description: "Proyecto o habilidad no encontrados" },
        },
      },
    },
    "/proyectos/{idProyecto}/perfiles/{id}": {
      get: {
        summary: "Obtiene un perfil de un proyecto",
        parameters: [
          {
            name: "idProyecto",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Id del proyecto",
          },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Id del perfil",
          },
        ],
        responses: {
          200: {
            description: "Perfil del proyecto",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Perfil" },
              },
            },
          },
          404: { description: "Proyecto o perfil no encontrado" },
        },
      },
      put: {
        summary: "Actualiza un perfil de un proyecto",
        parameters: [
          {
            name: "idProyecto",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Id del proyecto",
          },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Id del perfil",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CrearPerfil",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Perfil actualizado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Perfil" },
              },
            },
          },
          400: { description: "Datos inválidos" },
          404: { description: "Proyecto, perfil o habilidad no encontrados" },
        },
      },
      delete: {
        summary: "Elimina un perfil de un proyecto",
        parameters: [
          {
            name: "idProyecto",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Id del proyecto",
          },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Id del perfil",
          },
        ],
        responses: {
          204: { description: "Perfil eliminado" },
          404: { description: "Proyecto o perfil no encontrado" },
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
                    minLength: 1,
                    example:
                      "Estudiante de Diseño Industrial, disponible fines de semana",
                  },
                  pronombres: {
                    type: "array",
                    items: { type: "string" },
                    example: ["ella", "elle"],
                  },
                  aceptaMensajeria: {
                    type: "boolean",
                    default: false,
                    description:
                      "Consentimiento para que los colectivos la contacten mediante la plataforma",
                  },
                  mediosDeContacto: {
                    type: "array",
                    default: [],
                    items: {
                      oneOf: [
                        {
                          type: "object",
                          required: ["tipoDeContacto", "contacto"],
                          properties: {
                            tipoDeContacto: { type: "string", enum: ["EMAIL"] },
                            contacto: {
                              type: "string",
                              format: "email",
                              example: "persona@example.org",
                            },
                          },
                          additionalProperties: false,
                        },
                        {
                          type: "object",
                          required: ["tipoDeContacto", "contacto"],
                          properties: {
                            tipoDeContacto: {
                              type: "string",
                              enum: ["SMS", "WHATSAPP"],
                            },
                            contacto: {
                              type: "string",
                              pattern: "^\\+\\d{10,15}$",
                              example: "+541112345678",
                            },
                          },
                          additionalProperties: false,
                        },
                      ],
                    },
                  },
                  habilidades: {
                    type: "array",
                    minItems: 1,
                    items: { type: "string" },
                    example: ["Modelado 3D"],
                  },
                },
                additionalProperties: false,
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
    "/proyectos": {
      get: {
        summary: "Obtiene todos los proyectos",
        parameters: [
          {
            name: "etiqueta",
            in: "query",
            required: false,
            schema: { type: "array", items: { type: "string" } },
            style: "form",
            explode: true,
            description:
              "req 34: opcional. Filtra resultados x etiqueta. Permite buscar varias etiquetas al mismo tiempo y devuelve los proyectos que tengan al menos una de las etiquetas especificadas.",
          },
          {
            name: "provincia",
            in: "query",
            required: false,
            schema: { type: "array", items: { type: "string" } },
            style: "form",
            explode: true,
            description:
              "req 15: opcional. Filtra por provincia (nombre o codigo ISO 3166-2:AR). Ignora acentos y mayusculas. Se puede repetir para buscar varias provincias.",
          },
          {
            name: "estado",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["ACTIVO", "FINALIZADO"],
            },
            description:
              "Búsquedas: opcional. Filtra por estado. La pantalla de búsqueda de proyectos envía ACTIVO; sin este parámetro se devuelven todos.",
          },
          {
            name: "idColectivo",
            in: "query",
            required: false,
            schema: { type: "array", items: { type: "string" } },
            style: "form",
            explode: true,
            description:
              "Búsquedas: opcional. Filtra por el id del colectivo dueño del proyecto. Se puede repetir para buscar varios colectivos.",
          },
          {
            name: "habilidad",
            in: "query",
            required: false,
            schema: { type: "array", items: { type: "string" } },
            style: "form",
            explode: true,
            description:
              "Búsquedas: opcional. Filtra proyectos que tengan al menos un perfil con alguna de las habilidades indicadas (requeridas u opcionales). Se manda el título de la habilidad.",
          },
          {
            name: "modo",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["cualquiera"] },
            description:
              "Búsquedas: opcional. Con modo=cualquiera el proyecto entra si coincide en AL MENOS UNO de los filtros (habilidad, etiqueta, provincia o colectivo) y cada proyecto incluye 'coincidencias' indicando en qué coincidió. Sin este parámetro todos los filtros se combinan con AND.",
          },
        ],
        responses: {
          200: {
            description:
              "Lista de proyectos. Con modo=cualquiera cada proyecto incluye coincidencias: [{ tipo: HABILIDAD|ETIQUETA|PROVINCIA|COLECTIVO, valor }]",
          },
        },
      },
      post: {
        summary: "Crea un nuevo proyecto para un colectivo",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["idColectivo", "titulo", "descripcion"],
                properties: {
                  idColectivo: {
                    type: "string",
                    example: "c00000000000000000000001",
                  },
                  titulo: {
                    type: "string",
                    example: "Desarrollo de plataforma web",
                  },
                  descripcion: {
                    type: "string",
                    example: "Necesitamos programadores para la web solidaria",
                  },
                  fechaLimiteCierre: {
                    type: "string",
                    format: "date-time",
                    description: "Opcional; debe ser futura.",
                  },
                  etiquetas: {
                    type: "array",
                    maxItems: 10,
                    items: { type: "string", maxLength: 30 },
                    example: ["Accesibilidad Web", "Salud"],
                    description:
                      "req 34: Lista de etiquetas pesonalizadas (max 10, de 1 a 30 caracteres c/u). Normalizadas y sin duplicados",
                  },
                  ubicacion: {
                    type: "object",
                    description:
                      "req 15: opcional. Si no se envia, se hereda la ubicacion del colectivo; si el colectivo tampoco tiene, el proyecto queda sin ubicacion.",
                    properties: {
                      provincia: {
                        type: "string",
                        example: "Cordoba",
                        description:
                          "Nombre o alias de provincia (se normaliza a codigo ISO 3166-2:AR en la respuesta). La ubicacion guardada incluye ademas codigoPais/nombrePais para que el mapa pueda agrupar por pais.",
                      },
                      ciudad: { type: "string", example: "Córdoba" },
                    },
                    required: ["provincia"],
                    additionalProperties: false,
                  },
                  busquedaAbierta: {
                    type: "boolean",
                    default: false,
                    description:
                      "Opcional. Indica si la búsqueda de colaboraciones está abierta; por defecto queda cerrada.",
                  },
                  fechaLimiteBusqueda: {
                    type: "string",
                    format: "date-time",
                    nullable: true,
                    description:
                      "Opcional. Debe ser futura y solo se puede indicar con busquedaAbierta en true.",
                  },
                },
                additionalProperties: false,
              },
            },
          },
        },
        responses: {
          201: { description: "Proyecto creado exitosamente" },
          400: { description: "Datos inválidos o faltan campos obligatorios" },
          404: {
            description: "El colectivo no existe",
          },
        },
      },
    },
    "/proyectos/destacados": {
      get: {
        summary: "Obtiene proyectos destacados vigentes",
        description:
          "Devuelve proyectos activos cuyo periodo de destacado todavía no venció, ordenados por fecha de vencimiento más próxima.",
        responses: {
          200: { description: "Lista pública de proyectos destacados" },
        },
      },
    },
    "/proyectos/ubicaciones": {
      get: {
        summary: "Distribucion de proyectos activos por region (req 15)",
        description:
          "Devuelve los proyectos activos que cuentan con ubicacion agrupados por provincia (nivel=provincia, default) o por pais (nivel=pais), con la cantidad de cada grupo y el detalle (titulo, ciudad y colectivo) para el listado del mapa. Los proyectos finalizados no se incluyen. Ordenado por cantidad descendente y luego por nombre.",
        parameters: [
          {
            in: "query",
            name: "nivel",
            required: false,
            schema: {
              type: "string",
              enum: ["provincia", "pais"],
              default: "provincia",
            },
            description:
              "Region por la que se agrupa. provincia usa codigoProvincia; pais usa codigoPais.",
          },
        ],
        responses: {
          200: {
            description: "Regiones con proyectos",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      nivel: {
                        type: "string",
                        enum: ["provincia", "pais"],
                        example: "provincia",
                      },
                      codigo: { type: "string", example: "AR-M" },
                      nombre: { type: "string", example: "Mendoza" },
                      cantidad: { type: "integer", example: 2 },
                      proyectos: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            titulo: { type: "string" },
                            ciudad: {
                              type: "string",
                              nullable: true,
                              example: "Godoy Cruz",
                            },
                            colectivo: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                nombre: { type: "string" },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "El nivel del mapa no es valido",
          },
        },
      },
    },
    "/proyectos/{idProyecto}/colaboraciones": {
      get: {
        summary: "Obtiene las contribuciones públicas de un proyecto",
        parameters: [
          {
            in: "path",
            name: "idProyecto",
            required: true,
            schema: { type: "string" },
            description: "ID del proyecto",
          },
        ],
        responses: {
          200: {
            description:
              "Lista de contribuciones; las anónimas no incluyen identidad de la colaboradora",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    required: [
                      "idProyecto",
                      "idPerfil",
                      "fecha",
                      "esAnonima",
                    ],
                    properties: {
                      idProyecto: { type: "string" },
                      idPerfil: { type: "string", nullable: true },
                      fecha: { type: "string", format: "date-time" },
                      esAnonima: { type: "boolean" },
                      colaborador: {
                        type: "object",
                        description:
                          "Solo se incluye cuando la contribución no es anónima",
                        properties: {
                          id: { type: "string" },
                          nombreFantasia: { type: "string" },
                          usuarioGitHub: { type: "string" },
                          nombre: { type: "string" },
                          apellido: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: "Proyecto no encontrado" },
        },
      },
    },
    "/proyectos/{idProyecto}/perfiles/{idPerfil}/postulaciones": {
      post: {
        summary: "Crea una postulación pendiente a un perfil del proyecto",
        description:
          "Requiere sesión autenticada como colaboradora con perfil registrado. La identidad se obtiene del perfil asociado a la cuenta.",
        parameters: [
          {
            in: "path",
            name: "idProyecto",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "idPerfil",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  esAnonima: { type: "boolean", default: false },
                },
                additionalProperties: false,
              },
            },
          },
        },
        responses: {
          201: { description: "Postulación creada en estado PENDIENTE" },
          400: { description: "Datos inválidos" },
          401: { description: "Sesión no autenticada" },
          403: {
            description: "El usuario no tiene un perfil de colaboradora registrado",
          },
          404: { description: "Proyecto, perfil o colaboradora no encontrada" },
          409: {
            description:
              "Búsqueda cerrada, proyecto finalizado, incompatibilidad o postulación duplicada",
          },
        },
      },
    },
    "/proyectos/{idProyecto}/postulaciones": {
      get: {
        security: [{ bearerAuth: [] }],
        summary: "Lista las postulaciones de un proyecto",
        description:
          "Requiere sesión autenticada como COLECTIVO dueño del proyecto. Las postulaciones pendientes y rechazadas no incluyen identidad. Los datos de la colaboradora solo se incluyen después de aceptar.",
        parameters: [
          {
            in: "path",
            name: "idProyecto",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Lista de postulaciones",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Postulacion" },
                },
              },
            },
          },
          404: { description: "Proyecto no encontrado" },
          401: { description: "Sesión no autenticada" },
          403: {
            description: "El colectivo autenticado no es dueño del proyecto",
          },
        },
      },
    },
    "/proyectos/{idProyecto}/postulaciones/{idPostulacion}": {
      patch: {
        summary: "Acepta o rechaza una postulación pendiente",
        description:
          "Requiere sesión autenticada del colectivo dueño del proyecto.",
        parameters: [
          {
            in: "path",
            name: "idProyecto",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "idPostulacion",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["decision"],
                properties: {
                  decision: {
                    type: "string",
                    enum: ["ACEPTADA", "RECHAZADA"],
                  },
                },
                additionalProperties: false,
              },
            },
          },
        },
        responses: {
          200: { description: "Postulación resuelta" },
          400: { description: "Decisión inválida" },
          401: { description: "Sesión no autenticada" },
          403: {
            description: "El colectivo autenticado no es dueño del proyecto",
          },
          404: { description: "Proyecto o postulación no encontrada" },
          409: {
            description:
              "Postulación ya resuelta, proyecto cerrado o límite alcanzado",
          },
        },
      },
    },
    "/proyectos/{idProyecto}/colaboraciones/{idColaborador}": {
      delete: {
        summary: "Da de baja a una colaboradora del proyecto",
        description:
          "La colaboración permanece en el historial y libera la vacante del perfil. Requiere autenticación de la colaboradora asociada o del colectivo dueño.",
        parameters: [
          {
            in: "path",
            name: "idProyecto",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "idColaborador",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Colaboración dada de baja" },
          404: { description: "Proyecto o colaboración no encontrada" },
          401: { description: "Sesión no autenticada" },
          403: {
            description:
              "El actor autenticado no puede dar de baja esta colaboración",
          },
          409: { description: "La colaboración ya fue dada de baja" },
        },
      },
    },
    "/proyectos/{idProyecto}/destacado": {
      patch: {
        summary: "Configura o quita el destacado de un proyecto",
        description:
          "Requiere un token Bearer de un usuario con rol ADMINISTRADOR. Al destacar, la fecha de vencimiento es obligatoria y futura; los proyectos finalizados no pueden destacarse.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "idProyecto",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  {
                    type: "object",
                    required: ["destacado", "destacadoHasta"],
                    properties: {
                      destacado: { type: "boolean", enum: [true] },
                      destacadoHasta: {
                        type: "string",
                        format: "date-time",
                      },
                    },
                    additionalProperties: false,
                  },
                  {
                    type: "object",
                    required: ["destacado"],
                    properties: {
                      destacado: { type: "boolean", enum: [false] },
                    },
                    additionalProperties: false,
                  },
                ],
              },
            },
          },
        },
        responses: {
          200: { description: "Destacado actualizado" },
          400: { description: "Fecha inválida o vencimiento no futuro" },
          401: { description: "Sesión no autenticada" },
          403: { description: "La cuenta no pertenece al equipo administrativo" },
          404: { description: "Proyecto no encontrado" },
          409: { description: "No se puede destacar un proyecto finalizado" },
        },
      },
    },
    "/proyectos/{idProyecto}/cierre": {
      patch: {
        summary: "Cierra un proyecto",
        parameters: [
          {
            in: "path",
            name: "idProyecto",
            required: true,
            schema: { type: "string" },
            description: "ID del proyecto",
          },
        ],
        responses: {
          200: { description: "Proyecto cerrado exitosamente" },
          404: { description: "Proyecto no encontrado" },
        },
      },
    },
    "/proyectos/{idProyecto}/cierre-programado": {
      patch: {
        summary: "Programa la fecha límite de cierre automático de un proyecto",
        parameters: [
          {
            in: "path",
            name: "idProyecto",
            required: true,
            schema: { type: "string" },
            description: "ID del proyecto",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fechaLimiteCierre"],
                properties: {
                  fechaLimiteCierre: {
                    type: "string",
                    format: "date-time",
                    description:
                      "Fecha y hora en que se cerrará el proyecto. Debe ser futura.",
                    example: "2026-12-31T23:59:59Z",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Cierre programado; devuelve el proyecto actualizado",
          },
          400: {
            description:
              "Body inválido (falta la fecha o no es una fecha válida) o la fecha no es futura",
          },
          404: { description: "Proyecto no encontrado" },
          409: {
            description: "El proyecto ya está finalizado",
          },
        },
      },
    },
    "/proyectos/{idProyecto}/avance": {
      patch: {
        summary: "Actualiza el avance de un proyecto",
        description:
          "Se debe enviar al menos un campo; los campos omitidos conservan su valor actual.",
        parameters: [
          {
            in: "path",
            name: "idProyecto",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  porcentajeConcrecion: {
                    type: "number",
                    minimum: 0,
                    maximum: 100,
                    example: 50,
                  },
                  enlaceSistema: {
                    type: "string",
                    format: "uri",
                    example: "https://demo.example.org",
                  },
                  enlaceCodigoFuente: {
                    type: "string",
                    format: "uri",
                    example: "https://github.com/organizacion/proyecto",
                  },
                },
                additionalProperties: false,
              },
            },
          },
        },
        responses: {
          200: {
            description: "Avance actualizado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    idProyecto: { type: "string" },
                    porcentajeConcrecion: { type: "number" },
                    enlaceSistema: { type: "string", nullable: true },
                    enlaceCodigoFuente: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
          400: { description: "Body invalido o sin campos de avance" },
          404: { description: "Proyecto no encontrado" },
        },
      },
    },
    "/proyectos/{idProyecto}/logros": {
      get: {
        summary: "Lista los logros de un proyecto",
        parameters: [
          {
            in: "path",
            name: "idProyecto",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Logros del proyecto",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Logro" },
                },
              },
            },
          },
          404: { description: "Proyecto no encontrado" },
        },
      },
      post: {
        summary: "Crea un logro para un proyecto",
        parameters: [
          {
            in: "path",
            name: "idProyecto",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CrearLogro" },
            },
          },
        },
        responses: {
          201: {
            description: "Logro creado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Logro" },
              },
            },
          },
          400: { description: "Body invalido" },
          404: { description: "Proyecto no encontrado" },
        },
      },
    },
    "/proyectos/{idProyecto}/logros/{id}": {
      get: {
        summary: "Obtiene un logro de un proyecto",
        parameters: [
          {
            in: "path",
            name: "idProyecto",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Logro encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Logro" },
              },
            },
          },
          404: { description: "Proyecto o logro no encontrado" },
        },
      },
      put: {
        summary: "Actualiza un logro de un proyecto",
        parameters: [
          {
            in: "path",
            name: "idProyecto",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CrearLogro" },
            },
          },
        },
        responses: {
          200: {
            description: "Logro actualizado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Logro" },
              },
            },
          },
          400: { description: "Body invalido" },
          404: { description: "Proyecto o logro no encontrado" },
        },
      },
      delete: {
        summary: "Elimina un logro de un proyecto",
        parameters: [
          {
            in: "path",
            name: "idProyecto",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          204: { description: "Logro eliminado" },
          404: { description: "Proyecto o logro no encontrado" },
        },
      },
    },
        "/proyectos/{idProyecto}": {
      get: {
        summary: "Obtiene el detalle de un proyecto",
        parameters: [
          {
            in: "path",
            name: "idProyecto",
            required: true,
            schema: { type: "string" },
            description: "ID del proyecto",
          },
        ],
        responses: {
          200: { description: "Detalle del proyecto, con su avance y el estado de la búsqueda" },
          404: { description: "Proyecto no encontrado" },
        },
      },
      put: {
        summary: "Edita el título, la descripción y las etiquetas de un proyecto",
        parameters: [
          {
            in: "path",
            name: "idProyecto",
            required: true,
            schema: { type: "string" },
            description: "ID del proyecto",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["titulo", "descripcion"],
                properties: {
                  titulo: { type: "string", example: "Portal de turnos solidarios" },
                  descripcion: {
                    type: "string",
                    example: "Sitio para que voluntarias y voluntarios reserven turnos.",
                  },
                  etiquetas: {
                    type: "array",
                    maxItems: 10,
                    items: { type: "string", maxLength: 30 },
                    example: ["Accesibilidad Web", "Salud"],
                    description:
                      "req 34: Lista de etiquetas personalizadas (max 10, de 1 a 30 caracteres c/u).",
                  },
                },
                additionalProperties: false,
              },
            },
          },
        },
        responses: {
          200: { description: "Proyecto actualizado" },
          400: { description: "Datos inválidos" },
          404: { description: "Proyecto no encontrado" },
        },
      },
    },
    "/proyectos/{idProyecto}/busqueda": {
      put: {
        summary: "Configura la búsqueda de colaboraciones de un proyecto",
        description:
          "Reemplaza la configuración completa. Al cerrar la búsqueda se borra la fecha límite.",
        parameters: [
          {
            in: "path",
            name: "idProyecto",
            required: true,
            schema: { type: "string" },
            description: "ID del proyecto",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["busquedaAbierta"],
                properties: {
                  busquedaAbierta: { type: "boolean", example: true },
                  fechaLimiteBusqueda: {
                    type: "string",
                    format: "date-time",
                    description:
                      "Opcional. Debe ser futura y requiere busquedaAbierta en true.",
                    example: "2026-12-31T23:59:59Z",
                  },
                },
                additionalProperties: false,
              },
            },
          },
        },
        responses: {
          200: { description: "Búsqueda configurada; devuelve el proyecto actualizado" },
          400: {
            description:
              "Datos inválidos, fecha no futura, o fecha indicada con la búsqueda cerrada",
          },
          404: { description: "Proyecto no encontrado" },
          409: { description: "El proyecto está finalizado" },
        },
      },
    },
    "/notificaciones": {
      get: {
        summary: "Lista notificaciones",
        description:
          "Devuelve las notificaciones más recientes primero. Se puede filtrar por colectivo, colaboradora o ambos.",
        parameters: [
          {
            in: "query",
            name: "idColectivo",
            required: false,
            schema: { type: "string" },
            example: "c00000000000000000000001",
          },
          {
            in: "query",
            name: "idColaborador",
            required: false,
            schema: { type: "string" },
            example: "b00000000000000000000001",
          },
        ],
        responses: {
          200: {
            description:
              "Lista de notificaciones. No incluye emails ni teléfonos.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Notificacion" },
                },
              },
            },
          },
          400: {
            description: "Filtros inválidos o no soportados",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      post: {
        summary: "Crea un mensaje interno para una colaboradora",
        description:
          "Requiere que la colaboradora haya aceptado mensajería. Se guarda el mensaje interno antes de intentar el envío por los medios de contacto guardados para ella. Cada intento se informa en envios: si un canal no tiene configuración, su estado será SIMULADO; los fallos se informan como FALLIDO. La respuesta nunca incluye los destinos de contacto.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CrearNotificacion",
              },
              example: {
                idColectivo: "c00000000000000000000001",
                idColaborador: "b00000000000000000000001",
                contenido: "Hola, queremos colaborar.",
              },
            },
          },
        },
        responses: {
          201: {
            description:
              "Mensaje guardado con el resultado de cada intento de envío",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Notificacion" },
                example: {
                  id: "8f09d4b54eb34fc0a72a150",
                  fecha: "2026-10-15T04:20:00.000Z",
                  contenido: "Hola, queremos colaborar.",
                  idColectivo: "c00000000000000000000001",
                  idColaborador: "b00000000000000000000001",
                  envios: [
                    {
                      tipoDeContacto: "EMAIL",
                      estado: "SIMULADO",
                      detalle: "SMTP no configurado",
                    },
                  ],
                },
              },
            },
          },
          400: {
            description: "Body inválido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          403: {
            description: "La colaboradora no aceptó mensajería",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          404: {
            description: "Colectivo o colaboradora no encontrados",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/notificaciones/{id}": {
      get: {
        summary: "Obtiene una notificación por ID",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description:
              "Notificación encontrada. No incluye emails ni teléfonos.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Notificacion" },
              },
            },
          },
          404: {
            description: "Notificación no encontrada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      CrearPerfil: {
        type: "object",
        required: ["descripcion", "habilidadesRequeridas", "compromiso"],
        properties: {
          descripcion: { type: "string", minLength: 1, example: "Tester" },
          habilidadesRequeridas: {
            type: "array",
            minItems: 1,
            items: { type: "string" },
            example: ["Testing E2E con Cypress"],
          },
          habilidadesOpcionales: {
            type: "array",
            items: { type: "string" },
            default: [],
            example: [],
          },
          limiteColaboraciones: {
            type: "integer",
            minimum: 1,
            nullable: true,
            description: "Sin límite cuando se omite o es null.",
          },
          compromiso: {
            type: "object",
            required: ["tipoCompromiso", "horas", "tipoColaboracion"],
            properties: {
              tipoCompromiso: {
                type: "string",
                enum: ["TOTALES", "MENSUALES", "SEMANALES"],
              },
              horas: { type: "integer", minimum: 1, example: 5 },
              tipoColaboracion: {
                type: "string",
                enum: ["GRATUITA", "INCENTIVO", "CONTRATACION"],
              },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
      Perfil: {
        type: "object",
        required: [
          "id",
          "idProyecto",
          "descripcion",
          "habilidadesRequeridas",
          "habilidadesOpcionales",
          "limiteColaboraciones",
          "compromiso",
        ],
        properties: {
          id: { type: "string", description: "ObjectId de MongoDB" },
          idProyecto: { type: "string", description: "ObjectId de MongoDB" },
          descripcion: { type: "string" },
          habilidadesRequeridas: {
            type: "array",
            items: { type: "string" },
          },
          habilidadesOpcionales: {
            type: "array",
            items: { type: "string" },
          },
          limiteColaboraciones: {
            type: "integer",
            minimum: 1,
            nullable: true,
            description:
              "Máximo de colaboraciones que se necesitan para este perfil. null significa sin límite.",
            example: 2,
          },
          compromiso: { $ref: "#/components/schemas/Compromiso" },
        },
      },
      Postulacion: {
        type: "object",
        required: [
          "id",
          "idProyecto",
          "idPerfil",
          "estado",
          "fechaPostulacion",
          "esAnonima",
        ],
        properties: {
          id: { type: "string" },
          idProyecto: { type: "string" },
          idPerfil: { type: "string" },
          estado: {
            type: "string",
            enum: ["PENDIENTE", "ACEPTADA", "RECHAZADA"],
          },
          fechaPostulacion: { type: "string", format: "date-time" },
          esAnonima: { type: "boolean" },
          colaborador: {
            type: "object",
            description: "Solo se incluye después de aceptar la postulación.",
          },
        },
      },
      Compromiso: {
        type: "object",
        required: ["tipoCompromiso", "horas", "tipoColaboracion"],
        properties: {
          tipoCompromiso: {
            type: "string",
            enum: ["TOTALES", "MENSUALES", "SEMANALES"],
          },
          horas: { type: "integer", minimum: 1 },
          tipoColaboracion: {
            type: "string",
            enum: ["GRATUITA", "INCENTIVO", "CONTRATACION"],
          },
        },
      },
      CrearLogro: {
        type: "object",
        required: ["titulo", "descripcion", "fecha"],
        properties: {
          titulo: { type: "string", minLength: 1 },
          descripcion: { type: "string", minLength: 1 },
          fecha: { type: "string", format: "date-time" },
        },
        additionalProperties: false,
      },
      Logro: {
        type: "object",
        required: ["id", "idProyecto", "titulo", "descripcion", "fecha"],
        properties: {
          id: { type: "string", description: "ObjectId de MongoDB" },
          idProyecto: { type: "string", description: "ObjectId de MongoDB" },
          titulo: { type: "string" },
          descripcion: { type: "string" },
          fecha: { type: "string", format: "date-time" },
        },
      },
      CrearNotificacion: {
        type: "object",
        required: ["idColectivo", "idColaborador", "contenido"],
        properties: {
          idColectivo: {
            type: "string",
            description: "ID del colectivo emisor",
            example: "c00000000000000000000001",
          },
          idColaborador: {
            type: "string",
            description: "ID de la colaboradora destinataria",
            example: "b00000000000000000000001",
          },
          contenido: {
            type: "string",
            minLength: 4,
            example: "Hola, queremos colaborar.",
          },
        },
        additionalProperties: false,
      },
      Notificacion: {
        type: "object",
        required: [
          "id",
          "fecha",
          "contenido",
          "idColectivo",
          "idColaborador",
          "envios",
        ],
        properties: {
          id: { type: "string", description: "ObjectId de MongoDB" },
          fecha: { type: "string", format: "date-time" },
          contenido: { type: "string" },
          idColectivo: { type: "string", description: "ObjectId de MongoDB" },
          idColaborador: { type: "string", description: "ObjectId de MongoDB" },
          envios: {
            type: "array",
            items: { $ref: "#/components/schemas/ResultadoEnvio" },
          },
        },
      },
      ResultadoEnvio: {
        type: "object",
        required: ["tipoDeContacto", "estado"],
        properties: {
          tipoDeContacto: {
            type: "string",
            enum: ["EMAIL", "SMS", "WHATSAPP"],
          },
          estado: {
            type: "string",
            enum: ["ENVIADO", "SIMULADO", "FALLIDO"],
          },
          detalle: { type: "string" },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          codigo: {},
          timestamp: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

agregarDocumentacionDeAuth(swaggerSpec);
agregarDocumentacionDeWebhooks(swaggerSpec);

export default swaggerSpec;
