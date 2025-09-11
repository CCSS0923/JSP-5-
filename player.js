const tracks = [
  {
    id: 1,
    title: "Kairikibear - Darling Dance",
    artist: "Kairikibear",
    album: "Darling Dance 앨범",
    audioSrc: "assets/달링 댄스.mp3",
    albumCover: "assets/albumart.jpg"
  },
  {
    id: 2,
    title: "두번째 곡 예시",
    artist: "artist 2",
    album: "앨범 2",
    audioSrc: "assets/sample2.mp3",
    albumCover: "assets/sample2_album.jpg"
  }
];

let currentTrackIndex = 0;
const audio = new Audio();
audio.crossOrigin = "anonymous";

const canvas = document.getElementById("waveform");
const ctx = canvas.getContext("2d");
const playPauseBtn = document.getElementById("play-pause-btn");
const currentTimeSpan = document.getElementById("current-time");
const durationTimeSpan = document.getElementById("duration-time");
const artistNameEl = document.getElementById("artist-name");
const trackTitleEl = document.getElementById("track-title");
const albumCoverEl = document.getElementById("album-cover");
const tracklistContainer = document.getElementById("tracklist");

let audioContext;
let animationId;
let waveformData = null;

function resizeCanvas() {
  canvas.width = canvas.clientWidth * window.devicePixelRatio;
  canvas.height = canvas.clientHeight * window.devicePixelRatio;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

async function calculateWaveformData(audioURL, samples = 1200) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const response = await fetch(audioURL);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const rawData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(rawData.length / samples);
    const filteredData = [];
    for (let i = 0; i < samples; i++) {
      const blockStart = i * blockSize;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[blockStart + j]);
      }
      filteredData.push(sum / blockSize);
    }
    audioCtx.close();
    return filteredData;
  } catch (error) {
    console.error("파형 계산 중 오류:", error);
    return null;
  }
}

function drawBaseWaveform(data) {
  const width = canvas.width / window.devicePixelRatio;
  const height = canvas.height / window.devicePixelRatio;
  ctx.clearRect(0, 0, width, height);
  const barWidth = width / data.length;
  ctx.fillStyle = "#cccccc";
  data.forEach((value, i) => {
    const barHeight = value * height * 0.9;
    const x = i * barWidth;
    const y = height - barHeight;
    ctx.fillRect(x, y, barWidth * 0.92, barHeight);
  });
}

function drawProgressWaveform(data, progress) {
  const width = canvas.width / window.devicePixelRatio;
  const height = canvas.height / window.devicePixelRatio;
  const progressIndex = Math.floor(data.length * progress);
  ctx.fillStyle = "#ff5500";
  const barWidth = width / data.length;
  for (let i = 0; i < progressIndex; i++) {
    const barHeight = data[i] * height * 0.9;
    const x = i * barWidth;
    const y = height - barHeight;
    ctx.fillRect(x, y, barWidth * 0.92, barHeight);
  }
}

function setPlayButtonPlaying(isPlaying) {
  if (isPlaying) {
    playPauseBtn.querySelector(".icon.play").style.display = "none";
    playPauseBtn.querySelector(".icon.pause").style.display = "inline-block"; // 혹은 flex
  } else {
    playPauseBtn.querySelector(".icon.play").style.display = "inline-block"; // 혹은 inline
    playPauseBtn.querySelector(".icon.pause").style.display = "none";
  }
}


function formatTime(seconds) {
  if (isNaN(seconds)) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

async function setTrack(index) {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
    cancelAnimationFrame(animationId);
  }
  currentTrackIndex = index;
  const track = tracks[index];
  artistNameEl.textContent = track.artist;
  trackTitleEl.textContent = track.title;
  albumCoverEl.src = track.albumCover;
  currentTimeSpan.textContent = "0:00";
  durationTimeSpan.textContent = "--:--";
  setPlayButtonPlaying(false);
  audio.src = track.audioSrc;
  audio.load();
  waveformData = await calculateWaveformData(track.audioSrc);
  if (waveformData) drawBaseWaveform(waveformData);
  buildTracklist();
  highlightActiveTrack();
}

function buildTracklist() {
  tracklistContainer.innerHTML = "";
  tracks.forEach((track, idx) => {
    const div = document.createElement("div");
    div.classList.add("track-item");
    if (idx === currentTrackIndex) div.classList.add("active");
    div.setAttribute("data-index", idx);
    div.innerHTML = `
      <img src="${track.albumCover}" alt="앨범 커버" />
      <div class="track-details">
        <div class="title">${track.title}</div>
        <div class="artist">${track.artist}</div>
      </div>
      <div class="play-icon">▶</div>
    `;
    div.onclick = () => {
      if (idx !== currentTrackIndex) {
        setTrack(idx).then(() => {
          audio.play();
          setPlayButtonPlaying(true);
        });
      } else {
        if (audio.paused) {
          audio.play();
          setPlayButtonPlaying(true);
        } else {
          audio.pause();
          setPlayButtonPlaying(false);
        }
      }
      highlightActiveTrack();
    };
    tracklistContainer.appendChild(div);
  });
}

function highlightActiveTrack() {
  document.querySelectorAll(".track-item").forEach((el, idx) => {
    el.classList.toggle("active", idx === currentTrackIndex);
  });
}

playPauseBtn.onclick = async () => {
  if (audioContext && audioContext.state === "suspended") {
    await audioContext.resume();
  }
  if (audio.paused) {
    audio.play();
    setPlayButtonPlaying(true);
  } else {
    audio.pause();
    setPlayButtonPlaying(false);
  }
};

// 클릭한 위치로 재생 이동
canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const width = canvas.width / window.devicePixelRatio;
  const clickRatio = clickX / width;
  if (!isNaN(audio.duration)) {
    audio.currentTime = audio.duration * clickRatio;
  }
});

audio.addEventListener("timeupdate", () => {
  currentTimeSpan.textContent = formatTime(audio.currentTime);
  if (waveformData) {
    const progress = audio.currentTime / audio.duration;
    drawBaseWaveform(waveformData);
    drawProgressWaveform(waveformData, progress);
  }
});

audio.addEventListener("loadedmetadata", () => {
  durationTimeSpan.textContent = formatTime(audio.duration);
});

audio.addEventListener("ended", () => {
  setPlayButtonPlaying(false);
});

window.addEventListener("resize", () => {
  resizeCanvas();
  if (waveformData) drawBaseWaveform(waveformData);
});

resizeCanvas();
setTrack(currentTrackIndex);
