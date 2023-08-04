// Packages:
import { IgApiClient } from 'instagram-private-api'
import { withRealtime } from 'instagram_mqtt'
import { App } from '@slack/bolt'
import { handleNewMessages, login } from './utils'


// Typescript:
import { InstaZapOptions } from './types'


// Functions:
const InstaZap = async (options: InstaZapOptions) => {
  const ig = withRealtime(new IgApiClient())
  ig.state.generateDevice(options.instagram.credentials.USERNAME)
  const slack = new App({
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

  ig.realtime.on('error', console.error)
  ig.realtime.on('close', () => console.error('⚡ Instagram RealtimeClient closed'))
  await ig.realtime.connect({
    irisData: await ig.feed.directInbox().request(),
  })

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
}


// Exports:
export default InstaZap