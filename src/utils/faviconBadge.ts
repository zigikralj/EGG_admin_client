let originalFaviconHref: string | null = null;
let originalFaviconType: string | null = null;
let cachedBadgedHref: string | null = null;
let desiredBadgeActive = false;

const getFaviconLink = (): HTMLLinkElement | null => {
  if (typeof document === 'undefined') return null;
  return document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
};

/**
 * Draws a red notification badge in the top-right corner of the favicon on a 64x64 canvas.
 */
const drawBadgeOnCanvas = (img: HTMLImageElement | null): string | null => {
  try {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (img) {
      ctx.drawImage(img, 0, 0, size, size);
    }

    const radius = 14;
    const cx = size - radius - 2;
    const cy = radius + 2;

    ctx.beginPath();
    ctx.arc(cx, cy, radius + 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
};

const applyBadgedHref = (link: HTMLLinkElement, badgedHref: string) => {
  link.type = 'image/png';
  link.href = badgedHref;
};

const restoreOriginalFavicon = (link: HTMLLinkElement) => {
  if (originalFaviconHref !== null) {
    link.href = originalFaviconHref;
  }
  if (originalFaviconType !== null) {
    link.type = originalFaviconType;
  } else {
    link.removeAttribute('type');
  }
};

/**
 * Toggles a red notification badge overlay on the browser tab's favicon.
 * Lazily captures the original favicon href and caches the generated PNG data URL.
 */
export const setFaviconBadge = (showBadge: boolean): void => {
  desiredBadgeActive = showBadge;
  try {
    const link = getFaviconLink();
    if (!link) return;

    if (originalFaviconHref === null) {
      originalFaviconHref = link.getAttribute('href') || link.href || '';
      originalFaviconType = link.getAttribute('type');
    }

    if (!showBadge) {
      restoreOriginalFavicon(link);
      return;
    }

    if (cachedBadgedHref) {
      applyBadgedHref(link, cachedBadgedHref);
      return;
    }

    if (!originalFaviconHref || typeof Image === 'undefined') {
      const fallbackHref = drawBadgeOnCanvas(null);
      if (fallbackHref) {
        cachedBadgedHref = fallbackHref;
        if (desiredBadgeActive) {
          applyBadgedHref(link, fallbackHref);
        }
      }
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const badged = drawBadgeOnCanvas(img);
      if (badged) {
        cachedBadgedHref = badged;
        const currentLink = getFaviconLink();
        if (currentLink && desiredBadgeActive) {
          applyBadgedHref(currentLink, badged);
        }
      }
    };
    img.onerror = () => {
      const fallback = drawBadgeOnCanvas(null);
      if (fallback) {
        cachedBadgedHref = fallback;
        const currentLink = getFaviconLink();
        if (currentLink && desiredBadgeActive) {
          applyBadgedHref(currentLink, fallback);
        }
      }
    };
    img.src = originalFaviconHref;
  } catch {
    // Fail safely in environments without full canvas/image support
  }
};

/**
 * Resets internal favicon badge cache for unit tests.
 */
export const resetFaviconBadgeCacheForTests = (): void => {
  originalFaviconHref = null;
  originalFaviconType = null;
  cachedBadgedHref = null;
  desiredBadgeActive = false;
};
