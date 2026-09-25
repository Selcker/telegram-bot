const {
    Bot,
    registerExpressWebhook,
    InlineKeyboardBuilder
} = require("node-telegram-bot-api");

const express = require("express");

const token = process.env.BOT_TOKEN;

if (!token) {
    console.error("BOT_TOKEN не найден!");
    process.exit(1);
}

const bot = new Bot(token);
const app = express();

// ========================================
// Настройки
// ========================================

const ADMIN_CHAT_ID = 1215947826;

// ========================================
// Хранилища
// ========================================

const orderStates = new Map();
const pendingOrders = new Map();

const statistics = {
    total: 0,
    sent: 0,
    working: 0,
    completed: 0,
    rejected: 0
};

// ========================================
// Главное меню
// ========================================

function mainMenu() {
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
        .row()
        .text("📞 Контакти", "menu:contacts")
        .row()
        .url("💬 Написати нам", "https://t.me/Tuzkozirn1")
        .url("🌐 Наш сайт", "https://xxamihsite.vercel.app/")
        .build();
}

// ========================================
// Кнопка назад
// ========================================

function backMenu() {
    return new InlineKeyboardBuilder()
        .text("🔙 Назад", "menu:home")
        .build();
}

// ========================================
// Отмена заявки
// ========================================

function cancelOrderMenu() {
    return new InlineKeyboardBuilder()
        .text("❌ Скасувати", "order:cancel")
        .build();
}

// ========================================
// Выбор услуги
// ========================================

function serviceMenu() {
    return new InlineKeyboardBuilder()
        .text("💻 Сайт", "service:site")
        .text("🤖 Telegram-бот", "service:bot")
        .row()
        .text("⚙️ Автоматизація", "service:auto")
        .text("📦 Інше", "service:other")
        .row()
        .text("❌ Скасувати", "order:cancel")
        .build();
}

// ========================================
// Подтверждение заявки
// ========================================

function confirmOrderMenu() {
    return new InlineKeyboardBuilder()
        .text("✅ Відправити", "order:confirm")
        .text("✏️ Змінити", "order:edit")
        .row()
        .text("❌ Скасувати", "order:cancel")
        .build();
}

// ========================================
// Кнопки администратора
// ========================================

function adminOrderMenu(orderId) {
    return new InlineKeyboardBuilder()
        .text(
            "✅ Взяти в роботу",
            `admin:accept:${orderId}`
        )
        .row()
        .text(
            "❌ Відхилити",
            `admin:reject:${orderId}`
        )
        .build();
}

function adminWorkingMenu(orderId) {
    return new InlineKeyboardBuilder()
        .text(
            "✅ Завершити",
            `admin:complete:${orderId}`
        )
        .build();
}

// ========================================
// Админ-панель
// ========================================

function adminPanelMenu() {
    return new InlineKeyboardBuilder()
        .text("📋 Заявки", "admin:orders")
        .text("📊 Статистика", "admin:stats")
        .row()
        .text("⚙️ Налаштування", "admin:settings")
        .row()
        .text("🏠 Головне меню", "admin:home")
        .build();
}

function adminOrdersMenu() {
    return new InlineKeyboardBuilder()
        .text("🔄 Оновити", "admin:orders")
        .row()
        .text("🔙 Назад", "admin:home")
        .build();
}

// ========================================
// Статусы
// ========================================

function getStatusText(status) {
    if (status === "sent") {
        return "📨 ВІДПРАВЛЕНА";
    }

    if (status === "working") {
        return "🛠 В РОБОТІ";
    }

    if (status === "completed") {
        return "✅ ЗАВЕРШЕНА";
    }

    if (status === "rejected") {
        return "❌ ВІДХИЛЕНА";
    }

    return "❔ НЕВІДОМИЙ";
}

// ========================================
// Проверка слов
// ========================================

function containsAny(text, words) {
    return words.some((word) => text.includes(word));
}

// ========================================
// Редактирование сообщения
// ========================================

async function editCurrentMessage(ctx, text, replyMarkup) {
    const message = ctx.callbackQuery?.message;

    if (!message) {
        return;
    }

    await bot.api.editMessageText({
        chat_id: message.chat.id,
        message_id: message.message_id,
        text: text,
        reply_markup: replyMarkup
    });
}

// ========================================
// Редактирование сообщения заявки
// ========================================

