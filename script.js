let applications = JSON.parse(localStorage.getItem("jobTrackApplications")) || [];
let editingId = null;
let statusChart = null;
function saveApplications() {
    localStorage.setItem("jobTrackApplications", JSON.stringify(applications));
}
function updateStats() {
    const stats = {
        totalCount: applications.length,
        appliedCount: applications.filter(app => app.status === "Applied").length,
        interviewCount: applications.filter(app => app.status === "Interview").length,
        rejectedCount: applications.filter(app => app.status === "Rejected").length,
        offerCount: applications.filter(app => app.status === "Offer").length
    };
    Object.keys(stats).forEach(function (id) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = stats[id];
        }
    });
        updateStatusChart();
} 
function updateStatusChart() {
    const canvas = document.getElementById("statusChart");

    if (!canvas || typeof Chart === "undefined") return;

    const labels = ["Applied", "Interview", "Rejected", "Offer"];

    const counts = labels.map(function (status) {
        return applications.filter(function (app) {
            return app.status === status;
        }).length;
    });
    if (statusChart) {
        statusChart.data.datasets[0].data = counts;
        statusChart.update();
        return;
    }
    statusChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: [
                    "#8B1E3F",
                    "#D99AAB",
                    "#777777",
                    "#C49A45"
                ],
                borderWidth: 2,
                borderColor: "#FFFFFF"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom"
                }
            },
            cutout: "65%"
        }
    });
}
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character];
    });
}
function renderApplicationTable(tableBody, showActions) {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    applications.forEach(function (app) {
        const row = document.createElement("tr");
        row.dataset.id = app.id;
        row.innerHTML = `
            <td>${escapeHTML(app.company)}</td>
            <td>${escapeHTML(app.jobTitle)}</td>
            <td>${escapeHTML(app.location)}</td>
            <td>${escapeHTML(app.date)}</td>
           <td>
    <span class="status-badge status-${app.status.toLowerCase()}">
        ${escapeHTML(app.status)}
    </span>
</td>
            ${showActions ? `
                <td>
                    <button type="button" class="edit-btn" data-id="${app.id}">Edit</button>
                    <button type="button" class="delete-btn" data-id="${app.id}">Delete</button>
                </td>
            ` : ""}
        `;
        tableBody.appendChild(row);
    });
}
function renderRecentApplications() {
    const tbody = document.getElementById("recentApplications");
    if (!tbody) return;

    tbody.innerHTML = "";

    const recent = [...applications]
        .sort((a, b) => b.id - a.id)
        .slice(0, 5);

    recent.forEach(function (app) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(app.company)}</td>
            <td>${escapeHTML(app.jobTitle)}</td>
         <td>
    <span class="status-badge status-${app.status.toLowerCase()}">
        ${escapeHTML(app.status)}
    </span>
</td>
        `;

        tbody.appendChild(row);
    });
}

function updateHistorySummary() {
    const values = {
        historyTotal: applications.length,
        historyInterviews: applications.filter(
            app => app.status === "Interview"
        ).length,
        historyOffers: applications.filter(
            app => app.status === "Offer"
        ).length
    };

    Object.keys(values).forEach(function (id) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = values[id];
        }
    });
}
function renderSearchResults() {
    const searchBox = document.querySelector(".searchBox");
    const statusFilter = document.getElementById("statusFilter");
    const searchResults = document.getElementById("searchResults");
    if (!searchBox || !statusFilter || !searchResults) return;
    const searchText = searchBox.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;
    searchResults.innerHTML = "";
    const filteredApplications = applications.filter(function (app) {
        return (
            app.company.toLowerCase().includes(searchText) &&
            (selectedStatus === "All" || app.status === selectedStatus)
        );
    });
    filteredApplications.forEach(function (app) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHTML(app.company)}</td>
            <td>${escapeHTML(app.jobTitle)}</td>
            <td>${escapeHTML(app.location)}</td>
            <td>${escapeHTML(app.date)}</td>
            <td>${escapeHTML(app.status)}</td>
        `;
        searchResults.appendChild(row);
    });
}
function startEditing(id) {
    const app = applications.find(function (item) {
        return item.id === id;
    });
    if (!app) return;
    const form = document.getElementById("applicationForm");
    if (!form) {
        localStorage.setItem("jobTrackEditingId", String(id));
        window.location.href = "application.html";
        return;
    }
    editingId = id;
    document.getElementById("cname").value = app.company;
    document.getElementById("jobtitle").value = app.jobTitle;
    document.getElementById("location").value = app.location;
    document.getElementById("date").value = app.date;
    document.getElementById("status").value = app.status;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
}
function deleteApplication(id) {
    applications = applications.filter(function (app) {
        return app.id !== id;
    });
    saveApplications();
    refreshPageData();
}
function refreshPageData() {
    updateStats();
    renderApplicationTable(
        document.getElementById("applicationList"),
        true
    );
    renderSearchResults();
    renderRecentApplications();
    updateHistorySummary();
}
document.addEventListener("DOMContentLoaded", function () {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".sidebar a").forEach(function (link) {
        const linkPage = link.getAttribute("href");
        link.classList.toggle("active", linkPage === currentPage);
    });
    document.querySelectorAll(".card_inner").forEach(function (card) {
        card.addEventListener("click", function () {
            card.classList.toggle("flipped");
        });
    });
    refreshPageData();
    const searchButton = document.getElementById("searchButton");
    if (searchButton) {
        searchButton.addEventListener("click", renderSearchResults);
    }
    const searchBox = document.querySelector(".searchBox");
    if (searchBox) {
        searchBox.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                renderSearchResults();
            }
        });
    }
    const form = document.getElementById("applicationForm");
    if (form) {
        const pendingId = localStorage.getItem("jobTrackEditingId");
        if (pendingId !== null) {
            localStorage.removeItem("jobTrackEditingId");
            startEditing(Number(pendingId));
        }
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            const company = document.getElementById("cname").value.trim();
            const jobTitle = document.getElementById("jobtitle").value.trim();
            const location = document.getElementById("location").value.trim();
            const date = document.getElementById("date").value;
            const status = document.getElementById("status").value;
            if (!company || !jobTitle || !location || !date) return;
            if (editingId !== null) {
                const app = applications.find(function (item) {
                    return item.id === editingId;
                });
                if (app) {
                    app.company = company;
                    app.jobTitle = jobTitle;
                    app.location = location;
                    app.date = date;
                    app.status = status;
                }
                editingId = null;
            } else {
                applications.push({
                    id: Date.now(),
                    company: company,
                    jobTitle: jobTitle,
                    location: location,
                    date: date,
                    status: status
                });
            }
         saveApplications();
form.reset();
document.querySelectorAll(".checklist input[type='checkbox']")
    .forEach(function (checkbox) {
        checkbox.checked = false;
    });
refreshPageData();
        });
    }
    document.querySelectorAll("#applicationList").forEach(function (tableBody) {
        tableBody.addEventListener("click", function (event) {
            const button = event.target.closest("button");
            if (!button) return;
            const id = Number(button.dataset.id);
            if (button.classList.contains("edit-btn")) {
                startEditing(id);
            }

            if (button.classList.contains("delete-btn")) {
                deleteApplication(id);
            }
        });
    });
});
