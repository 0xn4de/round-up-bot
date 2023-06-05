# DefiLlama round-up bot
A bot that feeds the daily DefiLlama round-up message from Telegram to Discord


How it works:
- Poll Telegram for new round-up messages (or edits)
- Split text up by news category (DeFi, MEV etc)
- Make each category and its news into an embed
- Edit or send a new message containing the round-up split into categorized embeds

**NOTE**: requires **ONLY** category titles to be in bold, otherwise embed titles will mess up

[Before](https://github.com/0xn4de/round-up-bot/assets/109149873/eb8b6880-f3bb-4ac9-bab0-973aec74d627) and [After](https://github.com/0xn4de/round-up-bot/assets/109149873/66d3559e-3c00-4bd8-b2f4-869ea69933a2)

## Usage
Put your variables in .env (below)

Run `npm install`

Run `node index.js`


## Environment Variables
The following Environment Variables are required to be placed in .env:

`WEBHOOK_URL` - Discord Webhook URL for channel to feed round-up to

`TELEGRAM_TOKEN` - Token of Telegram bot thats added in round-up channel

`TELEGRAM_CHANNEL` - ID of Telegram channel to get round-ups from ([how to get it](https://neliosoftware.com/content/help/how-do-i-get-the-channel-id-in-telegram/))
