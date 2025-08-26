const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let counter = 0;

  const interval = setInterval(() => {
    const data = {
      id: counter++,
      timestamp: new Date(),
      temperature: (20 + Math.random() * 10).toFixed(2),
      humidity: (30 + Math.random() * 20).toFixed(2),
    };
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }, 5000); // Changed to 5000ms (5 seconds) for slower, more manageable updates

  req.on("close", () => {
    clearInterval(interval);
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Streaming API running on http://localhost:${PORT}/stream`);
});
