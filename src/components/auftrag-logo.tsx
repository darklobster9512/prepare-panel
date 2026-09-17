import { useEffect, useState, type ReactNode } from "react";

import { getAuftragFileUrls } from "@/lib/storage.functions";

export const AUFTRAG_LOGO_BUCKET = "auftrag-logos";

const signedUrlCache = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();

function isDirectImageSource(path: string) {
  return path.startsWith("blob:") || path.startsWith("data:") || path.startsWith("http");
}

function waitForImage(src: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
    if (image.complete) resolve();
  });
}

export async function resolveAuftragLogo(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (isDirectImageSource(path)) {
    return path;
  }

  const cached = signedUrlCache.get(path);
  if (cached) return cached;

  let request = pending.get(path);
  if (!request) {
    request = getAuftragFileUrls({ data: { paths: [path] } })
      .then((urls) => {
        const url = urls[path] ?? null;
        if (url) signedUrlCache.set(path, url);
        return url;
      })
      .catch(() => null)
      .finally(() => {
        // Fehlschläge nicht dauerhaft merken – beim nächsten Versuch neu laden.
        pending.delete(path);
      });
    pending.set(path, request);
  }
  return request;
}

export async function preloadAuftragFiles(paths: Array<string | null | undefined>): Promise<void> {
  const uniquePaths = Array.from(
    new Set(paths.filter((path): path is string => Boolean(path))),
  );
  if (uniquePaths.length === 0) return;

  const imageUrls: string[] = [];
  const pathsToSign: string[] = [];
  const pendingRequests: Promise<string | null>[] = [];

  for (const path of uniquePaths) {
    if (isDirectImageSource(path)) {
      imageUrls.push(path);
      continue;
    }

    const cached = signedUrlCache.get(path);
    if (cached) {
      imageUrls.push(cached);
      continue;
    }

    const existing = pending.get(path);
    if (existing) {
      pendingRequests.push(existing);
      continue;
    }

    pathsToSign.push(path);
  }

  if (pendingRequests.length > 0) {
    const settled = await Promise.allSettled(pendingRequests);
    for (const result of settled) {
      if (result.status === "fulfilled" && result.value) imageUrls.push(result.value);
    }
  }

  for (let index = 0; index < pathsToSign.length; index += 50) {
    const chunk = pathsToSign.slice(index, index + 50);
    try {
      const urls = await getAuftragFileUrls({ data: { paths: chunk } });
      for (const path of chunk) {
        const url = urls[path];
        if (!url) continue;
        signedUrlCache.set(path, url);
        imageUrls.push(url);
      }
    } catch {
      // Einzelne fehlende Bilder sollen die Seite nicht blockieren.
    }
  }

  await Promise.allSettled(imageUrls.map((url) => waitForImage(url)));
}

type AuftragLogoProps = {
  value: string | null;
  alt: string;
  className?: string;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
};

export function AuftragLogo({
  value,
  alt,
  className,
  fallback = null,
  loadingFallback,
}: AuftragLogoProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(value));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    setSrc(null);
    setLoading(Boolean(value));

    resolveAuftragLogo(value).then((url) => {
      if (!active) return;
      setSrc(url);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [value]);

  if (loading) return <>{loadingFallback ?? fallback}</>;
  if (!src || failed) return <>{fallback}</>;
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
