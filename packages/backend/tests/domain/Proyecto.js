import { Proyecto } from "../../domain/Proyecto.js";

const crear = (fechaLimiteCierre = null, estado = "ACTIVO") =>
  new Proyecto("Titulo", "Desc", [], estado, new Date(), "p-1", fechaLimiteCierre, "col-1");

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
});
