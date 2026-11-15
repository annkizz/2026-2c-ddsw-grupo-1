// El tipo de cuenta se elige ANTES de ir a Logto. Al volver, la página se recargó
// y el estado de React se perdió, así que lo guardamos en sessionStorage.
const CLAVE = 'tipoDeCuenta';

export const guardarTipo = (tipo) => sessionStorage.setItem(CLAVE, tipo);
export const leerTipo = () => sessionStorage.getItem(CLAVE);
export const borrarTipo = () => sessionStorage.removeItem(CLAVE);

export const rutaDeRegistro = (tipo) => {
  if (tipo === 'colectivo') return '/registro/colectivo';
  if (tipo === 'colaboradora') return '/registro/colaboradora';
  return '/registro/tipo';
};
