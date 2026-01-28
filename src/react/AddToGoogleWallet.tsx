import React from "react"

export interface AddToGoogleWalletProps {
  /** Signed JWT save URL from `getSignedURL()`. */
  saveUrl: string
  /** Width of the badge image in pixels (default: 264). */
  width?: number
  /** Height of the badge image in pixels (default: 48). */
  height?: number
  /** Custom CSS class name. */
  className?: string
  /** Custom inline styles. */
  style?: React.CSSProperties
}

/**
 * Renders the official Google "Save to Google Wallet" badge as a link.
 *
 * Uses the official SVG badge from Google's developer assets.
 */
export const AddToGoogleWallet: React.FC<AddToGoogleWalletProps> = ({
  saveUrl,
  width = 264,
  height = 48,
  className,
  style,
}) => {
  return (
    <a
      href={saveUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{ display: "inline-block", ...style }}
    >
      <img
        src="https://developers.google.com/static/wallet/images/buttons/s2gp_dark_en.svg"
        alt="Save to Google Wallet"
        width={width}
        height={height}
        style={{ display: "block" }}
      />
    </a>
  )
}
