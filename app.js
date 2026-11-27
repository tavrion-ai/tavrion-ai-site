
(() => {
  "use strict";

  const CONFIG = {
    brand: "TAVRION AI",
    whatsapp: "79770070610",
    telegram: "https://t.me/magomed_0077"
  };

  const PRODUCTS = [
    {
      id: "chatgpt-go",
      name: "ChatGPT Go",
      category: "ai",
      price: 1000,
      description: "Доступный тариф для повседневных задач",
      features: ["Работа с ИИ", "Помощь в обучении", "Повседневные задачи"],
      label: "GO"
    },
    {
      id: "chatgpt-plus",
      name: "ChatGPT Plus",
      category: "ai",
      price: 3000,
      description: "Расширенные возможности ChatGPT",
      features: ["Расширенные инструменты", "Работа с файлами", "Творческие задачи"],
      label: "PLUS"
    },
    {
      id: "telegram-premium",
      name: "Telegram Premium",
      category: "telegram",
      price: 1000,
      description: "Дополнительные возможности Telegram",
      features: ["Дополнительные функции", "Расширенные настройки", "Premium-возможности"],
      label: "PREMIUM"
    }
  ];

  const state = {
    category: "all",
    search: "",
    sort: "default",
    favorites: new Set(),
    chatOpen: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const money = value =>
    new Intl.NumberFormat("ru-RU").format(value) + " ₽";

  const escapeHTML = value =>
    String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);

  function notify(message) {
    let toast = $("#tavrion-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "tavrion-toast";
      toast.setAttribute("role", "status");
      toast.style.cssText = [
        "position:fixed",
        "bottom:24px",
        "left:50%",
        "transform:translateX(-50%)",
        "z-index:99999",
        "padding:14px 22px",
        "border:1px solid rgba(190,160,255,.35)",
        "border-radius:14px",
        "background:#171321",
        "color:#fff",
        "font:500 14px Arial,sans-serif",
        "box-shadow:0 12px 40px #0008",
        "max-width:90%",
        "text-align:center"
      ].join(";");
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.hidden = false;

    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => {
      toast.hidden = true;
    }, 2600);
  }

  function orderLink(product) {
    const message = `Здравствуйте! Интересует ${product.name}. Указанная на сайте цена: ${money(product.price)}. Подскажите, пожалуйста, условия и официальный способ оформления.`;

    return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
  }

  function getVisibleProducts() {
    let items = PRODUCTS.filter(product => {
      const categoryMatch =
        state.category === "all" ||
        product.category === state.category;

      const searchText =
        `${product.name} ${product.description} ${product.features.join(" ")}`
          .toLowerCase();

      const searchMatch =
        searchText.includes(state.search.toLowerCase());

      return categoryMatch && searchMatch;
    });

    if (state.sort === "price-up") {
      items.sort((a, b) => a.price - b.price);
    }

    if (state.sort === "price-down") {
      items.sort((a, b) => b.price - a.price);
    }

    if (state.sort === "name") {
      items.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    }

    if (state.sort === "favorites") {
      items = items.filter(item => state.favorites.has(item.id));
    }

    return items;
  }

  function productCard(product) {
    const favorite = state.favorites.has(product.id);

    return `
      <article class="product-card" data-product="${escapeHTML(product.id)}">
        <div class="product-card__top">
          <span class="product-card__label">${escapeHTML(product.label)}</span>
          <button
            class="favorite-button ${favorite ? "is-active" : ""}"
            type="button"
            data-favorite="${escapeHTML(product.id)}"
            aria-label="${favorite ? "Убрать из избранного" : "Добавить в избранное"}"
            aria-pressed="${favorite}"
          >${favorite ? "♥" : "♡"}</button>
        </div>

        <div class="product-card__icon" aria-hidden="true">
          ${product.category === "telegram" ? "✦" : "◈"}
        </div>

        <h3 class="product-card__title">${escapeHTML(product.name)}</h3>
        <p class="product-card__description">${escapeHTML(product.description)}</p>

        <ul class="product-card__features">
          ${product.features.map(feature =>
            `<li>${escapeHTML(feature)}</li>`
          ).join("")}
        </ul>

        <div class="product-card__bottom">
          <strong class="product-card__price">${money(product.price)}</strong>
          <a
            class="product-card__button"
            href="${orderLink(product)}"
            target="_blank"
            rel="noopener noreferrer"
          >Уточнить условия</a>
        </div>
      </article>
    `;
  }

  function renderCatalog() {
    const container =
      $("#products-grid") ||
      $("#product-grid") ||
      $("[data-products]");

    if (!container) return;

    const products = getVisibleProducts();

    container.innerHTML = products.length
      ? products.map(productCard).join("")
      : `<div class="empty-state">Ничего не найдено. Попробуйте изменить запрос.</div>`;

    const count = $("#products-count");
    if (count) count.textContent = String(products.length);

    const favoritesCount = $("#favorites-count");
    if (favoritesCount) {
      favoritesCount.textContent = String(state.favorites.size);
    }
  }

  function setCategory(category) {
    state.category = category;

    $$("[data-category]").forEach(button => {
      const active = button.dataset.category === category;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    renderCatalog();
  }

  function answerQuestion(question) {
    const text = question.toLowerCase();

    if (text.includes("цен") || text.includes("стоим")) {
      return "На сайте указаны цены: ChatGPT Go — 1 000 ₽, ChatGPT Plus — 3 000 ₽, Telegram Premium — 1 000 ₽. Перед оформлением уточните актуальные условия.";
    }

    if (text.includes("телеграм")) {
      return "Связаться с нами можно через Telegram: @magomed_0077. Напишите, какой продукт вас интересует.";
    }

    if (text.includes("ватсап") || text.includes("whatsapp")) {
      return "Для связи через WhatsApp используйте кнопку контакта на сайте.";
    }

    if (text.includes("поддерж") || text.includes("оператор")) {
      return "Для индивидуального вопроса напишите нам в Telegram или WhatsApp. Это автоматический помощник, он не подключён к оператору.";
    }

    if (text.includes("оплат") || text.includes("куп")) {
      return "Сначала уточните наличие, актуальную цену и условия оформления у поддержки. Не отправляйте пароли или коды подтверждения.";
    }

    if (text.includes("openai") || text.includes("официаль")) {
      return "TAVRION AI — независимый проект, не являющийся официальным представителем OpenAI или Telegram. Проверяйте доступность и условия подписок на официальных ресурсах.";
    }

    return "Пока я могу подсказать по ценам, контактам и условиям. Для другого вопроса напишите в нашу поддержку.";
  }

  function addChatMessage(message, type = "bot") {
    const messages = $("#chat-messages") || $("#support-messages");
    if (!messages) return;

    const bubble = document.createElement("div");
    bubble.className = `chat-message chat-message--${type}`;
    bubble.textContent = message;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  function openChat() {
    const panel = $("#support-chat") || $("#chat-panel");
    if (!panel) {
      notify("Раздел поддержки пока не найден на странице.");
      return;
    }

    state.chatOpen = !state.chatOpen;
    panel.hidden = !state.chatOpen;
    panel.classList.toggle("is-open", state.chatOpen);

    const button = $("#support-toggle") || $("#chat-toggle");
    if (button) {
      button.setAttribute("aria-expanded", String(state.chatOpen));
    }
  }

  function bindEvents() {
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
        } else {
          state.favorites.add(id);
        }

        renderCatalog();
        return;
      }

      const chatButton = event.target.closest(
        "#support-toggle, #chat-toggle, [data-open-chat]"
      );

      if (chatButton) {
        openChat();
        return;
      }

      const telegramButton = event.target.closest("[data-telegram]");
      if (telegramButton) {
        window.open(CONFIG.telegram, "_blank", "noopener,noreferrer");
      }
    });

    const search = $("#product-search") ||
      $("#search-input") ||
      $("[data-search]");

    if (search) {
      search.addEventListener("input", event => {
        state.search = event.target.value.trim();
        renderCatalog();
      });
    }

    const sort = $("#product-sort") ||
      $("#sort-select") ||
      $("[data-sort]");

    if (sort) {
      sort.addEventListener("change", event => {
        state.sort = event.target.value;
        renderCatalog();
      });
    }

    const chatForm = $("#chat-form") ||
      $("#support-form");

    if (chatForm) {
      chatForm.addEventListener("submit", event => {
        event.preventDefault();

        const input = $("#chat-input") ||
          $("#support-input") ||
          $("input", chatForm);

        if (!input || !input.value.trim()) return;

        const question = input.value.trim();
        addChatMessage(question, "user");
        input.value = "";

        window.setTimeout(() => {
          addChatMessage(answerQuestion(question), "bot");
        }, 250);
      });
    }

    $$("[data-contact-whatsapp]").forEach(button => {
      button.addEventListener("click", () => {
        const message = encodeURIComponent(
          "Здравствуйте! Хочу узнать подробнее о TAVRION AI."
        );

        window.open(
          `https://wa.me/${CONFIG.whatsapp}?text=${message}`,
          "_blank",
          "noopener,noreferrer"
        );
      });
    });
  }

  function init() {
    bindEvents();
    renderCatalog();

    const year = $("#current-year");
    if (year) year.textContent = String(new Date().getFullYear());

    document.documentElement.classList.add("tavrion-ready");
    console.info("TAVRION AI initialized.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
