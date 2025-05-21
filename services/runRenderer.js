const fs = require("fs-extra");
const path = require("path");
const { exec, spawn } = require("child_process");
const waitOn = require("wait-on");

const REQUIRED_PACKAGES = [
  "@babel/preset-env@^7.27.2",
  "@babel/preset-react@^7.27.1",
  "@babel/register@^7.27.1",
  "fs-extra@^11.3.0",
  "puppeteer@^24.9.0",
  "wait-on@^8.0.3",
  "@babel/parser@^7.27.2",
  "@babel/traverse@^7.27.1",
  "js-beautify@^1.15.4",
  "grapesjs@^0.22.7",
  "grapesjs-blocks-basic@^0.22.7",
  "grapesjs-plugin-forms@^0.22.7",
  "grapesjs-plugin-export@^0.22.7",
  "grapesjs-navbar@^0.22.7",
  "grapesjs-custom-code@^0.22.7",
  "grapesjs-style-bg@^0.22.7",
  "grapesjs-preset-webpage@^0.22.7",
  "grapesjs-project-manager@^0.22.7",
"grapesjs@^0.22.7",
"grapesjs-blocks-basic@^1.0.2",
"grapesjs-custom-code@^1.0.2",
"grapesjs-navbar@^1.0.2",
"grapesjs-parser-postcss@^1.0.3",
  "grapesjs-plugin-export@^1.0.12",
  "grapesjs-plugin-forms@^2.0.6",
"grapesjs-preset-webpage@^1.0.3",
"grapesjs-project-manager@^2.0.6",
 "grapesjs-style-bg@^2.0.2",
 "grapesjs-template-manager@^1.0.7"

];

async function runRenderer({ username, repoName, destPath }) {
  const sourceScriptsDir = path.join(__dirname, "../render-scripts");

  // Step 1: Copy render scripts
  await fs.copy(sourceScriptsDir, destPath, {
    filter: (src) => !src.endsWith("package-snippet.json")
  });
  const copyMappings = [
    {
      from: path.join(__dirname, "../src-scripts"),
      to: path.join(destPath, "src/")
    },
    {
      from: path.join(__dirname, "../component-scripts"),
      to: path.join(destPath, "src/components/")
    },
  ];
  
  for (const { from, to } of copyMappings) {
    console.log(`📁 Copying from ${from} to ${to}`);
    await fs.ensureDir(to); // ✅ Ensure the target directory exists
    await fs.copy(from, to);
  }
  
  // Step 2: Merge scripts into package.json
  const pkgPath = path.join(destPath, "package.json");
  const snippetPath = path.join(sourceScriptsDir, "package-snippet.json");

  const originalPkg = await fs.readJson(pkgPath);
  const snippetPkg = await fs.readJson(snippetPath);

  originalPkg.scripts = {
    ...(originalPkg.scripts || {}),
    ...(snippetPkg.scripts || {})
  };

  await fs.writeJson(pkgPath, originalPkg, { spaces: 2 });

  // Step 3: Install required packages
  console.log("📦 Installing render dependencies...");
  await new Promise((resolve, reject) => {
    exec(`npm install ${REQUIRED_PACKAGES.join(" ")}`, { cwd: destPath }, (err, stdout, stderr) => {
      if (err) return reject(stderr);
      console.log(stdout);
      resolve();
    });
  });

  // Step 4: Start server (npm start)
  console.log("🚀 Starting dev server...");
  const serverProcess = spawn("npm", ["start"], { cwd: destPath, shell: true, detached: true });

  // Step 5: Wait until app is live
  console.log("⏳ Waiting for http://localhost:3000 to be ready...");
  await waitOn({ resources: ["http://localhost:3000"], timeout: 60000 });

  // Step 6: Run generateRoutes
  console.log("🛠 Running 'npm run generateroute'...");
  await new Promise((resolve, reject) => {
    exec("npm run generateroute", { cwd: destPath }, (err, stdout, stderr) => {
      if (err) return reject(stderr);
      console.log(stdout);
      resolve();
    });
  });

  // Step 7: Run puppeteer-multiple.js
  console.log("📸 Running 'npm run rendermultiple'...");
  await new Promise((resolve, reject) => {
    exec("npm run rendermultiple", { cwd: destPath }, (err, stdout, stderr) => {
      if (err) return reject(stderr);
      console.log(stdout);
      resolve();
    });
  });

  // Step 8: Kill the dev server
  // try {
  //   if (serverProcess && serverProcess.pid) {
  //     process.kill(-serverProcess.pid); // Kill process group
  //     console.log("🛑 Dev server stopped");
  //   }
  // } catch (err) {
  //   console.warn("⚠️ Dev server already stopped or cannot be killed:", err.message);
  // }

  // Step 9: Return generated files
  const outputDir = path.join(destPath, "dist");
  if (!fs.existsSync(outputDir)) throw new Error("Rendering failed");

  const htmlFiles = fs.readdirSync(outputDir).filter(f => f.endsWith(".html"));
 // Step 10: Copy all HTML files to public/html-pages
const htmlTargetDir = path.join(__dirname, "../public/html-pages");
await fs.ensureDir(htmlTargetDir);

for (const file of htmlFiles) {
  const srcFile = path.join(outputDir, file);
  const destFile = path.join(htmlTargetDir, file);
  await fs.copyFile(srcFile, destFile);
  console.log(`📄 Copied ${file} → html-pages/`);
}

return { success: true, outputDir, files: htmlFiles };

}

module.exports = runRenderer;
