export interface OrderInstance {
  schemaVersion: number
  orderTypeIdentifier: string
  orderIdentifier: string
  orderType: string
  orderNumber: string
  createdAt: string
  updatedAt: string
  status: string
  changeNotifications: string
  webServiceURL: string
  authenticationToken?: string
  merchant: Merchant
  payment?: Payment
  lineItems?: LineItem[]
  statusDescription: string
  orderManagementURL: string
  fulfillments?: Fulfillment[]
}

export interface Merchant {
  displayName: string
  merchantIdentifier: string
  logo: string
  url: string
}

export interface Payment {
  status: string
  total: MoneyAmount
  summaryItems: SummaryItem[]
  paymentMethods?: string[]
}

export interface MoneyAmount {
  amount: number
  currency: string
}

export interface SummaryItem {
  label: string
  value: MoneyAmount
}

export interface LineItem {
  image: string
  price: MoneyAmount
  quantity: number
  subtitle?: string
  title: string
}

export interface Fulfillment {
  fulfillmentIdentifier: string
  status: string
  fulfillmentType: "shipping" | "pickup"
  trackingNumber?: string
  estimatedDeliveryAt?: string
  notes?: string
}

/** Options for creating a coupon-style Apple Wallet pass. */
export interface AppleCouponPassOptions {
  code: string
  offerTitle: string
  /** URL encoded into the QR code barcode */
  qrCodeUrl: string
  /** Optional back-of-pass fields */
  backFields?: { key: string; label: string; value: string }[]
}

/** Options for mounting an Apple order instance body. */
export interface AppleOrderOptions {
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
  fulfillments?: Fulfillment[]
  /** URL for order management page. If omitted, no link is added. */
  orderManagementURL?: string
}

/** Options for Apple push notifications. */
export interface ApplePushOptions {
  /** PEM-encoded certificate */
  certificate: string
  /** PEM-encoded private key */
  privateKey: string
  /** Key password */
  passphrase?: string
  /** Use production APN gateway (default: true) */
  production?: boolean
}
