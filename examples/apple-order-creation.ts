/**
 * Example: Create an Apple Wallet order (.order).
 *
 * This shows how to use createAppleWalletClient to build an order
 * instance, optionally add product images, and generate the signed
 * .order buffer.
 */

import {
  createAppleWalletClient,
  addImagesToModelDir,
  removeImagesFromModelDir,
} from "passkit-wallet"

const apple = createAppleWalletClient({
  order: {
    orderTypeIdentifier: "order.com.yourcompany",
    certificate: process.env.APPLE_ORDER_CERTIFICATE!,
    privateKey: process.env.APPLE_ORDER_PRIVATE_KEY!,
    keyPassword: process.env.APPLE_ORDER_KEY_PASSWORD,
    wwdrCertificate: process.env.APPLE_WWDR_G5_CERT!,
    webServiceURL: "https://yourapp.com/api/orders",
    authenticationToken: "your-order-auth-token",
    orderModelPath: "./resources/model.order",
  },
})

// 1. (Optional) Download product images into the model directory
const imageNames = await addImagesToModelDir(
  "./resources/model.order",
  [
    "https://cdn.example.com/products/widget.jpg",
    "https://cdn.example.com/products/gadget.jpg",
  ],
)

// 2. Build the order instance body
const orderBody = apple.mountOrderInstance({
  orderNumber: "ORD-12345",
  currency: "USD",
  totals: {
    grandTotal: 4999, // $49.99 in cents
    subTotal: 3999,
    shipping: 500,
    tax: 400,
    tip: 100,
  },
  orderItems: [
    {
      image: "https://cdn.example.com/products/widget.jpg",
      price: 2499,
      quantity: 1,
      productName: "Widget Pro",
      variantName: "Blue / Large",
    },
    {
      image: "https://cdn.example.com/products/gadget.jpg",
      price: 1500,
      quantity: 1,
      productName: "Gadget Mini",
    },
  ],
  customer: {
    emailAddress: "jane@example.com",
    givenName: "Jane",
    familyName: "Doe",
  },
  orderStatus: "PROCESSING",
  paymentStatus: "paid",
  orderManagementURL: "https://yourapp.com/orders/ORD-12345",
})

// 3. Generate the signed .order buffer
const orderBuffer = await apple.generateOrder(orderBody, imageNames)

// 4. Clean up downloaded images from the model directory
await removeImagesFromModelDir("./resources/model.order", imageNames)

// 5. Serve it (e.g. in an Express route)
// res.set("Content-Type", "application/vnd.apple.order")
// res.set("Content-Disposition", 'attachment; filename="order.order"')
// res.send(orderBuffer)

console.log(`Generated .order (${orderBuffer.length} bytes)`)
