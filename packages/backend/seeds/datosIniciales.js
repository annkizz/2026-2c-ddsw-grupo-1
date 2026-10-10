const enDias = (dias) => new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

export const habilidades = [
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
];

export const colectivos = [
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

export const proyectos = [
  {
    idProyecto: "seed-proyecto-1",
    idColectivo: "seed-colectivo-1",
    titulo: "Portal de turnos solidarios",
    descripcion: "Sitio para que voluntarias y voluntarios reserven turnos.",
    estado: "ACTIVO",
    fechaInicio: enDias(-30),
    fechaLimiteCierre: null,
    perfiles: [
      {
        descripcion: "Tester",
        habilidadesRequeridas: ["Testing E2E con Cypress"],
        habilidadesOpcionales: ["Uso de Soap UI"],
        compromiso: { tipoCompromiso: "MENSUALES", horas: 5, tipoColaboracion: "GRATUITA" },
      },
      {
        descripcion: "Analista de Datos",
        habilidadesRequeridas: ["Conocimientos de Pandas"],
        habilidadesOpcionales: ["SQL"],
        compromiso: { tipoCompromiso: "MENSUALES", horas: 15, tipoColaboracion: "INCENTIVO" },
      },
    ],
  },
  {
    idProyecto: "seed-proyecto-2",
    idColectivo: "seed-colectivo-3",
    titulo: "Mapa de comedores comunitarios",
    descripcion: "Mapa interactivo y accesible de comedores de todo el país.",
    estado: "ACTIVO",
    fechaInicio: enDias(-10),
    fechaLimiteCierre: enDias(60),
    perfiles: [
      {
        descripcion: "Desarrollo frontend",
        habilidadesRequeridas: ["React"],
        habilidadesOpcionales: ["Accesibilidad web", "Diseño UX/UI"],
        compromiso: { tipoCompromiso: "SEMANALES", horas: 6, tipoColaboracion: "GRATUITA" },
      },
    ],
  },
  {
    idProyecto: "seed-proyecto-3",
    idColectivo: "seed-colectivo-2",
    titulo: "Inventario de donaciones",
    descripcion: "Sistema para registrar las donaciones que recibe la despensa.",
    estado: "FINALIZADO",
    fechaInicio: enDias(-120),
    fechaLimiteCierre: enDias(-20),
    perfiles: [
      {
        descripcion: "Desarrollo backend",
        habilidadesRequeridas: ["Node.js"],
        habilidadesOpcionales: ["MongoDB"],
        compromiso: { tipoCompromiso: "TOTALES", horas: 40, tipoColaboracion: "CONTRATACION" },
      },
    ],
  },
];

export const colaboradoras = [
  {
    idColaborador: "seed-colaboradora-1",
    nombreFantasia: "Luna Código", // anónima
    presentacion: "QA con ganas de aportar a causas sociales.",
    pronombres: ["ella"],
    habilidades: ["Testing E2E con Cypress", "Uso de Soap UI", "Jest"],
  },
  {
    idColaborador: "seed-colaboradora-2",
    usuarioGitHub: "dev-sofia", 
    pronombres: ["ella", "elle"],
    habilidades: ["React", "Diseño UX/UI", "Accesibilidad web"],
  },
  {
    idColaborador: "seed-colaboradora-3",
    nombre: "Martín", 
    apellido: "Gómez",
    habilidades: ["Conocimientos de Pandas", "SQL", "Python"],
  },
  {
    idColaborador: "seed-colaboradora-4",
    nombreFantasia: "Kodama", 
    habilidades: ["Uso de Soap UI"],
  },
  {
    idColaborador: "seed-colaboradora-5",
    usuarioGitHub: "nico-node", 
    habilidades: ["Node.js", "MongoDB", "React"],
  },
  {
    idColaborador: "seed-colaboradora-6",
    nombreFantasia: "Tomás", 
    habilidades: ["Jest"],
  },
];

export const colaboraciones = [
  { idProyecto: "seed-proyecto-3", idColaborador: "seed-colaboradora-5", fecha: enDias(-100) },
  { idProyecto: "seed-proyecto-2", idColaborador: "seed-colaboradora-5", fecha: enDias(-5) },
];
