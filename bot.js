const {
    Bot,
    registerExpressWebhook,
    ReplyKeyboardBuilder
} = require("node-telegram-bot-api");

const express = require("express");

const token = process.env.BOT_TOKEN;

if (!token) {
    console.error("BOT_TOKEN не найден!");
    process.exit(1);
}

const bot = new Bot(token);
const app = express();

// Храним этап заказа для каждого пользователя
const orderStates = new Map();

// ========================================
// Клавиатуры
// ========================================

function mainMenu() {
    return new ReplyKeyboardBuilder()
        .text("💻 Створення сайтів")
        .row()
        .text("🤖 Telegram-боти")
        .row()
        .text("📝 Замовити")
        .row()
        .text("ℹ️ Про нас")
        .row()
        .text("📞 Контакти")
        .row()
        .text("🌐 Наш сайт")
        .build({
            resize_keyboard: true,
            is_persistent: true
        });
}

function cancelMenu() {
    return new ReplyKeyboardBuilder()
        .text("❌ Скасувати")
        .build({
            resize_keyboard: true
        });
}

function serviceMenu() {
    return new ReplyKeyboardBuilder()
        .text("💻 Сайт")
        .row()
        .text("🤖 Telegram-бот")
        .row()
        .text("⚙️ Автоматизація")
        .row()
        .text("Інше")
        .row()
        .text("❌ Скасувати")
        .build({
            resize_keyboard: true
        });
}

// ========================================
// Основной обработчик
// ========================================

