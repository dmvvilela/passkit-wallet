import type {
  HandlerResponse,
  AppleOrderHandlersConfig,
  AppleOrderDeviceRequest,
  AppleOrderIdentifiersRequest,
  AppleOrderLatestRequest,
  AppleLogRequest,
} from "./types.js"

function validateAuth(
  authorization: string | undefined,
  expectedToken: string,
): boolean {
  if (!authorization) return false
  const token = authorization.replace(/^AppleOrder\s+/i, "").trim()
  return token === expectedToken
}

/**
 * Create framework-agnostic handler functions for the Apple Order web service
 * protocol. Each handler accepts a plain request object and returns a plain
 * `{ status, headers, body }` response.
 */
export const createAppleOrderHandlers = (config: AppleOrderHandlersConfig) => {
  const { authenticationToken, store } = config

  return {
    /**
     * `POST /v1/devices/:did/registrations/:otid/:oid`
     *
     * Register a device to receive push notifications for an order.
     */
    async registerDevice(req: AppleOrderDeviceRequest): Promise<HandlerResponse> {
      if (!validateAuth(req.authorization, authenticationToken)) {
        return { status: 401 }
      }

      if (!req.pushToken) {
        return { status: 400, body: { message: "pushToken is required" } }
      }

      const order = await store.getOrder(req.orderIdentifier)
      if (!order) {
        return { status: 404 }
      }

      const result = await store.registerDevice(
        req.deviceIdentifier,
        req.pushToken,
        req.orderIdentifier,
      )

      return { status: result === "created" ? 201 : 200 }
    },

    /**
     * `DELETE /v1/devices/:did/registrations/:otid/:oid`
     *
     * Unregister a device from an order.
     */
    async unregisterDevice(req: AppleOrderDeviceRequest): Promise<HandlerResponse> {
      if (!validateAuth(req.authorization, authenticationToken)) {
        return { status: 401 }
      }

      await store.unregisterDevice(
        req.deviceIdentifier,
        req.orderIdentifier,
      )

      return { status: 200 }
    },

    /**
     * `GET /v1/devices/:did/registrations/:otid`
     *
     * Return order identifiers registered to a device.
     */
    async getOrderIdentifiers(req: AppleOrderIdentifiersRequest): Promise<HandlerResponse> {
      const registrations = await store.getRegistrations(
        req.orderTypeIdentifier,
        req.deviceIdentifier,
        req.ordersModifiedSince,
      )

      if (registrations.length === 0) {
        return { status: 204 }
      }

      const sorted = registrations.sort(
        (a, b) => a.updatedAt.getTime() - b.updatedAt.getTime(),
      )

      const lastModified = sorted[sorted.length - 1].updatedAt.toISOString()

      return {
        status: 200,
        body: {
          orderIdentifiers: sorted.map((r) => r.orderIdentifier),
          lastModified,
        },
      }
    },

    /**
     * `GET /v1/orders/:otid/:oid`
     *
     * Return the latest version of an order as a signed `.order` buffer.
     */
    async getLatestOrder(req: AppleOrderLatestRequest): Promise<HandlerResponse> {
      if (!validateAuth(req.authorization, authenticationToken)) {
        return { status: 401 }
      }

      const order = await store.getOrder(req.orderIdentifier)
      if (!order) {
        return { status: 404 }
      }

      const orderBuffer = await config.buildOrder(req.orderIdentifier)

      return {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.order",
          "Content-Disposition": `attachment; filename="${req.orderIdentifier}.order"`,
        },
        body: orderBuffer,
      }
    },

    /**
     * `POST /v1/log`
     *
     * Accept log messages from Apple Wallet.
     */
    async log(req: AppleLogRequest): Promise<HandlerResponse> {
      if (config.onLog) {
        await config.onLog(req.logs)
      }
      return { status: 200 }
    },
  }
}
