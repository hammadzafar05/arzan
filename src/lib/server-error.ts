/** An API error that carries the HTTP status (e.g. 503 = this deployment isn't set up). */
export class ServerError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
