export abstract class VerdictError extends Error {
  public abstract readonly code: string;
  public readonly timestamp: number = Date.now();

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NetworkError extends VerdictError {
  public readonly code = 'NETWORK_ERROR';
}

export class TimeoutError extends VerdictError {
  public readonly code = 'TIMEOUT_ERROR';
}

export class EngineUnavailableError extends VerdictError {
  public readonly code = 'ENGINE_UNAVAILABLE';
}

export class ValidationError extends VerdictError {
  public readonly code = 'VALIDATION_ERROR';
}
