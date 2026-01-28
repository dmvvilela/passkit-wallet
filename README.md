# passkit-wallet

Apple Wallet + Google Wallet pass generation made easy.

Generate `.pkpass` files, Apple Order files, and Google Wallet save links from a single, framework-agnostic TypeScript library. Optional React components render the official "Add to Wallet" badges.

## Install

```bash
npm install passkit-wallet
```

React components are optional — if you only use the backend helpers, React is not required.

## Examples

The [`examples/`](./examples) directory has full, runnable examples:

- **Pass & Order Creation** — [Apple Pass](./examples/apple-pass-creation.ts) · [Apple Order](./examples/apple-order-creation.ts) · [Google Wallet](./examples/google-wallet.ts)
- **Web Service Handlers** — [Express](./examples/express.ts) · [Hono](./examples/hono.ts) · [Elysia](./examples/elysia.ts)
- **Store Adapters** — [Drizzle ORM](./examples/store-drizzle.ts) · [In-Memory](./examples/store-in-memory.ts)

## Quick Start

### Apple Wallet

```typescript
import { createAppleWalletClient, mountCouponPassBody } from 'passkit-wallet'

const apple = createAppleWalletClient({
  pass: {
    passTypeIdentifier: 'pass.com.yourcompany',
    teamIdentifier: 'ABCDE12345',
    certificate: process.env.APPLE_PASS_CERTIFICATE!,
    privateKey: process.env.APPLE_PASS_PRIVATE_KEY!,
    keyPassword: process.env.APPLE_PASS_KEY_PASSWORD,
    wwdrCertificate: process.env.APPLE_WWDR_CERT!,
    webServiceURL: 'https://yourapp.com/api/passes',
    authenticationToken: 'your-auth-token',
    passTemplatePath: './resources/your.pass',
  },
})

// Load template and create a coupon pass
const template = await apple.loadPassTemplate()
const passBody = mountCouponPassBody({
  code: 'SAVE20',
  offerTitle: '20% Off',
  qrCodeUrl: 'https://yourapp.com/discount/SAVE20',
  backFields: [
    { key: 'support', label: 'Support', value: 'help@yourapp.com' },
  ],
})

const pass = template.createPass()
// ... set pass fields from passBody, then generate the .pkpass buffer
```

### Apple Orders

```typescript
import { createAppleWalletClient, mountOrderInstance } from 'passkit-wallet'

const apple = createAppleWalletClient({
  order: {
    orderTypeIdentifier: 'order.com.yourcompany',
    certificate: process.env.APPLE_ORDER_CERTIFICATE!,
    privateKey: process.env.APPLE_ORDER_PRIVATE_KEY!,
    keyPassword: process.env.APPLE_ORDER_KEY_PASSWORD,
    wwdrCertificate: process.env.APPLE_WWDR_G5_CERT!,
    webServiceURL: 'https://yourapp.com/api/orders',
    authenticationToken: 'your-order-auth-token',
    orderModelPath: './resources/model.order',
  },
})

const orderBody = apple.mountOrderInstance({
  orderNumber: 'ORD-12345',
  currency: 'USD',
  totals: { grandTotal: 4999, subTotal: 3999, shipping: 500, tax: 400, tip: 100 },
  orderItems: [{
    image: 'https://cdn.example.com/product.jpg',
    price: 3999,
    quantity: 1,
    productName: 'Widget',
  }],
  customer: { emailAddress: 'customer@example.com', givenName: 'Jane' },
  orderManagementURL: 'https://yourapp.com/orders/ORD-12345',
})

const orderBuffer = await apple.generateOrder(orderBody)
// Serve orderBuffer as application/vnd.apple.order with Content-Disposition
```

### Google Wallet

```typescript
import {
  createGoogleWalletClient,
  mountOfferClassBody,
  mountOfferObjectBody,
  createClass,
} from 'passkit-wallet'

const gw = createGoogleWalletClient({
  issuerId: '1234567890',
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS!),
  origins: ['https://yourapp.com'],
})

// Create an offer class
const classBody = mountOfferClassBody(gw.config.issuerId, {
  classSuffix: 'my_offers',
  offerTitle: '20% Off Everything',
  reviewStatus: 'DRAFT',
  provider: 'Your Company',
  hexBackgroundColor: '#1a1a2e',
})

await createClass(gw.client, 'offerclass', gw.config.issuerId, 'my_offers', classBody)

// Create an offer object
const objectBody = mountOfferObjectBody(gw.config.issuerId, {
  classSuffix: 'my_offers',
  objectSuffix: 'offer_user123',
  code: 'SAVE20',
  qrCodeUrl: 'https://yourapp.com/discount/SAVE20',
})

// Get the signed save URL
const saveUrl = gw.getSignedURL('offerObjects', 'offer_user123', 'my_offers')
// Redirect or display saveUrl to the user
```

### React Components

```tsx
import { AddToAppleWallet, AddToGoogleWallet } from 'passkit-wallet/react'

function WalletButtons({ pkpassUrl, googleSaveUrl }) {
  return (
    <div>
      <AddToAppleWallet url={pkpassUrl} />
      <AddToGoogleWallet saveUrl={googleSaveUrl} />
    </div>
  )
}
```

## Handlers (Web Service Protocol)

The `handlers` module implements Apple's web service protocol so you don't have to. Provide a "store" object with async callbacks for your DB, and get back plain `{ status, headers, body }` handler functions you can wire into any framework.

### Apple Pass Handlers

