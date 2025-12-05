const container = document.querySelector(".now-playing");
const titleEl = document.getElementById("title");
const artistEl = document.getElementById("artist");
const albumArtEl = document.getElementById("albumArt");
const blurBgEl = document.getElementById("blurBg");
const wrapper = document.querySelector(".song-text-wrapper");
const marquee = document.querySelector(".marquee");
const currentTimeEl = document.getElementById("timeCurrent");
const remainingTimeEl = document.getElementById("timeRemaining");
const progressFillEl = document.getElementById("progressFill");

let marqueePos = 0;
let marqueeInitialized = false;
let marqueeClone = null;

document.addEventListener("DOMContentLoaded", () => {
  const dupEl = document.getElementById("title-duplicate");
  if (dupEl) dupEl.style.display = "none";
  wrapper.classList.remove("masked");
  if (fadeLeftEl) fadeLeftEl.classList.remove("visible");
  if (fadeRightEl) fadeRightEl.classList.remove("visible");
});

const state = {
  noUpdateCounter: 0,
  MAX_NO_UPDATE: 5,

  lastTitle: "",
  lastArtist: "",
  lastAlbumArt: "album_art.png",
  prevProgress: "",
};

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
    return newValue;
  } else {
    return lastValueKey || "";
  }
}

function updateAlbumArtSmooth(newSrc) {
  const img = new Image();
  img.src = newSrc;

  img.onload = () => {
    albumArtEl.src = newSrc;
    blurBgEl.style.backgroundImage = `url('${newSrc}')`;
    state.lastAlbumArt = newSrc;
  };
}

function updateScrollingBehavior() {
  const wrapperWidth = wrapper.clientWidth;
  const textWidth = titleEl.scrollWidth;

  const dupEl = document.getElementById("title-duplicate");
  let padding = 100;
  dupEl.style.paddingLeft = `${padding}px`;
  dupEl.textContent = titleEl.textContent;

  const totalScrollWidth = textWidth + padding;

  if (textWidth <= wrapperWidth) {
    // No scrolling
    marquee.classList.remove("scrolling");
    marquee.style.animationDuration = "";
    marquee.style.setProperty("--scroll-distance", "0px");

    // Remove fade effects when text fits
    dupEl.style.display = "none";
    wrapper.classList.remove("masked");
    return;
  }

  // Enable scrolling
  marquee.classList.add("scrolling");

  // Scroll distance is negative of total width of one copy
  marquee.style.setProperty("--scroll-distance", `-${totalScrollWidth}px`);

  // Duration based on speed (pixels per second)
  const speed = 100; // adjust as needed
  const duration = totalScrollWidth / speed;
  marquee.style.animationDuration = `${duration}s`;
  wrapper.classList.add("masked");
  dupEl.style.display = "inline-block";
}

async function updateInfo() {
  const [title, artist, progressRaw] = await Promise.all([
    fetchText("title.txt"),
    fetchText("artist.txt"),
    fetchText("progress.txt"),
  ]);

  // Check for updates
  if (progressRaw === state.prevProgress) {
    state.noUpdateCounter++;
  } else {
    state.noUpdateCounter = 0;
    state.prevProgress = progressRaw;
  }

  // Hide overlay if no update for MAX_NO_UPDATE intervals
  if (state.noUpdateCounter >= state.MAX_NO_UPDATE) {
    container.classList.add("hidden");
    return;
  } else {
    container.classList.remove("hidden");
  }

  const hasSongChanged =
    title && (title !== state.lastTitle || artist !== state.lastArtist);

  state.lastTitle = updateField(titleEl, title, state.lastTitle);
  state.lastArtist = updateField(artistEl, artist, state.lastArtist);

  if (hasSongChanged) {
    updateAlbumArtSmooth("album_art.png?t=" + Date.now());
  }

  updateScrollingBehavior();
  // Update progress bar
  const parts = progressRaw.split(" ");
  console.log(parts);
  if (parts.length === 2) {
    const [currentStr, durationStr] = parts;
    const current = parseTime(currentStr);
    const duration = parseTime(durationStr);

    currentTimeEl.textContent = `${currentStr}`;
    const remaining = duration - current;
    const remainingStr = formatTime(remaining);
    remainingTimeEl.textContent = `${remainingStr}`;
    if (duration > 0) {
      const percent = (current / duration) * 100;
      progressFillEl.style.width = percent + "%";
    }
  }
}

setInterval(updateInfo, 500); // update every second
