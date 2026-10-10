import { describe, expect, it } from "@jest/globals";
import { evaluarCoincidencia } from "../../domain/Matching.js";
import { MatchingService } from "../../services/MatchingService.js";

const crearProyecto = (idProyecto, finalizado = false) => ({
  idProyecto,
  titulo: idProyecto,
  descripcion: `${idProyecto} descripción`,
  estaFinalizado: () => finalizado,
});

const colaboradoras = [
  {
    idColaborador: "solo-opcionales",
    nombreFantasia: "Solo opcionales",
    habilidades: ["Jest", "SQL"],
  },
  {
    idColaborador: "parcial",
    nombreFantasia: "Coincidencia parcial",
    habilidades: ["React", "Jest"],
  },
  {
    idColaborador: "completa",
    nombreFantasia: "Coincidencia completa",
    habilidades: ["React", "Node.js", "Jest", "SQL"],
    nombre: "Nombre privado",
    mediosContacto: ["privado@example.com"],
    colaboraciones: [],
  },
];

const proyectos = [
  crearProyecto("proyecto-1"),
  crearProyecto("proyecto-2"),
  crearProyecto("proyecto-cerrado", true),
  crearProyecto("proyecto-anotado"),
];

const perfiles = [
  {
    _id: "perfil-1",
    proyecto: "proyecto-1",
    descripcion: "Frontend",
    habilidadesRequeridas: ["React", "Node.js"],
    habilidadesOpcionales: ["Jest", "SQL"],
    compromiso: { tipoCompromiso: "MENSUALES", horas: 5 },
  },
  {
    _id: "perfil-2",
    proyecto: "proyecto-2",
    descripcion: "Frontend inicial",
    habilidadesRequeridas: ["React"],
    habilidadesOpcionales: [],
    compromiso: { tipoCompromiso: "TOTALES", horas: 10 },
  },
  {
    _id: "perfil-cerrado",
    proyecto: "proyecto-cerrado",
    descripcion: "Frontend",
    habilidadesRequeridas: ["React"],
    habilidadesOpcionales: [],
  },
  {
    _id: "perfil-anotado",
    proyecto: "proyecto-anotado",
    descripcion: "Frontend",
    habilidadesRequeridas: ["React"],
    habilidadesOpcionales: [],
  },
];

function crearServicio(colaboraciones = []) {
  return new MatchingService(
    {
      obtenerTodos: async () => colaboradoras,
      encontrarPorId: async (id) =>
        colaboradoras.find((colaboradora) => colaboradora.idColaborador === id),
    },
    {
      encontrarPorId: async (id) =>
        proyectos.find((proyecto) => proyecto.idProyecto === id),
      obtenerTodos: async () => proyectos,
      obtenerTodasColaboraciones: async () => colaboraciones,
    },
    {
      buscarPorId: async (id) => perfiles.find((perfil) => perfil._id === id),
      obtenerTodos: async (idProyecto) =>
        perfiles.filter((perfil) => perfil.proyecto === idProyecto),
    },
  );
}

describe("evaluarCoincidencia", () => {
  it("normaliza habilidades y exige al menos una requerida", () => {
    const perfil = {
      habilidadesRequeridas: ["Testing E2E con Cypress", "React"],
      habilidadesOpcionales: ["Jest"],
    };

    expect(
      evaluarCoincidencia(perfil, ["  testing   e2e CON cypress  "]),
    ).toMatchObject({
      tieneCoincidencia: true,
      requeridasCoincidentes: ["Testing E2E con Cypress"],
      porcentajeCoincidencia: 33,
    });
    expect(evaluarCoincidencia(perfil, ["Jest"]).tieneCoincidencia).toBe(
      false,
    );
  });
});

describe("MatchingService.buscarColaboradorasParaPerfil", () => {
  it("devuelve coincidencias ordenadas y omite datos privados", async () => {
    const resultado = await crearServicio().buscarColaboradorasParaPerfil(
      "proyecto-1",
      "perfil-1",
    );

    expect(resultado.map((c) => c.idColaborador)).toEqual([
      "completa",
      "parcial",
    ]);
    expect(resultado[0]).toMatchObject({
      requeridasCoincidentes: ["React", "Node.js"],
      opcionalesCoincidentes: ["Jest", "SQL"],
      porcentajeCoincidencia: 100,
    });
    expect(resultado[0]).not.toHaveProperty("nombre");
    expect(resultado[0]).not.toHaveProperty("mediosContacto");
    expect(resultado[0]).not.toHaveProperty("colaboraciones");
  });

  it("excluye colaboradoras ya anotadas en el proyecto", async () => {
    const servicio = crearServicio([
      {
        proyecto: { idProyecto: "proyecto-1" },
        colaborador: { idColaborador: "completa" },
      },
    ]);

    const resultado = await servicio.buscarColaboradorasParaPerfil(
      "proyecto-1",
      "perfil-1",
    );

    expect(resultado.map((c) => c.idColaborador)).toEqual(["parcial"]);
  });

  it("devuelve errores si faltan el proyecto o el perfil", async () => {
    const servicio = crearServicio();

    await expect(
      servicio.buscarColaboradorasParaPerfil("inexistente", "perfil-1"),
    ).rejects.toMatchObject({ codigo: "PROYECTO_NO_ENCONTRADO", status: 404 });
    await expect(
      servicio.buscarColaboradorasParaPerfil("proyecto-1", "inexistente"),
    ).rejects.toMatchObject({ codigo: "PERFIL_NO_ENCONTRADO", status: 404 });
    await expect(
      servicio.buscarColaboradorasParaPerfil("proyecto-2", "perfil-1"),
    ).rejects.toMatchObject({ codigo: "PERFIL_NO_ENCONTRADO", status: 404 });
  });

  it("no permite buscar para un proyecto finalizado", async () => {
    await expect(
      crearServicio().buscarColaboradorasParaPerfil(
        "proyecto-cerrado",
        "perfil-cerrado",
      ),
    ).rejects.toMatchObject({ codigo: "PROYECTO_FINALIZADO", status: 409 });
  });
});

describe("MatchingService.buscarProyectosParaColaboradora", () => {
  it("devuelve perfiles compatibles y omite proyectos cerrados o ya elegidos", async () => {
    const servicio = crearServicio([
      {
        proyecto: { idProyecto: "proyecto-anotado" },
        colaborador: { idColaborador: "parcial" },
      },
    ]);

    const resultado = await servicio.buscarProyectosParaColaboradora("parcial");

    expect(resultado.map((p) => p.idProyecto)).toEqual([
      "proyecto-2",
      "proyecto-1",
    ]);
    expect(resultado[0].perfilesCompatibles[0]).toMatchObject({
      idPerfil: "perfil-2",
      requeridasCoincidentes: ["React"],
      porcentajeCoincidencia: 100,
    });
    expect(resultado[1].perfilesCompatibles[0]).toMatchObject({
      idPerfil: "perfil-1",
      requeridasCoincidentes: ["React"],
      opcionalesCoincidentes: ["Jest"],
      porcentajeCoincidencia: 50,
    });
  });

  it("devuelve error cuando la colaboradora no existe", async () => {
    await expect(
      crearServicio().buscarProyectosParaColaboradora("inexistente"),
    ).rejects.toMatchObject({
      codigo: "COLABORADORA_NO_ENCONTRADA",
      status: 404,
    });
  });
});
