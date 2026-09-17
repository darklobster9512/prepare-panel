import { useEffect, useState, type ReactNode } from "react";

import { getAuftragFileUrls } from "@/lib/storage.functions";

export const AUFTRAG_LOGO_BUCKET = "auftrag-logos";

const signedUrlCache = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();

export async function resolveAuftragLogo(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("blob:") || path.startsWith("data:") || path.startsWith("http")) {
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