async function editOrderMessage(
    userId,
    messageId,
    text,
    replyMarkup
) {
    await bot.api.editMessageText({
        chat_id: userId,
        message_id: messageId,
        text: text,
        reply_markup: replyMarkup
    });
}

// ========================================
// Главное сообщение
// ========================================

async function sendHome(ctx) {
    await ctx.reply(
        "✨ XXAMIh\n\n" +
        "Цифрові рішення для сучасного бізнесу.\n\n" +
        "Ми допомагаємо створювати:\n\n" +
        "💻 Сучасні сайти\n" +
        "🤖 Telegram-боти\n" +
        "⚙️ Автоматизацію\n" +
        "☁️ Розміщення та хостинг\n\n" +
        "Є ідея або готове завдання?\n" +
        "Розкажіть нам — допоможемо перетворити її\n" +
        "на готовий цифровий продукт.\n\n" +
        "Оберіть потрібний розділ 👇",
        {
            reply_markup: mainMenu()
        }
    );
}

// ========================================
// Обычные сообщения
// ========================================

bot.on("message", async (ctx) => {
    const text = ctx.message?.text || "";
    const userId = ctx.chat.id;

    console.log("Отримано:", text);

    // ========================================
    // /admin
    // ========================================

    if (text === "/admin") {
        if (userId !== ADMIN_CHAT_ID) {
            await ctx.reply("⛔ Доступ заборонено.");
            return;
        }

        await ctx.reply(
            "🔐 АДМІН-ПАНЕЛЬ\n\n" +
            "Панель керування XXAMIh.\n\n" +
            "Оберіть потрібний розділ 👇",
            {
                reply_markup: adminPanelMenu()
            }
        );

        return;
    }

    // ========================================
    // /start
    // ========================================

    if (text === "/start") {
        orderStates.delete(userId);

        await sendHome(ctx);

        return;
    }

    // ========================================
    // Состояние заказа
    // ========================================

    const state = orderStates.get(userId);

    // ========================================
    // Автоматическое понимание текста
    // ========================================

    if (!state) {
        const normalizedText = text
            .toLowerCase()
            .trim();

        // Приветствие
        if (
            containsAny(normalizedText, [
                "привет",
                "здравствуйте",
                "добрый день",
                "добрый вечер",
                "доброе утро",
                "вітаю",
                "привіт",
                "доброго дня"
            ])
        ) {
            await sendHome(ctx);
            return;
        }

        // Заказ
        if (
            containsAny(normalizedText, [
                "хочу заказать",
                "хочу замовити",
                "заказать",
                "замовити",
                "оформить заказ",
                "оформити замовлення",
                "сделать заказ",
                "зробити замовлення"
            ])
        ) {
            const orderMessage = await ctx.reply(
                "📝 НОВЕ ЗАМОВЛЕННЯ\n\n" +
                "Оформимо заявку всього за 4 кроки.\n\n" +
                "1️⃣ КРОК 1 З 4\n\n" +
                "👤 Як вас звати?",
                {
                    reply_markup: cancelOrderMenu()
                }
            );

            orderStates.set(userId, {
                step: "name",
                messageId: orderMessage.message_id
            });

            return;
        }

        // Сайты
        if (
            containsAny(normalizedText, [
                "сайт",
                "сайты",
                "сайти",
                "лендинг",
                "лендінг",
                "интернет-магазин",
                "інтернет-магазин",
                "веб-сайт",
                "website"
            ])
        ) {
            await ctx.reply(
                "💻 САЙТИ\n\n" +
                "🌐 Сайт-візитка\n" +
                "Презентація компанії, послуг та контактів.\n\n" +
                "🛒 Інтернет-магазин\n" +
                "Каталог товарів та прийом замовлень.\n\n" +
                "📱 Адаптивний дизайн\n" +
                "Коректна робота на смартфонах, планшетах та ПК.\n\n" +
                "🎨 Сучасний інтерфейс\n" +
                "Акуратний та професійний зовнішній вигляд.\n\n" +
                "🚀 Розробка під ваше завдання.",
                {
                    reply_markup: backMenu()
                }
            );

            return;
        }

        // Telegram-боты
        if (
            containsAny(normalizedText, [
                "бот",
                "бота",
                "боты",
                "telegram бот",
                "телеграм бот",
                "телеграм-бот",
                "telegram-бот"
            ])
        ) {
            await ctx.reply(
                "🤖 TELEGRAM-БОТИ\n\n" +
                "💬 Спілкування з клієнтами\n" +
                "📋 Послуги та ціни\n" +
                "📝 Прийом заявок\n" +
                "🔔 Автоматичні повідомлення\n" +
                "⚙️ Автоматизація процесів\n\n" +
                "Ваш бот може працювати 24/7.",
                {
                    reply_markup: backMenu()
                }
            );

            return;
        }

        // Хостинг
        if (
            containsAny(normalizedText, [
                "хостинг",
                "hosting",
                "разместить сайт",
                "разместить бота",
                "розмістити сайт",
                "розмістити бота",
                "сервер",
                "сервере",
                "сервері"
            ])
        ) {
            await ctx.reply(
                "☁️ ХОСТИНГ ТА РОЗМІЩЕННЯ\n\n" +

                "🚀 Можемо розмістити ваш сайт або Telegram-бота\n" +
                "на сервері та налаштувати його для роботи.\n\n" +

                "🆓 FREE — $0 / місяць\n" +
                "• 0.1 CPU\n" +
                "• 512 MB RAM\n\n" +

                "⚡ 0.5c-512mb — $7 / місяць\n" +
                "• 0.5 CPU\n" +
                "• 512 MB RAM\n\n" +

                "🔥 1c-2g — $25 / місяць\n" +
                "• 1 CPU\n" +
                "• 2 GB RAM\n\n" +

                "🚀 2c-4g — $85 / місяць\n" +
                "• 2 CPU\n" +
                "• 4 GB RAM\n\n" +

                "💡 Допоможемо підібрати варіант\n" +
                "під ваш проєкт.",
                {
                    reply_markup: backMenu()
                }
            );

            return;
        }

        // Контакты
        if (
            containsAny(normalizedText, [
                "контакт",
                "контакты",
                "контакти",
                "связаться",
                "зв'язатися",
                "зв’язатися",
                "телефон"
            ])
        ) {
            await ctx.reply(
                "📞 КОНТАКТИ\n\n" +
                "Потрібен сайт або Telegram-бот?\n\n" +
                "💬 Telegram:\n" +
                "@Tuzkozirn1\n" +
                "@xxamih",
                {
                    reply_markup: backMenu()
                }
            );

            return;
        }

        // О нас
        if (
            containsAny(normalizedText, [
                "кто вы",
                "кто вы такие",
                "о вас",
                "про вас",
                "хто ви",
                "розкажіть про вас"
            ])
        ) {
            await ctx.reply(
                "ℹ️ ПРО XXAMIh\n\n" +
                "Створюємо цифрові продукти\n" +
                "для сучасного бізнесу.\n\n" +
                "💻 Сайти\n" +
                "🤖 Telegram-боти\n" +
                "⚙️ Автоматизація\n" +
                "☁️ Хостинг\n\n" +
                "Працюємо під конкретні завдання.",
                {
                    reply_markup: backMenu()
                }
            );

            return;
        }

        // Портфолио
        if (
            containsAny(normalizedText, [
                "наш сайт",
                "ваш сайт",
                "ссылка на сайт",
                "силка на сайт",
                "посмотреть сайт",
                "портфолио",
                "портфоліо"
            ])
        ) {
            await ctx.reply(
                "📂 ПОРТФОЛІО\n\n" +
                "Подивіться наші роботи:\n\n" +
                "🌐 https://xxamihsite.vercel.app/",
                {
                    reply_markup: backMenu()
                }
            );

            return;
        }

        // Неизвестный запрос
        await ctx.reply(
            "🤔 Не зовсім зрозумів вас.\n\n" +
            "Спробуйте написати:\n\n" +
            "💻 «Хочу сайт»\n" +
            "🤖 «Потрібен Telegram-бот»\n" +
            "☁️ «Потрібен хостинг»\n" +
            "📝 «Хочу замовити»\n" +
            "📞 «Як з вами зв'язатися?»",
            {
                reply_markup: mainMenu()
            }
        );

        return;
    }

    // ========================================
    // Шаг 1 — имя
    // ========================================

    if (state.step === "name") {
        state.name = text;
        state.step = "contact";

        await editOrderMessage(
            userId,
            state.messageId,
            "📝 НОВЕ ЗАМОВЛЕННЯ\n\n" +
            "✅ Ім'я збережено.\n\n" +
            "2️⃣ КРОК 2 З 4\n\n" +
            "📞 Вкажіть номер телефону\n" +
            "або ваш Telegram username.\n\n" +
            "Наприклад:\n" +
            "+380XXXXXXXXX\n" +
            "@username",
            cancelOrderMenu()
        );

        return;
    }

    // ========================================
    // Шаг 2 — контакт
    // ========================================

    if (state.step === "contact") {
        state.contact = text;
        state.step = "service";

        await editOrderMessage(
            userId,
            state.messageId,
            "📝 НОВЕ ЗАМОВЛЕННЯ\n\n" +
            "✅ Контакт збережено.\n\n" +
            "3️⃣ КРОК 3 З 4\n\n" +
            "💼 Що саме вам потрібно?",
            serviceMenu()
        );

        return;
    }

    // ========================================
    // Шаг 4 — описание
    // ========================================

    if (state.step === "description") {
        state.description = text;
        state.step = "confirm";

        state.username = ctx.from?.username
            ? "@" + ctx.from.username
            : "не вказано";

        const previewText =
            "📋 ПЕРЕВІРТЕ ВАШУ ЗАЯВКУ\n\n" +
            "👤 Ім'я:\n" +
            state.name +
            "\n\n" +
            "📞 Контакт:\n" +
            state.contact +
            "\n\n" +
            "💼 Послуга:\n" +
            state.service +
            "\n\n" +
            "📝 Опис:\n" +
            state.description +
            "\n\n" +
            "💬 Telegram:\n" +
            state.username +
            "\n\n" +
            "Все правильно? 👇";

        await editOrderMessage(
            userId,
            state.messageId,
            previewText,
            confirmOrderMenu()
        );

        return;
    }
});

