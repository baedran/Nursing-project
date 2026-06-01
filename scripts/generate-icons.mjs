// Rasterizes the brand SVGs into the PNG sizes phones need. Re-runnable:
//   node scripts/generate-icons.mjs
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";

mkdirSync("public/icons", { recursive: true });
const any = readFileSync("assets/icon.svg");
const maskable = readFileSync("assets/icon-maskable.svg");

const jobs = [
  [any, 192, "public/icons/icon-192.png"],
  [any, 512, "public/icons/icon-512.png"],
  [maskable, 512, "public/icons/icon-maskable-512.png"],
  [maskable, 180, "app/apple-icon.png"], // iPhone: no transparency, filled bg
  [any, 512, "app/icon.png"], // favicon source
];

for (const [svg, size, out] of jobs) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(out);
  console.log("wrote", out);
}
