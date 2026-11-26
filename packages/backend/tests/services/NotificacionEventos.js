import { describe, expect, it, jest } from "@jest/globals";
import { NotificacionService } from "../../services/NotificacionService.js";

describe("bandejas de eventos", () => {
  it("incluye postulaciones recibidas solo en la bandeja del colectivo", async () => {
    const repository = {
      obtenerTodosPaginado: jest.fn(async () => ({
        notificaciones: [],
        total: 0,
        pag: 1,
        totalPags: 0,
      })),
      buscarPorId: jest.fn(async () => ({
        idColectivo: "colectivo",
        idColaborador: "persona",
        tipo: "POSTULACION_RECIBIDA",
      })),
    };
    const service = new NotificacionService(
      repository,
      {
        buscarPorUsuario: async () => ({ _id: "colectivo" }),
        obtenerPorIds: async () => [],
      },
      {
        buscarPorUsuario: async () => ({ _id: "persona" }),
        obtenerPorIds: async () => [],
      },
    );
    const colectivo = { _id: "usuario-c", rol: "COLECTIVO" };
    const persona = { _id: "usuario-p", rol: "COLABORADOR" };
    await service.obtenerTodosPaginado(colectivo, 1, 8);
    expect(
      repository.obtenerTodosPaginado.mock.calls[0][0].$or[0].tipo.$in,
    ).toContain("POSTULACION_RECIBIDA");
    await service.obtenerTodosPaginado(persona, 1, 8);
    expect(repository.obtenerTodosPaginado.mock.calls[1][0]).toMatchObject({
      tipo: { $ne: "POSTULACION_RECIBIDA" },
    });
    await expect(
      service.obtenerPorId("notificacion", persona),
    ).rejects.toMatchObject({
      codigo: "NOTIFICACION_NO_ENCONTRADA",
    });
  });

  it("muestra la invitación solo a la colaboradora destinataria", async () => {
    const invitacion = {
      _id: "invitacion",
      idColectivo: "colectivo",
      idColaborador: "persona",
      tipo: "INVITACION_PROYECTO",
      estadoInvitacion: "ACEPTADA",
    };
    const repository = {
      obtenerTodosPaginado: jest.fn(async () => ({
        notificaciones: [],
        total: 0,
        pag: 1,
        totalPags: 0,
      })),
      buscarPorId: jest.fn(async () => invitacion),
    };
    const service = new NotificacionService(
      repository,
      {
        buscarPorUsuario: async () => ({ _id: "colectivo" }),
        obtenerPorIds: async () => [],
      },
      {
        buscarPorUsuario: async () => ({ _id: "persona" }),
        obtenerPorIds: async () => [],
      },
    );
    const colectivo = { _id: "usuario-c", rol: "COLECTIVO" };
    const persona = { _id: "usuario-p", rol: "COLABORADOR" };

    await service.obtenerTodosPaginado(colectivo, 1, 8);
    expect(
      repository.obtenerTodosPaginado.mock.calls[0][0].$or[0].tipo.$in,
    ).not.toContain("INVITACION_PROYECTO");
    await service.obtenerTodosPaginado(persona, 1, 8);
    expect(repository.obtenerTodosPaginado.mock.calls[1][0]).toMatchObject({
      idColaborador: "persona",
      tipo: { $ne: "POSTULACION_RECIBIDA" },
    });
    await expect(
      service.obtenerPorId("invitacion", colectivo),
    ).rejects.toMatchObject({
      codigo: "NOTIFICACION_NO_ENCONTRADA",
    });
    await expect(
      service.obtenerPorId("invitacion", persona),
    ).resolves.toMatchObject({
      id: "invitacion",
      tipo: "INVITACION_PROYECTO",
      estadoInvitacion: "ACEPTADA",
    });
  });
});
