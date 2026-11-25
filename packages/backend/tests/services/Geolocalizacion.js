import { describe, expect, it, jest } from "@jest/globals";
import { GeolocalizacionService } from "../../services/GeolocalizacionService.js";

describe("GeolocalizacionService", () => {
  it("consulta Nominatim con país, localidad y provincia, y cachea resultados", async () => {
    const fetcher = jest.fn(async () => ({
      ok: true,
      json: async () => [
        {
          place_id: 123,
          display_name: "Plaza Godoy Cruz, Mendoza, Argentina",
          lat: "-32.89",
          lon: "-68.83",
        },
        { place_id: 456, display_name: "Resultado inválido", lat: "no", lon: "no" },
      ],
    }));
    const service = new GeolocalizacionService({
      fetcher,
      userAgent: "Prueba/1.0",
    });

    const ubicacion = {
      direccion: "Plaza Godoy Cruz",
      ciudad: "Godoy Cruz",
      provincia: "AR-M",
    };
    const resultados = await service.buscarDirecciones(ubicacion);
    const repetidos = await service.buscarDirecciones(ubicacion);

    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, opciones] = fetcher.mock.calls[0];
    expect(url.searchParams.get("q")).toBe(
      "Plaza Godoy Cruz, Godoy Cruz, Mendoza, Argentina",
    );
    expect(url.searchParams.get("countrycodes")).toBe("ar");
    expect(opciones.headers).toMatchObject({
      "Accept-Language": "es",
      "User-Agent": "Prueba/1.0",
    });
    expect(resultados).toEqual([
      {
        id: "123",
        direccion: "Plaza Godoy Cruz, Mendoza, Argentina",
        latitud: -32.89,
        longitud: -68.83,
      },
    ]);
    expect(repetidos).toEqual(resultados);
  });

  it("rechaza una provincia inválida sin consultar Nominatim", async () => {
    const fetcher = jest.fn();
    const service = new GeolocalizacionService({ fetcher });

    await expect(
      service.buscarDirecciones({
        direccion: "Plaza",
        ciudad: "Ciudad",
        provincia: "Narnia",
      }),
    ).rejects.toMatchObject({
      status: 400,
      codigo: "PROVINCIA_INVALIDA",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("expone un error de gateway si Nominatim falla", async () => {
    const service = new GeolocalizacionService({
      fetcher: jest.fn(async () => ({ ok: false })),
    });

    await expect(
      service.buscarDirecciones({
        direccion: "Plaza",
        ciudad: "Godoy Cruz",
        provincia: "Mendoza",
      }),
    ).rejects.toMatchObject({
      status: 502,
      codigo: "GEOCODIFICADOR_NO_DISPONIBLE",
    });
  });
});