bot.on("message", async (ctx) => {
    const text = ctx.message?.text || "";
    const userId = ctx.from.id;

    console.log("Отримано:", text);

    // ========================================
    // /start
    // ========================================

    if (text === "/start") {
        orderStates.delete(userId);

        await ctx.reply(
            "╔══════════════════════════╗\n" +
            "        👋 ВІТАЄМО!\n" +
            "╚══════════════════════════╝\n\n" +

            "🚀 Створюємо цифрові рішення\n" +
            "для сучасного бізнесу.\n\n" +

            "💻 Сайти\n" +
            "🤖 Telegram-боти\n" +
            "⚙️ Автоматизація\n\n" +

            "Оберіть потрібний розділ нижче 👇",
            {
                reply_markup: mainMenu()
            }
        );

        return;
    }

    // ========================================
    // Отмена заказа
    // ========================================

    if (text === "❌ Скасувати") {
        orderStates.delete(userId);

        await ctx.reply(
            "❌ Замовлення скасовано.\n\n" +
            "Повертаємося до головного меню 👇",
            {
                reply_markup: mainMenu()
            }
        );

        return;
    }

    // ========================================
    // САЙТИ
    // ========================================

    if (text === "💻 Створення сайтів") {
        await ctx.reply(
            "💻 СТВОРЕННЯ САЙТІВ\n\n" +

            "🌐 Сайт-візитка\n" +
            "— презентація компанії та послуг\n\n" +

            "🛒 Інтернет-магазин\n" +
            "— товари, замовлення та онлайн-продажі\n\n" +

            "📱 Адаптивність\n" +
            "— правильне відображення на телефоні, планшеті та ПК\n\n" +

            "🎨 Сучасний дизайн\n" +
            "— акуратний та професійний зовнішній вигляд\n\n" +

            "Можемо створити сайт повністю під ваше завдання 🚀",
            {
                reply_markup: mainMenu()
            }
        );

        return;
    }

    // ========================================
    // TELEGRAM-БОТЫ
    // ========================================

    if (text === "🤖 Telegram-боти") {
        await ctx.reply(
            "🤖 TELEGRAM-БОТИ\n\n" +

            "💬 Спілкування з клієнтами\n" +
            "📋 Послуги та ціни\n" +
            "📝 Прийом заявок\n" +
            "🔔 Автоматичні повідомлення\n" +
            "⚙️ Автоматизація процесів\n\n" +

            "Бот може працювати 24/7 та економити ваш час 🚀",
            {
                reply_markup: mainMenu()
            }
        );

        return;
    }

    // ========================================
    // ПРО НАС
    // ========================================

    if (text === "ℹ️ Про нас") {
        await ctx.reply(
            "ℹ️ ПРО НАС\n\n" +

            "Ми створюємо цифрові рішення,\n" +
            "які допомагають бізнесу розвиватися.\n\n" +

            "💻 Сайти\n" +
            "🤖 Telegram-боти\n" +
            "⚙️ Автоматизація\n\n" +

            "Працюємо під конкретне завдання\n" +
            "та побажання клієнта.",
            {
                reply_markup: mainMenu()
            }
        );

        return;
    }

    // ========================================
    // КОНТАКТЫ
    // ========================================

    if (text === "📞 Контакти") {
        await ctx.reply(
            "📞 КОНТАКТИ\n\n" +

            "Потрібен сайт або Telegram-бот?\n\n" +

            "💬 Telegram:\n" +
            "@Tuzkozirn1\n" +
            "@xxamih\n\n" +

            "Напишіть нам — обговоримо ваше завдання 🤝",
            {
                reply_markup: mainMenu()
            }
        );

        return;
    }

    // ========================================
    // НАШ САЙТ
    // ========================================

    if (text === "🌐 Наш сайт") {
        await ctx.reply(
            "🌐 НАШ САЙТ\n\n" +
            "Перегляньте наші послуги та роботи 👇\n\n" +
            "https://xxamihsite.vercel.app/",
            {
                reply_markup: mainMenu()
            }
        );

        return;
    }

    // ========================================
    // НАЧАЛО ЗАКАЗА
    // ========================================

    if (text === "📝 Замовити") {
        orderStates.set(userId, {
            step: "name"
        });

        await ctx.reply(
            "📝 НОВЕ ЗАМОВЛЕННЯ\n\n" +
            "Давайте оформимо заявку.\n\n" +
            "Крок 1 з 4\n\n" +
            "👤 Напишіть ваше ім'я:",
            {
                reply_markup: cancelMenu()
            }
        );

        return;
    }

    // ========================================
    // ЭТАП 1 — ИМЯ
    // ========================================

    const state = orderStates.get(userId);

    if (state && state.step === "name") {
        state.name = text;
        state.step = "contact";

        orderStates.set(userId, state);

        await ctx.reply(
            "✅ Ім'я збережено.\n\n" +
            "Крок 2 з 4\n\n" +
            "📞 Напишіть ваш номер телефону\n" +
            "або Telegram username:\n\n" +
            "Наприклад:\n" +
            "+380XXXXXXXXX\n" +
            "@username",
            {
                reply_markup: cancelMenu()
            }
        );

        return;
    }

    // ========================================
    // ЭТАП 2 — КОНТАКТ
    // ========================================

    if (state && state.step === "contact") {
        state.contact = text;
        state.step = "service";

        orderStates.set(userId, state);

        await ctx.reply(
            "✅ Контакт збережено.\n\n" +
            "Крок 3 з 4\n\n" +
            "💼 Що вам потрібно?",
            {
                reply_markup: serviceMenu()
            }
        );

        return;
    }

    // ========================================
    // ЭТАП 3 — УСЛУГА
    // ========================================

    if (state && state.step === "service") {
        state.service = text;
        state.step = "description";

        orderStates.set(userId, state);

        await ctx.reply(
            "✅ Послугу вибрано.\n\n" +
            "Крок 4 з 4\n\n" +
            "📝 Коротко опишіть ваше завдання.\n\n" +
            "Наприклад:\n" +
            "«Потрібен сайт для магазину одягу»\n\n" +
            "Чим детальніше опишете завдання,\n" +
            "тим краще ми зможемо вам допомогти.",
            {
                reply_markup: cancelMenu()
            }
        );

        return;
    }

    // ========================================
    // ЭТАП 4 — ОПИСАНИЕ
    // ========================================

    if (state && state.step === "description") {
        state.description = text;

        const orderText =
            "📩 НОВА ЗАЯВКА\n\n" +
            "👤 Ім'я: " + state.name + "\n" +
            "📞 Контакт: " + state.contact + "\n" +
            "💼 Послуга: " + state.service + "\n\n" +
            "📝 Опис:\n" +
            state.description;

        console.log("=================================");
        console.log(orderText);
        console.log("=================================");

        orderStates.delete(userId);

        await ctx.reply(
            "🎉 ЗАЯВКУ ПРИЙНЯТО!\n\n" +

            "Дякуємо, " + state.name + "!\n\n" +

            "Ми отримали вашу заявку:\n\n" +

            "💼 " + state.service + "\n" +
            "📞 " + state.contact + "\n\n" +

            "Ми зв'яжемося з вами найближчим часом 🤝",
            {
                reply_markup: mainMenu()
            }
        );

        return;
    }

    // ========================================
    // Неизвестное сообщение
    // ========================================

    await ctx.reply(
        "🤔 Не зовсім зрозумів ваше повідомлення.\n\n" +
        "Будь ласка, скористайтеся кнопками меню 👇",
        {
            reply_markup: mainMenu()
        }
    );
});

// ========================================
// Ошибки
// ========================================

bot.catch((error) => {
    console.error("Помилка:", error);
});

// ========================================
// Webhook
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