import { jest } from "@jest/globals";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";
import { ProyectoModel } from "../../schemas/proyectoSchema.js";
import { ColectivoModel } from "../../schemas/colectivoSchema.js";
import { ProyectoService } from "../../services/ProyectoService.js";
import { ColectivoService } from "../../services/ColectivoService.js";
import { EtiquetaService } from "../../services/EtiquetaService.js";
import {
  conectarALaBaseDePrueba,
  desconectarDeLaBaseDePrueba,
  limpiarLaBase,
} from "./utils/baseDeDatosDePrueba.js";
import { sembrarDatosIniciales } from "./utils/sembrarDatosIniciales.js";

// req 34: prueba de integracion del filtro por etiquetas.
// service y repos REALES contra mongo embebido,

//   portal turnos  = [salud, voluntariado, turnos]
//   mapa comedores = [alimentos, accesibilidad_web, datos_abiertos]
//   inventario     = [alimentos, comunidad]
//   laboratorio    = [] (sin etiquetas)
//   colectivos     = [salud, voluntariado, accesibilidad_web],
//                    [alimentos, comunidad], [datos_abiertos, accesibilidad_web]

beforeAll(async () => {
  await conectarALaBaseDePrueba();
  await Promise.all([ProyectoModel.init(), ColectivoModel.init()]);
});

afterAll(async () => {
  await desconectarDeLaBaseDePrueba();
});

beforeEach(async () => {
  await limpiarLaBase();
  await sembrarDatosIniciales();
});

describe("Filtro por etiquetas (req 34, integración sobre la seed)", () => {
  it("GET /etiquetas: une las etiquetas de proyectos y colectivos, sin repetidas y ordenadas", async () => {
    const etiquetas = await new EtiquetaService().obtenerTodas();

    expect(etiquetas).toEqual([
      "accesibilidad_web",
      "alimentos",
      "comunidad",
      "datos_abiertos",
      "salud",
      "turnos",
      "voluntariado",
    ]);
  });

  it("filtra proyectos por una etiqueta", async () => {
    const resultado = await new ProyectoService().obtenerTodos({
      etiquetas: ["turnos"],
    });

    expect(resultado).toHaveLength(1);
    expect(resultado[0].titulo).toBe("Portal de turnos solidarios");
    expect(resultado[0].etiquetas).toContain("turnos");
  });

  it("filtra con varias etiquetas con semantica OR (al menos una)", async () => {
    const resultado = await new ProyectoService().obtenerTodos({
      etiquetas: ["accesibilidad_web", "salud"],
    });

    // el mapa (accesibilidad_web) y el portal (salud); el resto no tiene ninguna
    const titulos = resultado.map((proyecto) => proyecto.titulo).sort();
    expect(titulos).toEqual([
      "Mapa de comedores comunitarios",
      "Portal de turnos solidarios",
    ]);
  });

  it("sin filtro devuelve todo, incluido quien no tiene etiquetas", async () => {
    expect(await new ProyectoService().obtenerTodos()).toHaveLength(4);
    expect(await new ColectivoService().obtenerTodos()).toHaveLength(3);
  });

  it("devuelve una lista vacia si ninguna etiqueta matchea", async () => {
    const proyectos = await new ProyectoService().obtenerTodos({
      etiquetas: ["criptografia"],
    });

    expect(proyectos).toEqual([]);
  });

  it("filtra colectivos por etiqueta", async () => {
    const colectivos = await new ColectivoService().obtenerTodos({
      etiquetas: ["datos_abiertos"],
    });

    expect(colectivos).toHaveLength(1);
    expect(colectivos[0].nombre).toBe("Datos para Todos");
  });

  it("crea un proyecto con etiquetas y despues se lo encuentra por ellas", async () => {
    const creado = await new ProyectoService().crear({
      idColectivo: "c00000000000000000000001",
      titulo: "Telemedicina para barrios",
      descripcion: "Consultas remotas con material del hospital del barrio.",
      etiquetas: ["Comunidad Virtual", "comunidad_virtual", "Salud"],
    });

    expect(creado.etiquetas).toEqual(["comunidad_virtual", "salud"]);

    const encontrados = await new ProyectoService().obtenerTodos({
      etiquetas: ["comunidad_virtual"],
    });
    expect(encontrados).toHaveLength(1);
    expect(encontrados[0].id).toBe(creado.id);
  });
});
