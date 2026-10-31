import express from "express";
import { UnauthorizedError } from "../../../errors/AppError.js";
import { crearAutenticar } from "../../../middlewares/authMiddleware.js";
import { notFoundHandler } from "../../../middlewares/notFoundHandler.js";
import { errorHandler } from "../../../middlewares/errorHandler.js";
import { ColectivoService } from "../../../services/ColectivoService.js";
import { ColaboradorService } from "../../../services/ColaboradorService.js";
import { UsuarioService } from "../../../services/UsuarioService.js";
import { ColectivoController } from "../../../controllers/ColectivoController.js";
import { ColaboradorController } from "../../../controllers/ColaboradorController.js";
import { UsuarioController } from "../../../controllers/UsuarioController.js";
import { crearColectivoRouter } from "../../../routes/colectivoRouter.js";
import { crearColaboradorRouter } from "../../../routes/colaboradorRouter.js";
import { crearUsuarioRouter } from "../../../routes/usuarioRouter.js";

// Repos en memoria con la misma interfaz que los de mongo. Reemplazan a Logto y a la base:
// el token "token-<x>" es el usuario de Logto "<x>"; cualquier otro token es invalido.
export function crearAppDeAutenticacion() {
  let contador = 0;
  const nuevoId = () => String(++contador).padStart(24, "0");

  const usuarios = [];
  const usuarioRepository = {
    buscarOCrearPorLogtoId: async (logtoId) => {
      let usuario = usuarios.find((u) => u.logtoId === logtoId);
      if (!usuario) {
        usuario = { _id: nuevoId(), logtoId };
        usuarios.push(usuario);
      }
      return usuario;
    },
    asignarRol: async (id, rol) => {
      const usuario = usuarios.find((u) => u._id === id);
      if (usuario.rol) return null;
      usuario.rol = rol;
      return usuario;
    },
    quitarRol: async (id) => {
      delete usuarios.find((u) => u._id === id).rol;
    },
  };

  const crearRepositorioDePerfiles = () => {
    const guardados = [];
    return {
      guardados,
      save: async (perfil, id = perfil._id) => {
        const doc = { proyectos: [], ...perfil, _id: id ?? nuevoId() };
        const indice = guardados.findIndex((g) => g._id === doc._id);
        if (indice >= 0) guardados[indice] = doc;
        else guardados.push(doc);
        return doc;
      },
      buscarPorId: async (id) => guardados.find((g) => g._id === id) ?? null,
      buscarPorUsuario: async (idUsuario) =>
        guardados.find((g) => g.usuario === idUsuario) ?? null,
      obtenerTodos: async () => guardados,
    };
  };
  const colectivoRepository = crearRepositorioDePerfiles();
  const colaboradorRepository = crearRepositorioDePerfiles();

  const catalogo = [
    { codigo: "react", titulo: "React" },
    { codigo: "node_js", titulo: "Node.js" },
  ];
  const habilidadRepository = {
    encontrarPorCodigos: async (codigos) =>
      catalogo.filter((habilidad) => codigos.includes(habilidad.codigo)),
  };

  const usuarioService = new UsuarioService(
    usuarioRepository,
    colectivoRepository,
    colaboradorRepository,
  );
  const autenticar = crearAutenticar(usuarioRepository, async (token) => {
    if (!token.startsWith("token-")) {
      throw new UnauthorizedError("token invalido", "TOKEN_INVALIDO");
    }
    return { sub: token.slice("token-".length) };
  });

  const app = express();
  app.use(express.json());
  app.use(
    "/colectivos",
    crearColectivoRouter(
      new ColectivoController(
        new ColectivoService(colectivoRepository, usuarioService),
      ),
      autenticar,
    ),
  );
  app.use(
    "/colaboradoras",
    crearColaboradorRouter(
      new ColaboradorController(
        new ColaboradorService(
          colaboradorRepository,
          habilidadRepository,
          usuarioService,
        ),
      ),
      autenticar,
    ),
  );
  app.use(
    "/me",
    crearUsuarioRouter(new UsuarioController(usuarioService), autenticar),
  );
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, usuarios, colectivoRepository, colaboradorRepository };
}
