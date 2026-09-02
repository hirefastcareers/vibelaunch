const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const mark = fs.readFileSync("public/logo/mark.svg");
const sizes = [32, 64, 128, 256, 512];

const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" fill="#FAF8F4"/>
  <g transform="translate(100 100) scale(0.72) translate(-100 -100)">
    <path d="M159.4 159.4 A84 84 0 1 1 159.4 40.6" fill="none" stroke="#F24100" stroke-width="26"/>
    <path d="M132.53 132.53 A46 46 0 1 1 132.53 67.47" fill="none" stroke="#242424" stroke-width="26"/>
  </g>
</svg>`;

(async () => {
  for (const size of sizes) {
    await sharp(mark, { density: 300 })
      .resize(size, size)
      .png()
      .toFile(path.join("public/logo/png", `mark-${size}.png`));
    console.log(`wrote mark-${size}.png`);
  }

  await sharp(Buffer.from(appleSvg)).resize(180, 180).png().toFile("src/app/apple-icon.png");
  console.log("wrote apple-icon.png");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
