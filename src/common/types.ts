/** Order status values used across Apple and Google Wallet passes. */
export type OrderStatus =
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELED"
  | "REFUNDED"

/** Translate a raw order status string to a normalized OrderStatus. */
export const translateOrderStatus = (status: string): OrderStatus => {
  switch (status) {
    case "REFUNDED":
      return "REFUNDED"
    case "SHIPPED":
      return "SHIPPED"
    case "CANCELED":
      return "CANCELED"
    case "COMPLETED":
      return "DELIVERED"
    case "CREATED":
    case "CLOSED":
    case "PROCESSING":
    case "HOLD":
    default:
      return "PROCESSING"
  }
}

/** Data for mounting a coupon pass (used by both Apple and Google). */
export interface CouponPassData {
  code: string
  offerTitle: string
  /** URL the QR code should point to. */
  qrCodeUrl: string
  /** Optional back fields (Apple) or additional text modules (Google). */
  backFields?: { key: string; label: string; value: string }[]
}

/** Data for mounting an order. */
export interface OrderData {
  orderNumber: string
  currency: string
  totals: {
    grandTotal: number
    subTotal: number
    shipping: number
    tax: number
    tip: number
  }
  orderItems: {
    image: string
    price: number
    quantity: number
    productName: string
    variantName?: string
  }[]
  customer: {
    emailAddress: string
    familyName?: string
    givenName?: string
    organizationName?: string
    phoneNumber?: string
  }
  orderStatus?: string
  paymentStatus?: string
  fulfillments?: {
    fulfillmentIdentifier: string
    status: string
    fulfillmentType: "shipping" | "pickup"
    trackingNumber?: string
    estimatedDeliveryAt?: string
    notes?: string
  }[]
}
