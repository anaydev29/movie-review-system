app.get("/similar/:genre", async (req, res) => {
  const genre = req.params.genre;

  const omdbRes = await fetch(
    `https://www.omdbapi.com/?apikey=${process.env.OMDB_KEY}&s=${genre}&type=movie`
  );

  const data = await omdbRes.json();
  res.json(data.Search || []);
});

router.post("/review/like/:id", async (req, res) => {

  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ error: "Review not found" });
  }

  review.likes += 1;
  await review.save();

  res.json({ message: "Liked", likes: review.likes });

});