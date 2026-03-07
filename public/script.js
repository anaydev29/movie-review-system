console.log("✅ script.js loaded");

/* =====================
   GLOBAL STATE
===================== */
let currentMovieId = null;
let currentMovieTitle = null;
let selectedRating = 0;
const token = localStorage.getItem("token");

/* =====================
   SAFE DOM HELPERS
===================== */
function $(id) {
  return document.getElementById(id);
}

/* =====================
   AUTH (LOGIN / SIGNUP)
===================== */

function signup() {
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  const msg = document.getElementById("msg");

  if (!username || !password) {
    msg.innerText = "All fields required";
    return;
  }

  fetch("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(r => r.json())
    .then(d => {
  if (d.error) {
    msg.innerText = d.error;
    msg.style.color = "#ff4d4d";
  } else {
    msg.innerText = "✅ Signup successful! Redirecting to login...";
    msg.style.color = "#00c853";
    msg.style.fontSize = "15px";
    msg.style.fontWeight = "600";
    setTimeout(() => location.href = "login.html", 2000);
  }
  });
}

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(d => {

    if (d.error) {
      msg.innerText = d.error;
      return;
    }

    localStorage.setItem("token", d.token);
    localStorage.setItem("role", d.role);

    if (d.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "dashboard.html";
    }

  });
}


/* =====================
   AUTH
===================== */
function logout() {
  localStorage.clear();
  location.href = "index.html";
}

/* =====================
   INIT
===================== */
window.addEventListener("DOMContentLoaded", () => {
  console.log("Dashboard loaded");

  if ($("movieGrid")) loadTrendingMovies();
  if ($("popularRow")) loadPopularMovies();
  if ($("recommendationRow")) loadCuratedRecommendations();
  if ($("watchlistGrid")) loadWatchlist();
  if (location.pathname.includes("profile")) loadProfile();
  loadTopMovies();
});

/* =====================
   SEARCH + MOVIE LOAD
===================== */
async function openMovie(title) {
  $("movieName").value = title;
  searchMovie();
}

async function searchMovie() {
  const name = $("movieName")?.value.trim();
  if (!name) return;

  const res = await fetch(`/movie/${encodeURIComponent(name)}`);
  if (!res.ok) return alert("Movie search failed");

  const movie = await res.json();
  if (movie.Response === "False") return alert("Movie not found");

  if (movie.Type === "series") {

  document.getElementById("seriesSection").classList.remove("hidden");

  loadSeasons(movie.Title, movie.totalSeasons);

  } else {

  document.getElementById("seriesSection").classList.add("hidden");

  }

  currentMovieId = movie.imdbID;
  currentMovieTitle = movie.Title;

  const avg = await fetch(`/average/${currentMovieId}`).then(r => r.json());

  $("movie").innerHTML = `
  <div class="movie-container">
    <img class="movie-poster" src="${movie.Poster}" alt="${movie.Title}">
    <div class="movie-info">
      <h2>${movie.Title}</h2>
      <p>${movie.Plot}</p>
      <p><b>IMDb:</b> ${movie.imdbRating}</p>
      <p><b>User Avg:</b> ${avg.average}</p>
      <div class="movie-actions">
        <button onclick="addToWatchlist(
          '${movie.imdbID}',
          '${movie.Title.replace(/'/g, "\\'")}',
          '${movie.Poster}'
        )">❤️ Add to Watchlist</button>
        <button class="trailer-btn" onclick="openTrailer('${movie.Title}')">▶ Watch Trailer</button>
      </div>
    </div>
  </div>
`;

  $("reviewSection")?.classList.remove("hidden");
  loadReviews();
}

/* =====================
   REVIEWS
===================== */
function setRating(r) {
  selectedRating = r;
  document.querySelectorAll(".stars span").forEach((s, i) =>
    s.classList.toggle("active", i < r)
  );
}

