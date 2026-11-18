export class ConexionLinkedIn {
  constructor(idColectivo, personUrn, nombre, accessToken, expiraEn) {
    this.idColectivo = idColectivo;
    this.personUrn = personUrn;
    this.nombre = nombre;
    this.accessToken = accessToken; // siempre cifrado
    this.expiraEn = expiraEn;
  }

  estaVigente(ahora = new Date()) {
    return this.expiraEn > ahora;
  }
}