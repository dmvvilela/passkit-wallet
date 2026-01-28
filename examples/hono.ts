/**
 * Example: Wire passkit-wallet handlers into Hono.
 *
 * This is illustrative — adapt the store callbacks to your own database.
 */

import { Hono } from "hono"
import {
  createApplePassHandlers,
  createAppleOrderHandlers,
} from "passkit-wallet/handlers"

const app = new Hono()

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

// Device registration
app.post("/v1/devices/:did/registrations/:ptid/:sn", async (c) => {
  const body = await c.req.json()
  const result = await passHandlers.registerDevice({
    deviceLibraryIdentifier: c.req.param("did"),
    passTypeIdentifier: c.req.param("ptid"),
    serialNumber: c.req.param("sn"),
    pushToken: body.pushToken,
    authorization: c.req.header("authorization"),
  })
  return c.json(result.body ?? null, result.status as any)
})

// Device unregistration
app.delete("/v1/devices/:did/registrations/:ptid/:sn", async (c) => {
  const result = await passHandlers.unregisterDevice({
    deviceLibraryIdentifier: c.req.param("did"),
    passTypeIdentifier: c.req.param("ptid"),
    serialNumber: c.req.param("sn"),
    authorization: c.req.header("authorization"),
  })
  return c.json(result.body ?? null, result.status as any)
})

// Serial numbers for a device
app.get("/v1/devices/:did/registrations/:ptid", async (c) => {
  const result = await passHandlers.getSerialNumbers({
    deviceLibraryIdentifier: c.req.param("did"),
    passTypeIdentifier: c.req.param("ptid"),
    passesUpdatedSince: c.req.query("passesUpdatedSince"),
  })
  return c.json(result.body ?? null, result.status as any)
})

// Latest pass
app.get("/v1/passes/:ptid/:sn", async (c) => {
  const result = await passHandlers.getLatestPass({
    passTypeIdentifier: c.req.param("ptid"),
    serialNumber: c.req.param("sn"),
    authorization: c.req.header("authorization"),
    ifModifiedSince: c.req.header("if-modified-since"),
  })
  if (result.body instanceof Buffer) {
    return new Response(result.body, {
      status: result.status,
      headers: result.headers,
    })
  }
  return c.json(result.body ?? null, result.status as any)
})

// Log endpoint
app.post("/v1/log", async (c) => {
  const body = await c.req.json()
  const result = await passHandlers.log({ logs: body.logs })
  return c.json(result.body ?? null, result.status as any)
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

app.post("/v1/devices/:did/registrations/:otid/:oid", async (c) => {
  const body = await c.req.json()
  const result = await orderHandlers.registerDevice({
    deviceIdentifier: c.req.param("did"),
    orderTypeIdentifier: c.req.param("otid"),
    orderIdentifier: c.req.param("oid"),
    pushToken: body.pushToken,
    authorization: c.req.header("authorization"),
  })
  return c.json(result.body ?? null, result.status as any)
})

app.get("/v1/orders/:otid/:oid", async (c) => {
  const result = await orderHandlers.getLatestOrder({
    orderTypeIdentifier: c.req.param("otid"),
    orderIdentifier: c.req.param("oid"),
    authorization: c.req.header("authorization"),
    ifModifiedSince: c.req.header("if-modified-since"),
  })
  if (result.body instanceof Buffer) {
    return new Response(result.body, {
      status: result.status,
      headers: result.headers,
    })
  }
  return c.json(result.body ?? null, result.status as any)
})

export default app
