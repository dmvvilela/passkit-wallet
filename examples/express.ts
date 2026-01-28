/**
 * Example: Wire passkit-wallet handlers into Express.
 *
 * This is illustrative — adapt the store callbacks to your own database.
 */

import express from "express"
import {
  createApplePassHandlers,
  createAppleOrderHandlers,
} from "passkit-wallet/handlers"

const app = express()
app.use(express.json())

// ── Apple Pass Handlers ──────────────────────────────────────────────────

const passHandlers = createApplePassHandlers({
  authenticationToken: process.env.APPLE_PASS_AUTH_TOKEN!,
  store: {
    getPass: async (serialNumber) => {
      // TODO: query your DB
      return { updatedAt: new Date() }
    },
    registerDevice: async (deviceLibId, pushToken, serialNumber) => {
      // TODO: upsert into your registrations table
      return "created"
    },
    unregisterDevice: async (deviceLibId, serialNumber) => {
      // TODO: delete from your registrations table
    },
    getRegistrations: async (passTypeId, deviceLibId, updatedSince) => {
      // TODO: query registrations, optionally filtering by updatedSince
      return []
    },
    getPassData: async (serialNumber) => {
      // TODO: return the fields needed to build the .pkpass
      return { serialNumber, code: "SAVE20", offerTitle: "20% Off" }
    },
  },
  buildPass: async (passData) => {
    // TODO: use your template to build the .pkpass buffer
    return Buffer.from("pkpass-placeholder")
  },
  onLog: (logs) => console.log("[Apple Wallet]", logs),
})

// Device registration
app.post(
  "/v1/devices/:did/registrations/:ptid/:sn",
  async (req, res) => {
    const result = await passHandlers.registerDevice({
      deviceLibraryIdentifier: req.params.did,
      passTypeIdentifier: req.params.ptid,
      serialNumber: req.params.sn,
      pushToken: req.body.pushToken,
      authorization: req.headers.authorization,
    })
    res.status(result.status).json(result.body)
  },
)

// Device unregistration
app.delete(
  "/v1/devices/:did/registrations/:ptid/:sn",
  async (req, res) => {
    const result = await passHandlers.unregisterDevice({
      deviceLibraryIdentifier: req.params.did,
      passTypeIdentifier: req.params.ptid,
      serialNumber: req.params.sn,
      authorization: req.headers.authorization,
    })
    res.status(result.status).json(result.body)
  },
)

// Serial numbers for a device
app.get(
  "/v1/devices/:did/registrations/:ptid",
  async (req, res) => {
    const result = await passHandlers.getSerialNumbers({
      deviceLibraryIdentifier: req.params.did,
      passTypeIdentifier: req.params.ptid,
      passesUpdatedSince: req.query.passesUpdatedSince as string | undefined,
    })
    res.status(result.status).json(result.body)
  },
)

// Latest pass
app.get("/v1/passes/:ptid/:sn", async (req, res) => {
  const result = await passHandlers.getLatestPass({
    passTypeIdentifier: req.params.ptid,
    serialNumber: req.params.sn,
    authorization: req.headers.authorization,
    ifModifiedSince: req.headers["if-modified-since"],
  })
  if (result.headers) {
    for (const [k, v] of Object.entries(result.headers)) res.setHeader(k, v)
  }
  res.status(result.status).send(result.body)
})

// Log endpoint
app.post("/v1/log", async (req, res) => {
  const result = await passHandlers.log({ logs: req.body.logs })
  res.status(result.status).json(result.body)
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

app.post(
  "/v1/devices/:did/registrations/:otid/:oid",
  async (req, res) => {
    const result = await orderHandlers.registerDevice({
      deviceIdentifier: req.params.did,
      orderTypeIdentifier: req.params.otid,
      orderIdentifier: req.params.oid,
      pushToken: req.body.pushToken,
      authorization: req.headers.authorization,
    })
    res.status(result.status).json(result.body)
  },
)

app.get("/v1/orders/:otid/:oid", async (req, res) => {
  const result = await orderHandlers.getLatestOrder({
    orderTypeIdentifier: req.params.otid,
    orderIdentifier: req.params.oid,
    authorization: req.headers.authorization,
    ifModifiedSince: req.headers["if-modified-since"],
  })
  if (result.headers) {
    for (const [k, v] of Object.entries(result.headers)) res.setHeader(k, v)
  }
  res.status(result.status).send(result.body)
})

app.listen(3000, () => console.log("Listening on :3000"))
