// Packages:
import 'dotenv/config'
import { IgApiClient } from 'instagram-private-api'
import { withRealtime } from 'instagram_mqtt'
import { App } from '@slack/bolt'
import MockSlackApp from './testing'
import {
  attemptReconnection,
  connectToRealtime,
  handleNewMessages,
  login,
  startRandomSleepService
} from './utils'


// Typescript:
import { InstaZapOptions } from './types'


// Functions:
const InstaZap = async (options: InstaZapOptions) => {
  const ig = withRealtime(new IgApiClient())
  ig.state.generateDevice(options.instagram.credentials.USERNAME)
  const slack = options.slack.mock ? MockSlackApp() : new App({
    token: options.slack.credentials.OAUTH_TOKEN,
    signingSecret: options.slack.credentials.SIGNING_SECRET
  })

  console.log('⚡ Starting Slack Bot...')
  await slack.start(options.slack.port || 3000)
  console.log('⚡ Started Slack Bot')
  console.log('⚡ Logging in to Instagram...')
  const loggedInUser = await login(
    ig,
    options.instagram.credentials.USERNAME,
    options.instagram.credentials.PASSWORD
  )
  if (!loggedInUser) {
    console.error('⚡ There was some error while logging in to Instagram')
    return
  }
  console.log('⚡ Ready')

  ig.realtime.on('message', async ({ message }) => await handleNewMessages(ig, slack, message, options))
  // ig.realtime.on('message', async ({ message }) => console.log((message['media_share'] as any)['carousel_media']))

  ig.realtime.on('error', console.error)
  ig.realtime.on('close', async () => {
    console.error('⚡ Instagram RealtimeClient closed')
    await attemptReconnection(ig)
  })
  if (!await connectToRealtime(ig)) {
    console.error(`⚡ Turning off InstaZap - Please restart service manually`)
    return
  }

  // Simulate turning the device off after 2s and turning it back on after another 2s
  setTimeout(() => {
    console.log('⚡ Device turned off')
    // From now on, you won't receive any realtime-data as you *aren't in the app*
    // the keepAliveTimeout is somehow a 'constant' by instagram
    ig.realtime.direct.sendForegroundState({
      inForegroundApp: false,
      inForegroundDevice: false,
      keepAliveTimeout: 900,
    })
  }, 2000)

  setTimeout(() => {
    console.log('⚡ Device turned on')
    ig.realtime.direct.sendForegroundState({
      inForegroundApp: true,
      inForegroundDevice: true,
      keepAliveTimeout: 60,
    })
  }, 4000)

  startRandomSleepService(ig, options)
}


// Exports:
export default InstaZap

// Testing (comment it out):
// InstaZap({
//   instagram: {
//     credentials: {
//       USERNAME: process.env['IG_USERNAME'] as string,
//       PASSWORD: process.env['IG_PASSWORD'] as string,
//     }
//   },
//   slack: {
//     channel: 'C05L8T0JMQA',
//     credentials: {
//       OAUTH_TOKEN: process.env['SLACK_BOT_TOKEN'] as string,
//       SIGNING_SECRET: process.env['SLACK_SIGNING_SECRET'] as string,
//     }
//   }
// })
