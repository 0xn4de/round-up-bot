const { Telegraf } = require('telegraf');
const { EmbedBuilder, WebhookClient } = require('discord.js');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const webhook = new WebhookClient({url: process.env.WEBHOOK_URL});
const channel = process.env.TELEGRAM_CHANNEL;
let postData = {}; // Save message data for edits

bot.use((ctx, next) => {
    if (ctx.update.channel_post) {
        handleMessage(ctx.update.channel_post, false)
    } else if (ctx.update.edited_channel_post) {
        handleMessage(ctx.update.edited_channel_post, true)
    }
    next();
});



async function handleMessage(ctx, isEdit) {
    if (ctx.chat.id != channel) return // Check if message is from correct channel
    const message_id = isEdit ? ctx.message_id : ctx.message_id
    if (isEdit && !postData[message_id]) return; // No previous message data, can't edit

    const text = ctx.text
    let boldEntities = []
    ctx.entities?.forEach(e => {if(e.type == 'bold') boldEntities.push(e.offset-1)})
    const categorizedText = await splitTextWithBold(text, boldEntities)

    const data = categorizedText.map(category => {
        const [title, ...lines] = category.split("\n");
        
        for (let i = 0; i < lines.length - 1; i++) {
            if (lines[i + 1].startsWith("https://twitter.com")) {
                const twitterPoster = lines[i + 1].split("/")[3]; // Get poster name from URL
                lines[i] = `[${lines[i]}](${lines[i + 1]}) (${twitterPoster})`;
                lines.splice(i + 1, 1);
            }
        }
      
        const news = lines.join("\n");
        return [title, news];
    });

    // Create embeds
    const embeds = data
    .filter(m => m[0].length > 0)
    .map(m => {
        const embed = new EmbedBuilder().setTitle(m[0]).setColor("#0061EC");
        if (m[1].length > 0) {
            embed.setDescription(m[1]);
        }
        return embed;
    });
    sendMessages(embeds, isEdit, message_id)

}

// Send webhook messages
async function sendMessages(embeds, isEdit, message_id) {
    if (isEdit) {
        if (embeds.length > 10 && postData[message_id].length === 2) { // check if 
            const [msg, msg2] = await Promise.all([
                webhook.editMessage(postData[message_id][0], { embeds: embeds.slice(0, 10) }),
                webhook.editMessage(postData[message_id][1], { embeds: embeds.slice(10) })
            ]);
            postData[message_id] = [msg.id, msg2.id];
        } else if (embeds.length < 10) {
            if (postData[message_id].length === 2) { // Edit first, delete second if it goes from 2 -> 1 embed
                const [msg,] = await Promise.all([
                    webhook.editMessage(postData[message_id][0], { embeds }),
                    webhook.deleteMessage(postData[message_id][1])
                ]);
                postData[message_id] = [msg.id];
            } else {
                const msg = await webhook.editMessage(postData[message_id][0], { embeds });
                postData[message_id] = [msg.id];
            }
        }
        // TODO: figure out way to do messages that go from 1 embed to 2 through edit (rare but possible occurrence)
    } else {
        if (embeds.length > 10) {
            const [msg, msg2] = await Promise.all([
                webhook.send({ embeds: embeds.slice(0, 10) }),
                webhook.send({ embeds: embeds.slice(10) })
            ]);
            postData[message_id] = [msg.id, msg2.id];
        } else {
            const msg = await webhook.send({ embeds });
            postData[message_id] = [msg.id];
        }
    }
}

// split up text into categories based on bold text location (category titles)
async function splitTextWithBold(text, boldPositions) {
    const parts = [];
    let startIndex = 0;
    
    for (const boldIndex of boldPositions) {
        // Add the plain text before the bold part
        const plainText = text.substring(startIndex, boldIndex);
        parts.push(plainText);
        
        // Add the bold part
        const boldText = text.substring(boldIndex, boldIndex + 1);
        parts.push(boldText);
        
        // Update the start index for the next iteration
        startIndex = boldIndex + 1;
    }
    
    // Add the remaining plain text after the last bold part
    const remainingText = text.substring(startIndex);
    parts.push(remainingText);
    
    return parts;
}

// Start the bot
bot.startPolling();