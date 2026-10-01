import { downloadFile } from "./format";

/**
 * The backend QR is white on transparent, so a raw download looks blank in most viewers.
 * Compose it onto a dark card first; fall back to the original file if the image is cross-origin.
 */
export async function downloadQr(src: string, ticketNumber: string) {
  const name = `myevents-ticket-${ticketNumber}.png`;
  try {
    const img = await loadImage(src);
    const size = 640;
    const pad = 48;
    const canvas = document.createElement("canvas");
    canvas.width = size + pad * 2;
    canvas.height = size + pad * 2 + 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, pad, pad, size, size);
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 28px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(ticketNumber.toUpperCase(), canvas.width / 2, size + pad + 48);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (!blob) throw new Error("tainted");
    downloadFile(name, blob);
  } catch {
    const a = document.createElement("a");
    a.href = src;
    a.download = name;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
