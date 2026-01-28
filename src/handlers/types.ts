/** Plain HTTP response object — framework-agnostic. */
export interface HandlerResponse {
  status: number
  headers?: Record<string, string>
  body?: unknown
}

// ── Apple Pass Store ─────────────────────────────────────────────────────

/** Async callbacks for Apple Pass database operations. */
export interface ApplePassStore {
  /** Look up a pass by serial number. Return null if not found. */
  getPass(serialNumber: string): Promise<{ updatedAt: Date } | null>

  /**
   * Register a device to receive push updates for a pass.
   * Return `"created"` for new registrations or `"already_registered"` if the
   * device was already registered for this pass.
   */
  registerDevice(
    deviceLibraryIdentifier: string,
    pushToken: string,
    serialNumber: string,
  ): Promise<"created" | "already_registered">

  /** Unregister a device from a pass. */
  unregisterDevice(
    deviceLibraryIdentifier: string,
    serialNumber: string,
  ): Promise<void>

  /**
   * Return all passes registered to a device, optionally filtered by
   * modification date.
   */
  getRegistrations(
    passTypeIdentifier: string,
    deviceLibraryIdentifier: string,
    updatedSince?: string,
  ): Promise<{ serialNumber: string; updatedAt: Date }[]>

  /**
   * Return the data needed to build a `.pkpass` file for the given serial
   * number. The shape of the returned object is up to you — the handler will
   * pass it through to your `buildPass` callback.
   */
  getPassData(serialNumber: string): Promise<Record<string, unknown> | null>
}

/** Request data for pass device registration / unregistration. */
export interface ApplePassDeviceRequest {
  deviceLibraryIdentifier: string
  passTypeIdentifier: string
  serialNumber: string
  authorization?: string
  pushToken?: string
}

/** Request data for fetching serial numbers. */
export interface ApplePassSerialNumbersRequest {
  deviceLibraryIdentifier: string
  passTypeIdentifier: string
  passesUpdatedSince?: string
}

/** Request data for fetching the latest pass. */
export interface ApplePassLatestRequest {
  passTypeIdentifier: string
  serialNumber: string
  authorization?: string
  ifModifiedSince?: string
}

/** Request data for the log endpoint. */
export interface AppleLogRequest {
  logs: string[]
}

/** Options for `createApplePassHandlers`. */
export interface ApplePassHandlersConfig {
  /** The authentication token configured in pass.json. */
  authenticationToken: string
  /** Store adapter with async callbacks for DB operations. */
  store: ApplePassStore
  /**
   * Build a signed `.pkpass` buffer from the pass data returned by
   * `store.getPassData`. This is where you call your template logic.
   */
  buildPass(passData: Record<string, unknown>): Promise<Buffer>
  /** Optional log callback. */
  onLog?(logs: string[]): void | Promise<void>
}

// ── Apple Order Store ────────────────────────────────────────────────────

/** Async callbacks for Apple Order database operations. */
export interface AppleOrderStore {
  /** Look up an order by identifier. Return null if not found. */
  getOrder(orderIdentifier: string): Promise<{ updatedAt: Date } | null>

  /**
   * Register a device to receive push updates for an order.
   * Return `"created"` for new registrations or `"already_registered"` if the
   * device was already registered for this order.
   */
  registerDevice(
    deviceIdentifier: string,
    pushToken: string,
    orderIdentifier: string,
  ): Promise<"created" | "already_registered">

  /** Unregister a device from an order. */
  unregisterDevice(
    deviceIdentifier: string,
    orderIdentifier: string,
  ): Promise<void>

  /**
   * Return all orders registered to a device, optionally filtered by
   * modification date.
   */
  getRegistrations(
    orderTypeIdentifier: string,
    deviceIdentifier: string,
    modifiedSince?: string,
  ): Promise<{ orderIdentifier: string; updatedAt: Date }[]>
}

/** Request data for order device registration / unregistration. */
export interface AppleOrderDeviceRequest {
  deviceIdentifier: string
  orderTypeIdentifier: string
  orderIdentifier: string
  authorization?: string
  pushToken?: string
}

/** Request data for fetching order identifiers. */
export interface AppleOrderIdentifiersRequest {
  deviceIdentifier: string
  orderTypeIdentifier: string
  ordersModifiedSince?: string
}

/** Request data for fetching the latest order. */
export interface AppleOrderLatestRequest {
  orderTypeIdentifier: string
  orderIdentifier: string
  authorization?: string
  ifModifiedSince?: string
}

/** Options for `createAppleOrderHandlers`. */
export interface AppleOrderHandlersConfig {
  /** The authentication token configured for orders. */
  authenticationToken: string
  /** Store adapter with async callbacks for DB operations. */
  store: AppleOrderStore
  /**
   * Build a signed `.order` buffer for the given order identifier.
   * This is where you call your order generation logic.
   */
  buildOrder(orderIdentifier: string): Promise<Buffer>
  /** Optional log callback. */
  onLog?(logs: string[]): void | Promise<void>
}
