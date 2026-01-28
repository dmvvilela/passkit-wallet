/**
 * Example: Wire passkit-wallet handlers into Elysia (Bun).
 *
 * This is illustrative — adapt the store callbacks to your own database.
 */

import { Elysia } from "elysia"
import {
  createApplePassHandlers,
  createAppleOrderHandlers,
} from "passkit-wallet/handlers"

// ── Apple Pass Handlers ──────────────────────────────────────────────────

const passHandlers = createApplePassHandlers({
  authenticationToken: process.env.APPLE_PASS_AUTH_TOKEN!,
  store: {
    getPass: async (serialNumber) => {
      return { updatedAt: new Date() }
    },
    registerDevice: async (deviceLibId, pushToken, serialNumber) => {
      return "created"
    },
    unregisterDevice: async (deviceLibId, serialNumber) => {},
    getRegistrations: async (passTypeId, deviceLibId, updatedSince) => {
      return []
    },
    getPassData: async (serialNumber) => {
      return { serialNumber, code: "SAVE20", offerTitle: "20% Off" }
    },
  },
  buildPass: async (passData) => {
    return Buffer.from("pkpass-placeholder")
  },
  onLog: (logs) => console.log("[Apple Wallet]", logs),
})

// ── Apple Order Handlers ─────────────────────────────────────────────────

const orderHandlers = createAppleOrderHandlers({
  authenticationToken: process.env.APPLE_ORDER_AUTH_TOKEN!,
  store: {
    getOrder: async (orderIdentifier) => {
      return { updatedAt: new Date() }
    },
    registerDevice: async (deviceId, pushToken, orderIdentifier) => {
      return "created"
    },
    unregisterDevice: async (deviceId, orderIdentifier) => {},
    getRegistrations: async (orderTypeId, deviceId, modifiedSince) => {
      return []
    },
  },
  buildOrder: async (orderIdentifier) => {
    return Buffer.from("order-placeholder")
  },
})

// ── Elysia App ───────────────────────────────────────────────────────────

const app = new Elysia()
  // Pass: device registration
  .post("/v1/devices/:did/registrations/:ptid/:sn", async ({ params, body, headers }) => {
    const result = await passHandlers.registerDevice({
      deviceLibraryIdentifier: params.did,
      passTypeIdentifier: params.ptid,
      serialNumber: params.sn,
      pushToken: (body as any)?.pushToken,
      authorization: headers.authorization,
    })
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    })
  })

  // Pass: device unregistration
  .delete("/v1/devices/:did/registrations/:ptid/:sn", async ({ params, headers }) => {
    const result = await passHandlers.unregisterDevice({
      deviceLibraryIdentifier: params.did,
      passTypeIdentifier: params.ptid,
      serialNumber: params.sn,
      authorization: headers.authorization,
    })
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    })
  })

  // Pass: serial numbers for a device
  .get("/v1/devices/:did/registrations/:ptid", async ({ params, query }) => {
    const result = await passHandlers.getSerialNumbers({
      deviceLibraryIdentifier: params.did,
      passTypeIdentifier: params.ptid,
      passesUpdatedSince: query.passesUpdatedSince,
    })
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    })
  })

  // Pass: latest pass
  .get("/v1/passes/:ptid/:sn", async ({ params, headers }) => {
    const result = await passHandlers.getLatestPass({
      passTypeIdentifier: params.ptid,
      serialNumber: params.sn,
      authorization: headers.authorization,
      ifModifiedSince: headers["if-modified-since"],
    })
    if (result.body instanceof Buffer) {
      return new Response(result.body, {
        status: result.status,
        headers: result.headers,
      })
    }
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    })
  })

  // Log endpoint
  .post("/v1/log", async ({ body }) => {
    const result = await passHandlers.log({ logs: (body as any)?.logs ?? [] })
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    })
  })

  // Order: device registration
  .post("/v1/devices/:did/registrations/:otid/:oid", async ({ params, body, headers }) => {
    const result = await orderHandlers.registerDevice({
      deviceIdentifier: params.did,
      orderTypeIdentifier: params.otid,
      orderIdentifier: params.oid,
      pushToken: (body as any)?.pushToken,
      authorization: headers.authorization,
    })
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    })
  })

  // Order: latest order
  .get("/v1/orders/:otid/:oid", async ({ params, headers }) => {
    const result = await orderHandlers.getLatestOrder({
      orderTypeIdentifier: params.otid,
      orderIdentifier: params.oid,
      authorization: headers.authorization,
      ifModifiedSince: headers["if-modified-since"],
    })
    if (result.body instanceof Buffer) {
      return new Response(result.body, {
        status: result.status,
        headers: result.headers,
      })
    }
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    })
  })

  .listen(3000)

console.log(`Listening on ${app.server?.url}`)
