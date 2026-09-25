const { Bot, registerExpressWebhook } = require("node-telegram-bot-api");
const express = require("express");

const token = process.env.BOT_TOKEN;

if (!token) {
    console.error("BOT_TOKEN не найден!");
    process.exit(1);
}

const bot = new Bot(token);
const app = express();


// ====================
// ГЛАВНОЕ МЕНЮ
// ====================

bot.on("message", async (ctx) => {
    const text = ctx.message.text;

    console.log("Отримано:", text);


    // /start
    if (text === "/start") {
        await ctx.reply(
            "👋 Вітаємо!\n\n" +
            "💻 Ми створюємо сучасні сайти та Telegram-ботів для бізнесу.\n\n" +
            "Допоможемо вашому бізнесу виглядати професійно " +
            "та автоматизувати роботу з клієнтами.\n\n" +
            "Оберіть потрібний розділ 👇",
            {
                reply_markup: {
                    keyboard: [ 
                        ["📝 Замовити"]
                        ["💻 Створення сайтів"],
                        ["🤖 Telegram-боти"],
                        ["ℹ️ Про нас"],
                        ["📞 Контакти"],
                        ["🌐 Наш сайт"]
                    ],
                    resize_keyboard: true,
                    is_persistent: true
                }
            }
        );
    }


    // Створення сайтів
    else if (text === "💻 Створення сайтів") {
        await ctx.reply(
            "💻 Створення сайтів\n\n" +
            "Ми створюємо сайти для бізнесу:\n\n" +
            "🌐 Сайти-візитки\n" +
            "🛒 Інтернет-магазини\n" +
            "📱 Адаптивні сайти для смартфонів\n" +
            "🎨 Сучасний дизайн\n\n" +
            "Створимо сайт відповідно до ваших побажань."
        );
    }


    // Telegram-боти
    else if (text === "🤖 Telegram-боти") {
        await ctx.reply(
            "🤖 Telegram-боти для бізнесу\n\n" +
            "Створюємо ботів, які можуть:\n\n" +
            "💬 Спілкуватися з клієнтами\n" +
            "📋 Показувати послуги та ціни\n" +
            "📞 Приймати заявки\n" +
            "🔔 Надсилати повідомлення\n" +
            "⚙️ Автоматизувати роботу\n\n" +
            "Ваш бот може працювати 24/7."
        );
    } else if (text === "📝 Замовити") {
        await ctx.reply(
            "📝 Замовлення\n\n" +
            "Напишіть, що вам потрібно:\n\n" +
            "💻 Сайт\n" +
            "🤖 Telegram-бот\n" +
            "⚙️ Автоматизація\n\n" +
            "Опишіть ваше завдання — ми зв'яжемося з вами."
        );
    }


    // Про нас
    else if (text === "ℹ️ Про нас") {
        await ctx.reply(
            "ℹ️ Про нас\n\n" +
            "Ми створюємо цифрові рішення для бізнесу.\n\n" +
            "💻 Сайти\n" +
            "🤖 Telegram-боти\n" +
            "⚙️ Автоматизація\n\n" +
            "Наша мета — допомогти бізнесу розвиватися " +
            "за допомогою сучасних технологій."
        );
    }


    // Контакти
    else if (text === "📞 Контакти") {
        await ctx.reply(
            "📞 Зв'яжіться з нами\n\n" +
            "Потрібен сайт або Telegram-бот для вашого бізнесу?\n\n" +
            "💬 Telegram: @Tuzkozirn1 | @xxamih\n\n" +
            "Напишіть нам — обговоримо ваше завдання!"
        );
    }


    // Наш сайт
    else if (text === "🌐 Наш сайт") {
        await ctx.reply(
            "🌐 Наш сайт\n\n" +
            "Перегляньте наші послуги та роботи 👇\n\n" +
            "https://xxamihsite.vercel.app/"
        );
    }


    // Невідоме повідомлення
    else {
        await ctx.reply(
            "Оберіть потрібний розділ за допомогою меню 👇"
        );
    }
});


// Обработка ошибок
bot.catch((error) => {
    console.error("Помилка:", error);
});


// ====================
// TELEGRAM WEBHOOK
// ====================

registerExpressWebhook(bot, app, {
    path: "/telegram",
    allowUnauthenticated: true
});


// Проверка сервера
app.get("/", (req, res) => {
    res.send("Telegram bot is running!");
});


// ====================
// PORT ДЛЯ RENDER
// ====================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Сервер запущений на порту ${PORT}`);
});