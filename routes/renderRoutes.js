const express = require("express");
const cloneRepo = require("../services/cloneRepo");
const runRenderer = require("../services/runRenderer");
const path = require("path");
const archiver = require("archiver");
const fs = require("fs");

const router = express.Router();

router.post("/generate", async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) return res.status(400).json({ error: "Missing repoUrl" });

  try {
    const cloneInfo = await cloneRepo(repoUrl);
    const renderInfo = await runRenderer(cloneInfo);
    res.json({
        ...cloneInfo,
        ...renderInfo,
        downloadUrl: `http://localhost:4000/render/download?username=${cloneInfo.username}&repo=${cloneInfo.repoName}`
      });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/download", (req, res) => {
    const { username, repo } = req.query;
    if (!username || !repo) return res.status(400).json({ error: "Missing username or repo query param" });
  
    const distPath = path.join(__dirname, "..", "temp", username, repo, "dist");
    if (!fs.existsSync(distPath)) return res.status(404).json({ error: "Output folder not found" });
  
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=${repo}-output.zip`);
  
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.directory(distPath, false); // false => don't include dist folder name inside ZIP
    archive.pipe(res);
  
    archive.finalize().catch((err) => {
      console.error("❌ Archive error:", err);
      res.status(500).send("Error generating ZIP");
    });
  });

module.exports = router;
