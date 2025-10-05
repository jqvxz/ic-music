document.addEventListener("DOMContentLoaded", () => {
  const libraryGrid = document.getElementById("libraryGrid");
  const lastPlayedList = document.getElementById("lastPlayedList");
  const playButton = document.getElementById("playButton");
  const pauseButton = document.getElementById("pauseButton");
  const volumeSlider = document.getElementById("volumeSlider");
  const progressBarFg = document.querySelector(".progress-bar-fg");
  const progressBarBg = document.querySelector(".progress-bar-bg");
  const songTitle = document.querySelector(".song-title");
  const songLink = document.querySelector(".item-link");
  const songArtworkSm = document.querySelector(".song-artwork-sm");
  const searchInput = document.getElementById("searchInput");
  const saveButton = document.getElementById("safeSearchButton");
  const fileButton = document.getElementById("fileButton");
  const randomTrackButton = document.getElementById("randomTrackButton");

  let currentAudio = new Audio();
  let currentSong = null;
  let updateInterval = null;

  saveButton.addEventListener("click", () => {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
      saveButton.disabled = true;
      saveButton.textContent = "...";
      window.electronAPI.downloadSong(searchTerm)
        .then((newSong) => {
          console.log('Download complete. New song:', newSong);
          searchInput.value = "";
          if (newSong && newSong.filename) {
            libraryGrid.appendChild(createGridItem(newSong));
            lastPlayedList.appendChild(createSmallListItem(newSong));
          } else {
            console.log('Could not identify new song, performing a full library refresh.');
            loadLibrary();
          }
        })
        .catch((err) => {
          alert(`Error downloading: ${err.message}`);
          console.error(err);
        })
        .finally(() => {
          saveButton.disabled = false;
          saveButton.textContent = "SAVE";
        });
    } else {
      alert("Please enter a search term");
    }
  });

  // Open Explorer with saves path
  fileButton.addEventListener("click", () => {
    window.electronAPI.openSavesFolder();
  });

  progressBarBg.addEventListener("click", (e) => {
    if (currentAudio && currentAudio.duration) {
      const progressBar = progressBarBg;
      const clickX = e.pageX - progressBar.getBoundingClientRect().left;
      const width = progressBar.offsetWidth;
      const clickPosition = clickX / width;
      const newTime = clickPosition * currentAudio.duration;
      currentAudio.currentTime = newTime;
      progressBarFg.style.width = (clickPosition * 100) + "%";
    }
  });

  randomTrackButton.addEventListener("click", () => {
  window.electronAPI.getSongs()
    .then(songs => {
      if (songs.length === 0) {
        alert("No songs available to play.");
        return;
      }
      const randomIndex = Math.floor(Math.random() * songs.length);
      const randomSong = songs[randomIndex];
      playSong(randomSong);
    })
    .catch(err => {
      console.error("Failed to get songs for random play", err);
    });
  });

  function createSmallListItem(song) {
    const li = document.createElement("li");
    li.className = "item";

    const deleteSpan = document.createElement("span");
    deleteSpan.className = "material-symbols-outlined delete-icon";
    deleteSpan.textContent = "close";

    deleteSpan.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Are you sure you want to delete "${song.filename}"?`)) {
        window.electronAPI
          .deleteSong(song.filename)
          .then(() => {
            loadLibrary();
            if (currentSong === song.filename) {
              stopAudio();
            }
          })
          .catch((err) => {
            alert(`Error deleting file: ${err.message}`);
            console.error(err);
          });
      }
    };

    const span = document.createElement("span");
    span.textContent = song.filename;

    li.appendChild(deleteSpan);
    li.appendChild(span);

    li.onclick = () => {
      playSong(song);
    };

    return li;
  }

  function createGridItem(song) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "grid-item";

    const artworkDiv = document.createElement("div");
    artworkDiv.className = "item-artwork-placeholder";

    if (song.coverAvailable && song.coverPath) {
      const coverImg = document.createElement("img");
      coverImg.src = song.coverPath;
      coverImg.style.width = "100%";
      coverImg.style.height = "100%";
      coverImg.style.borderRadius = "8px";
      artworkDiv.appendChild(coverImg);
    } else {
      artworkDiv.innerHTML = "&#128220;";
      artworkDiv.style.fontSize = "50px";
      artworkDiv.style.display = "flex";
      artworkDiv.style.alignItems = "center";
      artworkDiv.style.justifyContent = "center";
    }

    const separatorDiv = document.createElement("div");
    separatorDiv.className = "separator";

    const infoDiv = document.createElement("div");
    infoDiv.className = "item-info";

    const titleSpan = document.createElement("span");
    titleSpan.className = "item-title";
    titleSpan.innerText = song.filename;

    infoDiv.appendChild(titleSpan);

    itemDiv.appendChild(artworkDiv);
    itemDiv.appendChild(separatorDiv);
    itemDiv.appendChild(infoDiv);

    itemDiv.onclick = () => {
      playSong(song);
    };

    return itemDiv;
  }

  function playSong(song) {
    if (currentSong === song.filename) {
      return;
    }
    if (currentAudio) {
      currentAudio.pause();
      clearInterval(updateInterval);
    }
    currentSong = song.filename;
    const songPath = `saves/${song.filename}`;
    currentAudio = new Audio(songPath);
    currentAudio.volume = volumeSlider.value;
    currentAudio.play();
    songTitle.textContent = song.filename;
    songLink.href = "https://youtube.com/placeholder";
    progressBarFg.style.width = "0%";
    updateInterval = setInterval(updateProgressBar, 500);
    songArtworkSm.style.backgroundImage = song.coverAvailable
      ? `url('${song.coverPath}')`
      : "none";
    songArtworkSm.style.backgroundSize = "cover";
    window.electronAPI.setNowPlaying(song.filename); // Discord update
  }

  function stopAudio() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      clearInterval(updateInterval);
      progressBarFg.style.width = "0%";
      songTitle.textContent = "There is no title currently playing";
      songLink.href = "#";
      songArtworkSm.style.backgroundImage = "none";
      currentSong = null;
      window.electronAPI.setNowPlaying(""); // Discord clear
    }
  }

  playButton.onclick = () => {
    if(currentAudio && currentAudio.paused && currentSong) {
      currentAudio.play();
      updateInterval = setInterval(updateProgressBar, 500);
      window.electronAPI.setNowPlaying(currentSong); // Discord resume
    }
  };

  pauseButton.onclick = () => {
    if(currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      clearInterval(updateInterval);
      window.electronAPI.setNowPlaying(""); // Discord pause (set idle)
    }
  };

  volumeSlider.oninput = () => {
    if(currentAudio) {
      currentAudio.volume = volumeSlider.value;
    }
  };

  function updateProgressBar() {
    if (currentAudio && currentAudio.duration) {
      const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
      progressBarFg.style.width = progress + "%";
      if (currentAudio.ended) {
        clearInterval(updateInterval);
        progressBarFg.style.width = "0%";
        window.electronAPI.setNowPlaying(""); // Discord set idle
      }
    }
  }

  function loadLibrary() {
    window.electronAPI
      .getSongs()
      .then((songs) => {
        libraryGrid.innerHTML = "";
        lastPlayedList.innerHTML = "";
        songs.forEach((song) => {
          libraryGrid.appendChild(createGridItem(song));
          lastPlayedList.appendChild(createSmallListItem(song));
        });
      })
      .catch(console.error);
  }

  loadLibrary();
});
