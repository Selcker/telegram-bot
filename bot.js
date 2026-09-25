const {
    Bot,
    registerExpressWebhook,
    ReplyKeyboardBuilder,
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

// Telegram ID администратора
const ADMIN_CHAT_ID = 1215947826;

// Состояния заказов
const orderStates = new Map();

// ========================================
// Главное меню
// ========================================

function mainMenu() {
    return new ReplyKeyboardBuilder()
        .text("💻 Створення сайтів")
        .text("🤖 Telegram-боти")
        .row()
        .text("📝 Замовити")
        .text("ℹ️ Про нас")
        .row()
        .text("📞 Контакти")
        .text("🌐 Наш сайт")
        .build({
            resize_keyboard: true,
            is_persistent: true
        });
}

// ========================================
// Меню отмены
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
        .text("🤖 Telegram-бот")
        .row()
        .text("⚙️ Автоматизація")
        .text("📦 Інше")
        .row()
        .text("❌ Скасувати")
        .build({
            resize_keyboard: true
        });
}

// ========================================
// Inline-кнопки подтверждения
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
// Основной обработчик сообщений
// ========================================

bot.on("message", async (ctx) => {
    const text = ctx.message?.text || "";
    const userId = ctx.chat.id;

    console.log("Отримано:", text);

    // ========================================
    // /start
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
    // СОЗДАНИЕ САЙТОВ
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
            "Зараз швидко оформимо вашу заявку.\n\n" +
            "1️⃣ КРОК 1 З 4\n\n" +
            "👤 Як вас звати?",
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
    // ЭТАП 1 — ИМЯ
    // ========================================

    if (state && state.step === "name") {
        state.name = text;
        state.step = "contact";

        await ctx.reply(
            "✅ Ім'я збережено.\n\n" +
            "2️⃣ КРОК 2 З 4\n\n" +
            "📞 Вкажіть номер телефону\n" +
            "або ваш Telegram username.\n\n" +
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

        await ctx.reply(
            "✅ Контакт збережено.\n\n" +
            "3️⃣ КРОК 3 З 4\n\n" +
            "💼 Що саме вам потрібно?",
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

        await ctx.reply(
            "✅ Послугу вибрано.\n\n" +
            "4️⃣ КРОК 4 З 4\n\n" +
            "📝 Розкажіть трохи про ваше завдання.\n\n" +
            "Наприклад:\n" +
            "«Потрібен сайт для магазину одягу»\n\n" +
            "Опишіть усе, що вважаєте важливим 👇",
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
        state.step = "confirm";

        // Сохраняем Telegram пользователя
        state.username = ctx.from?.username
            ? "@" + ctx.from.username
            : "не вказано";

        orderStates.set(userId, state);

        // ========================================
        // Предпросмотр заявки
        // ========================================

        const previewText =
            "📋 ПЕРЕВІРТЕ ВАШУ ЗАЯВКУ\n\n" +

            "👤 Ім'я:\n" +
            state.name + "\n\n" +

            "📞 Контакт:\n" +
            state.contact + "\n\n" +

            "💼 Послуга:\n" +
            state.service + "\n\n" +

            "📝 Опис:\n" +
            state.description + "\n\n" +

            "Все правильно?";

        await ctx.reply(
            previewText,
            {
                reply_markup: confirmOrderMenu()
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
// Обработчик inline-кнопок
// ========================================

bot.on("callback_query", async (ctx) => {
    const data = ctx.callbackQuery?.data;
    const userId = ctx.from?.id;

    // Убираем "часики" с кнопки
    await ctx.answerCallbackQuery();

    const state = orderStates.get(userId);

    // ========================================
    // Подтверждение заказа
    // ========================================

    if (data === "order:confirm") {
        if (!state || state.step !== "confirm") {
            await ctx.reply(
                "⚠️ Ця заявка вже була оброблена."
            );

            return;
        }

        const orderText =
            "📩 НОВА ЗАЯВКА\n\n" +

            "👤 Ім'я: " +
            state.name +
            "\n\n" +

            "📞 Контакт: " +
            state.contact +
            "\n\n" +

            "💼 Послуга: " +
            state.service +
            "\n\n" +

            "📝 Опис:\n" +
            state.description +
            "\n\n" +

            "👤 Telegram: " +
            state.username;

        console.log("=================================");
        console.log(orderText);
        console.log("=================================");

        try {
            await bot.api.sendMessage({
                chat_id: ADMIN_CHAT_ID,
                text: orderText
            });

            console.log("Заявка відправлена адміністратору.");

            orderStates.delete(userId);

            await ctx.reply(
                "🎉 ЗАЯВКУ ВІДПРАВЛЕНО!\n\n" +
                "Дякуємо, " +
                state.name +
                "!\n\n" +
                "Ми отримали ваше замовлення.\n" +
                "Зв'яжемося з вами найближчим часом 🤝",
                {
                    reply_markup: mainMenu()
                }
            );
        } catch (error) {
            console.error(
                "Помилка відправки заявки:",
                error
            );

            await ctx.reply(
                "⚠️ Виникла помилка під час відправки заявки.\n\n" +
                "Спробуйте ще раз трохи пізніше.",
                {
                    reply_markup: mainMenu()
                }
            );
        }

        return;
    }

    // ========================================
    // Изменить заявку
    // ========================================

    if (data === "order:edit") {
        if (!state) {
            await ctx.reply(
                "⚠️ Заявку не знайдено. Почніть оформлення ще раз.",
                {
                    reply_markup: mainMenu()
                }
            );

            return;
        }

        state.step = "name";
        state.name = "";
        state.contact = "";
        state.service = "";
        state.description = "";

        orderStates.set(userId, state);

        await ctx.reply(
            "✏️ ДОБРЕ!\n\n" +
            "Почнемо оформлення заявки заново.\n\n" +
            "1️⃣ КРОК 1 З 4\n\n" +
            "👤 Як вас звати?",
            {
                reply_markup: cancelMenu()
            }
        );

        return;
    }

    // ========================================
    // Отмена через inline-кнопку
    // ========================================

    if (data === "order:cancel") {
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
});

// ========================================
// Ошибки
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