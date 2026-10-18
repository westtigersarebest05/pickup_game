const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

// All the rooms live here while the server is running
const rooms = {};

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms[code] ? makeCode() : code;
}

function getRoom(req, res) {
  const room = rooms[req.params.code.toUpperCase()];
  if (!room) res.status(404).json({ error: "No such room" });
  return room;
}

// Create a new room
app.post("/api/create", (req, res) => {
  const code = makeCode();
  rooms[code] = { players: [], courts: [] };
  res.json({ code: code });
});

// Get everything in a room
app.get("/api/room/:code", (req, res) => {
  const room = getRoom(req, res);
  if (room) res.json(room);
});

// Add a player
app.post("/api/room/:code/player", (req, res) => {
  const room = getRoom(req, res);
  if (!room) return;
  const name = String(req.body.name || "").trim().slice(0, 30);
  if (name && room.players.length < 30) room.players.push(name);
  res.json(room);
});

// Suggest a court
app.post("/api/room/:code/court", (req, res) => {
  const room = getRoom(req, res);
  if (!room) return;
  const name = String(req.body.name || "").trim().slice(0, 50);
  if (name && room.courts.length < 20) room.courts.push({ name: name, votes: 0 });
  res.json(room);
});

// Vote for a court
app.post("/api/room/:code/vote", (req, res) => {
  const room = getRoom(req, res);
  if (!room) return;
  const court = room.courts[req.body.index];
  if (court) court.votes++;
  res.json(room);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port " + port));