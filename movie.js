// ===============================
// TMDB CONFIG
// ===============================

// Yahi wahi API key hai jo list page (app.js) me use ho rahi hai
const API_KEY = "55c0e5aacbf3699008a93fcdd20d4816";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

// Details section ka reference
const detailsContainer = document.getElementById("movie-details-page");

// ===============================
// URL se movie id nikalna
// ===============================
//
// Example URL: movie.html?id=12345
// URLSearchParams se `id` value nikal lete hain
//
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

// Agar id missing ho, to error message show karo
if (!movieId) {
  detailsContainer.innerHTML = "<p>Invalid movie link. No movie id provided.</p>";
} else {
  // Agar id mil gayi to details + trailer load karo
  loadMovieDetails(movieId);
}

// ===============================
// Movie details + videos API call
// ===============================
//
// append_to_response=credits,videos
// -> isse hame cast + trailer (videos) dono ek hi request me mil jate hain
//
async function loadMovieDetails(id) {
  try {
    const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&append_to_response=credits,videos`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("Failed to fetch movie details");
    }

    const movie = await res.json();
    renderMovieDetails(movie);
  } catch (err) {
    console.error(err);
    detailsContainer.innerHTML = "<p>Failed to load movie details.</p>";
  }
}

// ===============================
// UI me details + trailer dikhana
// ===============================
//
// Ye function:
// - Poster
// - Basic info (release, runtime, genres)
// - Rating & votes
// - Overview
// - Cast
// - Trailer (agar available ho)
// sab ko HTML me render karta hai.
//
function renderMovieDetails(movie) {
  const poster = movie.poster_path
    ? IMG_BASE + movie.poster_path
    : "https://via.placeholder.com/300x450?text=No+Image";

  // Genres ko readable string me convert karna
  const genres = movie.genres?.map((g) => g.name).join(", ") || "N/A";

  // Top 5 cast names
  const cast =
    movie.credits?.cast
      ?.slice(0, 5)
      .map((c) => c.name)
      .join(", ") || "N/A";

  // ===============================
  // Trailer find karna (YouTube + type: Trailer)
  // ===============================
  let trailerHtml = "";

  if (movie.videos && movie.videos.results && movie.videos.results.length > 0) {
    // YouTube trailer dhundhte hain
    const ytTrailer =
      movie.videos.results.find(
        (v) =>
          v.site === "YouTube" &&
          v.type === "Trailer" &&
          v.key // safety check
      ) ||
      movie.videos.results.find(
        (v) => v.site === "YouTube" && v.key
      ); // fallback: koi bhi YouTube video

    if (ytTrailer) {
      const youtubeEmbedUrl = `https://www.youtube.com/embed/${ytTrailer.key}`;

      trailerHtml = `
        <div class="movie-details-trailer">
          <h3>Official Trailer</h3>
          <iframe 
            src="${youtubeEmbedUrl}" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>
      `;
    }
  }

  // ===============================
  // Final HTML structure
  // ===============================
  detailsContainer.innerHTML = `
    <div class="movie-details-poster">
      <img src="${poster}" alt="${movie.title}">
    </div>

    <div class="movie-details-body">
      <div class="movie-details-title">${movie.title}</div>

      <p class="movie-details-meta">
        Release: ${movie.release_date || "N/A"}
        &nbsp;•&nbsp; Runtime: ${movie.runtime || "?"} min
        &nbsp;•&nbsp; Genres: ${genres}
      </p>

      <p class="movie-details-rating">
        ⭐ ${movie.vote_average?.toFixed(1) || "N/A"} 
        (${movie.vote_count || 0} votes)
      </p>

      <p class="movie-details-overview">
        ${movie.overview || "No overview available."}
      </p>

      <p class="movie-details-cast">
        <strong>Cast:</strong> ${cast}
      </p>

      ${trailerHtml}
    </div>
  `;
}
