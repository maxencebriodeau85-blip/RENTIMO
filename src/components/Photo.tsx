import type { CSSProperties } from "react";
import { PHOTOS, srcDefaut, srcset, type NomPhoto } from "@/lib/photos";

/** Photo responsive (AVIF puis WebP), avec un aperçu flou en fond le temps du chargement. */
export function Photo({
  nom,
  sizes,
  alt = "",
  className,
  priorite = false,
  style,
  ...data
}: {
  nom: NomPhoto;
  sizes: string;
  alt?: string;
  className?: string;
  priorite?: boolean;
  style?: CSSProperties;
} & Record<`data-${string}`, string | number>) {
  const p = PHOTOS[nom];
  return (
    <picture>
      <source type="image/avif" srcSet={srcset(nom, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcset(nom, "webp")} sizes={sizes} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={srcDefaut(nom)}
        alt={alt}
        width={p.largeur}
        height={p.hauteur}
        className={className}
        loading={priorite ? "eager" : "lazy"}
        decoding="async"
        {...((priorite ? { fetchpriority: "high" } : {}) as Record<string, string>)}
        style={{ backgroundImage: `url(${p.apercu})`, backgroundSize: "cover", backgroundPosition: "center", ...style }}
        {...data}
      />
    </picture>
  );
}
