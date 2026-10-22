import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NotificacionService } from "../../services/NotificacionService.js";
import { NotificadorExterno } from "../../services/notificadores/NotificadorExterno.js";
import { EstadoEnvio } from "../../domain/EstadoEnvio.js";
import { TipoDeContacto } from "../../domain/TipoDeContacto.js";

const ID_NOTIFICACION = "8f09d4b54eb34fc0a72a150";
const ID_COLECTIVO = "c00000000000000000000001";
const ID_COLABORADORA = "b00000000000000000000001";

describe("NotificacionService", () => {
  let notificacionRepository;
  let colectivoRepository;
  let colaboradorRepository;
  let notificadorExterno;
  let service;
  let colectivo;
  let colaboradora;

  beforeEach(() => {
    colectivo = { _id: ID_COLECTIVO, nombre: "Fundación" };
    colaboradora = {
      _id: ID_COLABORADORA,
      aceptaMensajeria: true,
      mediosDeContacto: [
        { tipoDeContacto: "EMAIL", contacto: "privado@example.org" },
      ],
    };
    notificacionRepository = {
      save: jest.fn(async (notificacion) => ({
        ...notificacion,
        id: notificacion.id ?? ID_NOTIFICACION,
      })),
      obtenerTodos: jest.fn(async () => []),
      encontrarPorId: jest.fn(async () => null),
    };
    colectivoRepository = {
      encontrarPorId: jest.fn(async () => colectivo),
    };
    colaboradorRepository = {
      encontrarPorId: jest.fn(async () => colaboradora),
    };
    notificadorExterno = {
      enviar: jest.fn(async (medio) => ({
        tipoDeContacto: medio.tipoDeContacto,
        estado: "FALLIDO",
        detalle: "El envío por EMAIL no está configurado.",
      })),
    };
    service = new NotificacionService(
      notificacionRepository,
      colectivoRepository,
      colaboradorRepository,
      notificadorExterno,
    );
  });

  it("guarda el mensaje y registra el resultado de cada medio sin exponer su destino", async () => {
    const resultado = await service.crear({
      idColectivo: colectivo._id,
      idColaborador: colaboradora._id,
      contenido: "Hola, queremos contactarte.",
    });

    expect(notificacionRepository.save).toHaveBeenCalledTimes(2);
    expect(
      notificacionRepository.save.mock.invocationCallOrder[0],
    ).toBeLessThan(notificadorExterno.enviar.mock.invocationCallOrder[0]);
    expect(notificadorExterno.enviar).toHaveBeenCalledWith(
      colaboradora.mediosDeContacto[0],
      expect.objectContaining({
        asunto: expect.stringContaining(colectivo.nombre),
        texto: expect.stringContaining("Hola, queremos contactarte."),
      }),
    );
    expect(resultado).toMatchObject({
      id: ID_NOTIFICACION,
      idColectivo: ID_COLECTIVO,
      idColaborador: ID_COLABORADORA,
    });
    expect(resultado.envios).toEqual([
      {
        tipoDeContacto: "EMAIL",
        estado: "FALLIDO",
        detalle: "El envío por EMAIL no está configurado.",
      },
    ]);
    expect(JSON.stringify(resultado)).not.toContain("privado@example.org");
  });

  it("persiste la notificación y el fallo si un proveedor lanza un error", async () => {
    notificadorExterno.enviar.mockRejectedValue(
      new Error("provider unavailable"),
    );
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      const resultado = await service.crear({
        idColectivo: colectivo._id,
        idColaborador: colaboradora._id,
        contenido: "Hola, queremos contactarte.",
      });

      expect(notificacionRepository.save).toHaveBeenCalledTimes(2);
      expect(resultado.envios[0]).toMatchObject({
        tipoDeContacto: "EMAIL",
        estado: "FALLIDO",
      });
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("rechaza la notificación cuando la colaboradora no aceptó mensajería", async () => {
    colaboradora.aceptaMensajeria = false;

    await expect(
      service.crear({
        idColectivo: colectivo._id,
        idColaborador: colaboradora._id,
        contenido: "Hola, queremos contactarte.",
      }),
    ).rejects.toMatchObject({
      status: 403,
      codigo: "COLABORADORA_NO_ACEPTA_MENSAJERIA",
    });

    expect(notificacionRepository.save).not.toHaveBeenCalled();
    expect(notificadorExterno.enviar).not.toHaveBeenCalled();
  });

  it("valida colectivo y colaboradora antes de guardar", async () => {
    colectivoRepository.encontrarPorId.mockResolvedValue(null);
    await expect(
      service.crear({
        idColectivo: colectivo._id,
        idColaborador: colaboradora._id,
        contenido: "Hola, queremos contactarte.",
      }),
    ).rejects.toMatchObject({ status: 404, codigo: "COLECTIVO_NO_ENCONTRADO" });
    expect(notificacionRepository.save).not.toHaveBeenCalled();

    colectivoRepository.encontrarPorId.mockResolvedValue(colectivo);
    colaboradorRepository.encontrarPorId.mockResolvedValue(null);
    await expect(
      service.crear({
        idColectivo: colectivo._id,
        idColaborador: colaboradora._id,
        contenido: "Hola, queremos contactarte.",
      }),
    ).rejects.toMatchObject({
      status: 404,
      codigo: "COLABORADORA_NO_ENCONTRADA",
    });
    expect(notificacionRepository.save).not.toHaveBeenCalled();
  });

  it("filtra notificaciones por IDs permitidos", async () => {
    notificacionRepository.obtenerTodos.mockResolvedValue([]);

    await service.obtenerTodos({ idColaborador: ID_COLABORADORA });

    expect(notificacionRepository.obtenerTodos).toHaveBeenCalledWith({
      idColaborador: ID_COLABORADORA,
    });
  });

  it("el adaptador informa explícitamente que los canales externos no están configurados", async () => {
    const notificador = new NotificadorExterno({
      [TipoDeContacto.WHATSAPP]: {
        enviar: jest.fn(async () => ({
          estado: EstadoEnvio.SIMULADO,
          detalle: "Twilio no configurado",
        })),
      },
    });
    const resultado = await notificador.enviar(
      { tipoDeContacto: TipoDeContacto.WHATSAPP, contacto: "+541112345678" },
      { texto: "mensaje privado" },
    );

    expect(resultado).toEqual({
      tipoDeContacto: TipoDeContacto.WHATSAPP,
      estado: EstadoEnvio.SIMULADO,
      detalle: "Twilio no configurado",
    });
    expect(JSON.stringify(resultado)).not.toContain("+541112345678");
  });
});
