import { useEffect } from "react";

/** Per-page document title, plus Open Graph tags when given (public pages). */
export function useTitle(title: string | undefined, og?: { description?: string; image?: string | null }) {
  useEffect(() => {
    if (!title) return;
    document.title = `${title} · HostMe`;
    if (!og) return;
    setMeta("og:title", title);
    if (og.description) {
      setMeta("og:description", og.description);
      setMeta("description", og.description, "name");
    }
    if (og.image) setMeta("og:image", og.image);
  }, [title, og?.description, og?.image]);
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
