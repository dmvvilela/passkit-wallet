import type { walletobjects_v1 } from "googleapis"

/**
 * Send a message/notification to a Google Wallet object to trigger an update.
 *
 * Google Wallet does not use push tokens like Apple. Instead, you update the
 * class or object via the API and Google handles notifying the device.
 *
 * This helper wraps the `addMessage` API call to attach a visible message
 * to a wallet object.
 */
export const sendObjectMessage = async (
  client: walletobjects_v1.Walletobjects,
  type: "genericobject" | "offerobject",
  resourceId: string,
  message: { header: string; body: string },
) => {
  const response = await (client[type] as any).addmessage({
    resourceId,
    requestBody: {
      message: {
        header: message.header,
        body: message.body,
      },
    },
  })

  return response.data
}
