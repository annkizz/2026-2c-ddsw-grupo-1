export class AppError extends Error {
  constructor(message) {
    super(message);
    this.status = 500;
    this.timestamp = new Date().toISOString();
  }
}

export class BadRequestError extends AppError {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

export class NotFoundError extends AppError {
  constructor(message) {
    super(message);
    this.status = 404;
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message);
    this.status = 409;
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message) {
    super(message);
    this.status = 422;
  }
}
