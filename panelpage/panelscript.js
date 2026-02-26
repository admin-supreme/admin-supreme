const API_BASE = "https://supreme-admin-worker.neonasmin.workers.dev";

const select = document.getElementById("animeSelect");
const searchInput = document.getElementById("searchInput");
const updateBtn = document.getElementById("updateBtn");
const bannerImage = document.getElementById("bannerImage");

const episodesContainer = document.getElementById("episodesContainer");

let currentId = null;
let episodes = [];
const imageInput = document.getElementById("image_url");

imageInput.addEventListener("input", () => {
  bannerImage.src = imageInput.value;
});
/* ===================== LOAD IDS ===================== */

async function loadIds() {
  const res = await fetch(`${API_BASE}/admin/anime-ids`, { credentials: "include" });
  const ids = await res.json();
  select.innerHTML = "";
  ids.forEach(id => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = id;
    select.appendChild(opt);
  });
}

/* ===================== SEARCH ===================== */

searchInput.addEventListener("input", () => {
  const val = searchInput.value.toLowerCase();
  [...select.options].forEach(o => {
    o.style.display = o.value.toLowerCase().includes(val) ? "" : "none";
  });
});

/* ===================== LOAD ANIME ===================== */

select.addEventListener("change", async () => {
  currentId = select.value;

  const res = await fetch(`${API_BASE}/admin/anime/${currentId}`, { credentials: "include" });
  const data = await res.json();

  loadAnimeInfo(data.anime_info);
  loadEpisodes(data.streaming_links || []);
});

/* ===================== ANIME INFO ===================== */

function loadAnimeInfo(ai) {
  bannerImage.src = ai.image_url || "";
  document.getElementById("image_url").value = ai.image_url || "";

  const container = document.getElementById("animeInfoFields");
  container.innerHTML = "";

  const numberFields = [
    "mal_id", "year", "episodes", "total_seasons",
    "popularity", "rank", "scored_by",
    "members", "favorites"
  ];

  const textareaFields = [
    "overview", "tags", "title_synonyms",
    "studios", "dubbed_languages",
    "producers", "licensors",
    "themes", "demographics"
  ];

  Object.keys(ai).forEach(key => {

    if (["id", "created_at", "updated_at"].includes(key)) return;

    const wrapper = document.createElement("div");
    const label = document.createElement("label");
    label.textContent = key;

    let field;

    if (textareaFields.includes(key)) {
      field = document.createElement("textarea");
    } else {
      field = document.createElement("input");

      if (numberFields.includes(key)) {
        field.type = "number";
      } else if (key === "rating") {
        field.type = "number";
        field.step = "0.1";
      } else {
        field.type = "text";
      }
    }

    field.value = ai[key] ?? "";
    field.dataset.field = key;

    wrapper.appendChild(label);
    wrapper.appendChild(field);
    container.appendChild(wrapper);
  });
}
let currentEditingIndex = null;
/* ================= LOAD EPISODES ================= */

function loadEpisodes(list) {
  episodes = list
    .map(e => ({ ...e }))
    .sort((a, b) => a.episode_number - b.episode_number);

  renderEpisodeGrid();
}

function renderEpisodeGrid() {
  episodesContainer.innerHTML = "";

  episodes.forEach((ep, index) => {
    const box = document.createElement("div");
    box.className = "episode-box";
    box.innerText = ` 𝙀𝙥𝙞𝙨𝙤𝙙𝙚- ${ep.episode_number}`;

    box.onclick = () => openEditor(index);

    episodesContainer.appendChild(box);
  });
}

/* ================= EDITOR ================= */

function openEditor(index) {
  currentEditingIndex = index;
  const ep = episodes[index];

  const editor = document.getElementById("episodeEditor");
  editor.style.display = "block";
  editor.scrollIntoView({ behavior: "smooth" });

  editor.innerHTML = `
    <h4>Editing Episode ${ep.episode_number}</h4>

    <input type="number"min="1"max="9999"value="${ep.episode_number || ""}"placeholder="Episode Number"id="edit_episode_number">
    <input value="${ep.episode_title || ""}" placeholder="Episode Title" id="edit_episode_title">
    <input value="${ep.quality || ""}" placeholder="Quality" id="edit_quality">
    <input value="${ep.language || ""}" placeholder="Language" id="edit_language">
    <input value="${ep.server_name || ""}" placeholder="Server Name" id="edit_server_name">
    <input value="${ep.stream_url || ""}" placeholder="Stream URL" id="edit_stream_url">
    <input value="${ep.download_url || ""}" placeholder="Download URL" id="edit_download_url">

    <div class="editor-actions">
  <button type="button" id="saveEpisodeBtn" class="editor-btn">Save</button>
  <button type="button" id="cancelEpisodeBtn" class="editor-btn cancel">Cancel</button>
</div>
  `;

  document.getElementById("saveEpisodeBtn").onclick = saveEpisode;
  document.getElementById("cancelEpisodeBtn").onclick = closeEditor;
}

