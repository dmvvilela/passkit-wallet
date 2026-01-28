import { z } from "zod"

// ── Apple Wallet client config ──────────────────────────────────────────

export const applePassConfigSchema = z.object({
  /** e.g. "pass.com.yourcompany" */
  passTypeIdentifier: z.string(),
  teamIdentifier: z.string(),
  /** PEM-encoded pass certificate */
  certificate: z.string(),
  /** PEM-encoded private key */
  privateKey: z.string(),
  /** Password for the private key (optional) */
  keyPassword: z.string().optional(),
  /** WWDR intermediate certificate (PEM) */
  wwdrCertificate: z.string(),
  /** Base URL for the web service that handles pass updates */
  webServiceURL: z.string().url(),
  /** Shared secret used to authenticate web service requests */
  authenticationToken: z.string(),
  /** Path to your .pass bundle directory */
  passTemplatePath: z.string(),
  /** Allow HTTP for development (default: false) */
  allowHttp: z.boolean().optional().default(false),
})

export type ApplePassConfig = z.infer<typeof applePassConfigSchema>

export const appleOrderConfigSchema = z.object({
  /** e.g. "order.com.yourcompany" */
  orderTypeIdentifier: z.string(),
  /** PEM-encoded order certificate */
  certificate: z.string(),
  /** PEM-encoded private key */
  privateKey: z.string(),
  /** Password for the private key (optional) */
  keyPassword: z.string().optional(),
  /** WWDR G5 intermediate certificate (PEM) */
  wwdrCertificate: z.string(),
  /** Base URL for the web service that handles order updates */
  webServiceURL: z.string().url(),
  /** Shared secret for order authentication */
  authenticationToken: z.string(),
  /** Path to your model.order bundle directory */
  orderModelPath: z.string(),
})

export type AppleOrderConfig = z.infer<typeof appleOrderConfigSchema>

export const appleClientConfigSchema = z.object({
  pass: applePassConfigSchema.optional(),
  order: appleOrderConfigSchema.optional(),
})

export type AppleClientConfig = z.infer<typeof appleClientConfigSchema>

// ── Google Wallet client config ─────────────────────────────────────────

export const googleClientConfigSchema = z.object({
  /** Your Google Wallet issuer ID */
  issuerId: z.string(),
  /** Google service account credentials (parsed JSON) */
  credentials: z.object({
    client_email: z.string(),
    private_key: z.string(),
  }).passthrough(),
  /** Allowed origins for the "Save to Wallet" JWT */
  origins: z.array(z.string().url()),
})

export type GoogleClientConfig = z.infer<typeof googleClientConfigSchema>
