const express = require("express");
const {
  Bot,
  registerExpressWebhook,
  InlineKeyboardBuilder,
} = require("node-telegram-bot-api");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = Number(process.env.ADMIN_CHAT_ID || "1215947826");
const PORT = Number(process.env.PORT || 3000);

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN не заданий у змінних середовища.");
}

const bot = new Bot(BOT_TOKEN);
const app = express();

const SITE_URL = "https://xxamihsite.vercel.app/";

const orderStates = new Map();
const pendingOrders = new Map();

let nextOrderId = 1;

const statistics = {
  total: 0,
  sent: 0,
  working: 0,
  completed: 0,
  rejected: 0,
};

function menuKeyboard() {
  return new InlineKeyboardBuilder()
    .text("💻 Сайти", "menu:sites")
    .text("🤖 Telegram-боти", "menu:bots")
    .row()
    .text("📝 Замовити", "menu:order")
    .text("⭐ Переваги", "menu:advantages")
    .row()
    .text("🛠 Як працюємо", "menu:process")
    .text("☁️ Хостинг", "menu:hosting")
    .row()
    .text("📂 Портфоліо", "menu:portfolio")
    .text("ℹ️ Про нас", "menu:about")
    .build();
}

function backMenu() {
  return new InlineKeyboardBuilder()
    .text("🔙 Назад", "menu:home")
    .build();
}

function orderKeyboard() {
  return new InlineKeyboardBuilder()
    .text("✅ Почати", "order:start")
    .row()
    .text("🔙 Назад", "menu:home")
    .build();
}

function cancelKeyboard() {
  return new InlineKeyboardBuilder()
    .text("❌ Скасувати", "order:cancel")
    .build();
}

function serviceKeyboard() {
  return new InlineKeyboardBuilder()
    .text("💻 Сайт", "service:site")
    .text("🤖 Telegram-бот", "service:bot")
    .row()
    .text("⚙️ Інше", "service:other")
    .row()
    .text("❌ Скасувати", "order:cancel")
    .build();
}

function confirmKeyboard() {
  return new InlineKeyboardBuilder()
    .text("✅ Відправити", "order:confirm")
    .row()
    .text("✏️ Змінити", "order:edit")
    .text("❌ Скасувати", "order:cancel")
    .build();
}

function adminNewOrderKeyboard(orderId) {
  return new InlineKeyboardBuilder()
    .text("✅ Взяти в роботу", `admin:take:${orderId}`)
    .text("❌ Відхилити", `admin:reject:${orderId}`)
    .build();
}

function adminWorkingKeyboard(orderId) {
  return new InlineKeyboardBuilder()
    .text("✅ Завершити", `admin:complete:${orderId}`)
    .build();
}

function adminMenuKeyboard() {
  return new InlineKeyboardBuilder()
    .text("📋 Заявки", "admin:orders")
    .text("📊 Статистика", "admin:stats")
    .row()
    .text("⚙️ Налаштування", "admin:settings")
    .text("🏠 Головне меню", "menu:home")
    .build();
}

function textMatches(text, phrases) {
  const normalized = text.trim().toLowerCase();

  return phrases.some((phrase) => normalized.includes(phrase));
}

function homeText() {
  return `✨ XXAMIh

Цифрові рішення для сучасного бізнесу.

Ми допомагаємо створювати:

💻 Сучасні сайти
🤖 Telegram-боти
⚙️ Автоматизацію
☁️ Розміщення та хостинг

Є ідея або готове завдання?
Розкажіть нам — допоможемо перетворити її
на готовий цифровий продукт.

Оберіть потрібний розділ 👇`;
}