async function addReview() {
  if (!token) {
    alert("Login required");
    return;
  }

  if (!currentMovieId || !currentMovieTitle) {
    alert("Search a movie first");
    return;
  }

  const comment =
    document.getElementById("comment")?.value ||
    document.getElementById("modalComment")?.value;

  if (!comment || selectedRating === 0) {
    alert("Select rating and write review");
    return;
  }

  await fetch("/review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify({
      movieId: currentMovieId,
      movieTitle: currentMovieTitle,
      rating: selectedRating,
      comment
    })
  });

  // Reset UI
  selectedRating = 0;
  document.querySelectorAll(".stars span").forEach(s =>
    s.classList.remove("active")
  );

  if (document.getElementById("comment"))
    document.getElementById("comment").value = "";
  if (document.getElementById("modalComment"))
    document.getElementById("modalComment").value = "";

  loadReviews(); // refresh movie reviews
  console.log("Submitting review for:", currentMovieId, currentMovieTitle);
}

async function loadReviews() {
  if (!currentMovieId) return;

  const res = await fetch(`/reviews/${currentMovieId}`);
  const list = await res.json();

  const reviewsDiv = document.getElementById("reviews");
  if (!reviewsDiv) return;

  reviewsDiv.innerHTML = list.map(r => `
    <div class="review">
      <b>${r.username || "Anonymous"}</b> ⭐ ${r.rating}
      <p>${r.comment}</p>

      <button onclick="likeReview('${r._id}')">
      👍 ${r.likes || 0}
      </button>

    </div>
  `).join("");
  console.log("Submitting review for:", currentMovieId, currentMovieTitle);
}

/* =====================
   WATCHLIST
===================== */
async function addToWatchlist(movieId, title, poster) {
  if (!token) return alert("Login required");

  await fetch("/watchlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify({ movieId, title, poster })
  });

  alert("Added to watchlist ❤️");
}

async function loadWatchlist() {
  const grid = $("watchlistGrid");
  if (!grid || !token) return;

  const res = await fetch("/watchlist", {
    headers: { Authorization: token }
  });
  const list = await res.json();

  grid.innerHTML = list.length
    ? list.map(m => `
        <div class="movie-thumb">
          <img src="${m.poster}">
          <p>${m.title}</p>
          <button onclick="removeFromWatchlist('${m.movieId}')">❌ Remove</button>
        </div>
      `).join("")
    : "<p>No movies in watchlist ❤️</p>";
}

async function removeFromWatchlist(movieId) {
  await fetch(`/watchlist/${movieId}`, {
    method: "DELETE",
    headers: { Authorization: token }
  });
  loadWatchlist();
}

/* =====================
   HOME SECTIONS
===================== */
async function loadTrendingMovies() {
  const res = await fetch("/trending");
  const list = await res.json();

  $("movieGrid").innerHTML = list.map(m => `
    <div class="movie-thumb" onclick="openMovie('${m.Title.replace(/'/g,"\\'")}')">
      <img src="${m.Poster}">
      <p>${m.Title}</p>
    </div>
  `).join("");
}

async function loadPopularMovies() {
  const res = await fetch("/trending");
  const list = await res.json();

  $("popularRow").innerHTML = list.map(m => `
    <div class="row-movie" onclick="openMovie('${m.Title.replace(/'/g,"\\'")}')">
      <img src="${m.Poster}">
    </div>
  `).join("");
}

async function loadCuratedRecommendations() {
  const res = await fetch("/recommendations");
  const list = await res.json();

  $("recommendationRow").innerHTML = list.map(r => `
    <div class="row-movie clickable-poster"
      onclick="openMovie('${r.title.replace(/'/g,"\\'").replace(/\s*\(\d{4}\)/,"")}')">
      <img src="${r.poster}">
      <p>${r.title}</p>
    </div>
  `).join("");
}

/* =====================
   PROFILE
===================== */
async function loadProfile() {
  if (!token) return alert("Login required");

  const res = await fetch("/user/profile", {
    headers: { Authorization: token }
  });
  const data = await res.json();

  $("profileName").innerText = data.username;
  $("profileRole").innerText = `Role: ${data.role}`;
  $("reviewCount").innerText = data.reviewCount;
  $("watchCount").innerText = data.watchCount;

  const box = $("myReviews");
  box.innerHTML = data.reviews.length
    ? data.reviews.map(r => `
        <div class="review">
          <b>${r.movieTitle}</b> ⭐ ${r.rating}
          <p>${r.comment}</p>
        </div>
      `).join("")
    : "<p>No reviews yet</p>";
}

function showSuggestions(query) {
  // temporary stub to avoid crashes
  // you can implement real suggestions later
  return;
}

window.showSuggestions = showSuggestions;

