import { Template } from "@walletpass/pass-js"
import type { ApplePassConfig } from "../common/config.js"
import type { AppleCouponPassOptions } from "./types.js"

/**
 * Load a pass template from a `.pass` bundle directory and configure
 * it with the provided certificates.
 */
export const loadPassTemplate = async (config: ApplePassConfig) => {
  const template = await Template.load(config.passTemplatePath, "", {
    allowHttp: config.allowHttp ?? false,
  })

  template.setCertificate(config.certificate)
  template.setPrivateKey(config.privateKey, config.keyPassword)

  return template
}

/**
 * Build the body for a coupon-style pass.
 *
 * Returns a plain object suitable for passing to `template.createPass()`.
 */
export const mountCouponPassBody = (options: AppleCouponPassOptions) => {
  const { code, offerTitle, qrCodeUrl, backFields } = options

  return {
    primaryFields: [
      {
        key: "offer",
        label: "Discount",
        value: offerTitle,
      },
    ],
    secondaryFields: [
      {
        key: "code",
        label: "Code",
        value: code,
      },
    ],
    barcode: {
      format: "PKBarcodeFormatQR",
      message: qrCodeUrl,
      messageEncoding: "iso-8859-1",
    },
    backFields: backFields ?? [],
  }
}
