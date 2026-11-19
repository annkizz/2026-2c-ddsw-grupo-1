// Datos iniciales para demo y pruebas manuales (Postman). Son datos puros, sin
// acceso a la base, para poder validarlos y probarlos sin Mongo.
//
// TODOS los ids son fijos (incluidos los de perfiles y logros), asi las
// requests de Postman se escriben una sola vez y no hay que copiar ids.
// ObjectId reales de Mongo: 24 caracteres hexadecimales.
// datosIniciales: que datos (puros, sin base de datos)
// ejecutarSeed: como interpretarlos (usa repo reales)
//adaptadorDeSeed: operaciones q los repos no tienen
//seed: conecta y dispara

const MIN = 60 * 1000;
const DIA = 24 * 60 * MIN;

export function crearDatosIniciales({
  ahora = new Date(),
  minutosParaCierre = 5,
  incluirEscenariosAdicionales = false,
} = {}) {
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
    "Pruebas de carga con k6", // sólo la usa el proyecto laboratorio (a00000000000000000000004)
  ];

  const colectivos = [
    {
      id: "c00000000000000000000001",
      nombre: "Fundación Manos Solidarias",
      descripcion:
        "Fundación que organiza turnos de voluntariado en hospitales.",
      tipoDeColectivo: "FUNDACIONES",
      ubicacion: {
        pais: "Argentina",
        provincia: "Buenos Aires",
        ciudad: "Lomas de Zamora",
      },
      etiquetas: ["Salud", "Voluntariado", "Accesibilidad Web"],
    },
    {
      id: "c00000000000000000000002",
      nombre: "Asociación Vecinal Barrio Norte",
      descripcion: "Vecinas y vecinos que gestionan una despensa comunitaria.",
      tipoDeColectivo: "ASOCIACIONES_BARRIALES",
      ubicacion: { pais: "Argentina", provincia: "Córdoba", ciudad: "Córdoba" },
      etiquetas: ["Alimentos", "Comunidad"],
    },
    {
      id: "c00000000000000000000003",
      nombre: "Datos para Todos",
      descripcion: "ONG que publica datos abiertos sobre acceso a alimentos.",
      tipoDeColectivo: "ONG",
      etiquetas: ["Datos Abiertos", "Accesibilidad Web"],
    },
  ];

  const proyectos = [
    {
      // Matching: Tester -> Luna; Analista -> Martín. Sin colaboraciones.
      id: "a00000000000000000000001",
      idColectivo: "c00000000000000000000001",
      titulo: "Portal de turnos solidarios",
      descripcion: "Sitio para que voluntarias y voluntarios reserven turnos.",
      etiquetas: ["Salud", "Voluntariado", "Turnos"],
      // req 15: sin ubicacion propia; hereda Buenos Aires de su colectivo.
      estado: "ACTIVO",
      fechaInicio: enDias(-30),
      fechaLimiteCierre: null,
      porcentajeConcrecion: 0,
      enlaceSistema: null,
      enlaceCodigoFuente: null,
      perfiles: [
        {
          id: "000000000000000000000001",
          descripcion: "Tester",
          habilidadesRequeridas: ["Testing E2E con Cypress"],
          habilidadesOpcionales: ["Uso de Soap UI"],
          compromiso: {
            tipoCompromiso: "MENSUALES",
            horas: 5,
            tipoColaboracion: "GRATUITA",
          },
        },
        {
          id: "000000000000000000000002",
          descripcion: "Analista de Datos",
          habilidadesRequeridas: ["Conocimientos de Pandas"],
          habilidadesOpcionales: ["SQL"],
          compromiso: {
            tipoCompromiso: "MENSUALES",
            horas: 15,
            tipoColaboracion: "INCENTIVO",
          },
        },
      ],
      logros: [
        {
          id: "5eed00000000000000000101",
          titulo: "Prototipo navegable",
          descripcion: "Mockups aprobados por el colectivo.",
          fecha: enDias(-20),
        },
        {
          id: "5eed00000000000000000102",
          titulo: "Reserva de turnos en línea",
          descripcion: "Primera versión funcional del flujo de reserva.",
          fecha: enDias(-5),
        },
      ],
    },
    {
      // Matching: Frontend -> Sofía (Nico ya colabora, de forma anónima).
      id: "a00000000000000000000002",
      idColectivo: "c00000000000000000000003",
      titulo: "Mapa de comedores comunitarios",
      descripcion: "Mapa interactivo y accesible de comedores de todo el país.",
      etiquetas: ["Alimentos", "Accesibilidad Web", "Datos Abiertos"],
      // req 15: ubicacion propia (su colectivo no tiene): Mendoza.
      ubicacion: { provincia: "Mendoza", ciudad: "Godoy Cruz" },
      estado: "ACTIVO",
      fechaInicio: enDias(-10),
      fechaLimiteCierre: enDias(60),
      porcentajeConcrecion: 0,
      enlaceSistema: null,
      enlaceCodigoFuente: null,
      perfiles: [
        {
          id: "000000000000000000000003",
          descripcion: "Desarrollo frontend",
          habilidadesRequeridas: ["React"],
          habilidadesOpcionales: ["Accesibilidad web", "Diseño UX/UI"],
          compromiso: {
            tipoCompromiso: "SEMANALES",
            horas: 6,
            tipoColaboracion: "GRATUITA",
          },
        },
      ],
      logros: [],
    },
    {
      // FINALIZADO: buscar colaboradoras da 409, anotarse da 409, no se recomienda.
      id: "a00000000000000000000003",
      idColectivo: "c00000000000000000000002",
      titulo: "Inventario de donaciones",
      descripcion:
        "Sistema para registrar las donaciones que recibe la despensa.",
      etiquetas: ["Alimentos", "Comunidad"],
      // req 15: sin ubicacion propia; hereda Córdoba de su colectivo.
      estado: "FINALIZADO",
      fechaInicio: enDias(-120),
      fechaLimiteCierre: enDias(-20),
      porcentajeConcrecion: 0,
      enlaceSistema: null,
      enlaceCodigoFuente: null,
      perfiles: [
        {
          id: "000000000000000000000004",
          descripcion: "Desarrollo backend",
          habilidadesRequeridas: ["Node.js"],
          habilidadesOpcionales: ["MongoDB"],
          compromiso: {
            tipoCompromiso: "TOTALES",
            horas: 40,
            tipoColaboracion: "CONTRATACION",
          },
        },
      ],
      logros: [
        {
          id: "5eed00000000000000000103",
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
      id: "a00000000000000000000004",
      idColectivo: "c00000000000000000000001",
      titulo: "Laboratorio de pruebas",
      descripcion:
        "Proyecto para probar anotación, cierre programado y cierre automático.",
      // req 15: ubicacion propia distinta a la del colectivo (Buenos Aires):
      // el mapa cuenta al proyecto en Mendoza, no al colectivo.
      ubicacion: { provincia: "Mendoza", ciudad: "Mendoza" },
      estado: "ACTIVO",
      fechaInicio: enDias(-1),
      fechaLimiteCierre: enMinutos(minutosParaCierre),
      porcentajeConcrecion: 0,
      enlaceSistema: null,
      enlaceCodigoFuente: null,
      perfiles: [
        {
          id: "000000000000000000000005",
          descripcion: "Tester de carga",
          habilidadesRequeridas: ["Pruebas de carga con k6"],
          habilidadesOpcionales: ["Jest"],
          compromiso: {
            tipoCompromiso: "TOTALES",
            horas: 10,
            tipoColaboracion: "GRATUITA",
          },
        },
      ],
      logros: [],
    },
  ];

  // Campos opcionales omitidos a propósito: pronombres, presentación, nombre, etc.
  const colaboradoras = [
    {
      id: "b00000000000000000000001",
      nombreFantasia: "Luna Código", // anónima
      presentacion: "QA con ganas de aportar a causas sociales.",
      pronombres: ["ella"],
      habilidades: ["Testing E2E con Cypress", "Uso de Soap UI", "Jest"],
    },
    {
      id: "b00000000000000000000002",
      usuarioGitHub: "dev-sofia", // con cuenta de GitHub
      pronombres: ["ella", "elle"],
      habilidades: ["React", "Diseño UX/UI", "Accesibilidad web"],
    },
    {
      id: "b00000000000000000000003",
      nombre: "Martín", // con nombre y apellido
      apellido: "Gómez",
      habilidades: ["Conocimientos de Pandas", "SQL", "Python"],
    },
    {
      id: "b00000000000000000000004",
      nombreFantasia: "Kodama", // sólo una habilidad OPCIONAL del Tester: no es candidata y no puede anotarse
      habilidades: ["Uso de Soap UI"],
    },
    {
      id: "b00000000000000000000005",
      usuarioGitHub: "nico-node", // ya colabora (p3 y p2): se excluye de esas búsquedas
      pronombres: ["él"],
      habilidades: ["Node.js", "MongoDB", "React"],
    },
    {
      id: "b00000000000000000000006",
      nombreFantasia: "Tomás", // ninguna habilidad requerida por algún perfil
      habilidades: ["Jest"],
    },
    {
      id: "b00000000000000000000007",
      nombreFantasia: "Probadora", // candidata sólo del laboratorio (a00000000000000000000004)
      habilidades: ["Pruebas de carga con k6"],
    },
  ];

  const colaboraciones = [
    // Pública: GET /proyectos/a00000000000000000000003/colaboraciones muestra a Nico.
    {
      idProyecto: "a00000000000000000000003",
      idColaborador: "b00000000000000000000005",
      fecha: enDias(-100),
      esAnonima: false,
    },
    // Anónima: GET /proyectos/a00000000000000000000002/colaboraciones NO muestra quién es.
    {
      idProyecto: "a00000000000000000000002",
      idColaborador: "b00000000000000000000005",
      fecha: enDias(-5),
      esAnonima: true,
    },
  ];

  if (incluirEscenariosAdicionales) {
    habilidades.push(
      "Comunicación digital",
      "Documentación técnica",
      "Agroecología",
      "Gestión comunitaria",
      "Mapeo colaborativo",
      "Soporte técnico",
      "Educación digital",
      "Mantenimiento de computadoras",
      "Fotografía",
      "Lectura fácil",
      "Seguridad digital",
      "Accesibilidad cognitiva",
    );

    colectivos.push(
      {
        id: "c00000000000000000000004",
        nombre: "Biblioteca Popular La Estación",
        descripcion:
          "Espacio barrial de lectura, cultura y acceso a materiales educativos.",
        tipoDeColectivo: "ASOCIACIONES_BARRIALES",
        ubicacion: {
          pais: "Argentina",
          provincia: "CABA",
          ciudad: "Barracas",
        },
        etiquetas: ["Educación", "Cultura", "Accesibilidad"],
      },
      {
        id: "c00000000000000000000005",
        nombre: "Asamblea Agroecológica del Litoral",
        descripcion:
          "Vecinas y vecinos que impulsan huertas y redes de producción local.",
        tipoDeColectivo: "ASAMBLEA",
        ubicacion: {
          pais: "Argentina",
          provincia: "Entre Ríos",
          ciudad: "Paraná",
        },
        etiquetas: ["Ambiente", "Agroecología", "Comunidad"],
      },
      {
        id: "c00000000000000000000006",
        nombre: "Red de Reciclaje del Norte",
        descripcion:
          "Organización comunitaria que conecta puntos verdes y cooperativas.",
        tipoDeColectivo: "ONG",
        ubicacion: {
          pais: "Argentina",
          provincia: "Jujuy",
          ciudad: "San Salvador de Jujuy",
        },
        etiquetas: ["Ambiente", "Reciclaje", "Datos Abiertos"],
      },
    );

    proyectos.push(
      {
        id: "a00000000000000000000005",
        idColectivo: "c00000000000000000000004",
        titulo: "Biblioteca digital accesible",
        descripcion:
          "Catálogo comunitario de materiales educativos con foco en accesibilidad.",
        etiquetas: ["Educación", "Accesibilidad", "Cultura"],
        estado: "ACTIVO",
        fechaInicio: enDias(-45),
        fechaLimiteCierre: enDias(90),
        porcentajeConcrecion: 45,
        enlaceSistema: "https://example.org/biblioteca-digital",
        enlaceCodigoFuente: "https://example.org/biblioteca-codigo",
        busquedaAbierta: true,
        fechaLimiteBusqueda: enDias(30),
        destacado: true,
        destacadoHasta: enDias(30),
        perfiles: [
          {
            id: "000000000000000000000006",
            descripcion: "Auditoría de accesibilidad",
            habilidadesRequeridas: ["Accesibilidad web"],
            habilidadesOpcionales: ["Accesibilidad cognitiva"],
            compromiso: {
              tipoCompromiso: "SEMANALES",
              horas: 4,
              tipoColaboracion: "GRATUITA",
            },
            limiteColaboraciones: 2,
          },
          {
            id: "000000000000000000000007",
            descripcion: "Contenidos en lectura fácil",
            habilidadesRequeridas: ["Lectura fácil"],
            habilidadesOpcionales: ["Comunicación digital"],
            compromiso: {
              tipoCompromiso: "MENSUALES",
              horas: 6,
              tipoColaboracion: "INCENTIVO",
            },
          },
        ],
        logros: [
          {
            id: "5eed00000000000000000104",
            titulo: "Catálogo inicial publicado",
            descripcion:
              "La comunidad ya puede consultar la primera colección de materiales.",
            fecha: enDias(-5),
          },
        ],
      },
      {
        id: "a00000000000000000000006",
        idColectivo: "c00000000000000000000005",
        titulo: "Compostaje y huertas comunitarias",
        descripcion:
          "Red de huertas para compartir herramientas, saberes y cosechas.",
        etiquetas: ["Ambiente", "Alimentos", "Comunidad"],
        ubicacion: { provincia: "Entre Ríos", ciudad: "Paraná" },
        estado: "ACTIVO",
        fechaInicio: enDias(-8),
        fechaLimiteCierre: enDias(120),
        porcentajeConcrecion: 20,
        enlaceSistema: null,
        enlaceCodigoFuente: null,
        busquedaAbierta: false,
        fechaLimiteBusqueda: null,
        perfiles: [
          {
            id: "000000000000000000000008",
            descripcion: "Acompañamiento agroecológico",
            habilidadesRequeridas: ["Agroecología"],
            habilidadesOpcionales: ["Gestión comunitaria"],
            compromiso: {
              tipoCompromiso: "MENSUALES",
              horas: 8,
              tipoColaboracion: "GRATUITA",
            },
            limiteColaboraciones: 1,
          },
        ],
        logros: [],
      },
      {
        id: "a00000000000000000000007",
        idColectivo: "c00000000000000000000006",
        titulo: "Mapa de puntos verdes",
        descripcion:
          "Mapa colaborativo de espacios de reciclaje y recepción de materiales.",
        etiquetas: ["Ambiente", "Reciclaje", "Datos Abiertos", "Mapas"],
        ubicacion: { provincia: "AR-N", ciudad: "Posadas" },
        estado: "ACTIVO",
        fechaInicio: enDias(-25),
        fechaLimiteCierre: enDias(60),
        porcentajeConcrecion: 80,
        enlaceSistema: "https://example.org/mapa-puntos-verdes",
        enlaceCodigoFuente: "https://example.org/mapa-codigo",
        busquedaAbierta: true,
        fechaLimiteBusqueda: enDias(20),
        perfiles: [
          {
            id: "000000000000000000000009",
            descripcion: "Datos geográficos",
            habilidadesRequeridas: ["Python"],
            habilidadesOpcionales: ["SQL", "Mapeo colaborativo"],
            compromiso: {
              tipoCompromiso: "TOTALES",
              horas: 20,
              tipoColaboracion: "INCENTIVO",
            },
          },
          {
            id: "00000000000000000000000a",
            descripcion: "Comunicación de datos",
            habilidadesRequeridas: ["Comunicación digital"],
            habilidadesOpcionales: ["Fotografía"],
            compromiso: {
              tipoCompromiso: "SEMANALES",
              horas: 3,
              tipoColaboracion: "GRATUITA",
            },
          },
        ],
        logros: [
          {
            id: "5eed00000000000000000105",
            titulo: "Primer mapa de puntos verdes",
            descripcion: "Se incorporaron los primeros espacios del municipio.",
            fecha: enDias(-3),
          },
        ],
      },
      {
        id: "a00000000000000000000008",
        idColectivo: "c00000000000000000000004",
        titulo: "Computadoras reacondicionadas para escuelas",
        descripcion:
          "Equipos recuperados y entregados a espacios educativos de la región.",
        etiquetas: ["Educación", "Tecnología", "Comunidad"],
        ubicacion: {
          provincia: "Tierra del Fuego",
          ciudad: "Ushuaia",
        },
        estado: "FINALIZADO",
        fechaInicio: enDias(-120),
        fechaLimiteCierre: enDias(-25),
        porcentajeConcrecion: 100,
        enlaceSistema: "https://example.org/equipos-reacondicionados",
        enlaceCodigoFuente: "https://example.org/equipos-codigo",
        busquedaAbierta: false,
        fechaLimiteBusqueda: null,
        perfiles: [
          {
            id: "00000000000000000000000b",
            descripcion: "Soporte y reacondicionamiento",
            habilidadesRequeridas: ["Mantenimiento de computadoras"],
            habilidadesOpcionales: ["Soporte técnico"],
            compromiso: {
              tipoCompromiso: "TOTALES",
              horas: 30,
              tipoColaboracion: "CONTRATACION",
            },
          },
        ],
        logros: [
          {
            id: "5eed00000000000000000106",
            titulo: "Primera entrega de equipos",
            descripcion: "Se entregaron equipos reacondicionados a dos escuelas.",
            fecha: enDias(-50),
          },
          {
            id: "5eed00000000000000000107",
            titulo: "Cierre del programa",
            descripcion: "El colectivo cerró el ciclo de reacondicionamiento.",
            fecha: enDias(-25),
            publicacionLinkedin: {
              estado: "FALLIDO",
              fecha: enDias(-24),
              detalle:
                "Publicación de demostración: no se conectó una cuenta de LinkedIn.",
            },
          },
        ],
      },
      {
        id: "a00000000000000000000009",
        idColectivo: "c00000000000000000000006",
        titulo: "Talleres de alfabetización digital",
        descripcion:
          "Encuentros para acompañar a personas que comienzan a usar herramientas digitales.",
        etiquetas: ["Educación", "Tecnología", "Inclusión"],
        estado: "ACTIVO",
        fechaInicio: enDias(-2),
        fechaLimiteCierre: enDias(90),
        porcentajeConcrecion: 10,
        enlaceSistema: null,
        enlaceCodigoFuente: null,
        busquedaAbierta: true,
        fechaLimiteBusqueda: enDias(45),
        perfiles: [
          {
            id: "00000000000000000000000c",
            descripcion: "Facilitación de talleres",
            habilidadesRequeridas: ["Educación digital"],
            habilidadesOpcionales: ["Lectura fácil"],
            compromiso: {
              tipoCompromiso: "MENSUALES",
              horas: 10,
              tipoColaboracion: "GRATUITA",
            },
            limiteColaboraciones: 3,
          },
        ],
        logros: [],
      },
      {
        id: "a00000000000000000000010",
        idColectivo: "c00000000000000000000005",
        titulo: "Laboratorio de seguridad digital",
        descripcion:
          "Guías prácticas para proteger cuentas y dispositivos de organizaciones comunitarias.",
        etiquetas: ["Tecnología", "Seguridad", "Educación"],
        ubicacion: { provincia: "AR-L", ciudad: "Santa Rosa" },
        estado: "ACTIVO",
        fechaInicio: enDias(-15),
        fechaLimiteCierre: enDias(60),
        porcentajeConcrecion: 35,
        enlaceSistema: null,
        enlaceCodigoFuente: null,
        busquedaAbierta: false,
        fechaLimiteBusqueda: null,
        destacado: true,
        destacadoHasta: enDias(-1),
        perfiles: [
          {
            id: "00000000000000000000000d",
            descripcion: "Revisión de seguridad",
            habilidadesRequeridas: ["Seguridad digital"],
            habilidadesOpcionales: ["Documentación técnica"],
            compromiso: {
              tipoCompromiso: "SEMANALES",
              horas: 5,
              tipoColaboracion: "GRATUITA",
            },
          },
        ],
        logros: [],
      },
    );

    colaboradoras.push(
      {
        id: "b00000000000000000000008",
        nombreFantasia: "Rena Accesibilidad",
        presentacion: "Prueba interfaces con distintas tecnologías de apoyo.",
        pronombres: ["ella"],
        habilidades: ["Accesibilidad web", "Accesibilidad cognitiva", "Diseño UX/UI"],
      },
      {
        id: "b00000000000000000000009",
        nombre: "Ariel",
        apellido: "Paz",
        pronombres: ["elle"],
        presentacion: "Escribe contenidos claros para proyectos comunitarios.",
        habilidades: ["Lectura fácil", "Comunicación digital", "Documentación técnica"],
      },
      {
        id: "b0000000000000000000000a",
        nombreFantasia: "Sol de la Huerta",
        habilidades: ["Agroecología", "Gestión comunitaria"],
      },
      {
        id: "b0000000000000000000000b",
        usuarioGitHub: "mapas-abiertos-demo",
        nombreFantasia: "Mapas Abiertos",
        habilidades: ["Python", "SQL", "Mapeo colaborativo", "Fotografía"],
      },
      {
        id: "b0000000000000000000000c",
        nombreFantasia: "Técnica del Sur",
        habilidades: ["Mantenimiento de computadoras", "Soporte técnico"],
      },
      {
        id: "b0000000000000000000000d",
        nombre: "Luz",
        apellido: "Benítez",
        pronombres: ["ella"],
        habilidades: ["Educación digital", "Lectura fácil", "Comunicación digital"],
      },
      {
        id: "b0000000000000000000000e",
        nombreFantasia: "Emi Fotografía",
        habilidades: ["Fotografía", "Comunicación digital"],
      },
      {
        id: "b0000000000000000000000f",
        nombreFantasia: "Perfil sin coincidencias",
        habilidades: ["Jest"],
      },
    );

    colaboraciones.push(
      {
        idProyecto: "a00000000000000000000005",
        idPerfil: "000000000000000000000006",
        idColaborador: "b00000000000000000000008",
        fecha: enDias(-4),
        esAnonima: true,
      },
      {
        idProyecto: "a00000000000000000000006",
        idPerfil: "000000000000000000000008",
        idColaborador: "b0000000000000000000000a",
        fecha: enDias(-2),
        esAnonima: false,
      },
      {
        idProyecto: "a00000000000000000000008",
        idPerfil: "00000000000000000000000b",
        idColaborador: "b0000000000000000000000c",
        fecha: enDias(-50),
        esAnonima: false,
      },
      {
        idProyecto: "a00000000000000000000009",
        idPerfil: "00000000000000000000000c",
        idColaborador: "b0000000000000000000000d",
        fecha: enDias(-1),
        esAnonima: true,
      },
    );
  }

  return { habilidades, colectivos, proyectos, colaboradoras, colaboraciones };
}