async function likeReview(id){

  const token = localStorage.getItem("token");

  await fetch(`/review/like/${id}`,{
    method:"POST",
    headers:{
      Authorization: token
    }
  });

  loadReviews();
}

const OMDB_KEY = "cfd54802";

async function showSuggestions(query) {

  const box = document.getElementById("suggestions");

  if (!query || query.length < 2) {
    box.classList.add("hidden");
    return;
  }

  const res = await fetch(
    `https://www.omdbapi.com/?apikey=${OMDB_KEY}&s=${encodeURIComponent(query)}`
  );

  const data = await res.json();

  if (!data.Search) {
    box.classList.add("hidden");
    return;
  }

  box.innerHTML = data.Search.slice(0,5).map(m => `
    <div class="suggestion-item"
         onclick="selectSuggestion('${m.Title.replace(/'/g,"\\'")}')">
      ${m.Title} (${m.Year})
    </div>
  `).join("");

  box.classList.remove("hidden");
}

function selectSuggestion(title){

  const input = document.getElementById("movieName");
  const box = document.getElementById("suggestions");

  input.value = title;
  box.classList.add("hidden");

  searchMovie();
}

document.addEventListener("click", e => {

  if (!e.target.closest(".search-box")) {
    document.getElementById("suggestions")
      ?.classList.add("hidden");
  }

});

async function loadSeasons(title, totalSeasons){

  const box = document.getElementById("seasonsBox");

  box.innerHTML = "";

  for(let i = 1; i <= totalSeasons; i++){

    box.innerHTML += `
      <button onclick="loadEpisodes('${title}', ${i})">
        Season ${i}
      </button>
    `;

  }

}

async function loadEpisodes(title, season){

  const res = await fetch(
    `https://www.omdbapi.com/?apikey=cfd54802&t=${encodeURIComponent(title)}&Season=${season}`
  );

  const data = await res.json();

  const box = document.getElementById("episodesBox");

  box.innerHTML = await Promise.all(
  data.Episodes.map(async e => {

    const avg = await fetch(
      `/episode-average?series=${encodeURIComponent(title)}&season=${season}&episode=${e.Episode}`
    ).then(r => r.json());

    return `

      <div class="episode-card">

        <b>Episode ${e.Episode}: ${e.Title}</b>

        <p>IMDb ⭐ ${e.imdbRating}</p>

        <p>User ⭐ ${avg.average}</p>

        <button onclick="rateEpisode('${title}','${season}','${e.Episode}')">
          Rate Episode
        </button>

      </div>

    `;
  })
).then(cards => cards.join(""));

}

async function rateEpisode(series, season, episode){

  const rating = prompt("Rate this episode (1-5)");
  if(!rating) return;

  const token = localStorage.getItem("token");

  await fetch("/episode-review",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization: token
    },
    body:JSON.stringify({
      series,
      season,
      episode,
      rating
    })
  });

  alert("Episode rated!");
}

function openTrailer(title) {

  const url =
  `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " official trailer")}`;

  window.open(url, "_blank");

}

async function loadTopMovies() {

  const res = await fetch("/top-movies");
  const data = await res.json();

  const box = document.getElementById("topMovies");
  if (!box) return;

  box.innerHTML = "";

  for (let movie of data) {

    const omdb = await fetch(
      `https://www.omdbapi.com/?apikey=cfd54802&t=${encodeURIComponent(movie._id)}`
    );

    const m = await omdb.json();

    const poster =
      m.Poster && m.Poster !== "N/A"
        ? m.Poster
        : "https://via.placeholder.com/200x300?text=No+Poster";

    box.innerHTML += `
      <div class="movie-card">
        <img src="${poster}" class="poster">
        <h4>${movie._id}</h4>
        <p>⭐ ${movie.avgRating.toFixed(1)}</p>
        <p>${movie.count} reviews</p>
      </div>
    `;
  }

}

async function loadLatestReviews(){

 const res = await fetch("/latest-reviews");
 const reviews = await res.json();

 const box = document.getElementById("latestReviews");

 box.innerHTML = reviews.map(r=>`
   <div class="review-card">
     <b>${r.username}</b> ⭐ ${r.rating}
     <p>${r.movieTitle}</p>
     <p>"${r.comment}"</p>
   </div>
 `).join("");

}