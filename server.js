const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// In-memory storage for locations
let locations = [];

app.post("/location", (req, res) => {
  const { deviceId, latitude, longitude } = req.body;
  if(deviceId && latitude && longitude){
    locations.push({ deviceId, latitude, longitude });
    res.json({ status: "ok" });
  } else {
    res.status(400).json({ error: "Invalid data" });
  }
});

app.get("/locations", (req, res) => {
  res.json(locations);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));