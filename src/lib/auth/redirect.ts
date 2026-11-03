/**
 * Where to send someone after sign-in. Only a same-origin relative path is
 * accepted; anything else falls back to "/". An absolute or protocol-relative
 * URL here would turn the sign-in page into an open redirect.
 */
export function safeReturnPath(from: string | undefined | null): string {
  if (!from || !from.startsWith("/")) return "/";
  // "//evil.example" and "/\evil.example" are protocol-relative in browsers.
  if (from.startsWith("//") || from.startsWith("/\\")) return "/";
  return from;
}
