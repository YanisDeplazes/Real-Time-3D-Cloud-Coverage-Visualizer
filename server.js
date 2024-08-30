const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

// Use the CORS middleware
app.use(cors());

app.use(express.json());

app.post("/fetch-cloud-data", async (req, res) => {
  const { boundingBox } = req.body;

  const {
    level,
    unit,
    date,
    north,
    west,
    south,
    east,
    resolutionLat,
    resolutionLon,
  } = boundingBox;
  const url = `https://api.meteomatics.com/${date}/${level}_cloud_cover:${unit}/${north},${west}_${south},${east}:${resolutionLat},${resolutionLon}/json`;
  const auth = Buffer.from("").toString("base64"); // Replace with your Login and Password

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: "Basic " + auth,
      },
    });
    res.json(response.data); // Use res.json() to send JSON response
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data");
  }
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
