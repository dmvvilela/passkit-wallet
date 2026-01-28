# passkit-wallet

Apple Wallet + Google Wallet pass generation made easy.

Generate `.pkpass` files, Apple Order files, and Google Wallet save links from a single, framework-agnostic TypeScript library. Optional React components render the official "Add to Wallet" badges.

## Install

```bash
npm install passkit-wallet
```

React components are optional — if you only use the backend helpers, React is not required.

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

### React

- `<AddToAppleWallet url={string} />` — Apple Wallet badge link.
- `<AddToGoogleWallet saveUrl={string} />` — Google Wallet badge link.

## License

MIT
