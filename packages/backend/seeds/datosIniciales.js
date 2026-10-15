// Datos iniciales para demo y pruebas manuales (Postman). Son datos puros, sin
// acceso a la base, para poder validarlos y probarlos sin Mongo.
//
// TODOS los ids son fijos (incluidos los de perfiles y logros), asi las
// requests de Postman se escriben una sola vez y no hay que copiar ids.
// Los ids de Mongo son 24 caracteres hexadecimales: los perfiles usan una
// secuencia predecible para facilitar las pruebas manuales.

const MIN = 60 * 1000;
const DIA = 24 * 60 * MIN;

export function crearDatosIniciales({ ahora = new Date(), minutosParaCierre = 5 } = {}) {
  const enDias = (dias) => new Date(ahora.getTime() + dias * DIA);
  const enMinutos = (min) => new Date(ahora.getTime() + min * MIN);

  const habilidades = [
    "Testing E2E con Cypress",
    "Uso de Soap UI",
    "Conocimientos de Pandas",
    "React",
    "Node.js",
    "Jest",
    "SQL",
    "MongoDB",
    "Python",
    "Diseño UX/UI",
    "Accesibilidad web",
    "Pruebas de carga con k6", // sólo la usa el proyecto laboratorio (seed-proyecto-4)
  ];

  const colectivos = [
    {
      idColectivo: "seed-colectivo-1",
      nombre: "Fundación Manos Solidarias",
      descripcion: "Fundación que organiza turnos de voluntariado en hospitales.",
      tipoDeColectivo: "FUNDACIONES",
      ubicacion: { pais: "Argentina", provincia: "Buenos Aires", ciudad: "Lomas de Zamora" },
    },
    {
      idColectivo: "seed-colectivo-2",
      nombre: "Asociación Vecinal Barrio Norte",
      descripcion: "Vecinas y vecinos que gestionan una despensa comunitaria.",
      tipoDeColectivo: "ASOCIACIONES_BARRIALES",
      ubicacion: { pais: "Argentina", provincia: "Córdoba", ciudad: "Córdoba" },
    },
    {
      idColectivo: "seed-colectivo-3",
      nombre: "Datos para Todos",
      descripcion: "ONG que publica datos abiertos sobre acceso a alimentos.",
      tipoDeColectivo: "ONG",
    },
  ];

  const proyectos = [
    {
      // Matching: Tester -> Luna; Analista -> Martín. Sin colaboraciones.
      idProyecto: "seed-proyecto-1",
      idColectivo: "seed-colectivo-1",
      titulo: "Portal de turnos solidarios",
      descripcion: "Sitio para que voluntarias y voluntarios reserven turnos.",
      estado: "ACTIVO",
      fechaInicio: enDias(-30),
      fechaLimiteCierre: null,
      porcentajeConcrecion: 0,
      enlaceSistema: null,
      enlaceCodigoFuente: null,
      perfiles: [
        {
          idPerfil: "000000000000000000000001",
          descripcion: "Tester",
          habilidadesRequeridas: ["Testing E2E con Cypress"],
          habilidadesOpcionales: ["Uso de Soap UI"],
          compromiso: { tipoCompromiso: "MENSUALES", horas: 5, tipoColaboracion: "GRATUITA" },
        },
        {
          idPerfil: "000000000000000000000002",
          descripcion: "Analista de Datos",
          habilidadesRequeridas: ["Conocimientos de Pandas"],
          habilidadesOpcionales: ["SQL"],
          compromiso: { tipoCompromiso: "MENSUALES", horas: 15, tipoColaboracion: "INCENTIVO" },
        },
      ],
      logros: [
        {
          idLogro: "5eed00000000000000000101",
          titulo: "Prototipo navegable",
          descripcion: "Mockups aprobados por el colectivo.",
          fecha: enDias(-20),
        },
        {
          idLogro: "5eed00000000000000000102",
          titulo: "Reserva de turnos en línea",
          descripcion: "Primera versión funcional del flujo de reserva.",
          fecha: enDias(-5),
        },
      ],
    },
    {
      // Matching: Frontend -> Sofía (Nico ya colabora, de forma anónima).
      idProyecto: "seed-proyecto-2",
      idColectivo: "seed-colectivo-3",
      titulo: "Mapa de comedores comunitarios",
      descripcion: "Mapa interactivo y accesible de comedores de todo el país.",
      estado: "ACTIVO",
      fechaInicio: enDias(-10),
      fechaLimiteCierre: enDias(60),
      porcentajeConcrecion: 0,
      enlaceSistema: null,
      enlaceCodigoFuente: null,
      perfiles: [
        {
          idPerfil: "000000000000000000000003",
          descripcion: "Desarrollo frontend",
          habilidadesRequeridas: ["React"],
          habilidadesOpcionales: ["Accesibilidad web", "Diseño UX/UI"],
          compromiso: { tipoCompromiso: "SEMANALES", horas: 6, tipoColaboracion: "GRATUITA" },
        },
      ],
      logros: [],
    },
    {
      // FINALIZADO: buscar colaboradoras da 409, anotarse da 409, no se recomienda.
      idProyecto: "seed-proyecto-3",
      idColectivo: "seed-colectivo-2",
      titulo: "Inventario de donaciones",
      descripcion: "Sistema para registrar las donaciones que recibe la despensa.",
      estado: "FINALIZADO",
      fechaInicio: enDias(-120),
      fechaLimiteCierre: enDias(-20),
      porcentajeConcrecion: 0,
      enlaceSistema: null,
      enlaceCodigoFuente: null,
      perfiles: [
        {
          idPerfil: "000000000000000000000004",
          descripcion: "Desarrollo backend",
          habilidadesRequeridas: ["Node.js"],
          habilidadesOpcionales: ["MongoDB"],
          compromiso: { tipoCompromiso: "TOTALES", horas: 40, tipoColaboracion: "CONTRATACION" },
        },
      ],
      logros: [
        {
          idLogro: "5eed00000000000000000103",
          titulo: "Entrega final",
          descripcion: "Sistema en uso por la despensa.",
          fecha: enDias(-25),
        },
      ],
    },
    {
      // LABORATORIO: se cierra solo `minutosParaCierre` minutos después de correr el
      // seed (cierre automático). Su habilidad es exclusiva, no interfiere con el
      // resto del matching. Al volver a correr el seed se reabre.
      idProyecto: "seed-proyecto-4",
      idColectivo: "seed-colectivo-1",
      titulo: "Laboratorio de pruebas",
      descripcion: "Proyecto para probar anotación, cierre programado y cierre automático.",
      estado: "ACTIVO",
      fechaInicio: enDias(-1),
      fechaLimiteCierre: enMinutos(minutosParaCierre),
      porcentajeConcrecion: 0,
      enlaceSistema: null,
      enlaceCodigoFuente: null,
      perfiles: [
        {
          idPerfil: "000000000000000000000005",
          descripcion: "Tester de carga",
          habilidadesRequeridas: ["Pruebas de carga con k6"],
          habilidadesOpcionales: ["Jest"],
          compromiso: { tipoCompromiso: "TOTALES", horas: 10, tipoColaboracion: "GRATUITA" },
        },
      ],
      logros: [],
    },
  ];

  // Campos opcionales omitidos a propósito: pronombres, presentación, nombre, etc.
  const colaboradoras = [
    {
      idColaborador: "seed-colaboradora-1",
      nombreFantasia: "Luna Código", // anónima
      presentacion: "QA con ganas de aportar a causas sociales.",
      pronombres: ["ella"],
      habilidades: ["Testing E2E con Cypress", "Uso de Soap UI", "Jest"],
    },
    {
      idColaborador: "seed-colaboradora-2",
      usuarioGitHub: "dev-sofia", // con cuenta de GitHub
      pronombres: ["ella", "elle"],
      habilidades: ["React", "Diseño UX/UI", "Accesibilidad web"],
    },
    {
      idColaborador: "seed-colaboradora-3",
      nombre: "Martín", // con nombre y apellido
      apellido: "Gómez",
      habilidades: ["Conocimientos de Pandas", "SQL", "Python"],
    },
    {
      idColaborador: "seed-colaboradora-4",
      nombreFantasia: "Kodama", // sólo una habilidad OPCIONAL del Tester: no es candidata y no puede anotarse
      habilidades: ["Uso de Soap UI"],
    },
    {
      idColaborador: "seed-colaboradora-5",
      usuarioGitHub: "nico-node", // ya colabora (p3 y p2): se excluye de esas búsquedas
      pronombres: ["él"],
      habilidades: ["Node.js", "MongoDB", "React"],
    },
    {
      idColaborador: "seed-colaboradora-6",
      nombreFantasia: "Tomás", // ninguna habilidad requerida por algún perfil
      habilidades: ["Jest"],
    },
    {
      idColaborador: "seed-colaboradora-7",
      nombreFantasia: "Probadora", // candidata sólo del laboratorio (seed-proyecto-4)
      habilidades: ["Pruebas de carga con k6"],
    },
  ];

  const colaboraciones = [
    // Pública: GET /proyectos/seed-proyecto-3/colaboraciones muestra a Nico.
    { idProyecto: "seed-proyecto-3", idColaborador: "seed-colaboradora-5", fecha: enDias(-100), esAnonima: false },
    // Anónima: GET /proyectos/seed-proyecto-2/colaboraciones NO muestra quién es.
    { idProyecto: "seed-proyecto-2", idColaborador: "seed-colaboradora-5", fecha: enDias(-5), esAnonima: true },
  ];

  return { habilidades, colectivos, proyectos, colaboradoras, colaboraciones };
}
