# InstaZap ⚡
[![npm](https://img.shields.io/badge/instazap-brightgreen.svg?style=flat-square)](https://www.npmjs.com/package/instazap)
[![npm version](https://img.shields.io/npm/v/instazap.svg?style=flat-square)](https://www.npmjs.com/package/instazap)
[![npm downloads](https://img.shields.io/npm/dm/instazap.svg?style=flat-square)](https://www.npmjs.com/package/instazap)
[![sponsors](https://img.shields.io/github/sponsors/diragb)](https://github.com/sponsors/diragb)

A straightforward bot to forward **Instagram** messages directly to your **Slack** organization.

# Usage

## Installation
Add `instazap` to your Node application.

```bash
npm install instazap --save
yarn add instazap ## or in yarn
```

**Additionally, go through the process of adding a Slack bot to your organization if you haven't made one yet. [It is pretty straightforward](#how-to-create-a-slack-bot).**

## Example
```ts
import InstaZap from 'instazap'

// Invoke it with credentials.
InstaZap({
  instagram: {
    credentials: {
      USERNAME: process.env.IG_USERNAME,
      PASSWORD: process.env.IG_PASSWORD,
    }
  },
  slack: {
    channel: process.env.SLACK_CHANNEL_ID,
    credentials: {
      OAUTH_TOKEN: process.env.SLACK_BOT_TOKEN,
      SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
    }
  }
})
```

# How To Create A Slack Bot
To create a Slack Bot, please follow these steps:
1. Login to Slack on Web.
2. Navigate to **[Your Apps](https://api.slack.com/apps?new_app=1&ref=bolt_start_hub)** and click on **Create New App** > **From scratch**.
3. Name your app and select the workspace.
4. After creating your bot, navigate to **OAuth & Permissions** (under **Features** tab on the left) and scroll down to **Scopes**.
5. Click on **Add an OAuth Scope** and add the following scopes: `channels:join`, `chat:write`, `chat:write.public`, `files:read`, `files:write`, `links.embed:write`, `links:read`, `links:write`, `reminders:read`, `reminders:write`.
6. While you're on the **OAuth & Permissions** page, install the bot to your workspace by clicking on the **Install to Workspace** button. After you've done this, copy the **Bot User OAuth Token**, this is the value for `SLACK_BOT_TOKEN`.
7. Navigate to **App Home** (under **Features** tab on the left) and enable **Home Tab** under **Show Tabs**. You can personalize the bot in the **Your App’s Presence in Slack** section as well.
8. Finally, navigate to **Basic Information** (under **Settings**) and copy the Signing Secret. This is the value for `SLACK_SIGNING_SECRET`.

Congratulations! Your Slack Bot is now ready. 🎉

# API

## instagram
`object`
### credentials
`object`
The credentials for the Instagram account.

### attemptReconnections
`boolean` - **OPTIONAL**

Handles reconnections on connection failure of any sort with the Instagram API.

## slack
`object`
### channel
`string`

This is the default channel for all your Instagram messages.

### customChannelMapper
`(message: StructuredMessage) => string` - **OPTIONAL**

If you want specific messages to go into certain channels (such as, Reels in #reels, and so on) then utilize this custom function that maps a message to a channel ID.

### mock
`boolean` - **OPTIONAL**

Set this as true if you'd like to mock the Slack app and get console logging of messages instead of them being posted to Slack channels.

## port
`number` - **OPTIONAL**

Port for Slack Bot.

### credentials
`object`
The credentials for the Slack bot.

## getAllItemsFromCarousel
`boolean` - **OPTIONAL**

Determines if all the items in a carousel post should be downloaded and posted in the channel. Default behavior is to post only the focused item in the carousel.

## ignoreAspectRatio
`boolean` - **OPTIONAL**

As the name suggests, it ignores the aspect ratio of the media and goes for the highest quality available.

## enableLogging
`boolean` - **OPTIONAL**

Enable additional logs for debugging. Error logs are unaffected by this.

## sleep
`object` - **OPTIONAL**

### randomSleepRange
`object` - **OPTIONAL**

Determines when how want the bot to sleep at the beginning of a sleep cycle, and how long you want it to be asleep. Default values work well, but feel free to play with it.

The ranges are used to generate a random time value that is eventually used - a value betweeen 2 seconds to 1.5 minutes is chosen by default.

### timeToNextSleepRange
`object` - **OPTIONAL**

Determines the time period between the bot's sleep-wake simulations. Default value of ranges is 30 mins to 3 hours. This maintains the Instagram MQTT API connection health.

# Troubleshooting
If the bot stops working at any time, it is probably because of the following reasons (listed in order of probability):
1. 🚩 **Instagram flagged your account**: This requires you to login from your mobile (or any trusted device), request for an OTP and fill it.
2. 🤕 **A malformed message was sent to Instagram**: This will pop up in the error logs. You may create a new issue for this.
3. 😪  **A malformed message was forwarded to Slack**: This will pop up in the error logs. You may create a new issue for this.

# Disclaimer
Neither the author, the contributors, nor this tool (or its underlying packages) are responsible for **any** damage that you may cause to yourself or others. Please do not use this tool for *evil* purposes.

# License
MIT