function sitesText() {
  return `💻 СТВОРЕННЯ САЙТІВ

Ваш сайт — це перше враження про бізнес.

🌐 Сайт-візитка
Підходить для компаній, експертів, майстрів та послуг.
Покажемо хто ви, чим займаєтесь та як з вами зв'язатися.

🛒 Інтернет-магазин
Каталог товарів, картки товарів та прийом замовлень.

🎯 Landing Page
Односторінковий сайт для конкретної послуги,
продукту або рекламної кампанії.

📱 Адаптивність
Сайт коректно відображається на смартфонах,
планшетах та комп'ютерах.

🎨 Дизайн
Створюємо сучасний та зрозумілий інтерфейс,
який відповідає стилю вашого бізнесу.

⚡ Швидкість
Оптимізуємо сторінки для комфортної роботи користувача.

Хочете свій сайт?
Натисніть «📝 Замовити» та залиште заявку.`;
}

function botsText() {
  return `🤖 TELEGRAM-БОТИ

Автоматизуйте спілкування з клієнтами
та частину рутинної роботи.

💬 Спілкування
Бот може відповідати на типові запитання
та допомагати користувачу знайти потрібну інформацію.

📋 Послуги та ціни
Показуємо ваші послуги, товари та актуальну інформацію.

📝 Заявки
Клієнт може залишити заявку прямо в Telegram.

🔔 Повідомлення
Автоматичні повідомлення про заявки,
замовлення та інші події.

⚙️ Автоматизація
Зменшуємо кількість ручної роботи
та спрощуємо взаємодію з клієнтами.

☁️ Розміщення
За потреби допоможемо встановити та запустити
бота на сервері.

🚀 Бот працює цілодобово без необхідності
постійно тримати ваш комп'ютер увімкненим.

Потрібен Telegram-бот?
Оформіть заявку через «📝 Замовити».`;
}

function advantagesText() {
  return `⭐ ЧОМУ XXAMIh?

🚀 Сучасні технології
Використовуємо сучасні підходи до створення
сайтів та Telegram-ботів.

🎯 Під конкретний бізнес
Не намагаємося зробити однаковий продукт
для всіх — враховуємо ваше завдання.

📱 Зручність
Проєкти мають бути зрозумілими
та зручними для кінцевого користувача.

🤝 На зв'язку
Обговорюємо ідею, уточнюємо деталі
та погоджуємо результат.

⚡ Швидкий запуск
Після завершення розробки можемо допомогти
із запуском та розміщенням проєкту.

💡 Від ідеї до готового продукту
Ви можете замовити розробку,
налаштування та розміщення в одному місці.`;
}

function processText() {
  return `🛠 ЯК МИ ПРАЦЮЄМО

1️⃣ ЗНАЙОМСТВО
Ви розповідаєте про свій бізнес
та те, що потрібно створити.

2️⃣ ОБГОВОРЕННЯ
Уточнюємо функції, дизайн,
структуру та інші деталі.

3️⃣ РОЗРОБКА
Створюємо сайт, Telegram-бота
або необхідну автоматизацію.

4️⃣ ТЕСТУВАННЯ
Перевіряємо роботу проєкту
та виправляємо знайдені помилки.

5️⃣ ЗАПУСК
Розміщуємо готовий продукт
та налаштовуємо все необхідне.

6️⃣ РЕЗУЛЬТАТ
Ви отримуєте готове цифрове рішення,
яке можна використовувати в роботі.

✨ Просто. Зрозуміло. Поетапно.`;
}

function hostingText() {
  return `☁️ ХОСТИНГ ТА РОЗМІЩЕННЯ

Можемо не тільки створити ваш сайт або бота,
а й допомогти розмістити його на сервері.

🆓 FREE
$0 / місяць
• 0.1 CPU
• 512 MB RAM

Підходить для тестових та невеликих проєктів.

⚡ 0.5c-512mb
$7 / місяць
• 0.5 CPU
• 512 MB RAM

🔥 1c-2g
$25 / місяць
• 1 CPU
• 2 GB RAM

🚀 2c-4g
$85 / місяць
• 2 CPU
• 4 GB RAM

🛠 Налаштування
Допоможемо розгорнути проєкт,
підключити домен та налаштувати запуск.

💡 Не знаєте, який варіант потрібен?
Розкажіть про свій проєкт — допоможемо підібрати
відповідний ресурс.`;
}

