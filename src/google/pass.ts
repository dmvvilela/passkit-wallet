import { type walletobjects_v1 } from "googleapis"
import { google } from "googleapis"
import jwt from "jsonwebtoken"
import type { GoogleClientConfig } from "../common/config.js"
import type {
  GoogleClassType,
  GoogleObjectType,
  GoogleSaveType,
  GoogleOfferClassOptions,
  GoogleOfferObjectOptions,
  GoogleOrderClassOptions,
  GoogleOrderObjectOptions,
} from "./types.js"

// ── Client ──────────────────────────────────────────────────────────────

/**
 * Create an authenticated Google Wallet API client.
 */
export const loadClient = (
  config: GoogleClientConfig,
): walletobjects_v1.Walletobjects => {
  const auth = new google.auth.GoogleAuth({
    credentials: config.credentials,
    scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
  })

  return google.walletobjects({ version: "v1", auth })
}

// ── Class / Object CRUD ─────────────────────────────────────────────────

export const getClass = async (
  client: walletobjects_v1.Walletobjects,
  type: GoogleClassType,
  issuerId: string,
  classSuffix: string,
) => {
  try {
    const response = await client[type].get({
      resourceId: `${issuerId}.${classSuffix}`,
    })
    return response.data
  } catch (err: any) {
    if (err.response?.status === 404) return null
    console.error(err)
    return null
  }
}

export const createClass = async (
  client: walletobjects_v1.Walletobjects,
  type: GoogleClassType,
  issuerId: string,
  classSuffix: string,
  body: object,
): Promise<string> => {
  const resourceId = `${issuerId}.${classSuffix}`

  try {
    await client[type].get({ resourceId })
    return resourceId // already exists
  } catch (err: any) {
    if (err.response?.status !== 404) {
      console.error(err)
      return resourceId
    }
  }

  await client[type].insert({ requestBody: body })
  return resourceId
}

export const updateClass = async (
  client: walletobjects_v1.Walletobjects,
  type: GoogleClassType,
  issuerId: string,
  classSuffix: string,
  body: object,
) => {
  const resourceId = `${issuerId}.${classSuffix}`

  try {
    await client[type].get({ resourceId })
  } catch (err: any) {
    if (err.response?.status === 404) return null
    console.error(err)
    return null
  }

  const response = await client[type].update({
    resourceId,
    requestBody: body,
  })

  return response
}

export const updateObject = async (
  client: walletobjects_v1.Walletobjects,
  type: GoogleObjectType,
  issuerId: string,
  objectSuffix: string,
  body: object,
) => {
  const resourceId = `${issuerId}.${objectSuffix}`

  try {
    await client[type].get({ resourceId })
  } catch (err: any) {
    if (err.response?.status === 404) {
      throw new Error(`Object ${objectSuffix} not found`)
    }
    throw err
  }

  const response = await (client[type] as any).update({
    resourceId,
    requestBody: body,
  })

  return response
}

// ── Signed "Save to Wallet" URL ─────────────────────────────────────────

/**
 * Generate a signed JWT URL that adds a pass to Google Wallet.
 */
export const getSignedURL = (
  config: GoogleClientConfig,
  type: GoogleSaveType,
  objectSuffix: string,
  classSuffix: string,
): string => {
  const claims = {
    iss: config.credentials.client_email,
    aud: "google",
    origins: config.origins,
    typ: "savetowallet",
    payload: {
      [type]: [
        {
          id: `${config.issuerId}.${objectSuffix}`,
          classId: `${config.issuerId}.${classSuffix}`,
        },
      ],
    },
  }

  const token = jwt.sign(claims, config.credentials.private_key, {
    algorithm: "RS256",
  })

  return `https://pay.google.com/gp/v/save/${token}`
}

// ── Body Builders ───────────────────────────────────────────────────────

