import { describe, expect, it } from "@jest/globals";
import { Proyecto } from "../../domain/Proyecto.js";

const crear = (
  fechaLimiteCierre = null,
  estado = "ACTIVO",
  busquedaAbierta = true,
  fechaLimiteBusqueda = null,
) =>
  new Proyecto(
    "Titulo",
    "Desc",
    [],
    estado,
    new Date(),
    fechaLimiteCierre,
    "col-1",
    undefined,
    undefined,
    undefined,
    busquedaAbierta,
    fechaLimiteBusqueda,
  );

const enUnaHora = () => new Date(Date.now() + 60 * 60 * 1000);
const haceUnaHora = () => new Date(Date.now() - 60 * 60 * 1000);

describe("Dominio - Proyecto", () => {
  it("guarda el id del colectivo al que pertenece", () => {
    expect(crear().idColectivo).toBe("col-1");
  });

  it("un proyecto activo no esta finalizado", () => {
    expect(crear().estaFinalizado()).toBe(false);
  });

  it("al cerrarlo queda finalizado", () => {
    const proyecto = crear();
    proyecto.cerrar();
    expect(proyecto.estaFinalizado()).toBe(true);
  });

  it("no puede aceptar colaboradoras si esta finalizado", () => {
    expect(() => crear(null, "FINALIZADO").aceptarColaborador()).toThrow();
  });

  describe("búsqueda de colaboraciones", () => {
    it("está abierta sin límite de fecha", () => {
      expect(crear().busquedaDeColaboracionesAbierta()).toBe(true);
    });

    it("está cerrada cuando se indica que no está abierta", () => {
      expect(
        crear(null, "ACTIVO", false).busquedaDeColaboracionesAbierta(),
      ).toBe(false);
    });

    it("se cierra cuando pasó la fecha límite", () => {
      expect(
        crear(
          null,
          "ACTIVO",
          true,
          haceUnaHora(),
        ).busquedaDeColaboracionesAbierta(),
      ).toBe(false);
    });

    it("sigue abierta antes de la fecha límite", () => {
      expect(
        crear(
          null,
          "ACTIVO",
          true,
          enUnaHora(),
        ).busquedaDeColaboracionesAbierta(),
      ).toBe(true);
    });
  });

  describe("cierre programado", () => {
    it("sin fecha no tiene cierre programado", () => {
      expect(crear().tieneCierreProgramado()).toBe(false);
    });

    it("al programar una fecha pasa a tener cierre programado", () => {
      const proyecto = crear();
      proyecto.programarCierre(enUnaHora());
      expect(proyecto.tieneCierreProgramado()).toBe(true);
    });

    it("esta vencido cuando la fecha ya paso y sigue activo", () => {
      expect(crear(haceUnaHora()).cierreVencido()).toBe(true);
    });

    it("no esta vencido si la fecha es futura", () => {
      expect(crear(enUnaHora()).cierreVencido()).toBe(false);
    });

    it("no esta vencido si no tiene fecha", () => {
      expect(crear(null).cierreVencido()).toBe(false);
    });

    it("no esta vencido si ya esta finalizado", () => {
      expect(crear(haceUnaHora(), "FINALIZADO").cierreVencido()).toBe(false);
    });
  });
  describe("avance", () => {
    it("guarda los datos de avance que recibe el constructor", () => {
      const proyecto = new Proyecto(
        "Titulo",
        "Desc",
        [],
        "ACTIVO",
        new Date(),
        null,
        "col-1",
        25,
        "https://sistema.com",
        "https://github.com/colectivo/app",
      );

      expect(proyecto.porcentajeConcrecion).toBe(25);
      expect(proyecto.enlaceSistema).toBe("https://sistema.com");
      expect(proyecto.enlaceCodigoFuente).toBe(
        "https://github.com/colectivo/app",
      );
    });

    it("actualizarAvance modifica solo los datos que se le pasan", () => {
      const proyecto = crear();
      proyecto.actualizarAvance({
        porcentajeConcrecion: 40,
        enlaceSistema: "https://sistema.com",
      });
      proyecto.actualizarAvance({
        enlaceCodigoFuente: "https://github.com/colectivo/app",
      });

      expect(proyecto.porcentajeConcrecion).toBe(40);
      expect(proyecto.enlaceSistema).toBe("https://sistema.com");
      expect(proyecto.enlaceCodigoFuente).toBe(
        "https://github.com/colectivo/app",
      );
    });

    it("permite volver el porcentaje a 0 sin confundirlo con un dato no indicado", () => {
      const proyecto = crear();
      proyecto.actualizarAvance({ porcentajeConcrecion: 40 });
      proyecto.actualizarAvance({ porcentajeConcrecion: 0 });

      expect(proyecto.porcentajeConcrecion).toBe(0);
    });
  });

  describe("búsqueda de colaboraciones", () => {
    const conBusqueda = (
      busquedaAbierta,
      fechaLimiteBusqueda = null,
      estado = "ACTIVO",
    ) =>
      new Proyecto(
        "Titulo",
        "Desc",
        [],
        estado,
        new Date(),
        null,
        "col-1",
        0,
        null,
        null,
        busquedaAbierta,
        fechaLimiteBusqueda,
      );

    it("guarda si la búsqueda está abierta y hasta cuándo", () => {
      const fecha = enUnaHora();
      const proyecto = conBusqueda(true, fecha);

      expect(proyecto.busquedaAbierta).toBe(true);
      expect(proyecto.fechaLimiteBusqueda).toBe(fecha);
    });

    it("está vigente si la búsqueda está abierta y no tiene fecha límite", () => {
      expect(conBusqueda(true).busquedaVigente()).toBe(true);
    });

    it("está vigente si la búsqueda está abierta y la fecha límite es futura", () => {
      expect(conBusqueda(true, enUnaHora()).busquedaVigente()).toBe(true);
    });

    it("no está vigente si la fecha límite ya pasó", () => {
      expect(conBusqueda(true, haceUnaHora()).busquedaVigente()).toBe(false);
    });

    it("no está vigente si la búsqueda está cerrada", () => {
      expect(conBusqueda(false).busquedaVigente()).toBe(false);
    });

    it("no está vigente si el proyecto está finalizado, aunque la búsqueda siga abierta", () => {
      expect(conBusqueda(true, null, "FINALIZADO").busquedaVigente()).toBe(
        false,
      );
    });

    it("configurarBusqueda abre la búsqueda con su fecha límite", () => {
      const proyecto = conBusqueda(false);
      const fecha = enUnaHora();

      proyecto.configurarBusqueda(true, fecha);

      expect(proyecto.busquedaAbierta).toBe(true);
      expect(proyecto.fechaLimiteBusqueda).toBe(fecha);
    });

    it("configurarBusqueda borra la fecha límite al cerrar la búsqueda", () => {
      const proyecto = conBusqueda(true, enUnaHora());

      proyecto.configurarBusqueda(false);

      expect(proyecto.busquedaAbierta).toBe(false);
      expect(proyecto.fechaLimiteBusqueda).toBeNull();
    });
  });

  describe("edición", () => {
    it("editarDatos cambia título y descripción y deja lo demás igual", () => {
      const proyecto = crear();

      proyecto.editarDatos({
        titulo: "Nuevo",
        descripcion: "Nueva descripción",
      });

      expect(proyecto.titulo).toBe("Nuevo");
      expect(proyecto.descripcion).toBe("Nueva descripción");
      expect(proyecto.idColectivo).toBe("col-1");
      expect(proyecto.estado).toBe("ACTIVO");
    });

    it("editarDatos reemplaza las etiquetas cuando se envían", () => {
      const proyecto = crear();

      proyecto.editarDatos({
        titulo: "Nuevo",
        descripcion: "Nueva descripción",
        etiquetas: ["salud", "comunidad"],
      });

      expect(proyecto.etiquetas).toEqual(["salud", "comunidad"]);
    });

    it("editarDatos sin etiquetas conserva las que ya tenía", () => {
      const proyecto = crear();
      proyecto.etiquetas = ["salud"];

      proyecto.editarDatos({
        titulo: "Nuevo",
        descripcion: "Nueva descripción",
      });

      expect(proyecto.etiquetas).toEqual(["salud"]);
    });
  });
});
