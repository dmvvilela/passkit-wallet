/**
 * Example: Create an Apple Wallet coupon pass (.pkpass).
 *
 * This shows how to use createAppleWalletClient to load a template,
 * build the pass body, and generate the signed .pkpass buffer.
 */

import {
  createAppleWalletClient,
  mountCouponPassBody,
} from "passkit-wallet"

const apple = createAppleWalletClient({
  pass: {
    passTypeIdentifier: "pass.com.yourcompany",
    teamIdentifier: "ABCDE12345",
    certificate: process.env.APPLE_PASS_CERTIFICATE!,
    privateKey: process.env.APPLE_PASS_PRIVATE_KEY!,
    keyPassword: process.env.APPLE_PASS_KEY_PASSWORD,
    wwdrCertificate: process.env.APPLE_WWDR_CERT!,
    webServiceURL: "https://yourapp.com/api/passes",
    authenticationToken: "your-shared-secret",
    passTemplatePath: "./resources/your.pass",
  },
})

// 1. Load the .pass template (reads from disk, sets certs)
const template = await apple.loadPassTemplate()

// 2. Build the coupon body
const passBody = mountCouponPassBody({
  code: "SAVE20",
  offerTitle: "20% Off Everything",
  qrCodeUrl: "https://yourapp.com/redeem/SAVE20",
  backFields: [
    { key: "terms", label: "Terms", value: "Valid until Dec 31, 2026." },
    { key: "support", label: "Support", value: "help@yourapp.com" },
  ],
})

// 3. Create a pass from the template and populate it
const pass = template.createPass({
  serialNumber: "coupon-001",
  description: "20% Off Coupon",
  organizationName: "Your Company",
  coupon: passBody,
})

// 4. Generate the signed .pkpass buffer
const pkpassBuffer = await pass.getAsBuffer()

// 5. Serve it (e.g. in an Express route)
// res.set("Content-Type", "application/vnd.apple.pkpass")
// res.set("Content-Disposition", 'attachment; filename="coupon.pkpass"')
// res.send(pkpassBuffer)

console.log(`Generated .pkpass (${pkpassBuffer.length} bytes)`)
