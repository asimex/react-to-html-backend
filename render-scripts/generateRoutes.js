const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const rootDir = path.join(__dirname, "src");
const routeCandidates = new Set();

// -----------------------------------------
// 1. Extract from JSX <Route path="..." />
// -----------------------------------------
function parseJSX(filePath) {
  const code = fs.readFileSync(filePath, "utf-8");
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  traverse(ast, {
    JSXOpeningElement(path) {
      const tag = path.node.name.name;
      if (tag === "Route") {
        const props = path.node.attributes;
        const pathAttr = props.find((p) => p.name?.name === "path");
        if (pathAttr?.value?.value) {
          routeCandidates.add(pathAttr.value.value);
        }
      }
    },
  });
}

// ---------------------------------------------------
// 2. File-based route detection (directory structure)
// ---------------------------------------------------
const ignoredDirs = ["components", "utils", "hooks", "assets", "styles", "redux", "context", "store"];
const ignoredFiles = ["store", "reducer", "action", "context", "types"];

function inferRoutesFromFiles(basePath, baseRoute = "") {
  const files = fs.readdirSync(basePath);

  for (const file of files) {
    const fullPath = path.join(basePath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      inferRoutesFromFiles(fullPath, path.join(baseRoute, file));
    } else if (/\.(js|jsx|tsx)$/.test(file)) {
      const isIndex = /^index\.(js|jsx|tsx)$/.test(file);
      const fileBase = file.replace(/\.(js|jsx|tsx)$/, "").toLowerCase();
      const finalRoute = "/" + baseRoute.replace(/\\/g, "/").replace(/\/index$/, "").replace(/\/+$/, "");
      const isTopLevel = !baseRoute.includes("/");

      if (
        isTopLevel &&
        !isIndex &&
        !ignoredFiles.includes(fileBase) &&
        !ignoredDirs.includes(fileBase)
      ) {
        routeCandidates.add("/" + fileBase);
      } else if (isIndex || fileBase === "index") {
        if (finalRoute === "") {
          routeCandidates.add("/");
        } else if (!finalRoute.includes("components")) {
          routeCandidates.add(finalRoute);
        }
      }
    }
  }
}

// ------------------------------------------
// 3. Parse App.js / App.jsx / App.tsx
// ------------------------------------------
["App.js", "App.jsx", "App.tsx"].forEach((entry) => {
  const appPath = path.join(rootDir, entry);
  if (fs.existsSync(appPath)) parseJSX(appPath);
});

// ------------------------------------------
// 4. Walk all JSX files for <Route path="">
// ------------------------------------------
function walkDir(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (/\.(js|jsx|tsx)$/.test(file)) {
      parseJSX(fullPath);
    }
  });
}
walkDir(rootDir);

// ------------------------------------------
// 5. Run file-based route inference
// ------------------------------------------
fs.readdirSync(rootDir).forEach((entry) => {
  const fullPath = path.join(rootDir, entry);
  if (fs.statSync(fullPath).isDirectory() && !ignoredDirs.includes(entry.toLowerCase())) {
    inferRoutesFromFiles(fullPath, entry);
  }
});

// ------------------------------------------
// 6. Generate & Write Output to src/routes.js
// ------------------------------------------
const finalRoutes = [...routeCandidates].sort();
const routeObjects = finalRoutes.map((r) => ({
  path: r === "" || r === "/" ? "/" : r,
  name: r === "/" ? "Home" : r.replace("/", "").replace(/-/g, " "),
}));

const output = `// Auto-generated route list
const routes = ${JSON.stringify(routeObjects, null, 2)};
export default routes;
`;

fs.writeFileSync(path.join(rootDir, "routes.js"), output);
console.log(`✅ Extracted ${routeObjects.length} routes into src/routes.js`);
