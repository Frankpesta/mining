export function isGoogleTranslated() {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("googtrans=");
}
