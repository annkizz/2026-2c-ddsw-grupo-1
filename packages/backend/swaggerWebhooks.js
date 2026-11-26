// Documentacion de los webhooks de colectivos (req 6 "De integración").
// Se aplica sobre el spec de swagger.js, igual que swaggerAuth.js.
const seguridad = [{ bearerAuth: [] }];

const parametros = (conWebhook) => [
  {
    name: "idColectivo",
    in: "path",
    required: true,
    schema: { type: "string" },
    description: "Id del colectivo (debe ser el del usuario autenticado)",
  },
  ...(conWebhook
    ? [
        {
          name: "idWebhook",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ]
    : []),
];

const respuestasDeError = {
  400: {
    description:
      "Datos inválidos o URL no permitida (WEBHOOK_URL_NO_PERMITIDA)",
  },
  401: { description: "Falta el token o es inválido" },
  403: {
    description:
      "No es un colectivo (ROL_NO_PERMITIDO) o el webhook es de otro colectivo (WEBHOOK_AJENO)",
  },
  404: { description: "El webhook no existe (WEBHOOK_NO_ENCONTRADO)" },
};

const EVENTOS = [
  "POSTULACION_CREADA",
  "COLABORACION_ACEPTADA",
  "PROYECTO_CERRADO",
];

const webhookDTO = {
  type: "object",
  properties: {
    id: { type: "string" },
    idColectivo: { type: "string" },
    url: {
      type: "string",
      example: "https://hooks.slack.com/…abcd",
      description: "Enmascarada: el token de Slack/Discord va dentro de la URL",
    },
    eventos: { type: "array", items: { type: "string", enum: EVENTOS } },
    formato: { type: "string", enum: ["GENERICO", "SLACK", "DISCORD"] },
    activo: { type: "boolean" },
    ultimaEntrega: {
      type: "object",
      nullable: true,
      properties: {
        fecha: { type: "string", format: "date-time" },
        estado: { type: "string", enum: ["ENVIADO", "FALLIDO", "SIMULADO"] },
        httpStatus: { type: "integer" },
      },
    },
    secreto: {
      type: "string",
      description:
        "Solo al crear o regenerar. Sirve para verificar la firma HMAC-SHA256 del header X-CAV-Signature.",
    },
  },
};

export function agregarDocumentacionDeWebhooks(spec) {
  const base = "/colectivos/{idColectivo}/webhooks";

  spec.paths[base] = {
    get: {
      tags: ["Webhooks"],
      summary: "Lista los webhooks del colectivo (sin secreto)",
      security: seguridad,
      parameters: parametros(false),
      responses: {
        200: {
          description: "Webhooks del colectivo",
          content: {
            "application/json": {
              schema: { type: "array", items: webhookDTO },
            },
          },
        },
        401: respuestasDeError[401],
        403: respuestasDeError[403],
      },
    },
    post: {
      tags: ["Webhooks"],
      summary: "Registra un webhook",
      description:
        "Cuando ocurra alguno de los eventos elegidos se hace un POST JSON a la URL. Máximo 5 por colectivo. La URL debe ser https y pública.",
      security: seguridad,
      parameters: parametros(false),
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["url", "eventos"],
              properties: {
                url: {
                  type: "string",
                  example: "https://discord.com/api/webhooks/123/abc",
                },
                eventos: {
                  type: "array",
                  minItems: 1,
                  items: { type: "string", enum: EVENTOS },
                },
                formato: {
                  type: "string",
                  enum: ["GENERICO", "SLACK", "DISCORD"],
                  default: "GENERICO",
                },
                activo: { type: "boolean", default: true },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description:
            "Webhook creado. Incluye el secreto: es la única vez que se muestra.",
          content: { "application/json": { schema: webhookDTO } },
        },
        400: respuestasDeError[400],
        401: respuestasDeError[401],
        403: respuestasDeError[403],
        409: {
          description:
            "Se alcanzó el máximo de webhooks (LIMITE_WEBHOOKS_ALCANZADO)",
        },
      },
    },
  };

  spec.paths[`${base}/{idWebhook}`] = {
    put: {
      tags: ["Webhooks"],
      summary: "Modifica un webhook (todos los campos son opcionales)",
      security: seguridad,
      parameters: parametros(true),
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                url: { type: "string" },
                eventos: {
                  type: "array",
                  items: { type: "string", enum: EVENTOS },
                },
                formato: {
                  type: "string",
                  enum: ["GENERICO", "SLACK", "DISCORD"],
                },
                activo: { type: "boolean" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Webhook actualizado",
          content: { "application/json": { schema: webhookDTO } },
        },
        ...respuestasDeError,
      },
    },
    delete: {
      tags: ["Webhooks"],
      summary: "Elimina un webhook (permanente)",
      security: seguridad,
      parameters: parametros(true),
      responses: { 204: { description: "Eliminado" }, ...respuestasDeError },
    },
  };

  spec.paths[`${base}/{idWebhook}/prueba`] = {
    post: {
      tags: ["Webhooks"],
      summary: "Envía un evento de prueba y devuelve el resultado",
      security: seguridad,
      parameters: parametros(true),
      responses: {
        200: {
          description: "Resultado del envío (un solo intento)",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  estado: { type: "string", enum: ["ENVIADO", "FALLIDO"] },
                  httpStatus: { type: "integer" },
                  detalle: { type: "string" },
                },
              },
            },
          },
        },
        ...respuestasDeError,
      },
    },
  };

  spec.paths[`${base}/{idWebhook}/secreto`] = {
    post: {
      tags: ["Webhooks"],
      summary: "Regenera el secreto de firma (el anterior deja de valer)",
      security: seguridad,
      parameters: parametros(true),
      responses: {
        200: {
          description:
            "Webhook con el secreto nuevo (única vez que se muestra)",
          content: { "application/json": { schema: webhookDTO } },
        },
        ...respuestasDeError,
      },
    },
  };
}
