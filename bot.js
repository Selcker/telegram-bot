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

// Твой Telegram ID
const ADMIN_CHAT_ID = 1215947826;

// Состояния заказов пользователей
const orderStates = new Map();

// ========================================
// Главное меню
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

// ========================================
// Кнопка отмены
// ========================================

function cancelMenu() {
    return new ReplyKeyboardBuilder()
        .text("❌ Скасувати")
        .build({
            resize_keyboard: true
        });
}

// ========================================
// Выбор услуги
// ========================================

function serviceMenu() {
    return new ReplyKeyboardBuilder()
        .text("💻 Сайт")
        .row()
        .text("🤖 Telegram-бот")
        .row()
        .text("⚙️ Автоматизація")
        .row()
        .text("📦 Інше")
        .row()
        .text("❌ Скасувати")
        .build({
            resize_keyboard: true
        });
}

// ========================================
// Основной обработчик сообщений
// ========================================

bot.on("message", async (ctx) => {
    const text = ctx.message?.text || "";
    const userId = ctx.chat.id;

    console.log("Отримано:", text);

    // ========================================
    // Команда /start
    // ========================================

    if (text === "/start") {
        orderStates.delete(userId);

        await ctx.reply(
            "✨ Вітаємо!\n\n" +
            "Ви у XXAMIh — місці, де ідеї\n" +
            "перетворюються на цифрові рішення.\n\n" +
            "💻 Сайти для бізнесу\n" +
            "🤖 Telegram-боти\n" +
            "⚙️ Автоматизація\n\n" +
            "Маєте ідею?\n" +
            "Розкажіть нам — допоможемо її реалізувати.\n\n" +
            "Оберіть, з чого почнемо 👇",
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
    // Создание сайтов
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
            "🚀 Можемо створити сайт повністю під ваше завдання.",
            {
                reply_markup: mainMenu()
            }
        );

        return;
    }

    // ========================================
    // Telegram-боты
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
    // О нас
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
    // Контакты
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
    // Наш сайт
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
    // Начало заказа
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
    // Текущее состояние заказа
    // ========================================

    const state = orderStates.get(userId);

    // ========================================
    // Шаг 1 — имя
    // ========================================

    if (state && state.step === "name") {
        state.name = text;
        state.step = "contact";

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
    // Шаг 2 — контакт
    // ========================================

    if (state && state.step === "contact") {
        state.contact = text;
        state.step = "service";

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
    // Шаг 3 — услуга
    // ========================================

    if (state && state.step === "service") {
        state.service = text;
        state.step = "description";

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
    // Шаг 4 — описание
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

        // Отправляем заявку тебе
        try {
            await bot.api.sendMessage({
                chat_id: ADMIN_CHAT_ID,
                text: orderText
            });

            console.log("Заявка відправлена адміністратору.");
        } catch (error) {
            console.error(
                "Помилка відправки заявки адміністратору:",
                error
            );
        }

        orderStates.delete(userId);

        // Ответ клиенту
        await ctx.reply(
            "🎉 ЗАЯВКУ ПРИЙНЯТО!\n\n" +
            "Дякуємо, " + state.name + "!\n\n" +
            "Ми отримали вашу заявку.\n\n" +
            "💼 Послуга: " + state.service + "\n\n" +
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