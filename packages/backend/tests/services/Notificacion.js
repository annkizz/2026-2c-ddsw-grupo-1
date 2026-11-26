import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NotificacionService } from "../../services/NotificacionService.js";
import { NotificadorExterno } from "../../services/notificadores/NotificadorExterno.js";
import { EstadoEnvio } from "../../domain/EstadoEnvio.js";
import { TipoDeContacto } from "../../domain/TipoDeContacto.js";

const ID_NOTIFICACION = "8f09d4b54eb34fc0a72a150";
const ID_COLECTIVO = "c00000000000000000000001";
const ID_COLABORADORA = "b00000000000000000000001";
const ID_USUARIO_COLECTIVO = "d00000000000000000000001";
const ID_USUARIO_COLABORADORA = "d00000000000000000000002";
const ID_OTRA_COLABORADORA = "b00000000000000000000002";

// El servicio decide los permisos por el rol del usuario autenticado.
const USUARIO_COLECTIVO = { _id: ID_USUARIO_COLECTIVO, rol: "COLECTIVO" };
const USUARIO_COLABORADORA = { _id: ID_USUARIO_COLABORADORA, rol: "COLABORADOR" };

describe("NotificacionService", () => {
  let notificacionRepository;
  let colectivoRepository;
  let colaboradorRepository;
  let notificadorExterno;
  let service;
  let colectivo;
  let colaboradora;

  beforeEach(() => {
    colectivo = {
      _id: ID_COLECTIVO,
      usuario: ID_USUARIO_COLECTIVO,
      nombre: "Fundación",
    };
    colaboradora = {
      _id: ID_COLABORADORA,
      usuario: ID_USUARIO_COLABORADORA,
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
      obtenerTodosPaginado: jest.fn(async () => ({
        notificaciones: [],
        total: 0,
        pag: 1,
        totalPags: 0,
      })),
      buscarPorId: jest.fn(async () => null),
    };
    colectivoRepository = {
      buscarPorId: jest.fn(async () => colectivo),
      buscarPorUsuario: jest.fn(async () => colectivo),
      obtenerPorIds: jest.fn(async () => [colectivo]),
    };
    colaboradorRepository = {
      buscarPorId: jest.fn(async () => colaboradora),
      buscarPorUsuario: jest.fn(async () => colaboradora),
      obtenerPorIds: jest.fn(async () => [colaboradora]),
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
    const resultado = await service.crear(
      {
        idColectivo: colectivo._id,
        idColaborador: colaboradora._id,
        contenido: "Hola, queremos contactarte.",
      },
      USUARIO_COLECTIVO,
    );

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
    // El detalle técnico del proveedor no se expone: se reemplaza por un mensaje genérico.
    expect(resultado.envios).toEqual([
      {
        tipoDeContacto: "EMAIL",
        estado: "FALLIDO",
        detalle: "No se pudo completar el envío por este medio.",
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
      const resultado = await service.crear(
        {
          idColectivo: colectivo._id,
          idColaborador: colaboradora._id,
          contenido: "Hola, queremos contactarte.",
        },
        USUARIO_COLECTIVO,
      );

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
      service.crear(
        {
          idColectivo: colectivo._id,
          idColaborador: colaboradora._id,
          contenido: "Hola, queremos contactarte.",
        },
        USUARIO_COLECTIVO,
      ),
    ).rejects.toMatchObject({
      status: 403,
      codigo: "COLABORADORA_NO_ACEPTA_MENSAJERIA",
    });

    expect(notificacionRepository.save).not.toHaveBeenCalled();
    expect(notificadorExterno.enviar).not.toHaveBeenCalled();
  });

  it("rechaza que un colectivo envíe una notificación en nombre de otro", async () => {
    colectivoRepository.buscarPorUsuario.mockResolvedValue(null);

    await expect(
      service.crear(
        {
          idColectivo: colectivo._id,
          idColaborador: colaboradora._id,
          contenido: "Hola, queremos contactarte.",
        },
        { _id: "d00000000000000000000003", rol: "COLECTIVO" },
      ),
    ).rejects.toMatchObject({ status: 404, codigo: "COLECTIVO_NO_ENCONTRADO" });
    expect(notificacionRepository.save).not.toHaveBeenCalled();

    colectivoRepository.buscarPorUsuario.mockResolvedValue(colectivo);
    colaboradorRepository.buscarPorId.mockResolvedValue(null);
    await expect(
      service.crear(
        {
          idColectivo: colectivo._id,
          idColaborador: colaboradora._id,
          contenido: "Hola, queremos contactarte.",
        },
        USUARIO_COLECTIVO,
      ),
    ).rejects.toMatchObject({
      status: 404,
      codigo: "COLABORADORA_NO_ENCONTRADA",
    });
    expect(notificacionRepository.save).not.toHaveBeenCalled();
  });

  it("no permite consultar las notificaciones de otra colaboradora", async () => {
    colaboradorRepository.buscarPorId.mockResolvedValue({
      ...colaboradora,
      _id: ID_OTRA_COLABORADORA,
      usuario: "d00000000000000000000003",
    });

    await expect(
      service.obtenerTodosPorColaboradora(
        ID_OTRA_COLABORADORA,
        1,
        10,
        USUARIO_COLABORADORA,
      ),
    ).rejects.toMatchObject({
      status: 404,
      codigo: "COLABORADORA_NO_ENCONTRADA",
    });
    expect(notificacionRepository.obtenerTodosPaginado).not.toHaveBeenCalled();
  });

  it("solo devuelve una notificación individual a su colaboradora destinataria", async () => {
    notificacionRepository.buscarPorId.mockResolvedValue({
      _id: ID_NOTIFICACION,
      idColaborador: ID_OTRA_COLABORADORA,
    });

    await expect(
      service.obtenerPorId(ID_NOTIFICACION, USUARIO_COLABORADORA),
    ).rejects.toMatchObject({
      status: 404,
      codigo: "NOTIFICACION_NO_ENCONTRADA",
    });
  });

  it("cada colaboradora ve solo sus propias notificaciones", async () => {
    await service.obtenerTodosPaginado(USUARIO_COLABORADORA, 1, 10);

    expect(notificacionRepository.obtenerTodosPaginado).toHaveBeenCalledWith(
      expect.objectContaining({ idColaborador: ID_COLABORADORA }),
      1,
      10,
    );
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
