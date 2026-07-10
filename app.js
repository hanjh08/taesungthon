import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBYAw6P_J1KtJWialHx0lGC-xARhcorz9E",
  authDomain: "taesungthon.firebaseapp.com",
  projectId: "taesungthon",
  storageBucket: "taesungthon.firebasestorage.app",
  messagingSenderId: "558479118068",
  appId: "1:558479118068:web:fdb39272d024dd223718a1",
  measurementId: "G-4XJ696KQ3E"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const itemsCollection = collection(db, "items");

isSupported().then((supported) => {
  if (supported) {
    getAnalytics(firebaseApp);
  }
});

const modal = document.querySelector("#register-modal");
const form = document.querySelector("#register-form");
const photoInput = document.querySelector("#item-photo");
const photoPreview = document.querySelector("#photo-preview");
const itemsGrid = document.querySelector("#items-grid");
const emptyState = document.querySelector("#empty-state");
const totalCount = document.querySelector("#total-count");
const lostCount = document.querySelector("#lost-count");
const foundCount = document.querySelector("#found-count");
const resolvedCount = document.querySelector("#resolved-count");
const nameInput = document.querySelector("#item-name");
const locationInput = document.querySelector("#item-location");
const categoryInput = document.querySelector("#item-category");
const storageInput = document.querySelector("#storage-location");
const descriptionInput = document.querySelector("#item-description");
const dateInput = document.querySelector("#item-date");
const locationLabel = document.querySelector("#location-label");
const nameCount = document.querySelector("#name-count");
const locationCount = document.querySelector("#location-count");
const detailModal = document.querySelector("#detail-modal");
const detailImage = document.querySelector("#detail-image");
const detailType = document.querySelector("#detail-type");
const detailTitle = document.querySelector("#detail-title");
const detailCategory = document.querySelector("#detail-category");
const detailLocationLabel = document.querySelector("#detail-location-label");
const detailLocation = document.querySelector("#detail-location");
const detailDate = document.querySelector("#detail-date");
const detailStorage = document.querySelector("#detail-storage");
const detailCreated = document.querySelector("#detail-created");
const detailDescription = document.querySelector("#detail-description");
const typeFilterButtons = document.querySelectorAll("[data-type-filter]");
const statusFilterButtons = document.querySelectorAll("[data-status-filter]");
const filterCategory = document.querySelector("#category");
const searchInput = document.querySelector("#search");
const submitButton = document.querySelector(".submit-button");

let uploadedImage = "";
let uploadedFile = null;
let items = [];
let activeTypeFilter = "all";
let activeStatusFilter = "active";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openModal() {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  if (!detailModal.classList.contains("is-open")) {
    document.body.classList.remove("modal-open");
  }
}

function openDetail(index) {
  const item = items[index];

  if (!item) {
    return;
  }

  const typeLabel = item.type === "lost" ? "분실물" : "습득물";
  detailType.textContent = typeLabel;
  detailType.className = `detail-type-badge ${item.type}`;
  detailImage.src = item.image;
  detailImage.alt = `${item.name || "분실물"} 사진`;
  detailTitle.textContent = item.name || "이름 없는 물품";
  detailCategory.textContent = item.category || "기타";
  detailLocationLabel.textContent = item.type === "found" ? "습득 위치" : "분실 위치";
  detailLocation.textContent = item.location || "-";
  detailDate.textContent = item.date || "-";
  detailStorage.textContent = item.storage || "-";
  detailCreated.textContent = formatCreatedAt(item.createdAt);
  detailDescription.textContent = item.description || "등록된 설명이 없습니다.";
  detailModal.classList.add("is-open");
  detailModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeDetail() {
  detailModal.classList.remove("is-open");
  detailModal.setAttribute("aria-hidden", "true");
  if (!modal.classList.contains("is-open")) {
    document.body.classList.remove("modal-open");
  }
}

function formatCreatedAt(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function subscribeItems() {
  const itemsQuery = query(itemsCollection, orderBy("createdAt", "desc"));

  onSnapshot(itemsQuery, (snapshot) => {
    items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    renderItems();
  }, (error) => {
    console.error("게시물을 불러오지 못했습니다.", error);
    alert("Firebase에서 게시물을 불러오지 못했어요. Firestore가 만들어졌는지, 규칙이 허용되어 있는지 확인해주세요.");
  });
}

async function uploadItemImage(file) {
  if (!file) {
    return "";
  }

  const safeName = file.name.replace(/[^\w.-]/g, "_");
  const imagePath = `items/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const imageRef = ref(storage, imagePath);

  await uploadBytes(imageRef, file);
  return getDownloadURL(imageRef);
}

function updateTypeCards() {
  const selectedType = form.elements.type.value;

  document.querySelectorAll(".type-card").forEach((card) => {
    const input = card.querySelector("input");
    card.classList.toggle("active", input.value === selectedType);
  });

  locationLabel.textContent = selectedType === "found" ? "습득 위치 *" : "분실 위치 *";
  locationInput.placeholder = "";
}

function updateCounts() {
  totalCount.textContent = items.length;
  lostCount.textContent = items.filter((item) => item.type === "lost").length;
  foundCount.textContent = items.filter((item) => item.type === "found").length;
  resolvedCount.textContent = items.filter((item) => item.status === "resolved").length;
}

function getFilteredItems() {
  const selectedCategory = filterCategory.value;
  const keyword = searchInput.value.trim().toLowerCase();

  return items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      const status = item.status || "active";
      const text = `${item.name || ""} ${item.location || ""} ${item.storage || ""} ${item.description || ""}`.toLowerCase();
      const matchesType = activeTypeFilter === "all" || item.type === activeTypeFilter;
      const matchesStatus = activeStatusFilter === "all" || status === activeStatusFilter;
      const matchesCategory = selectedCategory === "모든 카테고리" || item.category === selectedCategory;
      const matchesKeyword = keyword === "" || text.includes(keyword);

      return matchesType && matchesStatus && matchesCategory && matchesKeyword;
    });
}

function renderItems() {
  const filteredItems = getFilteredItems();

  itemsGrid.innerHTML = "";
  emptyState.hidden = filteredItems.length > 0;

  filteredItems.forEach(({ item, index }) => {
    const card = document.createElement("article");
    card.className = "item-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${item.name} 상세 보기`);
    card.dataset.index = index;
    const itemName = escapeHtml(item.name);
    const itemLocation = escapeHtml(item.location);
    const itemCategory = escapeHtml(item.category);
    const itemDate = escapeHtml(item.date);
    const itemStorage = escapeHtml(item.storage);

    card.innerHTML = `
      <img src="${item.image}" alt="${itemName} 사진">
      <div class="item-body">
        <span class="item-badge ${item.type}">${item.type === "lost" ? "분실물" : "습득물"}</span>
        <h3>${itemName}</h3>
        <p>${itemLocation}</p>
        <div class="item-meta">
          <span>${itemCategory}</span>
          <span>${itemDate}</span>
        </div>
        <strong>${itemStorage}</strong>
      </div>
    `;
    itemsGrid.prepend(card);
  });

  updateCounts();
}

