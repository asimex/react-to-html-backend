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
  "js-beautify@^1.15.4"
];

async function runRenderer({ username, repoName, destPath }) {
  const sourceScriptsDir = path.join(__dirname, "../render-scripts");

  // Step 1: Copy render scripts
  await fs.copy(sourceScriptsDir, destPath, {
    filter: (src) => !src.endsWith("package-snippet.json")
  });

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
  try {
    if (serverProcess && serverProcess.pid) {
      process.kill(-serverProcess.pid); // Kill process group
      console.log("🛑 Dev server stopped");
    }
  } catch (err) {
    console.warn("⚠️ Dev server already stopped or cannot be killed:", err.message);
  }

  // Step 9: Return generated files
  const outputDir = path.join(destPath, "dist");
  if (!fs.existsSync(outputDir)) throw new Error("Rendering failed");

  const htmlFiles = fs.readdirSync(outputDir).filter(f => f.endsWith(".html"));
  return { success: true, outputDir, files: htmlFiles };
}

module.exports = runRenderer;
