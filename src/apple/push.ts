import apn from "@parse/node-apn"
import type { ApplePushOptions } from "./types.js"

/**
 * Send an APN push notification to one or more devices to trigger
 * a pass or order refresh.
 *
 * @param pushTokens - A single token or array of device push tokens.
 * @param topic - The pass type identifier or order type identifier.
 * @param options - Certificate and key configuration.
 */
export const sendPushNotification = async (
  pushTokens: string | string[],
  topic: string,
  options: ApplePushOptions,
): Promise<{ sent: number; failed: number }> => {
  const provider = new apn.Provider({
    cert: options.certificate,
    key: options.privateKey,
    passphrase: options.passphrase,
    production: options.production ?? true,
  })

  const note = new apn.Notification()
  note.expiry = Math.floor(Date.now() / 1000) + 3600 // 1 hour
  note.badge = 3
  note.priority = 10
  note.pushType = "alert"
  note.sound = "ping.aiff"
  note.alert = "You have updates!"
  note.payload = {}
  note.topic = topic

  try {
    const result = await provider.send(note, pushTokens)
    return {
      sent: result.sent?.length ?? 0,
      failed: result.failed?.length ?? 0,
    }
  } finally {
    provider.shutdown()
  }
}
