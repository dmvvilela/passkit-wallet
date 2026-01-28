// ── Apple Wallet ─────────────────────────────────────────────────────────
export {
  loadPassTemplate,
  mountCouponPassBody,
  loadOrderModel,
  mountOrderInstance,
  generateOrder,
  writeOrderCertificates,
  addImagesToModelDir,
  removeImagesFromModelDir,
  sendPushNotification,
  parseRegistrationRequest,
  parseUnregistrationRequest,
} from "./apple/index.js"

// ── Google Wallet ───────────────────────────────────────────────────────
export {
  loadClient,
  getClass,
  createClass,
  updateClass,
  updateObject,
  getSignedURL,
  mountOfferClassBody,
  mountOfferObjectBody,
  mountOrderClassBody,
  mountOrderObjectBody,
  sendObjectMessage,
} from "./google/index.js"

// ── Config ──────────────────────────────────────────────────────────────
export {
  applePassConfigSchema,
  appleOrderConfigSchema,
  appleClientConfigSchema,
  googleClientConfigSchema,
} from "./common/config.js"
export type {
  ApplePassConfig,
  AppleOrderConfig,
  AppleClientConfig,
  GoogleClientConfig,
} from "./common/config.js"

// ── Common Types ────────────────────────────────────────────────────────
export { translateOrderStatus } from "./common/types.js"
export type { OrderStatus, CouponPassData, OrderData } from "./common/types.js"

// ── Apple Types ─────────────────────────────────────────────────────────
export type {
  OrderInstance,
  Merchant,
  Payment,
  MoneyAmount,
  SummaryItem,
  LineItem,
  Fulfillment,
  AppleCouponPassOptions,
  AppleOrderOptions,
  ApplePushOptions,
} from "./apple/types.js"

// ── Google Types ────────────────────────────────────────────────────────
export type {
  GoogleReviewStatus,
  GoogleObjectState,
  GoogleClassType,
  GoogleObjectType,
  GoogleSaveType,
  GoogleOfferClassOptions,
  GoogleOfferObjectOptions,
  GoogleOrderClassOptions,
  GoogleOrderObjectOptions,
} from "./google/types.js"

// ── Factory helpers ─────────────────────────────────────────────────────

import { applePassConfigSchema, appleOrderConfigSchema, googleClientConfigSchema } from "./common/config.js"
import type { ApplePassConfig, AppleOrderConfig, GoogleClientConfig } from "./common/config.js"
import { loadPassTemplate as _loadPassTemplate } from "./apple/pass.js"
import { loadOrderModel as _loadOrderModel, generateOrder as _generateOrder, mountOrderInstance as _mountOrderInstance } from "./apple/order.js"
import { sendPushNotification as _sendPush } from "./apple/push.js"
import { loadClient as _loadClient, getSignedURL as _getSignedURL } from "./google/pass.js"

/**
 * Create a configured Apple Wallet client with convenience methods.
 */
export const createAppleWalletClient = (config: {
  pass?: ApplePassConfig
  order?: AppleOrderConfig
}) => {
  const passConfig = config.pass ? applePassConfigSchema.parse(config.pass) : undefined
  const orderConfig = config.order ? appleOrderConfigSchema.parse(config.order) : undefined

  return {
    /** Load the pass template (requires `pass` config). */
    loadPassTemplate: () => {
      if (!passConfig) throw new Error("Apple pass config not provided")
      return _loadPassTemplate(passConfig)
    },
    /** Load the order model (requires `order` config). */
    loadOrderModel: () => {
      if (!orderConfig) throw new Error("Apple order config not provided")
      return _loadOrderModel(orderConfig)
    },
    /** Generate a signed .order file buffer (requires `order` config). */
    generateOrder: (orderInstance: Record<string, unknown>, images?: string[]) => {
      if (!orderConfig) throw new Error("Apple order config not provided")
      return _generateOrder(orderInstance, orderConfig, images)
    },
    /** Build an order instance body (requires `order` config). */
    mountOrderInstance: (options: import("./apple/types.js").AppleOrderOptions) => {
      if (!orderConfig) throw new Error("Apple order config not provided")
      return _mountOrderInstance(options, orderConfig.webServiceURL)
    },
    /** Send an APN push notification. */
    sendPushNotification: (pushTokens: string | string[], topic: string) => {
      const opts = passConfig ?? orderConfig
      if (!opts) throw new Error("Apple config not provided")
      return _sendPush(pushTokens, topic, {
        certificate: opts.certificate,
        privateKey: opts.privateKey,
        passphrase: opts.keyPassword,
      })
    },
    passConfig,
    orderConfig,
  }
}

/**
 * Create a configured Google Wallet client with convenience methods.
 */
export const createGoogleWalletClient = (config: GoogleClientConfig) => {
  const parsed = googleClientConfigSchema.parse(config)
  const client = _loadClient(parsed)

  return {
    client,
    config: parsed,
    /** Generate a signed "Save to Wallet" URL. */
    getSignedURL: (
      type: import("./google/types.js").GoogleSaveType,
      objectSuffix: string,
      classSuffix: string,
    ) => _getSignedURL(parsed, type, objectSuffix, classSuffix),
  }
}
