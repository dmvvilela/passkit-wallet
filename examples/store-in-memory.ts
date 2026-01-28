/**
 * Example: In-memory store adapters for quick prototyping and testing.
 *
 * Drop these into createApplePassHandlers / createAppleOrderHandlers
 * to get started without any database. Replace with a real store
 * (see store-drizzle.ts) when you're ready for production.
 */

import type { ApplePassStore, AppleOrderStore } from "passkit-wallet/handlers"

// ── In-Memory Apple Pass Store ───────────────────────────────────────────

interface PassRecord {
  serialNumber: string
  updatedAt: Date
  data: Record<string, unknown>
}

interface PassRegistrationRecord {
  deviceLibraryIdentifier: string
  serialNumber: string
  pushToken: string
}

export function createInMemoryPassStore(
  /** Seed with initial passes so getPass/getPassData return something. */
  seedPasses: PassRecord[] = [],
): ApplePassStore {
  const passes = new Map<string, PassRecord>(
    seedPasses.map((p) => [p.serialNumber, p]),
  )
  const registrations: PassRegistrationRecord[] = []

  return {
    async getPass(serialNumber) {
      const pass = passes.get(serialNumber)
      return pass ? { updatedAt: pass.updatedAt } : null
    },

    async registerDevice(deviceLibraryIdentifier, pushToken, serialNumber) {
      const existing = registrations.find(
        (r) =>
          r.deviceLibraryIdentifier === deviceLibraryIdentifier &&
          r.serialNumber === serialNumber,
      )
      if (existing) {
        existing.pushToken = pushToken
        return "already_registered"
      }
      registrations.push({ deviceLibraryIdentifier, pushToken, serialNumber })
      return "created"
    },

    async unregisterDevice(deviceLibraryIdentifier, serialNumber) {
      const idx = registrations.findIndex(
        (r) =>
          r.deviceLibraryIdentifier === deviceLibraryIdentifier &&
          r.serialNumber === serialNumber,
      )
      if (idx !== -1) registrations.splice(idx, 1)
    },

    async getRegistrations(passTypeIdentifier, deviceLibraryIdentifier, updatedSince) {
      const deviceRegs = registrations.filter(
        (r) => r.deviceLibraryIdentifier === deviceLibraryIdentifier,
      )

      const cutoff = updatedSince ? new Date(updatedSince) : null

      return deviceRegs
        .map((r) => {
          const pass = passes.get(r.serialNumber)
          if (!pass) return null
          if (cutoff && pass.updatedAt <= cutoff) return null
          return { serialNumber: r.serialNumber, updatedAt: pass.updatedAt }
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)
    },

    async getPassData(serialNumber) {
      const pass = passes.get(serialNumber)
      return pass ? pass.data : null
    },
  }
}

// ── In-Memory Apple Order Store ──────────────────────────────────────────

interface OrderRecord {
  orderIdentifier: string
  updatedAt: Date
}

interface OrderRegistrationRecord {
  deviceIdentifier: string
  orderIdentifier: string
  pushToken: string
}

export function createInMemoryOrderStore(
  seedOrders: OrderRecord[] = [],
): AppleOrderStore {
  const orders = new Map<string, OrderRecord>(
    seedOrders.map((o) => [o.orderIdentifier, o]),
  )
  const registrations: OrderRegistrationRecord[] = []

  return {
    async getOrder(orderIdentifier) {
      const order = orders.get(orderIdentifier)
      return order ? { updatedAt: order.updatedAt } : null
    },

    async registerDevice(deviceIdentifier, pushToken, orderIdentifier) {
      const existing = registrations.find(
        (r) =>
          r.deviceIdentifier === deviceIdentifier &&
          r.orderIdentifier === orderIdentifier,
      )
      if (existing) {
        existing.pushToken = pushToken
        return "already_registered"
      }
      registrations.push({ deviceIdentifier, pushToken, orderIdentifier })
      return "created"
    },

    async unregisterDevice(deviceIdentifier, orderIdentifier) {
      const idx = registrations.findIndex(
        (r) =>
          r.deviceIdentifier === deviceIdentifier &&
          r.orderIdentifier === orderIdentifier,
      )
      if (idx !== -1) registrations.splice(idx, 1)
    },

    async getRegistrations(orderTypeIdentifier, deviceIdentifier, modifiedSince) {
      const deviceRegs = registrations.filter(
        (r) => r.deviceIdentifier === deviceIdentifier,
      )

      const cutoff = modifiedSince ? new Date(modifiedSince) : null

      return deviceRegs
        .map((r) => {
          const order = orders.get(r.orderIdentifier)
          if (!order) return null
          if (cutoff && order.updatedAt <= cutoff) return null
          return { orderIdentifier: r.orderIdentifier, updatedAt: order.updatedAt }
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)
    },
  }
}

// ── Usage ────────────────────────────────────────────────────────────────

/*
import { createApplePassHandlers } from "passkit-wallet/handlers"

const passHandlers = createApplePassHandlers({
  authenticationToken: "test-token",
  store: createInMemoryPassStore([
    {
      serialNumber: "coupon-001",
      updatedAt: new Date(),
      data: { code: "SAVE20", offerTitle: "20% Off", qrCodeUrl: "https://example.com" },
    },
  ]),
  buildPass: async (passData) => {
    return Buffer.from("placeholder-pkpass")
  },
})
*/
