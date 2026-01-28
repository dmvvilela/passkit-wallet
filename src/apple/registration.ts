/**
 * Framework-agnostic helpers for Apple Wallet device registration.
 *
 * These helpers validate and parse incoming registration / unregistration
 * requests so you can plug them into any HTTP framework (Express, Fastify,
 * Hono, Elysia, etc.).
 */

export interface RegistrationRequest {
  /** The `Authorization` header value (e.g. "ApplePass <token>"). */
  authorizationHeader?: string
  /** Device library identifier from the URL path. */
  deviceLibraryIdentifier: string
  /** Serial number of the pass being registered. */
  serialNumber: string
  /** Push token from the request body (register only). */
  pushToken?: string
}

export interface RegistrationResult {
  valid: boolean
  /** HTTP status code to return. */
  status: number
  /** Parsed fields (available when valid). */
  deviceLibraryIdentifier?: string
  serialNumber?: string
  pushToken?: string
  authToken?: string
}

/**
 * Validate and parse a device registration request.
 *
 * @param request - The incoming request data.
 * @param expectedAuthToken - The authentication token configured for this pass type.
 */
export const parseRegistrationRequest = (
  request: RegistrationRequest,
  expectedAuthToken: string,
): RegistrationResult => {
  const authHeader = request.authorizationHeader ?? ""
  const token = authHeader.replace(/^ApplePass\s+/i, "").trim()

  if (!token || token !== expectedAuthToken) {
    return { valid: false, status: 401 }
  }

  if (!request.deviceLibraryIdentifier || !request.serialNumber) {
    return { valid: false, status: 400 }
  }

  return {
    valid: true,
    status: 200,
    deviceLibraryIdentifier: request.deviceLibraryIdentifier,
    serialNumber: request.serialNumber,
    pushToken: request.pushToken,
    authToken: token,
  }
}

/**
 * Validate and parse a device unregistration request.
 *
 * Same validation as registration but does not require a push token.
 */
export const parseUnregistrationRequest = (
  request: Omit<RegistrationRequest, "pushToken">,
  expectedAuthToken: string,
): RegistrationResult => {
  return parseRegistrationRequest(
    { ...request, pushToken: undefined },
    expectedAuthToken,
  )
}
