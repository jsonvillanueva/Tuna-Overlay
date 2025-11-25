const container = document.querySelector(".now-playing");
let noUpdateCounter = 0;
const MAX_NO_UPDATE = 5;

// Last Known Values
let lastTitle = "";
let lastArtist = "";
let lastAlbumArt = "album_art.png";
let prevProgress = "";

function parseTime(str) {
  const [min, sec] = str.split(":").map(Number);
  return min * 60 + sec;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

async function fetchText(file) {
  try {
    const res = await fetch(file + "?t=" + Date.now());
    return res.ok ? (await res.text()).trim() : "";
  } catch {
    return "";
  }
}

function updateField(el, newValue, lastValueKey) {
  if (newValue && newValue.trim() !== "") {
    el.textContent = newValue;
    window[lastValueKey] = newValue; // store last good value
  } else {
    el.textContent = window[lastValueKey] || "";
  }
}

function updateAlbumArtSmooth(newSrc) {
  const img = new Image();
  img.src = newSrc;

  img.onload = () => {
    document.getElementById("albumArt").src = newSrc;
    document.getElementById(
      "blurBg"
    ).style.backgroundImage = `url('${newSrc}')`;
    lastAlbumArt = newSrc; // update global
  };
}

async function updateInfo() {
  const [title, artist, progressRaw] = await Promise.all([
    fetchText("title.txt"),
    fetchText("artist.txt"),
    fetchText("progress.txt"),
  ]);

  // Check for updates
  if (progressRaw === prevProgress) {
    noUpdateCounter++;
  } else {
    noUpdateCounter = 0;
    prevProgress = progressRaw;
  }

  // Hide overlay if no update for MAX_NO_UPDATE intervals
  if (noUpdateCounter >= MAX_NO_UPDATE) {
    container.classList.add("hidden");
    return;
  } else {
    container.classList.remove("hidden");
  }

  // Show overlay
  // Update title/artist

  // Title & Artist (ignore clears)
  updateField(document.getElementById("title"), title, "lastTitle");
  updateField(document.getElementById("artist"), artist, "lastArtist");

  const songChanged =
    title !== "" && (title !== lastTitle || artist !== lastArtist);
  if (songChanged) {
    const cacheSrc = "album_art.png?t=" + Date.now();
    updateAlbumArtSmooth(cacheSrc);
  }

  // Refresh the album art if it was missing
  if (!document.getElementById("albumArt").src.includes(lastAlbumArt)) {
    updateAlbumArtSmooth(lastAlbumArt);
  }
  // Update progress bar
  const parts = progressRaw.split(" ");
  console.log(parts);
  if (parts.length === 2) {
    const [currentStr, durationStr] = parts;
    const current = parseTime(currentStr);
    const duration = parseTime(durationStr);

    document.getElementById("timeCurrent").textContent = `${currentStr}`;
    const remaining = duration - current;
    const remainingStr = formatTime(remaining);
    document.getElementById("timeRemaining").textContent = `${remainingStr}`;
    if (duration > 0) {
      const percent = (current / duration) * 100;
      document.getElementById("progressFill").style.width = percent + "%";
    }
  }
}

setInterval(updateInfo, 500); // update every second