function setActiveButton(buttons, activeButton, activeClass) {
  buttons.forEach((button) => {
    button.classList.toggle(activeClass, button === activeButton);
  });
}

function resetForm() {
  form.reset();
  uploadedImage = "";
  uploadedFile = null;
  photoPreview.removeAttribute("src");
  photoPreview.classList.remove("is-visible");
  nameCount.textContent = "0";
  locationCount.textContent = "0";
  dateInput.valueAsDate = new Date();
  updateTypeCards();
}

document.querySelectorAll(".open-register").forEach((button) => {
  button.addEventListener("click", openModal);
});

document.querySelector(".close-button").addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

detailModal.addEventListener("click", (event) => {
  if (event.target === detailModal) {
    closeDetail();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    closeModal();
  }
  if (event.key === "Escape" && detailModal.classList.contains("is-open")) {
    closeDetail();
  }
});

document.querySelectorAll(".detail-close, .detail-close-button").forEach((button) => {
  button.addEventListener("click", closeDetail);
});

typeFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeTypeFilter = button.dataset.typeFilter;
    setActiveButton(typeFilterButtons, button, "active");
    renderItems();
  });
});

statusFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeStatusFilter = button.dataset.statusFilter;
    setActiveButton(statusFilterButtons, button, "active");
    renderItems();
  });
});

filterCategory.addEventListener("change", renderItems);
searchInput.addEventListener("input", renderItems);

itemsGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".item-card");

  if (card) {
    openDetail(Number(card.dataset.index));
  }
});

itemsGrid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const card = event.target.closest(".item-card");

  if (card) {
    event.preventDefault();
    openDetail(Number(card.dataset.index));
  }
});

document.querySelectorAll('input[name="type"]').forEach((input) => {
  input.addEventListener("change", updateTypeCards);
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];

  if (!file) {
    return;
  }

  uploadedFile = file;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    uploadedImage = reader.result;
    photoPreview.src = uploadedImage;
    photoPreview.classList.add("is-visible");
    nameCount.textContent = nameInput.value.length;
    locationCount.textContent = locationInput.value.length;
  });
  reader.readAsDataURL(file);
});

nameInput.addEventListener("input", () => {
  nameCount.textContent = nameInput.value.length;
});

locationInput.addEventListener("input", () => {
  locationCount.textContent = locationInput.value.length;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const type = form.elements.type.value;
  const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='420' viewBox='0 0 640 420'%3E%3Crect width='640' height='420' fill='%23e9edff'/%3E%3Ctext x='320' y='190' text-anchor='middle' font-size='72'%3E%F0%9F%93%A6%3C/text%3E%3Ctext x='320' y='250' text-anchor='middle' font-family='Arial' font-size='28' fill='%235365d4'%3ETaesung Lost Found%3C/text%3E%3C/svg%3E";

  submitButton.disabled = true;
  submitButton.textContent = "등록 중...";

  try {
    const imageUrl = uploadedFile ? await uploadItemImage(uploadedFile) : fallbackImage;

    await addDoc(itemsCollection, {
      type,
      image: imageUrl,
      name: nameInput.value.trim(),
      category: categoryInput.value,
      location: locationInput.value.trim(),
      date: dateInput.value,
      storage: storageInput.value.trim(),
      description: descriptionInput.value.trim(),
      status: "active",
      createdAt: serverTimestamp()
    });

    resetForm();
    closeModal();
  } catch (error) {
    console.error("게시물을 등록하지 못했습니다.", error);
    alert("게시물을 등록하지 못했어요. Firestore/Storage가 만들어졌는지, Firebase 규칙이 허용되어 있는지 확인해주세요.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "등록하기";
  }
});

dateInput.valueAsDate = new Date();
updateTypeCards();
subscribeItems();
