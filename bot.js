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

// Храним этапы оформления заявок
const orderStates = new Map();

// Храним отправленные заявки
const pendingOrders = new Map();

// ========================================
// Главное меню
// ========================================

function mainMenu() {
    return new InlineKeyboardBuilder()
        .text("💻 Сайти", "menu:sites")
        .text("🤖 Telegram-боти", "menu:bots")
        .row()
        .text("📝 Замовити", "menu:order")
        .text("ℹ️ Про нас", "menu:about")
        .row()
        .text("📞 Контакти", "menu:contacts")
        .url("🌐 Наш сайт", "https://xxamihsite.vercel.app/")
        .build();
}

// ========================================
// Кнопка назад
// ========================================

function backMenu() {
    return new InlineKeyboardBuilder()
        .text("← Назад", "menu:home")
        .build();
}

// ========================================
// Отмена заказа
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
// Кнопки для администратора
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

// ========================================
// Стартовый экран
// ========================================

async function sendHome(ctx) {
    await ctx.reply(
        "✨ XXAMIh\n\n" +
        "Цифрові рішення для сучасного бізнесу.\n\n" +
        "Ми допомагаємо створювати:\n\n" +
        "💻 Сучасні сайти\n" +
        "🤖 Telegram-боти\n" +
        "⚙️ Автоматизацію\n\n" +
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
// Обработка обычных сообщений
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

        await sendHome(ctx);

        return;
    }

    // ========================================
    // Проверяем состояние заявки
    // ========================================

    const state = orderStates.get(userId);

    if (!state) {
        await ctx.reply(
            "🤔 Оберіть потрібний розділ у меню 👇",
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

        await ctx.reply(
            "✅ Ім'я збережено.\n\n" +
            "2️⃣ КРОК 2 З 4\n\n" +
            "📞 Вкажіть номер телефону\n" +
            "або ваш Telegram username.\n\n" +
            "Приклад:\n" +
            "+380XXXXXXXXX\n" +
            "@username",
            {
                reply_markup: cancelOrderMenu()
            }
        );

        return;
    }

    // ========================================
    // Шаг 2 — контакт
    // ========================================

    if (state.step === "contact") {
        state.contact = text;
        state.step = "service";

        await ctx.reply(
            "✅ Контакт збережено.\n\n" +
            "3️⃣ КРОК 3 З 4\n\n" +
            "💼 Оберіть, що вам потрібно:",
            {
                reply_markup: serviceMenu()
            }
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

        orderStates.set(userId, state);

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

            "Все правильно? 👇";

        await ctx.reply(
            previewText,
            {
                reply_markup: confirmOrderMenu()
            }
        );

        return;
    }
});

// ========================================
// Обработка inline-кнопок
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

        await ctx.reply(
            "✨ XXAMIh\n\n" +
            "Оберіть потрібний розділ 👇",
            {
                reply_markup: mainMenu()
            }
        );

        return;
    }

    // ========================================
    // Сайты
    // ========================================

    if (data === "menu:sites") {
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

    // ========================================
    // Telegram-боты
    // ========================================

    if (data === "menu:bots") {
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

    // ========================================
    // Про нас
    // ========================================

    if (data === "menu:about") {
        await ctx.reply(
            "ℹ️ ПРО XXAMIh\n\n" +

            "Створюємо цифрові продукти для бізнесу.\n\n" +

            "💻 Сайти\n" +
            "🤖 Telegram-боти\n" +
            "⚙️ Автоматизація\n\n" +

            "Працюємо під конкретні завдання\n" +
            "та побажання клієнта.",
            {
                reply_markup: backMenu()
            }
        );

        return;
    }

    // ========================================
    // Контакты
    // ========================================

    if (data === "menu:contacts") {
        await ctx.reply(
            "📞 КОНТАКТИ\n\n" +

            "💬 Telegram:\n" +
            "@Tuzkozirn1\n" +
            "@xxamih\n\n" +

            "Напишіть нам — обговоримо ваше завдання.",
            {
                reply_markup: backMenu()
            }
        );

        return;
    }

    // ========================================
    // Начало заказа
    // ========================================

    if (data === "menu:order") {
        orderStates.set(userId, {
            step: "name"
        });

        await ctx.reply(
            "📝 НОВЕ ЗАМОВЛЕННЯ\n\n" +

            "Оформимо заявку всього за 4 кроки.\n\n" +

            "1️⃣ КРОК 1 З 4\n\n" +

            "👤 Як вас звати?",
            {
                reply_markup: cancelOrderMenu()
            }
        );

        return;
    }

    // ========================================
    // Выбор услуги
    // ========================================

    if (data.startsWith("service:")) {
        const state = orderStates.get(userId);

        if (!state || state.step !== "service") {
            await ctx.reply(
                "⚠️ Почніть оформлення заявки ще раз.",
                {
                    reply_markup: mainMenu()
                }
            );

            return;
        }

        const serviceType = data.split(":")[1];

        if (serviceType === "site") {
            state.service = "💻 Сайт";
        }

        if (serviceType === "bot") {
            state.service = "🤖 Telegram-бот";
        }

        if (serviceType === "auto") {
            state.service = "⚙️ Автоматизація";
        }

        if (serviceType === "other") {
            state.service = "📦 Інше";
        }

        state.step = "description";

        orderStates.set(userId, state);

        await ctx.reply(
            "✅ Послугу вибрано.\n\n" +

            "4️⃣ КРОК 4 З 4\n\n" +

            "📝 Розкажіть трохи про ваше завдання.\n\n" +

            "Наприклад:\n" +
            "«Потрібен сайт для магазину одягу»\n\n" +

            "Опишіть усе, що вважаєте важливим 👇",
            {
                reply_markup: cancelOrderMenu()
            }
        );

        return;
    }

    // ========================================
    // Отмена
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
    // Изменить заявку
    // ========================================

    if (data === "order:edit") {
        const state = orderStates.get(userId);

        if (!state) {
            await ctx.reply(
                "⚠️ Заявку не знайдено.",
                {
                    reply_markup: mainMenu()
                }
            );

            return;
        }

        orderStates.set(userId, {
            step: "name"
        });

        await ctx.reply(
            "✏️ ЗМІНА ЗАЯВКИ\n\n" +
            "Почнемо заповнення заново.\n\n" +
            "1️⃣ КРОК 1 З 4\n\n" +
            "👤 Як вас звати?",
            {
                reply_markup: cancelOrderMenu()
            }
        );

        return;
    }

    // ========================================
    // Подтверждение заявки
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
        const shortOrderId = orderId.slice(-6);

        const orderText =
            "📩 НОВА ЗАЯВКА\n\n" +

            "🔢 Номер: #" +
            shortOrderId +
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
            name: state.name,
            orderId: orderId
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

                "Вашу заявку #" +
                shortOrderId +
                " успішно передано.\n\n" +

                "Ми зв'яжемося з вами найближчим часом 🤝",
                {
                    reply_markup: mainMenu()
                }
            );

            console.log(
                `Заявка #${shortOrderId} відправлена адміністратору.`
            );
        } catch (error) {
            console.error(
                "Помилка відправки заявки:",
                error
            );

            pendingOrders.delete(orderId);

            await ctx.reply(
                "⚠️ Не вдалося відправити заявку.\n\n" +
                "Спробуйте ще раз.",
                {
                    reply_markup: mainMenu()
                }
            );
        }

        return;
    }

    // ========================================
    // Админ — взять в работу
    // ========================================

    if (data.startsWith("admin:accept:")) {
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
                "⚠️ Заявку вже оброблено або не знайдено."
            );

            return;
        }

        try {
            await bot.api.sendMessage({
                chat_id: order.userId,
                text:
                    "✅ ВАШЕ ЗАМОВЛЕННЯ ПРИЙНЯТО\n\n" +
                    "Дякуємо, " +
                    order.name +
                    "!\n\n" +
                    "Ми взяли вашу заявку в роботу.\n" +
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
    // Админ — отклонить заявку
    // ========================================

    if (data.startsWith("admin:reject:")) {
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
                "⚠️ Заявку вже оброблено або не знайдено."
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