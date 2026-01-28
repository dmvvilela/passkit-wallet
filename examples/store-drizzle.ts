/**
 * Example: Implement ApplePassStore and AppleOrderStore with Drizzle ORM.
 *
 * This shows the DB schema and store adapter implementation you'd use
 * with createApplePassHandlers / createAppleOrderHandlers.
 *
 * Adapt the schema to your ORM of choice (Prisma, Knex, raw SQL, etc.).
 */

import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core"
import { eq, and, gt } from "drizzle-orm"
import type { ApplePassStore, AppleOrderStore } from "passkit-wallet/handlers"

// ── Schema ───────────────────────────────────────────────────────────────

/** Your passes table — stores the data needed to build each .pkpass. */
export const passes = pgTable("passes", {
  serialNumber: text("serial_number").primaryKey(),
  code: text("code").notNull(),
  offerTitle: text("offer_title").notNull(),
  qrCodeUrl: text("qr_code_url").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

/** Tracks which devices are registered for which passes. */
export const passRegistrations = pgTable(
  "pass_registrations",
  {
    deviceLibraryIdentifier: text("device_library_identifier").notNull(),
    serialNumber: text("serial_number")
      .notNull()
      .references(() => passes.serialNumber),
    pushToken: text("push_token").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.deviceLibraryIdentifier, t.serialNumber] }),
  }),
)

/** Your orders table. */
export const orders = pgTable("orders", {
  orderIdentifier: text("order_identifier").primaryKey(),
  orderNumber: text("order_number").notNull(),
  currency: text("currency").notNull(),
  // ... add your order fields
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

/** Tracks which devices are registered for which orders. */
export const orderRegistrations = pgTable(
  "order_registrations",
  {
    deviceIdentifier: text("device_identifier").notNull(),
    orderIdentifier: text("order_identifier")
      .notNull()
      .references(() => orders.orderIdentifier),
    pushToken: text("push_token").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.deviceIdentifier, t.orderIdentifier] }),
  }),
)

// ── Apple Pass Store ─────────────────────────────────────────────────────

/**
 * Create an ApplePassStore backed by Drizzle.
 *
 * Pass the returned object as `store` to `createApplePassHandlers()`.
 */
export function createPassStore(db: any): ApplePassStore {
  return {
    async getPass(serialNumber) {
      const [row] = await db
        .select({ updatedAt: passes.updatedAt })
        .from(passes)
        .where(eq(passes.serialNumber, serialNumber))
        .limit(1)

      return row ?? null
    },

    async registerDevice(deviceLibraryIdentifier, pushToken, serialNumber) {
      const [existing] = await db
        .select()
        .from(passRegistrations)
        .where(
          and(
            eq(passRegistrations.deviceLibraryIdentifier, deviceLibraryIdentifier),
            eq(passRegistrations.serialNumber, serialNumber),
          ),
        )
        .limit(1)

      if (existing) {
        // Update push token in case it changed
        await db
          .update(passRegistrations)
          .set({ pushToken })
          .where(
            and(
              eq(passRegistrations.deviceLibraryIdentifier, deviceLibraryIdentifier),
              eq(passRegistrations.serialNumber, serialNumber),
            ),
          )
        return "already_registered"
      }

      await db.insert(passRegistrations).values({
        deviceLibraryIdentifier,
        pushToken,
        serialNumber,
      })
      return "created"
    },

    async unregisterDevice(deviceLibraryIdentifier, serialNumber) {
      await db
        .delete(passRegistrations)
        .where(
          and(
            eq(passRegistrations.deviceLibraryIdentifier, deviceLibraryIdentifier),
            eq(passRegistrations.serialNumber, serialNumber),
          ),
        )
    },

    async getRegistrations(passTypeIdentifier, deviceLibraryIdentifier, updatedSince) {
      // passTypeIdentifier is part of the URL but typically you only have
      // one pass type, so filtering by device is enough. If you support
      // multiple pass types, add a passTypeIdentifier column.
      const conditions = [
        eq(passRegistrations.deviceLibraryIdentifier, deviceLibraryIdentifier),
      ]

      let query = db
        .select({
          serialNumber: passes.serialNumber,
          updatedAt: passes.updatedAt,
        })
        .from(passRegistrations)
        .innerJoin(passes, eq(passes.serialNumber, passRegistrations.serialNumber))
        .where(and(...conditions))

      if (updatedSince) {
        query = query.where(gt(passes.updatedAt, new Date(updatedSince)))
      }

      return query
    },

    async getPassData(serialNumber) {
      const [row] = await db
        .select()
        .from(passes)
        .where(eq(passes.serialNumber, serialNumber))
        .limit(1)

      return row ?? null
    },
  }
}

