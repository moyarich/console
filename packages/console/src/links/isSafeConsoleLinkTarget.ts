import { isSafeWebUrl } from "./isSafeWebUrl";

/** Returns whether a provider target is safe to place in an href attribute. */
export function isSafeConsoleLinkTarget(target: string): boolean {
  if (
    (target.startsWith("/") && !target.startsWith("//")) ||
    target.startsWith("./") ||
    target.startsWith("../") ||
    target.startsWith("#")
  ) {
    return true;
  }

  return isSafeWebUrl(target);
}
