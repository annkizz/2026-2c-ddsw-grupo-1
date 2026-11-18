import { PROVINCIAS_MAPA } from "./provinciasMapa";

export const PROVINCIAS = [...PROVINCIAS_MAPA.provincias]
  .map(({ codigoProvincia, nombreProvincia }) => ({
    codigo: codigoProvincia,
    nombre: nombreProvincia,
  }))
  .sort((a, b) => (a.nombre < b.nombre ? -1 : 1));
