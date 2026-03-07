# 🎬 Absolute Cinema

A full-stack movie review platform where users can search movies, write reviews, manage a watchlist, and explore trending content — all powered by a live OMDB API integration.

🔗 **Live Demo:** [https://absolute-cinema-production.up.railway.app](https://absolute-cinema-production.up.railway.app)

---

## ✨ Features

- 🔐 **User Authentication** — Signup, login and logout with JWT tokens
- 🎥 **Movie & Series Search** — Real-time search powered by OMDB API with autocomplete suggestions
- ⭐ **Reviews & Ratings** — Star rating system with user reviews and like functionality
- ❤️ **Watchlist** — Add and remove movies from your personal watchlist
- 📺 **TV Series Support** — Browse seasons and rate individual episodes
- 🏆 **Top Rated Movies** — Dynamically ranked by user average ratings
- 🔥 **Trending & Popular** — Auto-populated movie rows from OMDB
- 👤 **User Profile** — View your review history and watchlist stats
- 🛡️ **Admin Panel** — Manage users, delete reviews, view platform stats
- 📱 **Mobile Responsive** — Works on all screen sizes

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Authentication | JWT (JSON Web Tokens) + bcryptjs |
| Movie Data | OMDB API |
| Deployment | Railway |

---

## 📁 Project Structure

```
backend/
├── models/
│   ├── User.js
│   ├── Review.js
│   ├── Discussion.js
│   ├── EpisodeReview.js
│   └── Recommendation.js
├── routes/
│   ├── auth.js
│   ├── movie.js
│   ├── admin.js
│   ├── recommendation.js
│   └── user.js
├── public/
│   ├── index.html
│   ├── dashboard.html
│   ├── login.html
│   ├── signup.html
│   ├── profile.html
│   ├── watchlist.html
│   ├── admin.html
│   ├── script.js
│   └── style.css
├── server.js
├── package.json
└── .env
```

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

### Installation

```bash
# Clone the repository
git clone https://github.com/Ani226/movie-review-system.git

# Navigate to backend
cd movie-review-system

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
OMDB_KEY=your_omdb_api_key
PORT=3000
```

### Run Locally

```bash
node server.js
```

Open your browser at `http://localhost:3000`

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | Login user |
| GET | `/movie/:name` | Search movie by name |
| GET | `/trending` | Get trending movies |
| POST | `/review` | Add a review |
| GET | `/reviews/:movieId` | Get reviews for a movie |
| GET | `/average/:movieId` | Get average rating |
| POST | `/watchlist` | Add to watchlist |
| GET | `/watchlist` | Get user watchlist |
| DELETE | `/watchlist/:movieId` | Remove from watchlist |
| GET | `/top-movies` | Get top rated movies |
| GET | `/admin/stats` | Get platform statistics |

---

## 👨‍💻 Author

**Anay** — https://github.com/anaydev29
---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

⭐ If you like this project, give it a star on GitHub!