function saveEpisode() {
  const ep = episodes[currentEditingIndex];

  let num = Number(document.getElementById("edit_episode_number").value);

if (!Number.isSafeInteger(num) || num < 1) {
  alert("Invalid episode number. Please enter a valid number.");
  return;
}

ep.episode_number = num;
  ep.episode_title = document.getElementById("edit_episode_title").value;
  ep.quality = document.getElementById("edit_quality").value;
  ep.language = document.getElementById("edit_language").value;
  ep.server_name = document.getElementById("edit_server_name").value;
  ep.stream_url = document.getElementById("edit_stream_url").value;
  ep.download_url = document.getElementById("edit_download_url").value;

  closeEditor();
episodes.sort((a, b) => {
  const aNum = Number(a.episode_number);
  const bNum = Number(b.episode_number);

  if (!Number.isSafeInteger(aNum)) return 1;
  if (!Number.isSafeInteger(bNum)) return -1;

  return aNum - bNum;
});
renderEpisodeGrid();
}

function closeEditor() {
  document.getElementById("episodeEditor").style.display = "none";
  currentEditingIndex = null;
}

/* ================= ADD EPISODE ================= */

const addBtn = document.getElementById("addEpisodeBtn");

addBtn.onclick = () => {
  const safeNumbers = episodes
  .map(e => Number(e.episode_number))
  .filter(n => Number.isSafeInteger(n));

const maxEp = safeNumbers.length
  ? Math.max(...safeNumbers)
  : 0;

  const newEp = {
    episode_number: maxEp + 1,
    episode_title: "",
    quality: "",
    language: "",
    server_name: "",
    stream_url: "",
    download_url: ""
  };

  episodes.push(newEp);

  // Re-render grid
  renderEpisodeGrid();

  // Open editor for the newly added episode
  const newIndex = episodes.length - 1;
  openEditor(newIndex);
};
/* ================= REMOVE EPISODE ================= */

const removeBtn = document.getElementById("removeEpisodeBtn");
const confirmBox = document.getElementById("removeConfirmBox");

removeBtn.onclick = () => {

  if (!episodes.length) {
    alert("No episodes to remove.");
    return;
  }

  const lastEp = episodes[episodes.length - 1];

  confirmBox.style.display = "block";
  confirmBox.innerHTML = `
    <div class="confirm-content">
      <p>Do you really want to remove Episode ${lastEp.episode_number}?</p>

      <div class="confirm-actions">
        <button id="confirmYes" class="danger-btn">Yes</button>
        <button id="confirmNo">No</button>
      </div>

      <div id="removeLoadingBar" class="loading-bar" style="display:none;"></div>
    </div>
  `;

  document.getElementById("confirmNo").onclick = () => {
    confirmBox.style.display = "none";
  };

  document.getElementById("confirmYes").onclick = () => {
    const loadingBar = document.getElementById("removeLoadingBar");
    loadingBar.style.display = "block";

    let width = 0;

    const interval = setInterval(() => {
      width += 10;
      loadingBar.style.width = width + "%";

      if (width >= 100) {
        clearInterval(interval);

        // Remove last episode
        episodes.pop();
        renderEpisodeGrid();

        confirmBox.style.display = "none";
      }

    }, 80);
  };
};
/* ===================== UPDATE ===================== */

updateBtn.addEventListener("click", async () => {

  if (!currentId) {
    alert("Select an anime first");
    return;
  }

  // Collect Anime Info
  const animeInfo = {};
  document.querySelectorAll("#animeInfoFields input").forEach(input => {
    animeInfo[input.dataset.field] = input.value;
  });

  // IMPORTANT: Use episodes array directly
  const res = await fetch(`${API_BASE}/admin/anime/${currentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      anime_info: animeInfo,
      streaming_links: episodes
    })
  });

  if (res.ok) {
    alert("Updated Successfully");
  } else {
    alert("Update Failed");
  }
});