/**
 * Example: Create Google Wallet offer and order passes.
 *
 * This shows how to use createGoogleWalletClient to create classes,
 * objects, and generate signed "Save to Wallet" URLs.
 */

import {
  createGoogleWalletClient,
  mountOfferClassBody,
  mountOfferObjectBody,
  mountOrderClassBody,
  mountOrderObjectBody,
  createClass,
  updateObject,
} from "passkit-wallet"

const gw = createGoogleWalletClient({
  issuerId: "1234567890",
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS!),
  origins: ["https://yourapp.com"],
})

// ── Offer (Coupon) Pass ──────────────────────────────────────────────────

// 1. Create the offer class (template)
const offerClassBody = mountOfferClassBody(gw.config.issuerId, {
  classSuffix: "holiday_offers",
  offerTitle: "20% Off Everything",
  reviewStatus: "DRAFT",
  provider: "Your Company",
  hexBackgroundColor: "#1a1a2e",
  titleImageUri: "https://cdn.example.com/wallet/offer-title.png",
  heroImageUri: "https://cdn.example.com/wallet/offer-hero.png",
})

await createClass(
  gw.client,
  "offerclass",
  gw.config.issuerId,
  "holiday_offers",
  offerClassBody,
)

// 2. Create an offer object (instance for a specific user)
const offerObjectBody = mountOfferObjectBody(gw.config.issuerId, {
  classSuffix: "holiday_offers",
  objectSuffix: "offer_user_123",
  code: "SAVE20",
  qrCodeUrl: "https://yourapp.com/redeem/SAVE20",
})

// Insert the object via the API
await (gw.client.offerobject as any).insert({ requestBody: offerObjectBody })

// 3. Generate a signed "Save to Wallet" URL
const offerSaveUrl = gw.getSignedURL(
  "offerObjects",
  "offer_user_123",
  "holiday_offers",
)
console.log("Offer save URL:", offerSaveUrl)

// ── Order Pass ───────────────────────────────────────────────────────────

// 1. Create the order class (template)
const orderClassBody = mountOrderClassBody(gw.config.issuerId, {
  classSuffix: "order_tracking",
})

await createClass(
  gw.client,
  "genericclass",
  gw.config.issuerId,
  "order_tracking",
  orderClassBody,
)

// 2. Create an order object
const orderObjectBody = mountOrderObjectBody(gw.config.issuerId, {
  classSuffix: "order_tracking",
  objectSuffix: "order_12345",
  orderNumber: "ORD-12345",
  orderStatus: "Processing",
  orderDate: "January 28, 2026",
  estimatedDelivery: "February 5, 2026",
  trackingNumber: "1Z999AA10123456784",
  qrCodeUrl: "https://yourapp.com/orders/ORD-12345",
})

await (gw.client.genericobject as any).insert({ requestBody: orderObjectBody })

// 3. Generate a signed "Save to Wallet" URL
const orderSaveUrl = gw.getSignedURL(
  "genericObjects",
  "order_12345",
  "order_tracking",
)
console.log("Order save URL:", orderSaveUrl)

// ── Updating an existing object ──────────────────────────────────────────

// When the order status changes, update the existing object:
await updateObject(
  gw.client,
  "genericobject",
  gw.config.issuerId,
  "order_12345",
  {
    ...orderObjectBody,
    textModulesData: [
      { id: "status", header: "Status", body: "Shipped" },
      { id: "order_date", header: "Order Date", body: "January 28, 2026" },
      { id: "estimated_delivery", header: "Estimated Delivery", body: "February 3, 2026" },
      { id: "tracking_number", header: "Tracking Number", body: "1Z999AA10123456784" },
    ],
  },
)