// ── Apple Order Store ────────────────────────────────────────────────────

/**
 * Create an AppleOrderStore backed by Drizzle.
 *
 * Pass the returned object as `store` to `createAppleOrderHandlers()`.
 */
export function createOrderStore(db: any): AppleOrderStore {
  return {
    async getOrder(orderIdentifier) {
      const [row] = await db
        .select({ updatedAt: orders.updatedAt })
        .from(orders)
        .where(eq(orders.orderIdentifier, orderIdentifier))
        .limit(1)

      return row ?? null
    },

    async registerDevice(deviceIdentifier, pushToken, orderIdentifier) {
      const [existing] = await db
        .select()
        .from(orderRegistrations)
        .where(
          and(
            eq(orderRegistrations.deviceIdentifier, deviceIdentifier),
            eq(orderRegistrations.orderIdentifier, orderIdentifier),
          ),
        )
        .limit(1)

      if (existing) {
        await db
          .update(orderRegistrations)
          .set({ pushToken })
          .where(
            and(
              eq(orderRegistrations.deviceIdentifier, deviceIdentifier),
              eq(orderRegistrations.orderIdentifier, orderIdentifier),
            ),
          )
        return "already_registered"
      }

      await db.insert(orderRegistrations).values({
        deviceIdentifier,
        pushToken,
        orderIdentifier,
      })
      return "created"
    },

    async unregisterDevice(deviceIdentifier, orderIdentifier) {
      await db
        .delete(orderRegistrations)
        .where(
          and(
            eq(orderRegistrations.deviceIdentifier, deviceIdentifier),
            eq(orderRegistrations.orderIdentifier, orderIdentifier),
          ),
        )
    },

    async getRegistrations(orderTypeIdentifier, deviceIdentifier, modifiedSince) {
      let query = db
        .select({
          orderIdentifier: orders.orderIdentifier,
          updatedAt: orders.updatedAt,
        })
        .from(orderRegistrations)
        .innerJoin(orders, eq(orders.orderIdentifier, orderRegistrations.orderIdentifier))
        .where(eq(orderRegistrations.deviceIdentifier, deviceIdentifier))

      if (modifiedSince) {
        query = query.where(gt(orders.updatedAt, new Date(modifiedSince)))
      }

      return query
    },
  }
}

// ── Putting it all together ──────────────────────────────────────────────

/*
import { createApplePassHandlers, createAppleOrderHandlers } from "passkit-wallet/handlers"
import { drizzle } from "drizzle-orm/node-postgres"

const db = drizzle(process.env.DATABASE_URL!)

const passHandlers = createApplePassHandlers({
  authenticationToken: "your-auth-token",
  store: createPassStore(db),
  buildPass: async (passData) => {
    // passData is the row returned by getPassData — your passes table columns
    const template = await apple.loadPassTemplate()
    const body = mountCouponPassBody({
      code: passData.code,
      offerTitle: passData.offerTitle,
      qrCodeUrl: passData.qrCodeUrl,
    })
    const pass = template.createPass({
      serialNumber: passData.serialNumber,
      description: passData.offerTitle,
      organizationName: "Your Company",
      coupon: body,
    })
    return pass.getAsBuffer()
  },
})

const orderHandlers = createAppleOrderHandlers({
  authenticationToken: "your-order-auth-token",
  store: createOrderStore(db),
  buildOrder: async (orderIdentifier) => {
    // Fetch full order data and generate the .order buffer
    const orderData = await db.select().from(orders).where(eq(orders.orderIdentifier, orderIdentifier)).limit(1)
    const orderBody = apple.mountOrderInstance({ ...orderData[0] })
    return apple.generateOrder(orderBody)
  },
})
*/
