const params = new URLSearchParams(window.location.search);
const roomCode = (params.get("room") || "").toUpperCase();

const home = document.getElementById("home");
const room = document.getElementById("room");
const errorBox = document.getElementById("error");

// A helper that talks to the server
async function api(path, method, body) {
  const res = await fetch(path, {
    method: method || "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

// Copy text (with a backup plan if the browser says no)
function copyText(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function () {
      alert("Copied!");
    }).catch(function () {
      prompt("Copy this:", text);
    });
  } else {
    prompt("Copy this:", text);
  }
}

// ---------- HOME SCREEN ----------
document.getElementById("create").addEventListener("click", async function () {
  const data = await api("/api/create", "POST");
  window.location.href = "/?room=" + data.code;
});

document.getElementById("join").addEventListener("click", async function () {
  const code = document.getElementById("code").value.trim().toUpperCase();
  if (code === "") return;
  try {
    await api("/api/room/" + code);
    window.location.href = "/?room=" + code;
  } catch (e) {
    errorBox.textContent = "Couldn't find that room. Check the code!";
  }
});

// ---------- ROOM SCREEN ----------
if (roomCode) {
  home.style.display = "none";
  room.style.display = "block";
  document.getElementById("roomcode").textContent = roomCode;

  const nameBox = document.getElementById("name");
  const list = document.getElementById("list");
  const courtBox = document.getElementById("court");
  const courtList = document.getElementById("courts");
  let latest = { players: [], courts: [] };
  let timer;

  function draw(data) {
    latest = data;

    list.innerHTML = "";
    data.players.forEach(function (p) {
      const li = document.createElement("li");
      li.textContent = p;
      list.appendChild(li);
    });

    courtList.innerHTML = "";
    data.courts.forEach(function (c, i) {
      const li = document.createElement("li");
      li.textContent = c.name + " (" + c.votes + " votes)";
      const vote = document.createElement("button");
      vote.textContent = "👍";
      vote.onclick = async function () {
        draw(await api("/api/room/" + roomCode + "/vote", "POST", { index: i }));
      };
      li.appendChild(vote);
      courtList.appendChild(li);
    });
  }

  // Ask the server for fresh info
  async function refresh() {
    try {
      draw(await api("/api/room/" + roomCode));
    } catch (e) {
      clearInterval(timer);
      room.innerHTML = '<p>Room not found. It may have been closed.</p><a href="/">Go home</a>';
    }
  }

  document.getElementById("add").addEventListener("click", async function () {
    if (nameBox.value.trim() === "") return;
    draw(await api("/api/room/" + roomCode + "/player", "POST", { name: nameBox.value }));
    nameBox.value = "";
  });

  document.getElementById("suggest").addEventListener("click", async function () {
    if (courtBox.value.trim() === "") return;
    draw(await api("/api/room/" + roomCode + "/court", "POST", { name: courtBox.value }));
    courtBox.value = "";
  });

  document.getElementById("copylink").addEventListener("click", function () {
    copyText(window.location.href);
  });

  function makeMessage() {
    let topCourt = "TBD";
    let best = -1;
    latest.courts.forEach(function (c) {
      if (c.votes > best) {
        best = c.votes;
        topCourt = c.name;
      }
    });
    return "🏀 Pickup game! Court: " + topCourt +
      ". Players so far: " + (latest.players.join(", ") || "nobody yet") +
      ". Join us: " + window.location.href;
  }

  document.getElementById("text").addEventListener("click", function () {
    window.location.href = "sms:?&body=" + encodeURIComponent(makeMessage());
  });

  document.getElementById("copy").addEventListener("click", function () {
    copyText(makeMessage());
  });

  refresh();
  timer = setInterval(refresh, 2000); // check for updates every 2 seconds
}