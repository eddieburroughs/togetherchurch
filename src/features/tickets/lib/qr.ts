import QRCode from "qrcode";

/**
 * Generate a QR code as a data URL (PNG base64).
 * The content is the confirmation code for easy scanning.
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 256,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
