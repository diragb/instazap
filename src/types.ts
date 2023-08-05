export enum MESSAGE_TYPE {
  REEL = 'REEL',
  TEXT = 'TEXT',
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  POST_PHOTO = 'POST_PHOTO',
  POST_VIDEO = 'POST_VIDEO',
  CAROUSEL = 'CAROUSEL',
  STORY_PHOTO = 'STORY_PHOTO',
  STORY_VIDEO = 'STORY_VIDEO',
  UNKNOWN = 'UNKNOWN',
  ERROR = 'ERROR',
}

export type VideoMessageBody = {
  videoURL: string
  thumbnailURL: string
  title: string
}

export type StructuredNonCarouselMessage = {
  type:
    MESSAGE_TYPE.TEXT |
    MESSAGE_TYPE.PHOTO |
    MESSAGE_TYPE.POST_PHOTO |
    MESSAGE_TYPE.STORY_PHOTO |
    MESSAGE_TYPE.UNKNOWN |
    MESSAGE_TYPE.ERROR
  body: string
} | {
  type:
    MESSAGE_TYPE.REEL |
    MESSAGE_TYPE.VIDEO |
    MESSAGE_TYPE.POST_VIDEO |
    MESSAGE_TYPE.STORY_VIDEO
  body: VideoMessageBody
}

export type CarouselMediaItem = {
  body: string
  mediaType: MESSAGE_TYPE.PHOTO
} | {
  body: VideoMessageBody
  mediaType: MESSAGE_TYPE.VIDEO
}

export type StructuredMessage = StructuredNonCarouselMessage | {
  type: MESSAGE_TYPE.CAROUSEL
  body: CarouselMediaItem[]
}

export interface InstaZapOptions {
  instagram: {
    credentials: {
      USERNAME: string
      PASSWORD: string
    }
    attemptReconnections?: boolean
  }
  slack: {
    channel: string
    customChannelMapper?: (message: StructuredMessage) => string
    port?: number
    credentials: {
      OAUTH_TOKEN: string
      SIGNING_SECRET: string
    }
  }
  getAllItemsFromCarousel?: boolean
  ignoreAspectRatio?: boolean
  enableLogging?: boolean
  sleep?: {
    randomSleepRange?: {
      min?: number
      max?: number
    }
    timeToNextSleepRange?: {
      min?: number
      max?: number
    }
  }
}