```typescript
import { createApplePassHandlers } from 'passkit-wallet/handlers'

const handlers = createApplePassHandlers({
  authenticationToken: 'your-auth-token',
  store: {
    getPass: async (serialNumber) => {
      const pass = await db.findPass(serialNumber)
      return pass ? { updatedAt: pass.updatedAt } : null
    },
    registerDevice: async (deviceLibId, pushToken, serialNumber) => {
      const existed = await db.upsertRegistration(deviceLibId, pushToken, serialNumber)
      return existed ? 'already_registered' : 'created'
    },
    unregisterDevice: async (deviceLibId, serialNumber) => {
      await db.deleteRegistration(deviceLibId, serialNumber)
    },
    getRegistrations: async (passTypeId, deviceLibId, updatedSince) => {
      return db.findRegistrations(passTypeId, deviceLibId, updatedSince)
    },
    getPassData: async (serialNumber) => {
      return db.getPassFields(serialNumber)
    },
  },
  buildPass: async (passData) => {
    // Use your template to build the .pkpass buffer
    const template = await apple.loadPassTemplate()
    const pass = template.createPass()
    // ... set fields from passData
    return pass.getAsBuffer()
  },
  onLog: (logs) => console.log('Apple Wallet logs:', logs),
})

// Wire into any framework (Express example):
app.post('/v1/devices/:did/registrations/:ptid/:sn', async (req, res) => {
  const result = await handlers.registerDevice({
    deviceLibraryIdentifier: req.params.did,
    passTypeIdentifier: req.params.ptid,
    serialNumber: req.params.sn,
    pushToken: req.body.pushToken,
    authorization: req.headers.authorization,
  })
  res.status(result.status).json(result.body)
})
```

### Apple Order Handlers

```typescript
import { createAppleOrderHandlers } from 'passkit-wallet/handlers'

const orderHandlers = createAppleOrderHandlers({
  authenticationToken: 'your-order-auth-token',
  store: {
    getOrder: async (orderIdentifier) => {
      const order = await db.findOrder(orderIdentifier)
      return order ? { updatedAt: order.updatedAt } : null
    },
    registerDevice: async (deviceId, pushToken, orderIdentifier) => {
      const existed = await db.upsertOrderRegistration(deviceId, pushToken, orderIdentifier)
      return existed ? 'already_registered' : 'created'
    },
    unregisterDevice: async (deviceId, orderIdentifier) => {
      await db.deleteOrderRegistration(deviceId, orderIdentifier)
    },
    getRegistrations: async (orderTypeId, deviceId, modifiedSince) => {
      return db.findOrderRegistrations(orderTypeId, deviceId, modifiedSince)
    },
  },
  buildOrder: async (orderIdentifier) => {
    // Build and sign the .order buffer
    const orderBody = apple.mountOrderInstance({ /* ... */ })
    return apple.generateOrder(orderBody)
  },
})
```

### Handler Methods

**Pass handlers:** `registerDevice`, `unregisterDevice`, `getSerialNumbers`, `getLatestPass`, `log`

**Order handlers:** `registerDevice`, `unregisterDevice`, `getOrderIdentifiers`, `getLatestOrder`, `log`

All handlers return `{ status: number, headers?: Record<string, string>, body?: unknown }`.

## Apple Certificate Setup

1. Create a Pass Type ID and Order Type ID in the [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list/passTypeId).
2. Generate certificates for each and export them as `.pem` files.
3. Download the [WWDR G5 certificate](https://www.apple.com/certificateauthority/) and convert to PEM.
4. Create a `.pass` bundle directory with your `pass.json`, icon, logo, and other assets.
5. Create a `model.order` bundle directory with your `order.json`, icon, and assets.

## Google Wallet Setup

1. Create a [Google Wallet API](https://pay.google.com/business/console/) issuer account.
2. Create a service account with the **Google Wallet Object Issuer** role.
3. Download the service account JSON credentials.

## API Reference

### Factory Functions

- `createAppleWalletClient(config)` — returns a client with bound config for Apple pass/order operations.
- `createGoogleWalletClient(config)` — returns a client with bound config and authenticated Google API client.

### Apple

- `loadPassTemplate(config)` — loads a `.pass` template and configures certificates.
- `mountCouponPassBody(options)` — builds coupon pass field data.
- `loadOrderModel(config)` — loads an order model from a `.order` bundle.
- `mountOrderInstance(options, webServiceURL)` — builds order instance data.
- `generateOrder(instance, config, images?)` — generates a signed `.order` buffer.
- `sendPushNotification(tokens, topic, options)` — sends APN push to trigger pass/order refresh.
- `parseRegistrationRequest(request, authToken)` — validates Apple device registration requests.
- `parseUnregistrationRequest(request, authToken)` — validates device unregistration requests.

### Google

- `loadClient(config)` — creates an authenticated Google Wallet API client.
- `getSignedURL(config, type, objectSuffix, classSuffix)` — generates a signed save-to-wallet JWT URL.
- `mountOfferClassBody(issuerId, options)` / `mountOfferObjectBody(issuerId, options)` — build offer class/object data.
- `mountOrderClassBody(issuerId, options)` / `mountOrderObjectBody(issuerId, options)` — build order class/object data.
- `getClass` / `createClass` / `updateClass` / `updateObject` — CRUD operations on wallet classes and objects.
- `sendObjectMessage(client, type, resourceId, message)` — attach a message to a wallet object.

### Handlers

- `createApplePassHandlers(config)` — returns handler functions for Apple Pass web service endpoints.
- `createAppleOrderHandlers(config)` — returns handler functions for Apple Order web service endpoints.

### React

- `<AddToAppleWallet url={string} />` — Apple Wallet badge link.
- `<AddToGoogleWallet saveUrl={string} />` — Google Wallet badge link.

## License

MIT
