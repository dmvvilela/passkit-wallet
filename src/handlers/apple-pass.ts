import type {
  HandlerResponse,
  ApplePassHandlersConfig,
  ApplePassDeviceRequest,
  ApplePassSerialNumbersRequest,
  ApplePassLatestRequest,
  AppleLogRequest,
} from "./types.js"

function validateAuth(
  authorization: string | undefined,
  expectedToken: string,
): boolean {
  if (!authorization) return false
  const token = authorization.replace(/^ApplePass\s+/i, "").trim()
  return token === expectedToken
}

/**
 * Create framework-agnostic handler functions for the Apple Pass web service
 * protocol. Each handler accepts a plain request object and returns a plain
 * `{ status, headers, body }` response.
 */
export const createApplePassHandlers = (config: ApplePassHandlersConfig) => {
  const { authenticationToken, store } = config

  return {
    /**
     * `POST /v1/devices/:did/registrations/:ptid/:sn`
     *
     * Register a device to receive push notifications for a pass.
     */
    async registerDevice(req: ApplePassDeviceRequest): Promise<HandlerResponse> {
      if (!validateAuth(req.authorization, authenticationToken)) {
        return { status: 401 }
      }

      if (!req.pushToken) {
        return { status: 400, body: { message: "pushToken is required" } }
      }

      const pass = await store.getPass(req.serialNumber)
      if (!pass) {
        return { status: 404 }
      }

      const result = await store.registerDevice(
        req.deviceLibraryIdentifier,
        req.pushToken,
        req.serialNumber,
      )

      return { status: result === "created" ? 201 : 200 }
    },

    /**
     * `DELETE /v1/devices/:did/registrations/:ptid/:sn`
     *
     * Unregister a device from a pass.
     */
    async unregisterDevice(req: ApplePassDeviceRequest): Promise<HandlerResponse> {
      if (!validateAuth(req.authorization, authenticationToken)) {
        return { status: 401 }
      }

      await store.unregisterDevice(
        req.deviceLibraryIdentifier,
        req.serialNumber,
      )

      return { status: 200 }
    },

    /**
     * `GET /v1/devices/:did/registrations/:ptid`
     *
     * Return serial numbers of passes registered to a device.
     */
    async getSerialNumbers(req: ApplePassSerialNumbersRequest): Promise<HandlerResponse> {
      const registrations = await store.getRegistrations(
        req.passTypeIdentifier,
        req.deviceLibraryIdentifier,
        req.passesUpdatedSince,
      )

      if (registrations.length === 0) {
        return { status: 204 }
      }

      const sorted = registrations.sort(
        (a, b) => a.updatedAt.getTime() - b.updatedAt.getTime(),
      )

      const lastUpdated = sorted[sorted.length - 1].updatedAt.toISOString()

      return {
        status: 200,
        body: {
          serialNumbers: sorted.map((r) => r.serialNumber),
          lastUpdated,
        },
      }
    },

    /**
     * `GET /v1/passes/:ptid/:sn`
     *
     * Return the latest version of a pass as a `.pkpass` buffer.
     */
    async getLatestPass(req: ApplePassLatestRequest): Promise<HandlerResponse> {
      if (!validateAuth(req.authorization, authenticationToken)) {
        return { status: 401 }
      }

      const passData = await store.getPassData(req.serialNumber)
      if (!passData) {
        return { status: 404 }
      }

      const pkpassBuffer = await config.buildPass(passData)

      return {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.pkpass",
          "Content-Disposition": `attachment; filename="${req.serialNumber}.pkpass"`,
        },
        body: pkpassBuffer,
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
