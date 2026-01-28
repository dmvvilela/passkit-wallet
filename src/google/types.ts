export type GoogleReviewStatus =
  | "REVIEW_STATUS_UNSPECIFIED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "DRAFT"

export type GoogleObjectState =
  | "STATE_UNSPECIFIED"
  | "ACTIVE"
  | "COMPLETED"
  | "EXPIRED"
  | "INACTIVE"

export type GoogleClassType = "genericclass" | "offerclass"
export type GoogleObjectType = "genericobject" | "offerobject"
export type GoogleSaveType = "genericObjects" | "offerObjects"

/** Options for building a Google Wallet offer class. */
export interface GoogleOfferClassOptions {
  classSuffix: string
  offerTitle: string
  reviewStatus: GoogleReviewStatus
  /** Provider / issuer display name */
  provider: string
  /** Hex background color (e.g. "#000000") */
  hexBackgroundColor?: string
  /** Title image URI */
  titleImageUri?: string
  titleImageDescription?: string
  /** Hero image URI */
  heroImageUri?: string
  heroImageDescription?: string
  /** Localized issuer name */
  issuerName?: string
}

/** Options for building a Google Wallet offer object. */
export interface GoogleOfferObjectOptions {
  classSuffix: string
  objectSuffix: string
  code: string
  qrCodeUrl: string
  state?: GoogleObjectState
}

/** Options for building a Google Wallet order class (generic class). */
export interface GoogleOrderClassOptions {
  classSuffix: string
}

/** Options for building a Google Wallet order object (generic object). */
export interface GoogleOrderObjectOptions {
  classSuffix: string
  objectSuffix: string
  orderNumber: string
  orderDate: string
  orderStatus: string
  estimatedDelivery: string
  trackingNumber: string
  /** QR code value / URL */
  qrCodeUrl: string
  /** Card title (default: "Order Status") */
  cardTitle?: string
  /** Hex background color */
  hexBackgroundColor?: string
  /** Logo image URI */
  logoUri?: string
  logoDescription?: string
  /** Hero image URI */
  heroImageUri?: string
  heroImageDescription?: string
}
