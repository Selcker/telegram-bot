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

// ========================================
// Редактирование текущего сообщения
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

async function editOrderMessage(userId, messageId, text, replyMarkup) {
    await bot.api.editMessageText({
        chat_id: userId,
        message_id: messageId,
        text: text,
        reply_markup: replyMarkup
    });
}

// ========================================
// Стартовое сообщение
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
// Обычные сообщения
// ========================================
function containsAny(text, words) {
    return words.some((word) => text.includes(word));
}
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
    // Текущее состояние заказа
    // ========================================

    const state = orderStates.get(userId);

// ========================================
// Автоматическое понимание сообщений
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
        await ctx.reply(
            "✨ XXAMIh\n\n" +
            "Вітаємо!\n\n" +
            "Я допоможу вам дізнатися більше про наші\n" +
            "послуги або одразу оформити заявку.\n\n" +
            "Оберіть потрібний розділ 👇",
            {
                reply_markup: mainMenu()
            }
        );

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
            "зробити замовлення",
            "нужен сайт",
            "потрібен сайт",
            "нужен бот",
            "потрібен бот"
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
            "web site",
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

    // Контакты
    if (
        containsAny(normalizedText, [
            "контакт",
            "контакты",
            "контакти",
            "связаться",
            "зв'язатися",
            "зв’язатися",
            "телефон",
            "написать вам",
            "написати вам"
        ])
    ) {
        await ctx.reply(
            "📞 КОНТАКТИ\n\n" +
            "Потрібен сайт або Telegram-бот?\n\n" +
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

    // О нас
    if (
        containsAny(normalizedText, [
            "кто вы",
            "кто вы такие",
            "о вас",
            "про вас",
            "хто ви",
            "про вас",
            "розкажіть про вас"
        ])
    ) {
        await ctx.reply(
            "ℹ️ ПРО XXAMIh\n\n" +
            "Створюємо цифрові продукти\n" +
            "для сучасного бізнесу.\n\n" +
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

    // Наш сайт
    if (
        containsAny(normalizedText, [
            "наш сайт",
            "ваш сайт",
            "ссылка на сайт",
            "силка на сайт",
            "посмотреть сайт",
            "перейти на сайт",
            "портфолио",
            "портфоліо"
        ])
    ) {
        await ctx.reply(
            "🌐 XXAMIh\n\n" +
            "Наш сайт:\n\n" +
            "https://xxamihsite.vercel.app/",
            {
                reply_markup: backMenu()
            }
        );

        return;
    }

    // Неизвестный запрос
    await ctx.reply(
        "🤔 Не зовсім зрозумів вас.\n\n" +
        "Спробуйте написати, наприклад:\n\n" +
        "💻 «Хочу сайт»\n" +
        "🤖 «Потрібен Telegram-бот»\n" +
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

        orderStates.set(userId, state);

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

        orderStates.set(userId, state);

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

    await ctx.answerCallbackQuery();

    if (!data) {
        return;
    }

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
            "⚙️ Автоматизацію\n\n" +
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
            "⚙️ Автоматизація\n\n" +
            "Працюємо під конкретні завдання\n" +
            "та побажання клієнта.",
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
            "@xxamih\n\n" +
            "Напишіть нам — обговоримо ваше завдання.",
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

        await editOrderMessage(
            userId,
            state.messageId,
            "📝 НОВЕ ЗАМОВЛЕННЯ\n\n" +
            "✅ Послугу вибрано.\n\n" +
            "4️⃣ КРОК 4 З 4\n\n" +
            "💼 " + state.service + "\n\n" +
            "📝 Тепер розкажіть трохи про ваше завдання.\n\n" +
            "Наприклад:\n" +
            "«Потрібен сайт для магазину одягу»\n\n" +
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

            await editOrderMessage(
                userId,
                state.messageId,
                "🎉 ЗАЯВКУ ВІДПРАВЛЕНО!\n\n" +
                "Дякуємо, " +
                state.name +
                "!\n\n" +
                "Вашу заявку #" +
                shortOrderId +
                " успішно передано.\n\n" +
                "Ми зв'яжемося з вами найближчим часом 🤝",
                mainMenu()
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

            await bot.api.editMessageText({
                chat_id: ADMIN_CHAT_ID,
                message_id: ctx.callbackQuery.message.message_id,
                text:
                    "✅ ЗАЯВКА #" +
                    orderId.slice(-6) +
                    "\n\n" +
                    "Статус: В РОБОТІ 🛠"
            });

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
    // Админ — отклонить
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

            await bot.api.editMessageText({
                chat_id: ADMIN_CHAT_ID,
                message_id: ctx.callbackQuery.message.message_id,
                text:
                    "❌ ЗАЯВКА #" +
                    orderId.slice(-6) +
                    "\n\n" +
                    "Статус: ВІДХИЛЕНО"
            });

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