function portfolioText() {
  return `📂 ПОРТФОЛІО

Хочете побачити, що ми створюємо?

На нашому сайті можна переглянути
проєкти, дизайн та приклади робіт.

🌐 Сайт:
${SITE_URL}

💡 Маєте власну ідею?
Навіть якщо вашого проєкту ще немає
в портфоліо — можемо створити його з нуля.`;
}

function aboutText() {
  return `ℹ️ ПРО XXAMIh

Ми створюємо цифрові рішення,
які допомагають бізнесу працювати сучасніше.

💻 Сайти
Створення та запуск сайтів
під різні завдання.

🤖 Telegram-боти
Боти для спілкування з клієнтами,
прийому заявок та автоматизації.

⚙️ Автоматизація
Допомагаємо скоротити ручну роботу
та спростити повторювані процеси.

☁️ Хостинг
Можемо допомогти із розміщенням
готового проєкту на сервері.

🚀 Наша задача —
перетворити вашу ідею на готовий цифровий продукт.`;
}

function contactsText() {
  return `📞 КОНТАКТИ

Зв'язатися з нами можна напряму:

💬 Telegram: @Tuzkozirn1
💬 Telegram: @xxamih

🌐 Сайт:
${SITE_URL}

Напишіть нам, коротко опишіть ваше завдання
— і ми обговоримо наступні кроки.`;
}

function orderIntroText() {
  return `📝 НОВЕ ЗАМОВЛЕННЯ

Розкажіть нам трохи про ваш проєкт,
і ми зможемо краще зрозуміти ваше завдання.

Форма займає лише кілька хвилин.

1️⃣ Ваше ім'я
2️⃣ Контакт для зв'язку
3️⃣ Що саме потрібно
4️⃣ Короткий опис завдання

📩 Після заповнення ви побачите
готову заявку перед відправкою.

Натискайте «✅ Почати» та починаємо 👇`;
}

function nameStepText() {
  return `👤 КРОК 1 З 4

Як вас звати?

Напишіть своє ім'я нижче 👇`;
}

function contactStepText() {
  return `📱 КРОК 2 З 4

Залиште контакт для зв'язку.

Це може бути:
• номер телефону
• Telegram username
• інший зручний спосіб зв'язку

Напишіть контакт нижче 👇`;
}

function serviceStepText() {
  return `🛠 КРОК 3 З 4

Що саме вам потрібно?

Оберіть один із варіантів нижче 👇`;
}

function descriptionStepText() {
  return `📝 КРОК 4 З 4

Коротко опишіть ваше завдання.

Наприклад:
«Потрібен сайт для компанії з інформацією про послуги та контактами».

Напишіть опис нижче 👇`;
}

function confirmationText(state) {
  return `✅ ПЕРЕВІРКА ЗАМОВЛЕННЯ

👤 Ім'я: ${state.name}
📱 Контакт: ${state.contact}
🛠 Послуга: ${state.service}
📝 Опис:
${state.description}

Все правильно?
Натисніть кнопку нижче.`;
}

function formatOrderForAdmin(order) {
  return `🆕 НОВА ЗАЯВКА #${order.orderId}

📌 Статус: НОВА

👤 Ім'я: ${order.name}
🔹 Username: ${order.username}
📱 Контакт: ${order.contact}
🛠 Послуга: ${order.service}

📝 Опис:
${order.description}`;
}

function formatWorkingOrder(order) {
  return `🛠 ЗАЯВКА #${order.orderId}

📌 Статус: В РОБОТІ

👤 Клієнт: ${order.name}
🔹 Username: ${order.username}
📱 Контакт: ${order.contact}
🛠 Послуга: ${order.service}

📝 Опис:
${order.description}`;
}

function formatCompletedOrder(order) {
  return `✅ ЗАЯВКА #${order.orderId}

📌 Статус: ЗАВЕРШЕНО

👤 Клієнт: ${order.name}
🔹 Username: ${order.username}
📱 Контакт: ${order.contact}
🛠 Послуга: ${order.service}

📝 Опис:
${order.description}`;
}

