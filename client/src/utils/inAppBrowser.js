const IN_APP_BROWSER_RE = /FBAN|FBAV|Instagram|Snapchat|Line|Twitter|LinkedIn|Pinterest|Telegram|WhatsApp|Messenger/i;
const REDIRECT_FLAG = "ttm_inapp_autoredirect";

export const getUserAgent = () => {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent || "";
};

export const isInAppBrowser = (ua = getUserAgent()) => IN_APP_BROWSER_RE.test(ua);

export const isIOS = (ua = getUserAgent()) =>
  /iPad|iPhone|iPod/i.test(ua) ||
  (typeof navigator !== "undefined" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export const isAndroid = (ua = getUserAgent()) => /Android/i.test(ua);

const buildAndroidIntentUrl = (url) => {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(":", "");
    const path = `${parsed.hostname}${parsed.pathname}${parsed.search}`;
    return `intent://${path}#Intent;scheme=${scheme};package=com.android.chrome;end`;
  } catch {
    return null;
  }
};

export const shouldAutoRedirectInApp = () => {
  if (!isInAppBrowser()) return false;
  if (typeof sessionStorage === "undefined") return true;
  return !sessionStorage.getItem(REDIRECT_FLAG);
};

export const markInAppRedirectAttempted = () => {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(REDIRECT_FLAG, String(Date.now()));
};

export const openInExternalBrowser = (url) => {
  const targetUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  if (!targetUrl) return;

  if (isAndroid()) {
    const intentUrl = buildAndroidIntentUrl(targetUrl);
    if (intentUrl) {
      window.location.href = intentUrl;
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 700);
      return;
    }
  }

  const opened = window.open(targetUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.href = targetUrl;
  }
};
