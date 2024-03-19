# Unofficial HackTheBox Discord Bot

A simple Discord bot to call details for HackTheBox machines.

## Setup

* Clone this repository `git clone https://github.com/LinusKay/hackthebox-bot`
* Install required packages `npm i` 
* [Create a Discord bot application](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) and invite it to your server
* Create a `config.json` in the project root directory, swapping in your details where required 
    * `token`: your discord bot's secret token token (https://discord.com/developers/)
    * `clientId` your discord app's Application ID (https://discord.com/developers/)
    * `guildId`: ID of the server to run the bot in
    * `hackTheBoxApiToken`: App token generated on your HackTheBox account (https://app.hackthebox.com/profile/settings)
```
    {
        "token": "DISCORD BOT TOKEN",
        "clientId": "DISCORD BOT APPLICATION ID",
        "guildId": "DISCORD SERVER ID",
        "hackTheBoxApiToken": "HACKTHEBOX APP TOKEN"
    }
```
* run `node .`

## Commands
### retired {sort} {order} {page}
View all retired machines
* `sort`: `[choice]`
    * `name`
    * `rating`
    * `user-owns`
    * `system-owns`
    * `user-difficulty`
    * `released`
* `order`: `[choice]`
    * `ascending`
    * `descending`
* `page`: `[number]`

![image](https://i.imgur.com/QMB7pnh.png)

### machine {machinename}
View details for a specific machine
* `machinename`: `[string]`

![image](https://i.imgur.com/aBYi9NE.png)