
(() => {
  "use strict";

  const DATA = window.TAVRION_DATA || {};

  const CONFIG = {
    brand: DATA.brand?.name || "TAVRION AI",
    whatsapp: DATA.contacts?.whatsapp || "79770070610",
    telegram: DATA.contacts?.telegram || "https://t.me/magomed_0077",
    currency: DATA.currency || "₽"
  };

  const PRODUCTS = Array.isArray(DATA.products) ? DATA.products : [];

  const state = {
    category: "all",
    search: "",
    sort: "default",
    favorites: new Set()
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);

  function loadFavorites() {
    try {
      const saved = JSON.parse(localStorage.getItem("tavrion-favorites") || "[]");
      if (Array.isArray(saved)) state.favorites = new Set(saved);
    } catch {
      state.favorites = new Set();
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(
        "tavrion-favorites",
        JSON.stringify([...state.favorites])
      );
    } catch {
      // Сайт продолжит работать, даже если хранилище недоступно.
    }
  }

  function formatPrice(price) {
    return Number(price || 0).toLocaleString("ru-RU");
  }

  function getWhatsAppLink(product) {
    const message = [
      "Здравствуйте! Интересует предложение TAVRION AI:",
      product.name,
      `Цена на сайте: ${formatPrice(product.price)} ${CONFIG.currency}`,
      "Расскажите, пожалуйста, об условиях."
    ].join("\n");

    return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
  }

  function getVisibleProducts() {
    let items = [...PRODUCTS];

    if (state.category === "favorites") {
      items = items.filter(product => state.favorites.has(product.id));
    } else if (state.category !== "all") {
      items = items.filter(product => product.category === state.category);
    }

    if (state.search.trim()) {
      const query = state.search.toLowerCase().trim();

      items = items.filter(product => {
        const searchable = [
          product.name,
          product.description,
          product.label,
          ...(product.features || [])
        ].join(" ").toLowerCase();

        return searchable.includes(query);
      });
    }

    if (state.sort === "price-up") {
      items.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (state.sort === "price-down") {
      items.sort((a, b) => Number(b.price) - Number(a.price));
    }

    if (state.sort === "name") {
      items.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    }

    return items;
  }

  function renderProduct(product) {
    const id = escapeHTML(product.id);
    const name = escapeHTML(product.name);
    const description = escapeHTML(product.description || "");
    const label = escapeHTML(product.label || "Предложение");
    const icon = escapeHTML(product.icon || "✦");
    const isFavorite = state.favorites.has(product.id);

    const features = (product.features || [])
      .map(feature => `<li>${escapeHTML(feature)}</li>`)
      .join("");

    return `
      <article class="product">
        <div class="product-top">
          <div class="product-icon">${icon}</div>
          <button
            class="favorite ${isFavorite ? "active" : ""}"
            type="button"
            data-favorite="${id}"
            aria-label="${isFavorite ? "Убрать из избранного" : "Добавить в избранное"}"
            aria-pressed="${isFavorite}"
          >${isFavorite ? "♥" : "♡"}</button>
        </div>

        <div class="tag">${label}</div>

        <h3>${name}</h3>
        <p>${description}</p>

        ${features ? `<ul class="product-features">${features}</ul>` : ""}

        <div class="price-row">
          <span class="price">${formatPrice(product.price)}</span>
          <span class="currency">${escapeHTML(CONFIG.currency)}</span>
        </div>

        <a
          class="btn btn-primary"
          href="${getWhatsAppLink(product)}"
          target="_blank"
          rel="noopener noreferrer"
        >Уточнить условия</a>
      </article>
    `;
  }

  function renderCatalog() {
    const container = $("#products-grid") || $("#product-grid") ||
      $("[data-products]");

    if (!container) return;

    const products = getVisibleProducts();

    if (!products.length) {
      container.innerHTML = `
        <div class="empty">
          <div class="product-icon">✦</div>
          <h3>Ничего не найдено</h3>
          <p>Попробуйте изменить поиск или выбрать другую категорию.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(renderProduct).join("");
  }

  function updateCategories() {
    $$("[data-category]").forEach(button => {
      const active = button.dataset.category === state.category;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function updateFavoritesCount() {
    const counters = $$("[data-favorites-count]");
    counters.forEach(counter => {
      counter.textContent = String(state.favorites.size);
    });
  }

  function setCategory(category) {
    state.category = category;
    updateCategories();
    renderCatalog();
  }

  function toggleFavorite(id) {
    if (state.favorites.has(id)) {
      state.favorites.delete(id);
    } else {
      state.favorites.add(id);
    }

    saveFavorites();
    updateFavoritesCount();
    renderCatalog();
  }

  function showToast(message) {
    let toast = $("#tavrion-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "tavrion-toast";
      toast.className = "toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("visible");

    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.classList.remove("visible");
    }, 2400);
  }

  function addChatMessage(text, type = "bot") {
    const messages = $("#chat-messages") || $("#support-messages");
    if (!messages) return;

    const message = document.createElement("div");
    message.className = `message ${type}`;
    message.textContent = text;

    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
  }

  function getBotReply(question) {
    const q = question.toLowerCase();

    if (/привет|здравств|добрый день|добрый вечер/.test(q)) {
      return "Здравствуйте! Добро пожаловать в TAVRION AI. Чем могу помочь?";
    }

    if (/цена|стоимость|сколько|прайс/.test(q)) {
      return "Актуальные цены указаны в каталоге. Выберите интересующее предложение и уточните условия у поддержки.";
    }

    if (/go|го\b/.test(q)) {
      return "ChatGPT Go указан в каталоге за 1 000 ₽. Перед оплатой обязательно уточните доступность и условия.";
    }

    if (/plus|плюс/.test(q)) {
      return "ChatGPT Plus указан в каталоге за 3 000 ₽. Уточнить доступность и условия можно через контакты поддержки.";
    }

    if (/telegram|телеграм|премиум/.test(q)) {
      return "Telegram Premium указан в каталоге за 1 000 ₽. Уточните доступность и условия перед покупкой.";
    }

    if (/оплат|купить|заказ/.test(q)) {
      return "Чтобы уточнить условия, нажмите кнопку у выбранного предложения. Не отправляйте пароли и коды подтверждения.";
    }

    if (/поддерж|оператор|человек|связаться/.test(q)) {
      return "Для связи с поддержкой используйте Telegram или WhatsApp в разделе контактов сайта.";
    }

    if (/спасибо/.test(q)) {
      return "Пожалуйста! Будем рады помочь.";
    }

    return "Я автоматический помощник TAVRION AI и могу отвечать на основные вопросы. Для уточнения деталей напишите нашей поддержке через контакты на сайте.";
  }

  function setupCatalog() {
    $$("[data-category]").forEach(button => {
      button.addEventListener("click", () => {
        setCategory(button.dataset.category);
      });
    });

    const search = $("#product-search") || $("#search-input") ||
      $("[data-search]");

    if (search) {
      search.addEventListener("input", event => {
        state.search = event.target.value;
        renderCatalog();
      });
    }

    const sort = $("#product-sort") || $("#sort-select") ||
      $("[data-sort]");

    if (sort) {
      sort.addEventListener("change", event => {
        state.sort = event.target.value;
        renderCatalog();
      });
    }

    document.addEventListener("click", event => {
      const favoriteButton = event.target.closest("[data-favorite]");

      if (favoriteButton) {
        toggleFavorite(favoriteButton.dataset.favorite);
      }
    });
  }

  function setupChat() {
    const form = $("#chat-form") || $("#support-form");
    const input = $("#chat-input") || $("#support-input");

    if (!form || !input) return;

    form.addEventListener("submit", event => {
      event.preventDefault();

      const question = input.value.trim();
      if (!question) return;

      addChatMessage(question, "user");
      input.value = "";

      window.setTimeout(() => {
        addChatMessage(getBotReply(question), "bot");
      }, 350);
    });
  }

  function setupContactLinks() {
    $$("[data-contact='telegram']").forEach(link => {
      link.href = CONFIG.telegram;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });

    $$("[data-contact='whatsapp']").forEach(link => {
      link.href = `https://wa.me/${CONFIG.whatsapp}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
  }

  function init() {
    loadFavorites();
    setupCatalog();
    setupChat();
    setupContactLinks();
    updateCategories();
    updateFavoritesCount();
    renderCatalog();

    console.info(`${CONFIG.brand}: система сайта запущена.`);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
