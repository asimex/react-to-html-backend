const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const waitOn = require("wait-on");
const pLimit = require("p-limit"); // ✅ Concurrency control
const beautify = require("js-beautify").html; // 👈 Import HTML beautifier
require("@babel/register")({
  presets: ["@babel/preset-env", "@babel/preset-react"],
  extensions: [".js", ".jsx", ".ts", ".tsx"],
});

const routes = require("./src/routes").default;

const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

async function renderWithPuppeteer(name, url, browser) {
    const page = await browser.newPage();
    console.log(`⏳ Navigating to ${url}...`);
  
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.waitForSelector(".ant-spin", { hidden: true }).catch(() => {});
    const html = await page.content();
  
    // Remove all inline source maps (base64)
    const cleanedHtml = html.replace(/\/\*# sourceMappingURL=data:application\/json;base64,[^*]*\*\//g, '');
  
    // Beautify HTML
    const beautifiedHtml = beautify(cleanedHtml, {
      indent_size: 2,
      preserve_newlines: true,
      max_preserve_newlines: 1,
      wrap_line_length: 120,
    });
  
    const safeName = name === "/" ? "index" : name.replace(/^\/+|\/+$/g, "").replace(/\//g, "_");
    fs.writeFileSync(path.join(distDir, `${safeName}.html`), beautifiedHtml);
  
    console.log(`✅ Rendered with Puppeteer: ${safeName}.html`);
    await page.close();
  }

(async () => {
  console.log(`🕓 Waiting for server...`);
  await waitOn({ resources: ["http://localhost:3000"], timeout: 60000 });

  const browser = await puppeteer.launch({ headless: true });

  const limit = pLimit(5); // ⏱️ Limit concurrency to 5 parallel pages
  const tasks = routes
  .filter(({ path: routePath }) => {
    // Skip routes with dynamic or wildcard params
    return !routePath.includes(":") && !routePath.includes("*");
  })
  .map(({ path: routePath }) => {
    const url = `http://localhost:3000${routePath}`;
    return limit(() => renderWithPuppeteer(routePath, url, browser));
  });


  await Promise.all(tasks);
  await browser.close();
  console.log("🚀 All pages rendered.");
})();
