console.log("Admin JS loaded");
let imdbCache = null;

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "admin") {
  alert("Admin access only");
  location.href = "login.html";
}

/* ================= TAB SWITCH ================= */
function showTab(tabId) {
  // hide all tabs
  document.querySelectorAll(".admin-tab").forEach(tab => {
    tab.classList.add("hidden");
  });

  // show selected tab (only if it exists)
  const activeTab = document.getElementById(tabId);
  if (!activeTab) {
    console.error("Tab not found:", tabId);
    return;
  }

  activeTab.classList.remove("hidden");

  // load data
  if (tabId === "users") loadUsers();
  if (tabId === "reviews") loadReviews();
  if (tabId === "recs") loadRecommendations();
}

/* ================= USERS ================= */
async function loadUsers() {
  const res = await fetch("/admin/users", {
    headers: { Authorization: token }
  });

  const users = await res.json();
  const table = document.getElementById("usersTable");
  table.innerHTML = "";

  users.forEach(u => {
    table.innerHTML += `
      <tr>
        <td>${u.username}</td>
        <td>${u.role}</td>
      </tr>
    `;
  });

  document.getElementById("userCount").innerText = users.length;
}

/* ================= REVIEWS ================= */
async function loadReviews() {
  const list = document.getElementById("reviewsList");
  if (!list) return;

  const res = await fetch("/reviews-all", {
    headers: { Authorization: token }
  });

  const reviews = await res.json();

  if (!reviews.length) {
    list.innerHTML = "<p>No reviews found</p>";
    return;
  }

  list.innerHTML = reviews.map(r => `
    <div class="admin-review">
      <b>${r.username}</b> — ⭐ ${r.rating}
      <p><i>${r.movieTitle}</i></p>
      <p>${r.comment}</p>
      <button class="danger"
        onclick="deleteReview('${r._id}', '${r.username}')">
        ❌ Delete
      </button>
    </div>
  `).join("");

  loadStats(); // 🔥 ADD THIS LINE
}

/* ================= RECOMMENDATIONS ================= */
async function loadRecommendations() {
  const res = await fetch("/recommendations");
  const list = await res.json();

  const box = document.getElementById("recsList");
  box.innerHTML = "";

  if (!list.length) {
    box.innerHTML = "<p>No recommendations yet ⭐</p>";
    return;
  }

  box.innerHTML = list.map(r => `
    <div class="admin-review">
      <img src="${r.poster}" style="height:80px;border-radius:6px">
      <div>
        <b>${r.title}</b>
        <p>${r.reason || ""}</p>
      </div>
      <button class="danger" onclick="deleteRec('${r._id}')">❌ Delete</button>
    </div>
  `).join("");
}

async function deleteRec(id) {
  if (!confirm("Delete recommendation?")) return;

  await fetch("/recommendations/" + id, {
    method: "DELETE",
    headers: {
      Authorization: localStorage.getItem("token")
    }
  });

  loadRecommendations();
}

/* ================= LOGOUT ================= */
function logout() {
  localStorage.clear();
  location.href = "index.html";
}

/* ================= INIT ================= */
window.onload = () => {
  loadStats();
  showTab("users"); // default tab
};

async function deleteReview(id, username) {
  if (!confirm(`Delete review by ${username}?`)) return;

  await fetch(`/admin/review/${id}`, {
    method: "DELETE",
    headers: { Authorization: token }
  });

  loadReviews();
  loadStats();
}

async function loadStats() {
  const users = await fetch("/admin/users", {
    headers: { Authorization: token }
  }).then(r => r.json());

  const reviews = await fetch("/reviews-all", {
    headers: { Authorization: token }
  }).then(r => r.json());

  let watchCount = 0;
  users.forEach(u => watchCount += (u.watchlist?.length || 0));

  document.getElementById("userCount").innerText = users.length;
  document.getElementById("reviewCount").innerText = reviews.length;
  document.getElementById("watchlistCount").innerText = watchCount;
}

async function fetchFromIMDb() {
  const title = document.getElementById("recTitle").value.trim();
  if (!title) return alert("Enter movie title");

  const res = await fetch(
    `https://www.omdbapi.com/?apikey=cfd54802&t=${encodeURIComponent(title)}`
  );
  const data = await res.json();

  if (data.Response === "False") {
    return alert("Movie not found on IMDb");
  }

  imdbCache = {
    title: `${data.Title} (${data.Year})`,
    poster: data.Poster !== "N/A"
      ? data.Poster
      : "https://via.placeholder.com/200x300?text=No+Image"
  };

  addRecommendation();
}

async function addRecommendation() {
  if (!imdbCache) {
    alert("Select a movie from suggestions");
    return;
  }

  const reason = document.getElementById("recReason").value;

  await fetch("/recommendations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token")
    },
    body: JSON.stringify({
      title: imdbCache.title,
      poster: imdbCache.poster,
      reason
    })
  });

  imdbCache = null;
  document.getElementById("recTitle").value = "";
  document.getElementById("recReason").value = "";

  loadRecommendations();
}

async function suggestIMDb(query) {
  const box = document.getElementById("imdbSuggestions");

  if (query.length < 3) {
    box.classList.add("hidden");
    return;
  }

  const res = await fetch(
    `https://www.omdbapi.com/?apikey=cfd54802&s=${encodeURIComponent(query)}`
  );
  const data = await res.json();

  if (!data.Search) return;

  box.innerHTML = data.Search.slice(0, 6)
    .map(
      m => `
      <div onclick="selectIMDb('${m.imdbID}')">
        ${m.Title} (${m.Year})
      </div>`
    )
    .join("");

  box.classList.remove("hidden");
}

async function selectIMDb(imdbID) {
  const box = document.getElementById("imdbSuggestions");

  const res = await fetch(
    `https://www.omdbapi.com/?apikey=cfd54802&i=${imdbID}`
  );
  const m = await res.json();

  imdbCache = {
    title: `${m.Title} (${m.Year})`,
    poster:
      m.Poster !== "N/A"
        ? m.Poster
        : "https://via.placeholder.com/200x300?text=No+Image"
  };

  document.getElementById("recTitle").value = imdbCache.title;
  box.classList.add("hidden");
}
