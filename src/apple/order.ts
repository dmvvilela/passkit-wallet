// @ts-expect-error — wallet-order-generator has no type declarations
import orderGenerator from "wallet-order-generator"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { unlink } from "node:fs/promises"
import type { AppleOrderConfig } from "../common/config.js"
import type { AppleOrderOptions, OrderInstance } from "./types.js"

/**
 * Write order certificates to a temporary directory so
 * `wallet-order-generator` can read them from disk.
 *
 * Returns the temp directory path.
 */
export const writeOrderCertificates = (config: AppleOrderConfig): string => {
  const tempDir = mkdtempSync(join(tmpdir(), "passkit-certs-"))

  const certs = {
    signerCert: config.certificate,
    signerKey: config.privateKey,
    wwdr: config.wwdrCertificate,
  }

  for (const [name, value] of Object.entries(certs)) {
    writeFileSync(join(tempDir, `${name}.pem`), value)
  }

  return tempDir
}

/**
 * Load an order model from a `.order` bundle directory.
 */
export const loadOrderModel = async (
  config: AppleOrderConfig,
): Promise<OrderInstance> => {
  const orderInstance = await orderGenerator.from(config.orderModelPath)
  return orderInstance as OrderInstance
}

/**
 * Build a plain order instance body from the provided data.
 *
 * Amounts in `totals` and `orderItems[].price` are expected in the
 * **smallest currency unit** (e.g. cents) and will be divided by 100.
 */
export const mountOrderInstance = (
  options: AppleOrderOptions,
  webServiceURL: string,
): Record<string, unknown> => {
  const {
    orderNumber,
    totals,
    currency,
    orderItems,
    customer,
    orderStatus,
    paymentStatus,
    fulfillments,
    orderManagementURL,
  } = options

  return {
    orderNumber,
    customer,
    webServiceURL,
    payment: {
      status: paymentStatus || "paid",
      total: {
        amount: totals.grandTotal / 100,
        currency,
      },
      summaryItems: [
        {
          label: "Subtotal",
          value: { amount: totals.subTotal / 100, currency },
        },
        {
          label: "Shipping",
          value: { amount: totals.shipping / 100, currency },
        },
        {
          label: "Tip",
          value: { amount: totals.tip / 100, currency },
        },
      ],
    },
    lineItems: orderItems.map((item) => ({
      image: item.image.split("/").pop(),
      price: { amount: item.price / 100, currency },
      quantity: item.quantity,
      title: item.productName,
      subtitle: item.variantName || "",
    })),
    statusDescription: orderStatus || "PROCESSING",
    orderManagementURL,
    fulfillments,
  }
}

/**
 * Download images from URLs and save them into the order model directory.
 *
 * Returns the list of saved file names.
 */
export const addImagesToModelDir = async (
  modelDirPath: string,
  images: string[],
): Promise<string[]> => {
  const results = await Promise.all(
    images.map(async (imageUrl) => {
      try {
        const response = await fetch(imageUrl)
        const buffer = Buffer.from(await response.arrayBuffer())
        const imageName = imageUrl.split("/").pop()!
        const imagePath = join(modelDirPath, imageName)
        writeFileSync(imagePath, buffer)
        return imageName
      } catch (err) {
        console.error("Failed to download image:", err)
        return null
      }
    }),
  )

  return results.filter((name): name is string => name !== null)
}

/**
 * Remove previously-added images from the order model directory.
 */
export const removeImagesFromModelDir = async (
  modelDirPath: string,
  images: string[],
): Promise<void> => {
  for (const image of images) {
    try {
      await unlink(join(modelDirPath, image))
    } catch {
      // ignore missing files
    }
  }
}

/**
 * Generate a signed `.order` file buffer.
 *
 * @param orderInstance - The order data object (from `mountOrderInstance` or your own).
 * @param config - Apple order certificate configuration.
 * @param images - List of image file names already present in the model directory.
 * @returns A `Buffer` containing the signed order file.
 */
export const generateOrder = async (
  orderInstance: Record<string, unknown>,
  config: AppleOrderConfig,
  images: string[] = [],
): Promise<Buffer> => {
  const tempCertsDir = writeOrderCertificates(config)

  // Inject the auth token
  orderInstance.authenticationToken = config.authenticationToken

  const readStream = await orderGenerator.generateOrder(
    orderInstance,
    config.keyPassword ?? "",
    ["icon.png", ...images],
    config.orderModelPath,
    tempCertsDir,
  )

  return readStream.toBuffer() as Promise<Buffer>
}
