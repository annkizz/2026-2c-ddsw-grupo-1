export class AppError extends Error {
  constructor(message, codigo) {
    super(message);
    this.status = 500;
    this.codigo = codigo;
    this.timestamp = new Date().toISOString();
    this.esAppError = true;
  }
}

export class BadRequestError extends AppError {
  constructor(message, codigo) {
    super(message, codigo);
    this.status = 400;
  }
}

export class NotFoundError extends AppError {
  constructor(message, codigo) {
    super(message, codigo);
    this.status = 404;
  }
}

export class ConflictError extends AppError {
  constructor(message, codigo) {
    super(message, codigo);
    this.status = 409;
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message, codigo) {
    super(message, codigo);
    this.status = 422;
  }
}

// agrego el codigo para poder identificar mas facil el error!! 