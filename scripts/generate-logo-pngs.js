const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const mark = fs.readFileSync("public/logo/mark-x.svg");
const favicon = fs.readFileSync("public/logo/favicon-x.svg");
const outDir = "public/logo/png";

const markSizes = [128, 256, 512];
const faviconSizes = [16, 32, 64];

const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" rx="44" fill="#FAF8F4"/>
  <g transform="translate(100 100) scale(0.72) translate(-100 -100)" fill="none" stroke-linecap="round">
    <path d="M76.0 76.0 L36.4 36.4" stroke="#F24100" stroke-width="28"/>
    <path d="M124.0 76.0 L163.6 36.4" stroke="#F24100" stroke-width="28"/>
    <path d="M76.0 124.0 L36.4 163.6" stroke="#242424" stroke-width="28"/>
    <path d="M124.0 124.0 L163.6 163.6" stroke="#242424" stroke-width="28"/>
  </g>
</svg>`;

(async () => {
  fs.mkdirSync(outDir, { recursive: true });

  for (const size of markSizes) {
    await sharp(mark, { density: 300 })
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, `mark-x-${size}.png`));
    await sharp(mark, { density: 300 })
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, `mark-${size}.png`));
    console.log(`wrote mark-x-${size}.png`);
  }

  for (const size of faviconSizes) {
    await sharp(favicon, { density: 300 })
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, `favicon-x-${size}.png`));
    await sharp(favicon, { density: 300 })
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, `mark-${size}.png`));
    console.log(`wrote favicon-x-${size}.png`);
  }

  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(outDir, "apple-touch-icon.png"));
  await sharp(Buffer.from(appleSvg)).resize(180, 180).png().toFile("src/app/apple-icon.png");
  console.log("wrote apple-touch-icon.png");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
