const jobsGrid = document.getElementById("jobsGrid");
const loading = document.getElementById("loading");
const totalJobs = document.getElementById("totalJobs");
const updateText = document.getElementById("updateText");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

let allJobs = [];


/* =========================
   LOAD JOBS
========================= */

async function loadJobs() {

    try {

        loading.style.display = "flex";

        const response = await fetch("/api/jobs");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        allJobs = data.jobs || [];

        if (totalJobs) {
            totalJobs.textContent = allJobs.length;
        }

        updateText.textContent =
            `${allJobs.length} active jobs available`;

        renderJobs(allJobs);

    } catch (error) {

        console.error("Job loading error:", error);

        jobsGrid.innerHTML = `
            <div class="error-box">
                <h3>Unable to load jobs</h3>
                <p>Please try again later.</p>
            </div>
        `;

        updateText.textContent =
            "Update temporarily unavailable";

    } finally {

        loading.style.display = "none";

    }

}


/* =========================
   RENDER JOBS
========================= */

function renderJobs(jobs) {

    jobsGrid.innerHTML = "";

    if (!jobs || jobs.length === 0) {

        jobsGrid.innerHTML = `
            <div class="empty-state">
                <h3>No jobs found</h3>
                <p>Try another search.</p>
            </div>
        `;

        return;
    }


    jobs.forEach((job, index) => {

        const card = document.createElement("article");

        card.className = "job-card";

        card.style.animationDelay =
            `${index * 0.05}s`;


        card.innerHTML = `

            <div class="job-top">

                <div class="organization-icon">
                    ${
                        job.shortName
                            ? escapeHTML(
                                job.shortName
                                    .substring(0, 2)
                                    .toUpperCase()
                              )
                            : "BD"
                    }
                </div>

                <span class="live-badge">
                    LIVE
                </span>

            </div>


           <h3
    data-tooltip="${escapeAttribute(
        job.organization || "Government Organization"
    )}"
>
    <span class="job-title-text">
        ${escapeHTML(
            job.organization || "Government Organization"
        )}
    </span>
</h3>

            <p class="short-name">
                ${escapeHTML(
                    job.shortName || "Government Organization"
                )}
            </p>


            <div class="job-info">

                <div>
                    <span>
                        Application Start
                    </span>

                    <strong>
                        ${escapeHTML(
                            job.startDate ||
                            "See official site"
                        )}
                    </strong>
                </div>


                <div>
                    <span>
                        Application Deadline
                    </span>

                    <strong>
                        ${escapeHTML(
                            job.deadline ||
                            "See official site"
                        )}
                    </strong>
                </div>

            </div>


            <div class="job-actions">

                <a
                    href="${escapeAttribute(
                        job.applicationUrl
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="apply-button"
                >
                    <span>
                        Apply on Official Site
                    </span>

                    <span>
                        ↗
                    </span>

                </a>

            </div>

        `;


        jobsGrid.appendChild(card);

    });

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text || "";

    return div.innerHTML;

}


/* =========================
   ESCAPE ATTRIBUTE
========================= */

function escapeAttribute(text) {

    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

}


/* =========================
   SEARCH JOBS
========================= */

function searchJobs() {

    const query = searchInput.value
        .trim()
        .toLowerCase();


    if (!query) {

        renderJobs(allJobs);

        return;

    }


    const filtered = allJobs.filter(job => {

        const organization =
            String(job.organization || "")
            .toLowerCase();

        const shortName =
            String(job.shortName || "")
            .toLowerCase();


        return (
            organization.includes(query) ||
            shortName.includes(query)
        );

    });


    renderJobs(filtered);

}


/* =========================
   SEARCH EVENTS
========================= */

searchButton.addEventListener(
    "click",
    searchJobs
);


searchInput.addEventListener(
    "keyup",
    event => {

        if (event.key === "Enter") {

            searchJobs();

        }

    }
);


/* =========================
   INITIAL LOAD
========================= */

loadJobs();


/* =========================
   AUTO REFRESH
   Every 10 minutes
========================= */

setInterval(
    loadJobs,
    10 * 60 * 1000
);