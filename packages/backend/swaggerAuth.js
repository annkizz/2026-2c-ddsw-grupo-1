// Documentacion de autenticacion y de los endpoints de perfil propio.
// Se aplica sobre el spec de swagger.js, y refleja las reglas de routes/router.js.
const METODOS_QUE_MODIFICAN = ["post", "put", "patch", "delete"];

const respuestasDeAuth = {
  401: {
    description:
      "Falta el token o es invalido (TOKEN_AUSENTE / TOKEN_INVALIDO)",
  },
  403: {
    description:
      "No tiene el rol necesario (ROL_NO_PERMITIDO) o el perfil es de otra persona (PERFIL_AJENO)",
  },
};

const parametroId = (descripcion) => [
  {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string" },
    description: descripcion,
  },
];

export function agregarDocumentacionDeAuth(spec) {
  spec.components.securitySchemes = {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "Access token emitido por Logto",
    },
  };

  const { paths } = spec;

  paths["/me"] = {
    get: {
      summary: "Datos de la sesion: rol y perfil de quien inicia sesion",
      description:
        "Crea el usuario local la primera vez. rol es null hasta que registre un colectivo o una colaboradora.",
      responses: {
        200: {
          description: "Sesion actual",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  usuarioId: { type: "string" },
                  nombreUsuario: { type: "string", nullable: true },
                  rol: {
                    type: "string",
                    enum: ["COLECTIVO", "COLABORADOR"],
                    nullable: true,
                  },
                  tienePerfil: { type: "boolean" },
                  idColectivo: { type: "string", nullable: true },
                  idColaborador: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        401: respuestasDeAuth[401],
      },
    },
  };

  paths["/colectivos/{id}"] = {
    get: {
      summary: "Obtiene un colectivo",
      parameters: parametroId("Id del colectivo"),
      responses: {
        200: { description: "Colectivo" },
        404: { description: "COLECTIVO_NO_ENCONTRADO" },
      },
    },
    put: {
      summary: "Edita el perfil del colectivo (solo su duenio)",
      parameters: parametroId("Id del colectivo"),
      requestBody: paths["/colectivos"].post.requestBody,
      responses: {
        200: { description: "Colectivo actualizado" },
        400: { description: "Datos invalidos" },
        ...respuestasDeAuth,
        404: { description: "COLECTIVO_NO_ENCONTRADO" },
      },
    },
  };

  paths["/colaboradoras/me"] = {
    get: {
      summary: "Perfil propio de la colaboradora (incluye medios de contacto)",
      responses: {
        200: { description: "Perfil propio" },
        ...respuestasDeAuth,
        404: { description: "PERFIL_NO_ENCONTRADO" },
      },
    },
  };

  paths["/colaboradoras/{id}"] = {
    get: {
      summary: "Perfil publico de una colaboradora (sin medios de contacto)",
      parameters: parametroId("Id de la colaboradora"),
      responses: {
        200: { description: "Perfil publico" },
        404: { description: "COLABORADOR_NO_ENCONTRADO" },
      },
    },
    put: {
      summary:
        "Edita el perfil de la colaboradora, con habilidades y medios de contacto (solo su duenia)",
      parameters: parametroId("Id de la colaboradora"),
      requestBody: paths["/colaboradoras"].post.requestBody,
      responses: {
        200: { description: "Perfil actualizado" },
        400: { description: "Datos invalidos" },
        ...respuestasDeAuth,
        404: {
          description: "COLABORADOR_NO_ENCONTRADO o HABILIDAD_NO_ENCONTRADA",
        },
      },
    },
  };

  // alta de perfil: ademas de autenticada, falla si la cuenta ya tiene uno
  for (const ruta of ["/colectivos", "/colaboradoras"]) {
    paths[ruta].post.responses[409] = { description: "PERFIL_YA_REGISTRADO" };
  }

  // marca con el candado todo lo que exige token (misma regla que router.js)
  for (const [ruta, operaciones] of Object.entries(paths)) {
    for (const [metodo, operacion] of Object.entries(operaciones)) {
      const exigeToken =
        METODOS_QUE_MODIFICAN.includes(metodo) ||
        ruta === "/me" ||
        ruta === "/colaboradoras/me" ||
        (metodo === "get" && ruta.startsWith("/notificaciones"));
      if (exigeToken) {
        operacion.security = [{ bearerAuth: [] }];
        operacion.responses ??= {};
        operacion.responses[401] ??= respuestasDeAuth[401];
      }
    }
  }

  return spec;
}
