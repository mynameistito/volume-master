// Rasterize assets/icon.svg → public/icon/icon-{N}.png at all required sizes.
// WXT picks up `public/icon/icon-{16,32,48,128}.png` for the manifest.
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const SIZES = [16, 32, 48, 128] as const;
const SVG = resolve("assets/icon.svg");
const OUT_DIR = resolve("public/icon");

await mkdir(OUT_DIR, { recursive: true });

for (const size of SIZES) {
  const out = resolve(OUT_DIR, `icon-${size}.png`);
  await mkdir(dirname(out), { recursive: true });
  await sharp(SVG)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`wrote ${out}`);
}
