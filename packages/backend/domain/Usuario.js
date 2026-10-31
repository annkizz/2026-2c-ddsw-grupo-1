// Cuenta de acceso (login). Su identidad la maneja Logto: logtoId es el "sub" del token.
// El rol queda sin definir hasta que la persona registra su perfil de colectivo o de colaboradora.
export class Usuario {
  constructor(logtoId, nombreUsuario, rol) {
    this.logtoId = logtoId;
    this.nombreUsuario = nombreUsuario;
    this.rol = rol;
  }
}