// ========================================
// Inline-кнопки
// ========================================

bot.on("callback_query", async (ctx) => {
    const data = ctx.callbackQuery?.data;
    const userId = ctx.from?.id;

    if (!data) {
        await ctx.answerCallbackQuery();
        return;
    }

    await ctx.answerCallbackQuery();

    // ========================================
    // Главное меню
    // ========================================

    if (data === "menu:home") {
        orderStates.delete(userId);

        await editCurrentMessage(
            ctx,
            "✨ XXAMIh\n\n" +
            "Цифрові рішення для сучасного бізнесу.\n\n" +
            "Ми допомагаємо створювати:\n\n" +
            "💻 Сучасні сайти\n" +
            "🤖 Telegram-боти\n" +
            "⚙️ Автоматизацію\n" +
            "☁️ Розміщення та хостинг\n\n" +
            "Є ідея або готове завдання?\n" +
            "Розкажіть нам — допоможемо її реалізувати.\n\n" +
            "Оберіть потрібний розділ 👇",
            mainMenu()
        );

        return;
    }

    // ========================================
    // Сайты
    // ========================================

    if (data === "menu:sites") {
        await editCurrentMessage(
            ctx,
            "💻 САЙТИ\n\n" +
            "🌐 Сайт-візитка\n" +
            "Презентація компанії, послуг та контактів.\n\n" +
            "🛒 Інтернет-магазин\n" +
            "Каталог товарів та прийом замовлень.\n\n" +
            "📱 Адаптивний дизайн\n" +
            "Коректна робота на смартфонах, планшетах та ПК.\n\n" +
            "🎨 Сучасний інтерфейс\n" +
            "Акуратний та професійний зовнішній вигляд.\n\n" +
            "🚀 Розробка під ваше завдання.",
            backMenu()
        );

        return;
    }

    // ========================================
    // Telegram-боты
    // ========================================

    if (data === "menu:bots") {
        await editCurrentMessage(
            ctx,
            "🤖 TELEGRAM-БОТИ\n\n" +
            "💬 Спілкування з клієнтами\n" +
            "📋 Послуги та ціни\n" +
            "📝 Прийом заявок\n" +
            "🔔 Автоматичні повідомлення\n" +
            "⚙️ Автоматизація процесів\n\n" +
            "Ваш бот може працювати 24/7.",
            backMenu()
        );

        return;
    }

    // ========================================
    // Преимущества
    // ========================================

    if (data === "menu:advantages") {
        await editCurrentMessage(
            ctx,
            "⭐ ПЕРЕВАГИ XXAMIh\n\n" +
            "🚀 Сучасні рішення\n" +
            "Створюємо актуальні сайти та Telegram-ботів.\n\n" +
            "🎯 Під ваше завдання\n" +
            "Рішення під конкретний бізнес.\n\n" +
            "📱 Адаптивність\n" +
            "Коректна робота на телефоні, планшеті та ПК.\n\n" +
            "☁️ Хостинг\n" +
            "Допоможемо розмістити проєкт на сервері.\n\n" +
            "🤝 Зворотний зв'язок\n" +
            "Працюємо разом від ідеї до результату.",
            backMenu()
        );

        return;
    }

    // ========================================
    // Как работаем
    // ========================================

    if (data === "menu:process") {
        await editCurrentMessage(
            ctx,
            "🛠 ЯК МИ ПРАЦЮЄМО\n\n" +
            "1️⃣ Знайомство\n" +
            "Дізнаємося, що вам потрібно.\n\n" +
            "2️⃣ Обговорення\n" +
            "Уточнюємо деталі та формат роботи.\n\n" +
            "3️⃣ Розробка\n" +
            "Створюємо сайт, бота або автоматизацію.\n\n" +
            "4️⃣ Розміщення\n" +
            "За потреби налаштовуємо сервер та запускаємо проєкт.\n\n" +
            "5️⃣ Результат\n" +
            "Передаємо готовий продукт.",
            backMenu()
        );

        return;
    }

    // ========================================
    // Хостинг
    // ========================================

    if (data === "menu:hosting") {
        await editCurrentMessage(
            ctx,
            "☁️ ХОСТИНГ ТА РОЗМІЩЕННЯ\n\n" +

            "🚀 Можемо розмістити ваш сайт або Telegram-бота\n" +
            "на сервері та налаштувати його для роботи.\n\n" +

            "🆓 FREE\n" +
            "$0 / місяць\n" +
            "• 0.1 CPU\n" +
            "• 512 MB RAM\n\n" +

            "⚡ 0.5c-512mb\n" +
            "$7 / місяць\n" +
            "• 0.5 CPU\n" +
            "• 512 MB RAM\n\n" +

            "🔥 1c-2g\n" +
            "$25 / місяць\n" +
            "• 1 CPU\n" +
            "• 2 GB RAM\n\n" +

            "🚀 2c-4g\n" +
            "$85 / місяць\n" +
            "• 2 CPU\n" +
            "• 4 GB RAM\n\n" +

            "💡 Допоможемо підібрати варіант\n" +
            "під ваш проєкт та виконати налаштування.",
            backMenu()
        );

        return;
    }

    // ========================================
    // Портфолио
    // ========================================

    if (data === "menu:portfolio") {
        await editCurrentMessage(
            ctx,
            "📂 ПОРТФОЛІО\n\n" +
            "Подивіться наші роботи та цифрові рішення.\n\n" +
            "🌐 Наш сайт:\n" +
            "https://xxamihsite.vercel.app/",
            backMenu()
        );

        return;
    }

    // ========================================
    // Про нас
    // ========================================

    if (data === "menu:about") {
        await editCurrentMessage(
            ctx,
            "ℹ️ ПРО XXAMIh\n\n" +
            "Створюємо цифрові продукти\n" +
            "для сучасного бізнесу.\n\n" +
            "💻 Сайти\n" +
            "🤖 Telegram-боти\n" +
            "⚙️ Автоматизація\n" +
            "☁️ Хостинг\n\n" +
            "Працюємо під конкретні завдання.",
            backMenu()
        );

        return;
    }

    // ========================================
    // Контакты
    // ========================================

    if (data === "menu:contacts") {
        await editCurrentMessage(
            ctx,
            "📞 КОНТАКТИ\n\n" +
            "Потрібен сайт або Telegram-бот?\n\n" +
            "💬 Telegram:\n" +
            "@Tuzkozirn1\n" +
            "@xxamih",
            backMenu()
        );

        return;
    }

    // ========================================
    // Начало заказа
    // ========================================

    if (data === "menu:order") {
        const message = ctx.callbackQuery.message;

        orderStates.set(userId, {
            step: "name",
            messageId: message.message_id
        });

        await editCurrentMessage(
            ctx,
            "📝 НОВЕ ЗАМОВЛЕННЯ\n\n" +
            "Оформимо заявку всього за 4 кроки.\n\n" +
            "1️⃣ КРОК 1 З 4\n\n" +
            "👤 Як вас звати?",
            cancelOrderMenu()
        );

        return;
    }

    // ========================================
    // Выбор услуги
    // ========================================

    if (data.startsWith("service:")) {
        const state = orderStates.get(userId);

        if (!state || state.step !== "service") {
            await editCurrentMessage(
                ctx,
                "⚠️ Почніть оформлення заявки ще раз.",
                mainMenu()
            );

            return;
        }

        const serviceType = data.split(":")[1];

        if (serviceType === "site") {
            state.service = "💻 Сайт";
        } else if (serviceType === "bot") {
            state.service = "🤖 Telegram-бот";
        } else if (serviceType === "auto") {
            state.service = "⚙️ Автоматизація";
        } else if (serviceType === "other") {
            state.service = "📦 Інше";
        }

        state.step = "description";

        await editOrderMessage(
            userId,
            state.messageId,
            "📝 НОВЕ ЗАМОВЛЕННЯ\n\n" +
            "✅ Послугу вибрано.\n\n" +
            "4️⃣ КРОК 4 З 4\n\n" +
            "💼 " +
            state.service +
            "\n\n" +
            "📝 Тепер розкажіть трохи про ваше завдання.\n\n" +
            "Опишіть усе, що вважаєте важливим 👇",
            cancelOrderMenu()
        );

        return;
    }

    // ========================================
    // Отмена заявки
    // ========================================

    if (data === "order:cancel") {
        orderStates.delete(userId);

        await editCurrentMessage(
            ctx,
            "❌ ЗАМОВЛЕННЯ СКАСОВАНО\n\n" +
            "Повертаємося до головного меню 👇",
            mainMenu()
        );

        return;
    }

    // ========================================
    // Изменить заявку
    // ========================================

    if (data === "order:edit") {
        orderStates.set(userId, {
            step: "name",
            messageId: ctx.callbackQuery.message.message_id
        });

        await editCurrentMessage(
            ctx,
            "✏️ ЗМІНА ЗАЯВКИ\n\n" +
            "Почнемо оформлення заново.\n\n" +
            "1️⃣ КРОК 1 З 4\n\n" +
            "👤 Як вас звати?",
            cancelOrderMenu()
        );

        return;
    }

    // ========================================
    // Подтверждение заявки
    // ========================================

    if (data === "order:confirm") {
        const state = orderStates.get(userId);

        if (!state || state.step !== "confirm") {
            await editCurrentMessage(
                ctx,
                "⚠️ Ця заявка вже була оброблена.",
                mainMenu()
            );

            return;
        }

        const orderId = Date.now().toString();
        const shortOrderId = orderId.slice(-6);

        const orderText =
            "📩 НОВА ЗАЯВКА\n\n" +
            "🔢 Номер: #" +
            shortOrderId +
            "\n\n" +
            "📊 Статус: 📨 ВІДПРАВЛЕНА\n\n" +
            "👤 Ім'я:\n" +
            state.name +
            "\n\n" +
            "💬 Username:\n" +
            state.username +
            "\n\n" +
            "📞 Контакт:\n" +
            state.contact +
            "\n\n" +
            "💼 Послуга:\n" +
            state.service +
            "\n\n" +
            "📝 Опис:\n" +
            state.description;

        pendingOrders.set(orderId, {
            userId: userId,
            name: state.name,
            username: state.username,
            orderId: orderId,
            clientMessageId: state.messageId,
            status: "sent"
        });

        try {
            await bot.api.sendMessage({
                chat_id: ADMIN_CHAT_ID,
                text: orderText,
                reply_markup: adminOrderMenu(orderId)
            });

            statistics.total += 1;
            statistics.sent += 1;

            orderStates.delete(userId);

            await editOrderMessage(
                userId,
                state.messageId,
                "📨 ЗАЯВКА ВІДПРАВЛЕНА\n\n" +
                "🔢 Номер: #" +
                shortOrderId +
                "\n\n" +
                "📊 Статус: 📨 ВІДПРАВЛЕНА\n\n" +
                "Вашу заявку успішно передано.\n" +
                "Ми зв'яжемося з вами найближчим часом 🤝",
                mainMenu()
            );
        } catch (error) {
            console.error(
                "Помилка відправки заявки:",
                error
            );

            pendingOrders.delete(orderId);

            await editOrderMessage(
                userId,
                state.messageId,
                "⚠️ НЕ ВДАЛОСЯ ВІДПРАВИТИ ЗАЯВКУ\n\n" +
                "Спробуйте ще раз.",
                mainMenu()
            );
        }

        return;
    }

    // ========================================
    // АДМИН — ГЛАВНАЯ
    // ========================================

    if (data === "admin:home") {
        if (userId !== ADMIN_CHAT_ID) {
            return;
        }

        await editCurrentMessage(
            ctx,
            "🔐 АДМІН-ПАНЕЛЬ\n\n" +
            "Панель керування XXAMIh.\n\n" +
            "Оберіть потрібний розділ 👇",
            adminPanelMenu()
        );

        return;
    }

    // ========================================
    // АДМИН — ЗАЯВКИ
    // ========================================

    if (data === "admin:orders") {
        if (userId !== ADMIN_CHAT_ID) {
            return;
        }

        if (pendingOrders.size === 0) {
            await editCurrentMessage(
                ctx,
                "📋 ЗАЯВКИ\n\n" +
                "Активних заявок немає.",
                adminOrdersMenu()
            );

            return;
        }

        let ordersText =
            "📋 АКТИВНІ ЗАЯВКИ\n\n";

        for (const [orderId, order] of pendingOrders) {
            ordersText +=
                "🔢 #" +
                orderId.slice(-6) +
                "\n" +
                "👤 " +
                order.name +
                "\n" +
                "💬 " +
                order.username +
                "\n" +
                "📊 " +
                getStatusText(order.status) +
                "\n\n";
        }

        await editCurrentMessage(
            ctx,
            ordersText,
            adminOrdersMenu()
        );

        return;
    }

    // ========================================
    // АДМИН — СТАТИСТИКА
    // ========================================

    if (data === "admin:stats") {
        if (userId !== ADMIN_CHAT_ID) {
            return;
        }

        await editCurrentMessage(
            ctx,
            "📊 СТАТИСТИКА\n\n" +
            "📦 Всього заявок: " +
            statistics.total +
            "\n\n" +
            "📨 Відправлено: " +
            statistics.sent +
            "\n" +
            "🛠 В роботі: " +
            statistics.working +
            "\n" +
            "✅ Завершено: " +
            statistics.completed +
            "\n" +
            "❌ Відхилено: " +
            statistics.rejected +
            "\n\n" +
            "📌 Активних зараз: " +
            pendingOrders.size,
            new InlineKeyboardBuilder()
                .text("🔄 Оновити", "admin:stats")
                .row()
                .text("🔙 Назад", "admin:home")
                .build()
        );

        return;
    }

    // ========================================
    // АДМИН — НАСТРОЙКИ
    // ========================================

    if (data === "admin:settings") {
        if (userId !== ADMIN_CHAT_ID) {
            return;
        }

        await editCurrentMessage(
            ctx,
            "⚙️ НАЛАШТУВАННЯ\n\n" +
            "🤖 Бот: XXAMIh\n" +
            "🟢 Статус: працює\n\n" +
            "🌐 Сайт:\n" +
            "https://xxamihsite.vercel.app/\n\n" +
            "💬 Telegram:\n" +
            "@Tuzkozirn1\n" +
            "@xxamih\n\n" +
            "🆔 Адміністратор:\n" +
            ADMIN_CHAT_ID,
            new InlineKeyboardBuilder()
                .text("🔙 Назад", "admin:home")
                .build()
        );

        return;
    }

    // ========================================
    // АДМИН — ВЗЯТЬ В РАБОТУ
    // ========================================

    if (data.startsWith("admin:accept:")) {
        if (userId !== ADMIN_CHAT_ID) {
            return;
        }

        const orderId = data.split(":")[2];
        const order = pendingOrders.get(orderId);

        if (!order) {
            await ctx.reply(
                "⚠️ Заявка вже оброблена або не знайдена."
            );

            return;
        }

        try {
            await editOrderMessage(
                order.userId,
                order.clientMessageId,
                "🛠 ЗАЯВКА В РОБОТІ\n\n" +
                "🔢 Номер: #" +
                orderId.slice(-6) +
                "\n\n" +
                "📊 Статус: 🛠 В РОБОТІ\n\n" +
                "Ми вже працюємо над вашим замовленням.\n\n" +
                "Найближчим часом з вами зв'яжуться 🤝",
                mainMenu()
            );

            await bot.api.editMessageText({
                chat_id: ADMIN_CHAT_ID,
                message_id: ctx.callbackQuery.message.message_id,
                text:
                    "🛠 ЗАЯВКА #" +
                    orderId.slice(-6) +
                    "\n\n" +
                    "👤 Клієнт: " +
                    order.name +
                    "\n" +
                    "💬 Username: " +
                    order.username +
                    "\n\n" +
                    "📊 Статус: 🛠 В РОБОТІ",
                reply_markup: adminWorkingMenu(orderId)
            });

            statistics.sent -= 1;
            statistics.working += 1;

            order.status = "working";
            pendingOrders.set(orderId, order);
        } catch (error) {
            console.error(
                "Помилка зміни статусу:",
                error
            );
        }

        return;
    }

    // ========================================
    // АДМИН — ЗАВЕРШИТЬ
    // ========================================

    if (data.startsWith("admin:complete:")) {
        if (userId !== ADMIN_CHAT_ID) {
            return;
        }

        const orderId = data.split(":")[2];
        const order = pendingOrders.get(orderId);

        if (!order) {
            await ctx.reply(
                "⚠️ Заявка вже оброблена або не знайдена."
            );

            return;
        }

        try {
            await editOrderMessage(
                order.userId,
                order.clientMessageId,
                "✅ ЗАЯВКУ ЗАВЕРШЕНО\n\n" +
                "🔢 Номер: #" +
                orderId.slice(-6) +
                "\n\n" +
                "📊 Статус: ✅ ЗАВЕРШЕНА\n\n" +
                "Дякуємо за звернення до XXAMIh! 🤝",
                mainMenu()
            );

            await bot.api.editMessageText({
                chat_id: ADMIN_CHAT_ID,
                message_id: ctx.callbackQuery.message.message_id,
                text:
                    "✅ ЗАЯВКА #" +
                    orderId.slice(-6) +
                    "\n\n" +
                    "👤 Клієнт: " +
                    order.name +
                    "\n" +
                    "💬 Username: " +
                    order.username +
                    "\n\n" +
                    "📊 Статус: ✅ ЗАВЕРШЕНА"
            });

            statistics.working -= 1;
            statistics.completed += 1;

            pendingOrders.delete(orderId);
        } catch (error) {
            console.error(
                "Помилка завершення заявки:",
                error
            );
        }

        return;
    }

    // ========================================
    // АДМИН — ОТКЛОНИТЬ
    // ========================================

    if (data.startsWith("admin:reject:")) {
        if (userId !== ADMIN_CHAT_ID) {
            return;
        }

        const orderId = data.split(":")[2];
        const order = pendingOrders.get(orderId);

        if (!order) {
            await ctx.reply(
                "⚠️ Заявка вже оброблена або не знайдена."
            );

            return;
        }

        try {
            await editOrderMessage(
                order.userId,
                order.clientMessageId,
                "❌ ЗАЯВКУ ВІДХИЛЕНО\n\n" +
                "🔢 Номер: #" +
                orderId.slice(-6) +
                "\n\n" +
                "📊 Статус: ❌ ВІДХИЛЕНА\n\n" +
                "Дякуємо за звернення до XXAMIh.",
                mainMenu()
            );

            await bot.api.editMessageText({
                chat_id: ADMIN_CHAT_ID,
                message_id: ctx.callbackQuery.message.message_id,
                text:
                    "❌ ЗАЯВКА #" +
                    orderId.slice(-6) +
                    "\n\n" +
                    "👤 Клієнт: " +
                    order.name +
                    "\n" +
                    "💬 Username: " +
                    order.username +
                    "\n\n" +
                    "📊 Статус: ❌ ВІДХИЛЕНА"
            });

            statistics.sent -= 1;
            statistics.rejected += 1;

            pendingOrders.delete(orderId);
        } catch (error) {
            console.error(
                "Помилка відхилення заявки:",
                error
            );
        }

        return;
    }
});

// ========================================
// Обработка ошибок
// ========================================

bot.catch((error) => {
    console.error("Помилка:", error);
});

// ========================================
// Telegram Webhook
// ========================================

registerExpressWebhook(bot, app, {
    path: "/telegram",
    allowUnauthenticated: true
});

// ========================================
// Проверка сервера
// ========================================

app.get("/", (req, res) => {
    res.send("Telegram bot is running!");
});

// ========================================
// PORT Render
// ========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Сервер запущений на порту ${PORT}`);
});