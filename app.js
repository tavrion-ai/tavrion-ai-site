
"use strict";

/* =========================================
   TAVRION AI — APPLICATION CORE
   ========================================= */

(() => {
  const DATA = window.TAVRION_DATA || {};

  const CONFIG = {
    whatsapp: DATA.contacts?.whatsapp || "79770070610",
    telegram: DATA.contacts?.telegram || "https://t.me/magomed_0077",
    currency: DATA.currency || "₽"
  };

  const PRODUCTS = Array.isArray(DATA.products) ? DATA.products : [];

  const state = {
    category: "all",
    search: "",
    sort: "default",
    favorites: loadFavorites()
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function loadFavorites() {
    try {
      return new Set(JSON.parse(localStorage.getItem("tavrion-favorites") || "[]"));
    } catch {
      return new Set();
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

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function productName(product) {
    return product.name || product.title || product.id || "Предложение";
  }

  function formatPrice(price) {
    const number = Number(price);

    if (!Number.isFinite(number)) {
      return "Уточняйте";
    }

    return `${number.toLocaleString("ru-RU")} ${CONFIG.currency}`;
  }

  function getProductId(product, index) {
    return String(product.id || `product-${index}`);
  }

  function getWhatsAppLink(product) {
    const message = `Здравствуйте! Интересует предложение: ${productName(product)}. Расскажите, пожалуйста, подробнее.`;
    const phone = String(CONFIG.whatsapp).replace(/\D/g, "");

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  function showToast(message) {
    let toast = $("#tavrion-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "tavrion-toast";
      toast.className = "tavrion-toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("visible");

    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.classList.remove("visible");
    }, 2400);
  }

  /* =========================================
     PRODUCT CATALOG
     ========================================= */

  function getVisibleProducts() {
    let result = PRODUCTS.map((product, index) => ({
      ...product,
      _id: getProductId(product, index)
    }));

    if (state.category === "favorites") {
      result = result.filter(product => state.favorites.has(product._id));
    } else if (state.category !== "all") {
      result = result.filter(product =>
        String(product.category || "").toLowerCase() === state.category
      );
    }

    if (state.search.trim()) {
      const query = state.search.toLowerCase().trim();

      result = result.filter(product => {
        const searchable = [
          productName(product),
          product.description,
          product.category,
          product.badge
        ].join(" ").toLowerCase();

        return searchable.includes(query);
      });
    }

    if (state.sort === "price-up") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (state.sort === "price-down") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (state.sort === "name") {
      result.sort((a, b) =>
        productName(a).localeCompare(productName(b), "ru")
      );
    }

    return result;
  }

  function renderProducts() {
    const grid =
      $("#products-grid") ||
      $("#product-grid") ||
      $("[data-products]");

    if (!grid) return;

    const products = getVisibleProducts();

    if (!products.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✦</div>
          <h3>Ничего не найдено</h3>
          <p>Попробуйте изменить поиск или выбрать другую категорию.</p>
        </div>
      `;
      updateFavoriteCount();
      return;
    }

    grid.innerHTML = products.map(product => {
      const id = escapeHTML(product._id);
      const name = escapeHTML(productName(product));
      const description = escapeHTML(product.description || "");
      const icon = escapeHTML(product.icon || "✦");
      const badge = product.badge
        ? `<span class="tag">${escapeHTML(product.badge)}</span>`
        : "";

      const favoriteClass = state.favorites.has(product._id)
        ? "favorite is-active"
        : "favorite";

      const favoriteLabel = state.favorites.has(product._id)
        ? "Убрать из избранного"
        : "Добавить в избранное";

      return `
        <article class="product" data-product-id="${id}">
          <div class="product-top">
            <div class="product-icon">${icon}</div>
            <button
              class="${favoriteClass}"
              type="button"
              data-favorite="${id}"
              aria-label="${favoriteLabel}"
              title="${favoriteLabel}"
            >${state.favorites.has(product._id) ? "♥" : "♡"}</button>
          </div>

          ${badge}

          <h3>${name}</h3>
          <p>${description}</p>

          <div class="price-row">
            <div class="price">${formatPrice(product.price)}</div>
            <span class="currency">${escapeHTML(CONFIG.currency)}</span>
          </div>

          <a
            class="btn btn-primary"
            href="${getWhatsAppLink(product)}"
            target="_blank"
            rel="noopener noreferrer"
          >Уточнить предложение</a>
        </article>
      `;
    }).join("");

    updateFavoriteCount();
  }

  function updateFavoriteCount() {
    const count = $("#favorites-count") || $("[data-favorites-count]");

    if (count) {
      count.textContent = String(state.favorites.size);
    }
  }

  function setCategory(category) {
    state.category = category;

    $$("[data-category]").forEach(button => {
      const active = button.dataset.category === category;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    renderProducts();
  }

  /* =========================================
     SEARCH AND SORT
     ========================================= */

  const searchInput =
    $("#product-search") ||
    $("#search-input") ||
    $("[data-search]");

  if (searchInput) {
    searchInput.addEventListener("input", event => {
      state.search = event.target.value || "";
      renderProducts();
    });
  }

  const sortSelect =
    $("#product-sort") ||
    $("#sort-select") ||
    $("[data-sort]");

  if (sortSelect) {
    sortSelect.addEventListener("change", event => {
      state.sort = event.target.value || "default";
      renderProducts();
    });
  }

  document.addEventListener("click", event => {
    const categoryButton = event.target.closest("[data-category]");

    if (categoryButton) {
      setCategory(categoryButton.dataset.category);
      return;
    }

    const favoriteButton = event.target.closest("[data-favorite]");

    if (favoriteButton) {
      const id = favoriteButton.dataset.favorite;

      if (state.favorites.has(id)) {
        state.favorites.delete(id);
        showToast("Удалено из избранного");
      } else {
        state.favorites.add(id);
        showToast("Добавлено в избранное");
      }

      saveFavorites();
      renderProducts();
    }
  });

  /* =========================================
     SUPPORT CHAT
     ========================================= */

  const chatMessages =
    $("#chat-messages") ||
    $("#support-messages");

  const chatForm =
    $("#chat-form") ||
    $("#support-form");

  const chatInput =
    $("#chat-input") ||
    $("#support-input");

  function addChatMessage(message, type = "bot") {
    if (!chatMessages) return;

    const element = document.createElement("div");
    element.className = `message ${type}`;
    element.textContent = message;

    chatMessages.appendChild(element);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getPriceList() {
    if (!PRODUCTS.length) {
      return "Сейчас список предложений недоступен. Напишите нам в Telegram или WhatsApp.";
    }

    const lines = PRODUCTS.map(product =>
      `• ${productName(product)} — ${formatPrice(product.price)}`
    );

    return `Актуальные цены, указанные в каталоге TAVRION AI:\n\n${lines.join("\n")}\n\nПодробности можно уточнить у поддержки.`;
  }

  function getBotReply(rawMessage) {
    const message = rawMessage.toLowerCase().trim();

    if (
      message.includes("цен") ||
      message.includes("прайс") ||
      message.includes("сколько стоит") ||
      message.includes("стоимость")
    ) {
      return getPriceList();
    }

    if (
      message.includes("go") ||
      message.includes("plus") ||
      message.includes("pro") ||
      message.includes("чатгпт") ||
      message.includes("chatgpt")
    ) {
      return "В каталоге представлены ChatGPT Go, Plus и Pro. Посмотреть цены можно в разделе предложений. Чтобы уточнить условия, напишите в поддержку.";
    }

    if (
      message.includes("telegram") ||
      message.includes("телеграм") ||
      message.includes("премиум")
    ) {
      const telegramProduct = PRODUCTS.find(product =>
        `${productName(product)} ${product.category || ""}`
          .toLowerCase()
          .includes("telegram")
      );

      if (telegramProduct) {
        return `Telegram Premium указан в каталоге по цене ${formatPrice(telegramProduct.price)}. Подробности можно уточнить у поддержки.`;
      }

      return "Информация о Telegram Premium есть в каталоге предложений. Если нужна помощь, напишите в поддержку.";
    }

    if (
      message.includes("поддерж") ||
      message.includes("оператор") ||
      message.includes("человек") ||
      message.includes("связаться") ||
      message.includes("контакт")
    ) {
      return `Связаться с поддержкой можно здесь:\n\nTelegram: ${CONFIG.telegram}\nWhatsApp: https://wa.me/${String(CONFIG.whatsapp).replace(/\D/g, "")}`;
    }

    if (
      message.includes("здрав") ||
      message.includes("привет") ||
      message.includes("добрый")
    ) {
      return "Здравствуйте! Добро пожаловать в TAVRION AI. Я автоматический помощник. Могу подсказать информацию о каталоге, ценах и способах связи.";
    }

    if (
      message.includes("как") &&
      (message.includes("заказ") || message.includes("купить"))
    ) {
      return "Чтобы узнать подробности, откройте нужное предложение в каталоге и нажмите «Уточнить предложение». Сообщение откроется в WhatsApp.";
    }

    return "Спасибо за сообщение! Я пока могу отвечать на основные вопросы о каталоге, ценах и контактах. Если вопрос индивидуальный, напишите в поддержку через Telegram или WhatsApp.";
  }

  function sendChatMessage(message) {
    const cleanMessage = String(message || "").trim();

    if (!cleanMessage) return;

    addChatMessage(cleanMessage, "user");

    window.setTimeout(() => {
      addChatMessage(getBotReply(cleanMessage), "bot");
    }, 350);
  }

  if (chatForm && chatInput) {
    chatForm.addEventListener("submit", event => {
      event.preventDefault();

      const message = chatInput.value;
      if (!message.trim()) return;

      chatInput.value = "";
      sendChatMessage(message);
    });
  }

  // Быстрые вопросы из блока поддержки в index.html
  document.addEventListener("click", event => {
    const quickButton = event.target.closest("[data-quick-question]");

    if (!quickButton) return;

    const question = quickButton.dataset.quickQuestion;

    if (question) {
      sendChatMessage(question);
    }
  });

  /* =========================================
     CONTACT LINKS
     ========================================= */

  $$("[data-contact]").forEach(link => {
    const type = link.dataset.contact;

    if (type === "whatsapp") {
      link.href = `https://wa.me/${String(CONFIG.whatsapp).replace(/\D/g, "")}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    if (type === "telegram") {
      link.href = CONFIG.telegram;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
  });

  /* =========================================
     INITIALIZATION
     ========================================= */

  renderProducts();
  updateFavoriteCount();

  console.log("TAVRION AI initialized successfully.");
})();