function formatRejectedOrder(order) {
  return `❌ ЗАЯВКА #${order.orderId}

📌 Статус: ВІДХИЛЕНО

👤 Клієнт: ${order.name}
🔹 Username: ${order.username}
📱 Контакт: ${order.contact}
🛠 Послуга: ${order.service}

📝 Опис:
${order.description}`;
}

async function editCurrentMessage(ctx, text, replyMarkup) {
  const message = ctx.callbackQuery?.message;

  if (!message) {
    return;
  }

  await bot.api.editMessageText({
    chat_id: message.chat.id,
    message_id: message.message_id,
    text,
    reply_markup: replyMarkup,
  });
}

async function editOrderMessage(userId, messageId, text, replyMarkup) {
  await bot.api.editMessageText({
    chat_id: userId,
    message_id: messageId,
    text,
    reply_markup: replyMarkup,
  });
}

async function sendHome(ctx) {
  await ctx.reply(homeText(), {
    reply_markup: menuKeyboard(),
  });
}

async function startOrderFromCallback(ctx) {
  const userId = ctx.from.id;
  const message = ctx.callbackQuery?.message;

  if (!message) {
    return;
  }

  orderStates.set(userId, {
    step: "name",
    messageId: message.message_id,
    name: "",
    username: ctx.from?.username
      ? `@${ctx.from.username}`
      : "не вказано",
    contact: "",
    service: "",
    description: "",
  });

  await editCurrentMessage(
    ctx,
    nameStepText(),
    cancelKeyboard(),
  );
}

async function startOrderFromText(ctx) {
  const userId = ctx.from.id;

  const message = await ctx.reply(nameStepText(), {
    reply_markup: cancelKeyboard(),
  });

  orderStates.set(userId, {
    step: "name",
    messageId: message.message_id,
    name: "",
    username: ctx.from?.username
      ? `@${ctx.from.username}`
      : "не вказано",
    contact: "",
    service: "",
    description: "",
  });
}

async function cancelOrder(ctx, userId) {
  orderStates.delete(userId);

  if (ctx.callbackQuery?.message) {
    await editCurrentMessage(
      ctx,
      homeText(),
      menuKeyboard(),
    );
  } else {
    await ctx.reply(homeText(), {
      reply_markup: menuKeyboard(),
    });
  }
}

async function showAdminPanel(ctx) {
  await ctx.reply(
    `🔐 АДМІН-ПАНЕЛЬ

Оберіть потрібний розділ 👇`,
    {
      reply_markup: adminMenuKeyboard(),
    },
  );
}

bot.command("start", async (ctx) => {
  orderStates.delete(ctx.from.id);

  await sendHome(ctx);
});

bot.command("admin", async (ctx) => {
  if (ctx.from.id !== ADMIN_CHAT_ID) {
    return;
  }

  await showAdminPanel(ctx);
});

bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery?.data || "";
  const userId = ctx.from.id;

  await ctx.answerCallbackQuery();

  if (data === "menu:home") {
    orderStates.delete(userId);

    await editCurrentMessage(
      ctx,
      homeText(),
      menuKeyboard(),
    );

    return;
  }

  if (data === "menu:sites") {
    await editCurrentMessage(
      ctx,
      sitesText(),
      backMenu(),
    );

    return;
  }

  if (data === "menu:bots") {
    await editCurrentMessage(
      ctx,
      botsText(),
      backMenu(),
    );

    return;
  }

  if (data === "menu:advantages") {
    await editCurrentMessage(
      ctx,
      advantagesText(),
      backMenu(),
    );

    return;
  }

  if (data === "menu:process") {
    await editCurrentMessage(
      ctx,
      processText(),
      backMenu(),
    );

    return;
  }

  if (data === "menu:hosting") {
    await editCurrentMessage(
      ctx,
      hostingText(),
      backMenu(),
    );

    return;
  }

  if (data === "menu:portfolio") {
    const keyboard = new InlineKeyboardBuilder()
      .url("🌐 Відкрити сайт", SITE_URL)
      .row()
      .text("🔙 Назад", "menu:home")
      .build();

    await editCurrentMessage(
      ctx,
      portfolioText(),
      keyboard,
    );

    return;
  }

  if (data === "menu:about") {
    await editCurrentMessage(
      ctx,
      aboutText(),
      backMenu(),
    );

    return;
  }

  if (data === "menu:order") {
    await editCurrentMessage(
      ctx,
      orderIntroText(),
      orderKeyboard(),
    );

    return;
  }

  if (data === "order:start") {
    await startOrderFromCallback(ctx);
    return;
  }

  if (data === "order:cancel") {
    await cancelOrder(ctx, userId);
    return;
  }

  if (data === "order:edit") {
    const state = orderStates.get(userId);

    if (!state) {
      await editCurrentMessage(
        ctx,
        orderIntroText(),
        orderKeyboard(),
      );

      return;
    }

    state.step = "name";

    await editOrderMessage(
      userId,
      state.messageId,
      nameStepText(),
      cancelKeyboard(),
    );

    return;
  }

  if (data.startsWith("service:")) {
    const state = orderStates.get(userId);

    if (!state) {
      await editCurrentMessage(
        ctx,
        orderIntroText(),
        orderKeyboard(),
      );

      return;
    }

    const serviceMap = {
      "service:site": "💻 Сайт",
      "service:bot": "🤖 Telegram-бот",
      "service:other": "⚙️ Інше",
    };

    state.service = serviceMap[data] || "⚙️ Інше";
    state.step = "description";

    await editOrderMessage(
      userId,
      state.messageId,
      descriptionStepText(),
      cancelKeyboard(),
    );

    return;
  }

  if (data === "order:confirm") {
    const state = orderStates.get(userId);

    if (!state) {
      await editCurrentMessage(
        ctx,
        orderIntroText(),
        orderKeyboard(),
      );

      return;
    }

    const order = {
      orderId: nextOrderId++,
      userId,
      clientMessageId: state.messageId,
      name: state.name,
      username: state.username,
      contact: state.contact,
      service: state.service,
      description: state.description,
      status: "sent",
      adminMessageId: null,
    };

    pendingOrders.set(order.orderId, order);

    statistics.total += 1;
    statistics.sent += 1;

    const adminMessage = await bot.api.sendMessage({
      chat_id: ADMIN_CHAT_ID,
      text: formatOrderForAdmin(order),
      reply_markup: adminNewOrderKeyboard(order.orderId),
    });

    order.adminMessageId = adminMessage.message_id;

    orderStates.delete(userId);

    await editOrderMessage(
      userId,
      order.clientMessageId,
      `✅ ЗАЯВКА ВІДПРАВЛЕНА

Дякуємо, ${order.name}!

Ми отримали вашу заявку та зв'яжемося з вами після її перегляду.`,
      new InlineKeyboardBuilder()
        .text("🏠 Головне меню", "menu:home")
        .build(),
    );

    return;
  }

  if (data === "admin:orders") {
    if (userId !== ADMIN_CHAT_ID) {
      return;
    }

    const orders = [...pendingOrders.values()];

    if (orders.length === 0) {
      await editCurrentMessage(
        ctx,
        `📋 ЗАЯВКИ

Поки що немає збережених заявок.`,
        adminMenuKeyboard(),
      );

      return;
    }

    const list = orders
      .map(
        (order) =>
          `#${order.orderId} — ${order.name} — ${order.service} — ${order.status}`,
      )
      .join("\n");

    await editCurrentMessage(
      ctx,
      `📋 ЗАЯВКИ

${list}`,
      adminMenuKeyboard(),
    );

    return;
  }

  if (data === "admin:stats") {
    if (userId !== ADMIN_CHAT_ID) {
      return;
    }

    const statsText = `📊 СТАТИСТИКА

📦 Усього заявок: ${statistics.total}
📨 Відправлено: ${statistics.sent}
🛠 В роботі: ${statistics.working}
✅ Завершено: ${statistics.completed}
❌ Відхилено: ${statistics.rejected}`;

    await editCurrentMessage(
      ctx,
      statsText,
      adminMenuKeyboard(),
    );

    return;
  }

  if (data === "admin:settings") {
    if (userId !== ADMIN_CHAT_ID) {
      return;
    }

    await editCurrentMessage(
      ctx,
      `⚙️ НАЛАШТУВАННЯ

👤 Admin ID: ${ADMIN_CHAT_ID}
🌐 Сайт: ${SITE_URL}
🤖 Бот працює через webhook.

Тут можна буде додати додаткові налаштування пізніше.`,
      adminMenuKeyboard(),
    );

    return;
  }

  if (data.startsWith("admin:take:")) {
    if (userId !== ADMIN_CHAT_ID) {
      return;
    }

    const orderId = Number(data.split(":")[2]);
    const order = pendingOrders.get(orderId);

    if (!order) {
      await editCurrentMessage(
        ctx,
        "❌ Заявку не знайдено.",
        adminMenuKeyboard(),
      );

      return;
    }

    if (order.status !== "sent") {
      return;
    }

    order.status = "working";
    statistics.working += 1;

    await bot.api.editMessageText({
      chat_id: ADMIN_CHAT_ID,
      message_id: order.adminMessageId,
      text: formatWorkingOrder(order),
      reply_markup: adminWorkingKeyboard(order.orderId),
    });

    await editOrderMessage(
      order.userId,
      order.clientMessageId,
      `🛠 ЗАЯВКА В РОБОТІ

Дякуємо, ${order.name}!

Ми взяли вашу заявку в роботу та вже працюємо над нею.`,
      new InlineKeyboardBuilder()
        .text("🏠 Головне меню", "menu:home")
        .build(),
    );

    return;
  }

  if (data.startsWith("admin:reject:")) {
    if (userId !== ADMIN_CHAT_ID) {
      return;
    }

    const orderId = Number(data.split(":")[2]);
    const order = pendingOrders.get(orderId);

    if (!order) {
      await editCurrentMessage(
        ctx,
        "❌ Заявку не знайдено.",
        adminMenuKeyboard(),
      );

      return;
    }

    if (order.status !== "sent") {
      return;
    }

    order.status = "rejected";
    statistics.rejected += 1;

    await bot.api.editMessageText({
      chat_id: ADMIN_CHAT_ID,
      message_id: order.adminMessageId,
      text: formatRejectedOrder(order),
    });

    await editOrderMessage(
      order.userId,
      order.clientMessageId,
      `❌ ЗАЯВКУ ВІДХИЛЕНО

На жаль, зараз ми не можемо взяти цю заявку в роботу.

Дякуємо за звернення.`,
      new InlineKeyboardBuilder()
        .text("🏠 Головне меню", "menu:home")
        .build(),
    );

    return;
  }

  if (data.startsWith("admin:complete:")) {
    if (userId !== ADMIN_CHAT_ID) {
      return;
    }

    const orderId = Number(data.split(":")[2]);
    const order = pendingOrders.get(orderId);

    if (!order) {
      await editCurrentMessage(
        ctx,
        "❌ Заявку не знайдено.",
        adminMenuKeyboard(),
      );

      return;
    }

    if (order.status !== "working") {
      return;
    }

    order.status = "completed";
    statistics.completed += 1;

    await bot.api.editMessageText({
      chat_id: ADMIN_CHAT_ID,
      message_id: order.adminMessageId,
      text: formatCompletedOrder(order),
    });

    await editOrderMessage(
      order.userId,
      order.clientMessageId,
      `✅ ЗАЯВКУ ЗАВЕРШЕНО

Дякуємо, ${order.name}!

Роботу над вашою заявкою завершено.`,
      new InlineKeyboardBuilder()
        .text("🏠 Головне меню", "menu:home")
        .build(),
    );

    return;
  }
});

