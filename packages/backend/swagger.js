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
            description: "Lista de colaboradoras compatibles con el perfil",
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
            description: "Lista de proyectos compatibles",
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
        responses: {
          200: { description: "Lista de proyectos" },
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
                    required: ["idProyecto", "fecha", "esAnonima"],
                    properties: {
                      idProyecto: { type: "string" },
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
      post: {
        summary:
          "Crea una nueva colaboración entre un proyecto y una colaboradora.",
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
                required: ["idColaborador"],
                properties: {
                  idColaborador: {
                    type: "string",
                    example: "b00000000000000000000001",
                  },
                  esAnonima: {
                    type: "boolean",
                    default: false,
                    description:
                      "Si es true, la contribución se registra sin exponer la identidad públicamente",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Colaboración creada exitosamente" },
          400: { description: "Datos inválidos o faltan campos obligatorios" },
          404: {
            description: "El proyecto o la persona colaboradora no existe",
          },
          409: {
            description:
              "El proyecto está finalizado o la persona colaboradora ya está anotada",
          },
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
          compromiso: { $ref: "#/components/schemas/Compromiso" },
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

export default swaggerSpec;