export const mountOfferClassBody = (
  issuerId: string,
  options: GoogleOfferClassOptions,
) => {
  return {
    id: `${issuerId}.${options.classSuffix}`,
    reviewStatus: options.reviewStatus,
    provider: options.provider,
    redemptionChannel: "ONLINE",
    ...(options.titleImageUri && {
      titleImage: {
        sourceUri: { uri: options.titleImageUri },
        contentDescription: {
          defaultValue: {
            language: "en-US",
            value: options.titleImageDescription ?? "Logo",
          },
        },
      },
    }),
    ...(options.issuerName && {
      localizedIssuerName: {
        defaultValue: { language: "en-US", value: options.issuerName },
      },
    }),
    ...(options.hexBackgroundColor && {
      hexBackgroundColor: options.hexBackgroundColor,
    }),
    ...(options.heroImageUri && {
      heroImage: {
        sourceUri: { uri: options.heroImageUri },
        contentDescription: {
          defaultValue: {
            language: "en-US",
            value: options.heroImageDescription ?? "Hero image",
          },
        },
      },
    }),
    localizedTitle: {
      defaultValue: { language: "en-US", value: options.offerTitle },
    },
  }
}

export const mountOfferObjectBody = (
  issuerId: string,
  options: GoogleOfferObjectOptions,
) => {
  return {
    id: `${issuerId}.${options.objectSuffix}`,
    classId: `${issuerId}.${options.classSuffix}`,
    state: options.state ?? "ACTIVE",
    barcode: {
      type: "QR_CODE",
      value: options.qrCodeUrl,
      alternateText: "Code: " + options.code,
    },
  }
}

export const mountOrderClassBody = (
  issuerId: string,
  options: GoogleOrderClassOptions,
) => {
  return {
    id: `${issuerId}.${options.classSuffix}`,
    classTemplateInfo: {
      cardTemplateOverride: {
        cardRowTemplateInfos: [
          {
            twoItems: {
              startItem: {
                firstValue: {
                  fields: [
                    { fieldPath: "object.textModulesData['status']" },
                  ],
                },
              },
              endItem: {
                firstValue: {
                  fields: [
                    { fieldPath: "object.textModulesData['order_date']" },
                  ],
                },
              },
            },
          },
          {
            twoItems: {
              startItem: {
                firstValue: {
                  fields: [
                    {
                      fieldPath:
                        "object.textModulesData['estimated_delivery']",
                    },
                  ],
                },
              },
              endItem: {
                firstValue: {
                  fields: [
                    {
                      fieldPath: "object.textModulesData['tracking_number']",
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    },
  }
}

export const mountOrderObjectBody = (
  issuerId: string,
  options: GoogleOrderObjectOptions,
) => {
  return {
    id: `${issuerId}.${options.objectSuffix}`,
    classId: `${issuerId}.${options.classSuffix}`,
    ...(options.logoUri && {
      logo: {
        sourceUri: { uri: options.logoUri },
        contentDescription: {
          defaultValue: {
            language: "en-US",
            value: options.logoDescription ?? "Logo",
          },
        },
      },
    }),
    cardTitle: {
      defaultValue: {
        language: "en-US",
        value: options.cardTitle ?? "Order Status",
      },
    },
    subheader: {
      defaultValue: { language: "en-US", value: "Order Number" },
    },
    header: {
      defaultValue: { language: "en-US", value: options.orderNumber },
    },
    textModulesData: [
      { id: "status", header: "Status", body: options.orderStatus },
      { id: "order_date", header: "Order Date", body: options.orderDate },
      {
        id: "estimated_delivery",
        header: "Estimated Delivery",
        body: options.estimatedDelivery,
      },
      {
        id: "tracking_number",
        header: "Tracking Number",
        body: options.trackingNumber,
      },
    ],
    barcode: {
      type: "QR_CODE",
      value: options.qrCodeUrl,
      alternateText: "Scan to track your order",
    },
    ...(options.hexBackgroundColor && {
      hexBackgroundColor: options.hexBackgroundColor,
    }),
    ...(options.heroImageUri && {
      heroImage: {
        sourceUri: { uri: options.heroImageUri },
        contentDescription: {
          defaultValue: {
            language: "en-US",
            value: options.heroImageDescription ?? "Hero image",
          },
        },
      },
    }),
  }
}
