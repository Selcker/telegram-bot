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

// ========================================
// Твой Telegram ID
// ========================================

const ADMIN_CHAT_ID = 1215947826;

// ========================================
// Хранилища
// ========================================

// Этапы заполнения заявок
const orderStates = new Map();

// Заявки, которые уже отправлены администратору
const pendingOrders = new Map();

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
// Кнопки подтверждения заявки клиентом
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
// Кнопки для администратора
// ========================================

function adminOrderMenu(orderId) {
    return new InlineKeyboardBuilder()
        .text("✅ Взяти в роботу", `admin:accept:${orderId}`)
        .row()
        .text("❌ Відхилити", `admin:reject:${orderId}`)
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
    // Отмена
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
            "Презентація компанії та послуг.\n\n" +

            "🛒 Інтернет-магазин\n" +
            "Товари, замовлення та онлайн-продажі.\n\n" +

            "📱 Адаптивність\n" +
            "Коректне відображення на смартфонах, планшетах та ПК.\n\n" +

            "🎨 Сучасний дизайн\n" +
            "Акуратний та професійний зовнішній вигляд.\n\n" +

            "🚀 Створимо сайт відповідно до вашого завдання.",
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

            "Ваш бот може працювати 24/7\n" +
            "та економити час вашої команди. 🚀",
            {
                reply_markup: mainMenu()
            }
        );

        return;
    }

    // ========================================
    // Про нас
    // ========================================

    if (text === "ℹ️ Про нас") {
        await ctx.reply(
            "ℹ️ ПРО НАС\n\n" +

            "Ми створюємо цифрові рішення\n" +
            "для сучасного бізнесу.\n\n" +

            "💻 Сайти\n" +
            "🤖 Telegram-боти\n" +
            "⚙️ Автоматизація\n\n" +

            "Працюємо під конкретне завдання\n" +
            "та побажання клієнта. 🤝",
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

            "Напишіть нам — обговоримо ваше завдання.",
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
    // Состояние заказа
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
    // Шаг 2 — контакт
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
    // Шаг 3 — услуга
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
    // Шаг 4 — описание
    // ========================================

    if (state && state.step === "description") {
        state.description = text;
        state.step = "confirm";

        state.username = ctx.from?.username
            ? "@" + ctx.from.username
            : "не вказано";

        orderStates.set(userId, state);

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

            "Все правильно? 👇";

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
        "Скористайтеся кнопками меню 👇",
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

    await ctx.answerCallbackQuery();

    if (!data) {
        return;
    }

    // ========================================
    // Клиент подтверждает заявку
    // ========================================

    if (data === "order:confirm") {
        const state = orderStates.get(userId);

        if (!state || state.step !== "confirm") {
            await ctx.reply(
                "⚠️ Ця заявка вже була оброблена."
            );

            return;
        }

        const orderId = Date.now().toString();

        const orderText =
            "📩 НОВА ЗАЯВКА\n\n" +

            "🔢 Номер: #" +
            orderId.slice(-6) +
            "\n\n" +

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

            "👤 Telegram:\n" +
            state.username;

        pendingOrders.set(orderId, {
            userId: userId,
            name: state.name
        });

        try {
            await bot.api.sendMessage({
                chat_id: ADMIN_CHAT_ID,
                text: orderText,
                reply_markup: adminOrderMenu(orderId)
            });

            orderStates.delete(userId);

            await ctx.reply(
                "🎉 ЗАЯВКУ ВІДПРАВЛЕНО!\n\n" +
                "Дякуємо, " +
                state.name +
                "!\n\n" +
                "Ваше замовлення успішно передано.\n\n" +
                "Ми зв'яжемося з вами найближчим часом 🤝",
                {
                    reply_markup: mainMenu()
                }
            );

            console.log(
                `Заявка #${orderId.slice(-6)} відправлена адміністратору.`
            );
        } catch (error) {
            console.error(
                "Помилка відправки заявки:",
                error
            );

            pendingOrders.delete(orderId);

            await ctx.reply(
                "⚠️ Не вдалося відправити заявку.\n\n" +
                "Будь ласка, спробуйте ще раз.",
                {
                    reply_markup: mainMenu()
                }
            );
        }

        return;
    }

    // ========================================
    // Клиент хочет изменить заявку
    // ========================================

    if (data === "order:edit") {
        const state = orderStates.get(userId);

        if (!state) {
            await ctx.reply(
                "⚠️ Заявку не знайдено.\n\n" +
                "Почніть оформлення ще раз.",
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
    // Клиент отменяет заявку
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

    // ========================================
    // Администратор принимает заявку
    // ========================================

    if (data.startsWith("admin:accept:")) {
        // Проверяем, что кнопку нажал именно ты
        if (userId !== ADMIN_CHAT_ID) {
            await ctx.answerCallbackQuery({
                text: "⛔ Доступ заборонено."
            });

            return;
        }

        const orderId = data.split(":")[2];
        const order = pendingOrders.get(orderId);

        if (!order) {
            await ctx.reply(
                "⚠️ Цю заявку вже оброблено або не знайдено."
            );

            return;
        }

        try {
            await bot.api.sendMessage({
                chat_id: order.userId,
                text:
                    "✅ ВАШУ ЗАЯВКУ ПРИЙНЯТО\n\n" +
                    "Дякуємо, " +
                    order.name +
                    "!\n\n" +
                    "Ми взяли ваше замовлення в роботу.\n" +
                    "Найближчим часом з вами зв'яжуться 🤝"
            });

            await ctx.reply(
                "✅ Заявку #" +
                orderId.slice(-6) +
                " взято в роботу."
            );

            pendingOrders.delete(orderId);
        } catch (error) {
            console.error(
                "Помилка повідомлення клієнту:",
                error
            );
        }

        return;
    }

    // ========================================
    // Администратор отклоняет заявку
    // ========================================

    if (data.startsWith("admin:reject:")) {
        // Проверяем, что кнопку нажал именно ты
        if (userId !== ADMIN_CHAT_ID) {
            await ctx.answerCallbackQuery({
                text: "⛔ Доступ заборонено."
            });

            return;
        }

        const orderId = data.split(":")[2];
        const order = pendingOrders.get(orderId);

        if (!order) {
            await ctx.reply(
                "⚠️ Цю заявку вже оброблено або не знайдено."
            );

            return;
        }

        try {
            await bot.api.sendMessage({
                chat_id: order.userId,
                text:
                    "ℹ️ ЩОДО ВАШОЇ ЗАЯВКИ\n\n" +
                    "Дякуємо за звернення.\n\n" +
                    "На жаль, наразі ми не можемо взяти це замовлення в роботу."
            });

            await ctx.reply(
                "❌ Заявку #" +
                orderId.slice(-6) +
                " відхилено."
            );

            pendingOrders.delete(orderId);
        } catch (error) {
            console.error(
                "Помилка повідомлення клієнту:",
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