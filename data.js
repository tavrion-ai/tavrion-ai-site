
"use strict";

window.TAVRION_DATA = {
  brand: {
    name: "TAVRION AI",
    tagline: "THE FUTURE IS INTELLIGENT",
    description: "Цифровые возможности нового поколения"
  },

  contacts: {
    whatsapp: "79770070610",
    telegram: "https://t.me/magomed_0077"
  },

  currency: "₽",

  products: [
    {
      id: "chatgpt-go",
      name: "ChatGPT Go",
      category: "ai",
      price: 1000,
      description: "Доступный тариф для повседневных задач",
      features: [
        "Работа с искусственным интеллектом",
        "Помощь в обучении",
        "Повседневные задачи"
      ],
      label: "GO",
      featured: false
    },
    {
      id: "chatgpt-plus",
      name: "ChatGPT Plus",
      category: "ai",
      price: 3000,
      description: "Расширенные возможности ChatGPT",
      features: [
        "Расширенные инструменты",
        "Работа с файлами",
        "Творческие задачи"
      ],
      label: "PLUS",
      featured: true
    },
    {
      id: "telegram-premium",
      name: "Telegram Premium",
      category: "telegram",
      price: 1000,
      description: "Дополнительные возможности Telegram",
      features: [
        "Дополнительные функции",
        "Расширенные настройки",
        "Premium-возможности"
      ],
      label: "PREMIUM",
      featured: false
    }
  ],

  categories: [
    { id: "all", name: "Все продукты" },
    { id: "ai", name: "AI-подписки" },
    { id: "telegram", name: "Telegram" }
  ],

  support: {
    title: "Центр поддержки",
    subtitle: "Помощь по вопросам TAVRION AI",
    automated: true,
    questions: [
      "Какие есть тарифы?",
      "Сколько стоят подписки?",
      "Как связаться с поддержкой?",
      "Как уточнить условия оформления?"
    ]
  },

  legal: {
    independentProject: true,
    notice: "TAVRION AI — независимый проект, не являющийся официальным представителем OpenAI или Telegram. Названия продуктов принадлежат их правообладателям. Актуальные условия и доступность необходимо проверять на официальных ресурсах."
  }
};
