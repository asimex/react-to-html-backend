// services/cloneRepo.js
const path = require("path");
const fs = require("fs-extra");
const simpleGit = require("simple-git");

function parseGitUrl(repoUrl) {
  const match = repoUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)(\.git)?$/);
  if (!match) return null;
  return { username: match[1], repoName: match[2].replace(/\.git$/, "") };
}

async function cloneRepo(repoUrl) {
  const parsed = parseGitUrl(repoUrl);
  if (!parsed) throw new Error("Invalid GitHub repo URL");

  const { username, repoName } = parsed;
  const destPath = path.join(__dirname, "..", "temp", username, repoName);

  // Clean if already exists
  if (fs.existsSync(destPath)) await fs.remove(destPath);
  await fs.ensureDir(path.dirname(destPath));

  const git = simpleGit();
  console.log(`📦 Cloning ${repoUrl}...`);

  await git.clone(repoUrl, destPath);

  console.log(`✅ Cloned to ${destPath}`);
  return { username, repoName, destPath };
}

module.exports = cloneRepo;
