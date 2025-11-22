// =====================================
// TMDB CONFIG
// =====================================

// TMDB API key (apni key yahan rakho)
const API_KEY = "55c0e5aacbf3699008a93fcdd20d4816";
// Poster images ke liye base URL
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

// =====================================
// DOM ELEMENTS (sirf ek baar select)
// =====================================
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const suggestionBox = document.getElementById("suggestions");
const sectionTitle = document.getElementById("section-title");
const movieGrid = document.getElementById("movie-grid");
const paginationContainer = document.getElementById("pagination"); // <div id="pagination">

// =====================================
// PAGINATION STATE
// =====================================
//
// currentPage     -> abhi ka page number
// totalPages      -> TMDB se aane wala total pages
// lastMode        -> kaunsa mode chala tha ("latest", "search", "trending", "language")
// lastQueryUsed   -> search query ya language code
// currentLangLabel-> language filter ka heading label (Bollywood Movies etc.)
//
let currentPage = 1;
let totalPages = 1;
let lastMode = "latest";
let lastQueryUsed = "";
let currentLangLabel = "";

// =====================================
// MOVIES GRID RENDER KARNA
// =====================================
//
// - API se aayi hui movies ko grid me card form me dikhata hai
// - Har card ek <a> link hai jo user ko movie.html?id=123 pe le jata hai
//
function renderMovies(movies) {
  movieGrid.innerHTML = "";

  if (!movies || movies.length === 0) {
    movieGrid.innerHTML = "<p>No movies found.</p>";
    return;
  }

  movies.forEach((movie) => {
    const poster = movie.poster_path
      ? IMG_BASE + movie.poster_path
      : "https://via.placeholder.com/300x450?text=No+Image";

    // Card ko <a> banaya jo detail page par le jayega
    const link = document.createElement("a");
    link.className = "movie-card";
    link.href = `movie.html?id=${movie.id}`;

    link.innerHTML = `
      <img src="${poster}" alt="${movie.title}">
      <div class="movie-card-body">
        <div class="movie-card-title">${movie.title}</div>
        <div class="movie-card-meta">
          ${movie.release_date || "Unknown"} • ⭐ ${
      movie.vote_average?.toFixed(1) || "N/A"
    }
        </div>
      </div>
    `;

    movieGrid.appendChild(link);
  });
}

