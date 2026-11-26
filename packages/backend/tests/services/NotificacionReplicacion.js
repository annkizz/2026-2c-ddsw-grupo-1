import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NotificacionService } from "../../services/NotificacionService.js";

// Los avisos del sistema dirigidos a la colaboradora (invitación, postulación aceptada o rechazada)
// se replican por sus medios de contacto, igual que los mensajes directos.

const ID_NOTIFICACION = "a00000000000000000000001";
const ID_COLECTIVO = "c00000000000000000000001";
const ID_COLABORADORA = "b00000000000000000000001";

describe("NotificacionService: replicación de avisos por mail", () => {
  let notificacionRepository;
  let colectivoRepository;
  let colaboradorRepository;
  let notificadorExterno;
  let service;
  let colaboradora;

  const evento = (tipo, extra = {}) => ({
    tipo,
    contenido: 'El colectivo te invita a colaborar en el proyecto "Huerta", para el perfil "Tester".',
    idColectivo: ID_COLECTIVO,
    idColaborador: ID_COLABORADORA,
    ...extra,
  });

  beforeEach(() => {
    colaboradora = {
      _id: ID_COLABORADORA,
      aceptaMensajeria: true,
      mediosDeContacto: [{ tipoDeContacto: "EMAIL", contacto: "ana@example.org" }],
    };
    notificacionRepository = {
      save: jest.fn(async (n) => ({ ...n, _id: ID_NOTIFICACION })),
      registrarEnvios: jest.fn(async (id, envios) => ({ _id: id, tipo: "INVITACION_PROYECTO", envios })),
    };
    colectivoRepository = { buscarPorId: jest.fn(async () => ({ _id: ID_COLECTIVO, nombre: "Huerta Sur" })) };
    colaboradorRepository = { buscarPorId: jest.fn(async () => colaboradora) };
    notificadorExterno = {
      enviar: jest.fn(async (medio) => ({ tipoDeContacto: medio.tipoDeContacto, estado: "ENVIADO" })),
    };
    service = new NotificacionService(
      notificacionRepository,
      colectivoRepository,
      colaboradorRepository,
      notificadorExterno,
      { FRONTEND_URL: "https://codigo.example" },
    );
  });

  it("manda la invitación por mail con el nombre del colectivo y registra el envío", async () => {
    const resultado = await service.crearEventoSistema(evento("INVITACION_PROYECTO", { estadoInvitacion: "PENDIENTE" }));

    expect(notificadorExterno.enviar).toHaveBeenCalledWith(
      { tipoDeContacto: "EMAIL", contacto: "ana@example.org" },
      {
        asunto: "Huerta Sur te invita a colaborar en Código a Voluntad",
        texto: expect.stringContaining('te invita a colaborar en el proyecto "Huerta"'),
      },
    );
    expect(notificadorExterno.enviar.mock.calls[0][1].texto).toContain("https://codigo.example/notificaciones");
    // Se guarda primero el aviso y después solo se agregan los envíos (no se pisa el estado de la invitación).
    expect(notificacionRepository.save).toHaveBeenCalledTimes(1);
    expect(notificacionRepository.registrarEnvios).toHaveBeenCalledWith(ID_NOTIFICACION, [
      { tipoDeContacto: "EMAIL", estado: "ENVIADO" },
    ]);
    expect(resultado.envios).toEqual([{ tipoDeContacto: "EMAIL", estado: "ENVIADO" }]);
  });

  it.each([
    ["POSTULACION_ACEPTADA", "Aceptaron tu postulación en Código a Voluntad"],
    ["POSTULACION_RECHAZADA", "Novedades sobre tu postulación en Código a Voluntad"],
  ])("avisa por mail el resultado de una postulación (%s)", async (tipo, asunto) => {
    await service.crearEventoSistema(evento(tipo, { contenido: "Tu postulación fue resuelta." }));

    expect(notificadorExterno.enviar).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ asunto, texto: expect.stringContaining("Tu postulación fue resuelta.") }),
    );
  });

  it("no manda nada si la colaboradora no aceptó que la contacten", async () => {
    colaboradora.aceptaMensajeria = false;
    const resultado = await service.crearEventoSistema(evento("POSTULACION_ACEPTADA"));

    expect(notificadorExterno.enviar).not.toHaveBeenCalled();
    expect(notificacionRepository.registrarEnvios).not.toHaveBeenCalled();
    expect(resultado.envios).toEqual([]);
  });

  it("no replica los avisos que son para el colectivo", async () => {
    await service.crearEventoSistema(evento("POSTULACION_RECIBIDA"));

    expect(colaboradorRepository.buscarPorId).not.toHaveBeenCalled();
    expect(notificadorExterno.enviar).not.toHaveBeenCalled();
  });

  it("si falla la replicación, el aviso interno se crea igual", async () => {
    colaboradorRepository.buscarPorId.mockRejectedValue(new Error("Mongo caído"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      const resultado = await service.crearEventoSistema(evento("INVITACION_PROYECTO"));
      expect(resultado.id).toBe(ID_NOTIFICACION);
      expect(notificadorExterno.enviar).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });
});
