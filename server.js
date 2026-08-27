const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const cors = require("cors");
const https = require("https");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DB_FILE = path.join(__dirname, "jobs.json");

// Official Teletalk live government jobs source
const SOURCE_URL = "https://vas.teletalk.com.bd/clientLivejobs.php";

function readJobs() {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (error) {
    console.error("Database read error:", error.message);
    return [];
  }
}

function saveJobs(jobs) {
  fs.writeFileSync(DB_FILE, JSON.stringify(jobs, null, 2));
}

async function fetchLiveJobs() {
  console.log("Checking for new government job circulars...");

  try {
    const https = require("https");

const response = await axios.get(SOURCE_URL, {
  timeout: 20000,

  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  }),

  headers: {
    "User-Agent": "ChakriPulseBD/1.0 Job Information Aggregator"
  }
});

    const $ = cheerio.load(response.data);

    const foundJobs = [];

    $("tr").each((index, row) => {
      const cells = $(row).find("td");

      if (cells.length < 5) return;

      const organization = $(cells[1]).text().trim();
      const shortName = $(cells[2]).text().trim();
      const startDate = $(cells[3]).text().trim();
      const deadline = $(cells[4]).text().trim();

      const link = $(cells[5]).find("a").attr("href") ||
                   $(row).find("a").last().attr("href");

      if (!organization || !link || organization.length < 3) return;

      foundJobs.push({
        id: Buffer.from(
          organization + shortName + startDate + deadline
        ).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 32),

        organization,
        shortName,
        startDate,
        deadline,

        applicationUrl: link,

        source: "Official Teletalk Recruitment System",
        sourceUrl: SOURCE_URL,

        category: "Government Job",
        status: "Live",

        importedAt: new Date().toISOString()
      });
    });

    const existingJobs = readJobs();
    const existingIds = new Set(existingJobs.map(job => job.id));

    let newCount = 0;

    for (const job of foundJobs) {
      if (!existingIds.has(job.id)) {
        existingJobs.unshift(job);
        newCount++;
      }
    }

    saveJobs(existingJobs);

    console.log(
      `Automation complete. ${foundJobs.length} jobs checked. ${newCount} new jobs added.`
    );

    return {
      success: true,
      checked: foundJobs.length,
      added: newCount
    };

  } catch (error) {
    console.error("Automation error:", error.message);

    return {
      success: false,
      error: error.message
    };
  }
}

// API: Get all jobs
app.get("/api/jobs", (req, res) => {
  const jobs = readJobs();

  res.json({
    success: true,
    total: jobs.length,
    updatedAt: new Date().toISOString(),
    jobs
  });
});

// API: Search jobs
app.get("/api/jobs/search", (req, res) => {
  const query = (req.query.q || "").toLowerCase();

  const jobs = readJobs();

  const filteredJobs = jobs.filter(job =>
    job.organization.toLowerCase().includes(query) ||
    job.shortName.toLowerCase().includes(query)
  );

  res.json({
    success: true,
    total: filteredJobs.length,
    jobs: filteredJobs
  });
});

// Admin/manual refresh endpoint
app.post("/api/update-jobs", async (req, res) => {
  const result = await fetchLiveJobs();
  res.json(result);
});

// Run immediately when server starts
fetchLiveJobs();

// Automatic update every 6 hours
cron.schedule("0 */6 * * *", async () => {
  console.log("Scheduled automatic update started...");
  await fetchLiveJobs();
});

app.listen(PORT, () => {
  console.log(`ChakriPulse BD running at http://localhost:${PORT}`);
});