// =====================================
// PAGINATION BUTTONS RENDER KARNA
// =====================================
//
// - totalPages ke base par "1 2 3 4 5" buttons banata hai
// - currentPage ko active class deta hai
// - Button click -> corresponding page data load
//
function renderPagination() {
  paginationContainer.innerHTML = "";

  // Agar sirf 1 page hai to pagination ki zarurat nahi
  if (totalPages <= 1) return;

  // ---------- HOME BUTTON ----------
  const homeBtn = document.createElement("button");
  homeBtn.className = "page-btn home-btn";
  homeBtn.innerText = "🏠 Home";

  homeBtn.addEventListener("click", () => {
    // state reset
    currentPage = 1;
    lastMode = "latest";
    lastQueryUsed = "";
    searchInput.value = "";

    // URL se ?query hata do
    history.pushState({}, "", window.location.pathname);

    // Latest releases load karo
    loadLatest(1);

    // Page top pe scroll
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  paginationContainer.appendChild(homeBtn);
  // ---------- END HOME BUTTON ----------

  // Jitne page dikhane hain (max 5, taaki UI clean rahe)
  const maxPagesToShow = Math.min(totalPages, 5);

  for (let i = 1; i <= maxPagesToShow; i++) {
    const btn = document.createElement("button");
    btn.className = "page-btn" + (i === currentPage ? " active" : "");
    btn.innerText = i;

    btn.addEventListener("click", () => {
      currentPage = i;

      if (lastMode === "search") {
        searchMovies(lastQueryUsed, currentPage, false);
      } else if (lastMode === "latest") {
        loadLatest(currentPage);
      } else if (lastMode === "trending") {
        loadTrending(currentPage);
      } else if (lastMode === "language") {
        loadByLanguage(lastQueryUsed, currentLangLabel, currentPage);
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    paginationContainer.appendChild(btn);
  }
}


// =====================================
// API CALLS (LIST PAGES)
// =====================================

// 1) Latest Releases (Now Playing)
async function loadLatest(page = 1) {
  lastMode = "latest";
  lastQueryUsed = "";
  currentPage = page;

  const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&page=${page}`;
  const res = await fetch(url);
  const data = await res.json();

  sectionTitle.innerText = "Latest Releases";
  totalPages = data.total_pages || 1;

  renderMovies(data.results);
  renderPagination();
}

// 2) Search by query
async function searchMovies(query, page = 1, updateUrl = true) {
  lastMode = "search";
  lastQueryUsed = query;
  currentPage = page;

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
    query
  )}&page=${page}`;
  const res = await fetch(url);
  const data = await res.json();

  sectionTitle.innerText = `Search results for "${query}"`;
  totalPages = data.total_pages || 1;

  renderMovies(data.results);
  renderPagination();

  // URL ko sirf initial search pe update karna (pagination click pe nahi)
  if (updateUrl) {
    history.pushState(
      { search: query, page },
      "",
      `?query=${encodeURIComponent(query)}`
    );
  }
}
// ===========================
// 3) HERO BACKGROUND SLIDESHOW
// ===========================

async function setHeroBackground() {
  try {
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    // Sirf woh movies jinke paas backdrop ho
    const backdrops = data.results
      .filter(m => m.backdrop_path)
      .map(m => `https://image.tmdb.org/t/p/w780${m.backdrop_path}`); 
      // 👆 w780 = light images, /original se kaafi fast

    if (!backdrops.length) return;

    const hero = document.querySelector(".hero");
    if (!hero) return;

    let index = 0;

    function changeBackground() {
      const img = new Image();
      img.src = backdrops[index];

      img.onload = () => {
        // CSS variable set karo jo hero::before me use hoga
        hero.style.setProperty("--bg-img", `url('${backdrops[index]}')`);
        // loaded class add karo taaki fade-in ho
        hero.classList.add("loaded");
      };

      index = (index + 1) % backdrops.length;
    }

    // Pehli image turant load
    changeBackground();

    // Har 3 second me next (fast but not irritating)
    setInterval(changeBackground, 3000);
  } catch (err) {
    console.error("Hero background error:", err);
  }
}

setHeroBackground();


// 4) Suggestions ke liye search (same API, first page)
async function fetchSuggestions(query) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
    query
  )}&page=1`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results.slice(0, 6); // sirf top 6 suggestions
}

// 5) Trending movies
async function loadTrending(page = 1) {
  lastMode = "trending";
  lastQueryUsed = "";
  currentPage = page;

  const url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}&page=${page}`;
  const res = await fetch(url);
  const data = await res.json();

  sectionTitle.innerText = "Trending Movies";
  totalPages = data.total_pages || 1;

  renderMovies(data.results);
  renderPagination();
}

// 6) Language based filter (Hollywood/Bollywood/Tollywood)
async function loadByLanguage(langCode, label, page = 1) {
  lastMode = "language";
  lastQueryUsed = langCode; // is case me query = language code
  currentLangLabel = label;
  currentPage = page;

  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_original_language=${langCode}&page=${page}`;
  const res = await fetch(url);
  const data = await res.json();

  sectionTitle.innerText = label;
  totalPages = data.total_pages || 1;

  renderMovies(data.results);
  renderPagination();
}

// =====================================
// SEARCH HANDLER (button + Enter)
// =====================================
//
// Common function: search button click + Enter key dono ke liye
//
function handleSearch() {
  const text = searchInput.value.trim();
  if (text !== "") {
    // Naya search hamesha page 1 se start karega
    currentPage = 1;
    searchMovies(text, currentPage, true);
    suggestionBox.style.display = "none";
  }
}

// Button click -> search
searchBtn.addEventListener("click", handleSearch);

// Enter key -> search
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleSearch();
  }
});

// =====================================
// SEARCH SUGGESTIONS (on input)
// =====================================
//
// - User typing ke time TMDB se suggestions laata hai
// - Debounce (80ms) laga ke network spam kam kiya hai
//
let suggestionTimeout = null;
let lastSuggestionQuery = "";

searchInput.addEventListener("input", () => {
  const text = searchInput.value.trim();

  // 1 se kam character pe suggestions band
  if (text.length < 1) {
    suggestionBox.style.display = "none";
    suggestionBox.innerHTML = "";
    lastSuggestionQuery = "";
    return;
  }

  clearTimeout(suggestionTimeout);

  suggestionTimeout = setTimeout(async () => {
    if (text === lastSuggestionQuery) return;
    lastSuggestionQuery = text;

    const suggestions = await fetchSuggestions(text);

    suggestionBox.innerHTML = "";
    if (!suggestions || suggestions.length === 0) {
      suggestionBox.style.display = "none";
      return;
    }

    suggestions.forEach((movie) => {
      const item = document.createElement("div");
      item.className = "suggestion-item";
      item.innerText = movie.title;

      // Suggestion pe click -> search run + dropdown hide
      item.addEventListener("click", () => {
        searchInput.value = movie.title;
        suggestionBox.style.display = "none";
        currentPage = 1;
        searchMovies(movie.title, currentPage, true);
      });

      suggestionBox.appendChild(item);
    });

    suggestionBox.style.display = "flex";
  }, 80); // fast suggestions
});

// Click bahar -> dropdown band
document.addEventListener("click", (e) => {
  if (
    !searchInput.contains(e.target) &&
    !suggestionBox.contains(e.target)
  ) {
    suggestionBox.style.display = "none";
  }
});

// =====================================
// NAVBAR EVENTS (categories)
// =====================================

// Trending
document
  .getElementById("nav-trending")
  .addEventListener("click", () => {
    currentPage = 1;
    loadTrending(currentPage);
  });

// Hollywood = English
document
  .getElementById("nav-hollywood")
  .addEventListener("click", () =>
    loadByLanguage("en", "Hollywood Movies", 1)
  );

// Bollywood = Hindi
document
  .getElementById("nav-bollywood")
  .addEventListener("click", () =>
    loadByLanguage("hi", "Bollywood Movies", 1)
  );

// Tollywood = Telugu
document
  .getElementById("nav-tollywood")
  .addEventListener("click", () =>
    loadByLanguage("te", "Tollywood Movies", 1)
  );

// =====================================
// BACK / FORWARD BUTTON HANDLING
// =====================================
//
// - Agar history state me search hai -> wahi search dobara run karo
// - Agar kuch nahi -> home page (latest releases)
//
window.onpopstate = function (event) {
  if (!event.state || !event.state.search) {
    // HOME: latest releases page 1
    currentPage = 1;
    searchInput.value = "";
    loadLatest(currentPage);
  } else {
    const q = event.state.search;
    const pageFromState = event.state.page || 1;
    currentPage = pageFromState;
    searchInput.value = q;
    // URL already correct hoga, isliye updateUrl = false
    searchMovies(q, currentPage, false);
  }
};

// =====================================
// INITIAL LOAD (page open hote hi)
// =====================================
//
// Agar URL me ?query= hai -> direct search dikhana
// Nahi to latest releases dikhana
//
const urlParams = new URLSearchParams(window.location.search);
const initialQuery = urlParams.get("query");

if (initialQuery) {
  searchInput.value = initialQuery;
  currentPage = 1;
  // replaceState taaki current state bhi search ho
  history.replaceState(
    { search: initialQuery, page: 1 },
    "",
    window.location.href
  );
  searchMovies(initialQuery, currentPage, false);
} else {
  currentPage = 1;
  loadLatest(currentPage);
}
