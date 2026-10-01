import { useEffect } from "react";

/** Per-page document title, plus Open Graph tags when given (public pages). */
export function useTitle(
  title: string | undefined,
  og?: { description?: string; image?: string | null },
) {
  const hasOg = !!og;
  const description = og?.description;
  const image = og?.image;
  useEffect(() => {
    if (!title) return;
    document.title = `${title} · HostMe`;
    if (!hasOg) return;
    setMeta("og:title", title);
    if (description) {
      setMeta("og:description", description);
      setMeta("description", description, "name");
    }
    if (image) setMeta("og:image", image);
  }, [title, hasOg, description, image]);
}

function setMeta(key: string, content: string, attr: "property" | "name" = "property") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content.slice(0, 300);
}
