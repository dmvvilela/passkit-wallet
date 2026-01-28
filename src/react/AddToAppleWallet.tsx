import React from "react"

export interface AddToAppleWalletProps {
  /** URL to your `.pkpass` file download endpoint. */
  url: string
  /** Width of the badge image in pixels (default: 168). */
  width?: number
  /** Height of the badge image in pixels (default: 54). */
  height?: number
  /** Custom CSS class name. */
  className?: string
  /** Custom inline styles. */
  style?: React.CSSProperties
}

/**
 * Renders the official Apple "Add to Apple Wallet" badge as a link.
 *
 * Uses the official SVG badge from Apple's CDN.
 */
export const AddToAppleWallet: React.FC<AddToAppleWalletProps> = ({
  url,
  width = 168,
  height = 54,
  className,
  style,
}) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{ display: "inline-block", ...style }}
    >
      <img
        src="https://developer.apple.com/wallet/add-to-apple-wallet-guidelines/images/add-to-apple-wallet-badge_en.svg"
        alt="Add to Apple Wallet"
        width={width}
        height={height}
        style={{ display: "block" }}
      />
    </a>
  )
}
