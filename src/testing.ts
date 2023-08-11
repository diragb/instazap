// Typescript:
import { App } from '@slack/bolt'
import { StringIndexed } from '@slack/bolt/dist/types/helpers'


// Functions:
const MockSlackApp = () => {
  return {
    start: (port: number) => console.log(`🧪 Mock Slack App starting at Port ${ port }`),
    client: {
      files: {
        uploadV2: async (options: any) => console.log(options.filename)
      },
      chat: {
        postMessage: async (options: any) => console.log(options.blocks[0].text.text)
      }
    }
  } as unknown as App<StringIndexed>
}


// Exports:
export default MockSlackApp