bot.on("message", async (ctx) => {
  const text = ctx.message?.text;

  if (!text || text.startsWith("/")) {
    return;
  }

  const userId = ctx.from.id;
  const state = orderStates.get(userId);

  if (state) {
    if (state.step === "name") {
      state.name = text.trim();
      state.step = "contact";

      await editOrderMessage(
        userId,
        state.messageId,
        contactStepText(),
        cancelKeyboard(),
      );

      return;
    }

    if (state.step === "contact") {
      state.contact = text.trim();
      state.step = "service";

      await editOrderMessage(
        userId,
        state.messageId,
        serviceStepText(),
        serviceKeyboard(),
      );

      return;
    }

    if (state.step === "service") {
      await editOrderMessage(
        userId,
        state.messageId,
        serviceStepText(),
        serviceKeyboard(),
      );

      return;
    }

    if (state.step === "description") {
      state.description = text.trim();
      state.step = "confirm";

      await editOrderMessage(
        userId,
        state.messageId,
        confirmationText(state),
        confirmKeyboard(),
      );

      return;
    }
  }

  if (
    textMatches(text, [
      "привіт",
      "привет",
      "hello",
      "hi",
      "добрий день",
      "доброго дня",
    ])
  ) {
    await sendHome(ctx);
    return;
  }

  if (
    textMatches(text, [
      "замовити",
      "замовлення",
      "хочу замовити",
      "заявка",
      "зробити сайт",
      "зробити бота",
    ])
  ) {
    await startOrderFromText(ctx);
    return;
  }

  if (
    textMatches(text, [
      "сайт",
      "сайти",
      "лендінг",
      "лендинг",
      "магазин",
      "інтернет-магазин",
    ])
  ) {
    await ctx.reply(
      sitesText(),
      {
        reply_markup: backMenu(),
      },
    );

    return;
  }

  if (
    textMatches(text, [
      "бот",
      "боти",
      "telegram бот",
      "телеграм бот",
      "телеграм-бот",
    ])
  ) {
    await ctx.reply(
      botsText(),
      {
        reply_markup: backMenu(),
      },
    );

    return;
  }

  if (
    textMatches(text, [
      "хостинг",
      "сервер",
      "розміщення",
      "hosting",
    ])
  ) {
    await ctx.reply(
      hostingText(),
      {
        reply_markup: backMenu(),
      },
    );

    return;
  }

  if (
    textMatches(text, [
      "контакт",
      "контакти",
      "зв'язатися",
      "звʼязатися",
      "написати вам",
    ])
  ) {
    await ctx.reply(
      contactsText(),
      {
        reply_markup: backMenu(),
      },
    );

    return;
  }

  if (
    textMatches(text, [
      "про вас",
      "про нас",
      "хто ви",
      "xxamih",
    ])
  ) {
    await ctx.reply(
      aboutText(),
      {
        reply_markup: backMenu(),
      },
    );

    return;
  }

  if (
    textMatches(text, [
      "портфоліо",
      "портфолио",
      "приклади",
      "роботи",
      "ваші роботи",
    ])
  ) {
    const keyboard = new InlineKeyboardBuilder()
      .url("🌐 Відкрити сайт", SITE_URL)
      .row()
      .text("🔙 Назад", "menu:home")
      .build();

    await ctx.reply(
      portfolioText(),
      {
        reply_markup: keyboard,
      },
    );

    return;
  }

  await ctx.reply(
    `🤔 Не зовсім зрозумів запит.

Оберіть потрібний розділ у меню або напишіть:

💻 сайт
🤖 бот
☁️ хостинг
📝 замовити
📞 контакти`,
    {
      reply_markup: menuKeyboard(),
    },
  );
});

registerExpressWebhook(bot, app, {
  path: "/telegram",
});

app.get("/", (req, res) => {
  res.send("XXAMIh bot is running ✅");
});

app.listen(PORT, () => {
  console.log(`Сервер запущений на порту ${PORT}`);
});