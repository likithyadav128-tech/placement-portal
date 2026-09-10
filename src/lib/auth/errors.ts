/**
 * Domain error classes for authentication and access control.
 */

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message = "Authentication required to access this resource.") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AuthError {
  constructor(message = "You do not have permission to perform this action.") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class UnregisteredUserError extends AuthError {
  constructor(
    message = "Your Microsoft account is authenticated, but you are not registered for this portal. Please contact your institution administrator."
  ) {
    super(message, 403);
    this.name = "UnregisteredUserError";
  }
}

export class BlockedUserError extends AuthError {
  constructor(
    message = "Your account has been suspended or blocked. Please contact your institution administrator."
  ) {
    super(message, 403);
    this.name = "BlockedUserError";
  }
}

export class InactiveUserError extends AuthError {
  constructor(
    message = "Your account is currently inactive. Please contact your institution administrator."
  ) {
    super(message, 403);
    this.name = "InactiveUserError";
  }
}
