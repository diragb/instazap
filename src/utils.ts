// Packages:
import Bluebird from 'bluebird'
import lodash from 'lodash'
import axios from 'axios'
import { Readable } from 'stream'

// Typescript:
import { IgApiClientRealtime, MessageSyncMessage } from 'instagram_mqtt'
import { IgApiClient } from 'instagram-private-api'
import { StringIndexed } from '@slack/bolt/dist/types/helpers'
import {
  CarouselMediaItem,
  InstaZapOptions,
  MESSAGE_TYPE,
  StructuredMessage,
  VideoMessageBody
} from './types'
import { App } from '@slack/bolt'


// Functions:
export const facebookOta = async (ig: IgApiClient) => {
  const uid = ig.state.cookieUserId
  const { body } = await ig.request.send({
    url: '/api/v1/facebook_ota/',
    qs: {
      fields: ig.state.fbOtaFields,
      custom_user_id: uid,
      signed_body: ig.request.signature('') + '.',
      ig_sig_key_version: ig.state.signatureVersion,
      version_code: ig.state.appVersionCode,
      version_name: ig.state.appVersion,
      custom_app_id: ig.state.fbOrcaApplicationId,
      custom_device_id: ig.state.uuid,
    },
  })
  return body
}

export const executeRequestsFlow = async ({
  requests,
  concurrency = 1,
  toShuffle = true
}: {
  requests: (() => Promise<any>)[]
  concurrency?: number
  toShuffle?: boolean
}) => {
  if (toShuffle) {
    requests = (0, lodash.shuffle)(requests);
  }
  await Bluebird.map(requests, request => request(), { concurrency });
}

export const login = async (ig: IgApiClient, username: string, password: string) => {
  try {
    try {
      await ig.simulate.preLoginFlow()
    } catch(e) {
      console.log('⚡ Pre-login flow failed, proceeding with login')
    }
    const loggedInUser = await ig.account.login(username, password)
    process.nextTick(async () => {
      const requests = [
        () => ig.zr.tokenResult(),
        () => ig.launcher.postLoginSync(),
        () => ig.qe.syncExperiments(),
        () => ig.attribution.logAttribution(),
        () => ig.attribution.logResurrectAttribution(),
        () => ig.loom.fetchConfig(),
        () => ig.linkedAccount.getLinkageStatus(),
        () => ig.feed.timeline().request({ recoveredFromCrash: '1', reason: 'cold_start_fetch' }),
        () => ig.fbsearch.recentSearches(),
        () => ig.direct.rankedRecipients('reshare'),
        () => ig.direct.rankedRecipients('raven'),
        () => ig.direct.getPresence(),
        () => ig.feed.directInbox().request(),
        () => ig.media.blocked(),
        () => ig.qp.batchFetch(),
        () => ig.qp.getCooldowns(),
        () => ig.user.arlinkDownloadInfo(),
        () => ig.discover.topicalExplore(),
        () => ig.discover.markSuSeen(),
        () => facebookOta(ig),
        () => ig.status.getViewableStatuses(),
      ]
      await executeRequestsFlow({
        requests,
      })
    })
    return loggedInUser
  } catch (err) {
    console.error(err)
    return false
  }
}

export const getInstagramHeaders = async (ig: IgApiClientRealtime) => {
  const response = await axios.get('https://www.instagram.com/apple/')
  const html = response.data as string
  const CSRFToken = html?.split('csrf_token')[1]?.split('\\"')[2]
  const IGAppID = html?.split('X-IG-App-ID')[1]?.split(',')[0]?.replace(/\"/g, '').replace(':', '')
  return {
      ...response.headers,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:104.0) 20100101 Firefox/103.0',
      'Accept': '*/*',
      'Accept-Language': 'en,en-US;q=0.3',
      'X-Csrftoken': CSRFToken,
      'X-IG-App-ID': IGAppID,
      'X-ASBD-ID': '198337',
      'X-IG-WWW-Claim': 'hmac.AR2vqJv-rMUJZ0y3MD6rTCGpFTZHRY8OD0gGoEPuHcCI9jtN',
      'Origin': 'https://www.instagram.com',
      'DNT': '1',
      'Alt-Used': 'i.instagram.com',
      'Connection': 'keep-alive',
      'Referer': 'https://www.instagram.com/',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="102"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'Sec-GPC': '1',
      'Cookie': ig.state.cookieJar.getCookieString('https://www.instagram.com'),
      // 'Cookie': `ig_did=EFE154B5-6D69-4E69-9AFC-8B6C4E938A35; mid=YfdjCAALAAH1cxL_Tk4JafHaE9e0; datr=0JKYYnGSpl0d6uy4UFrCxtFm; fbm_124024574287414=base_domain=.instagram.com; ig_nrcb=1; shbid="7514\\05450139324098\\0541722437884:01f75263f960e5ace4179bdafc75fd93491ac702986dc1adbfdc7d512e1e1e63b233b76e"; shbts="1690901884\\05450139324098\\0541722437884:01f7eb77b8427eea7d34afdb7b68800b5d44198ea843b682461e806fce8fadc0dae3e093"; ds_user_id=52728292684; sessionid=52728292684:wWcHL4O2Rs7mhx:13:AYcDi-IzWXpur7cAB6c3Ob-RttDM3NhKJNn_cxaf6w; csrftoken=alBJ5ckhgruy9CG9LvQntYze3dZANmUB; rur="LDC\\05452728292684\\0541722545415:01f725d358c1ad8ee05d9c77c2c713b0633e8924b628b326a766b2c4fa751543df471d92"`
  }
}

export const getLargestCandidate = (candidates: any[], options?: InstaZapOptions) => {
  if (options?.ignoreAspectRatio) return candidates.sort((candidateA, candidateB) => candidateB.width - candidateA.width)[0]
  return candidates[0]
}

export const handlePostVideo = (media: any, options?: InstaZapOptions): {
  type: MESSAGE_TYPE.POST_VIDEO,
  body: VideoMessageBody
} => ({
  type: MESSAGE_TYPE.POST_VIDEO,
  body: {
    thumbnailURL: getLargestCandidate(media.video_versions, options).url as string,
    title: media.user.username,
    videoURL: getLargestCandidate(media.video_versions, options).url as string
  }
})

export const handleMediaShare = async (
  ig: IgApiClientRealtime,
  message: any,
  options?: InstaZapOptions
): Promise<StructuredMessage> => {
  try {
    const response = await axios
      .get(`https://www.instagram.com/api/v1/direct_v2/threads/${ message.thread_id }/get_items/?item_ids=%5B%22${ message.item_id }%22%5D&original_message_client_contexts=%5B%22${ (message as any).client_context }%22%5D`, {
      headers: await getInstagramHeaders(ig),
      method: 'GET'
    })
    const media_share = response.data.items?.[0].media_share
    const isCarousel = media_share.carousel_media_count > 0 || media_share.carousel_media?.length > 1
    if (isCarousel) {
      if (options?.getAllItemsFromCarousel) {
        const carouselLength = media_share.carousel_media_count ?? media_share.carousel_media?.length
        const body: CarouselMediaItem[] = []
        Array.from(Array(carouselLength)).forEach((_, i) => {
          const isVideo = media_share.carousel_media[i].media_type === 2
          if (isVideo) {
            body.push({
              body: {
                thumbnailURL: getLargestCandidate(media_share.carousel_media[i].image_versions2.candidates, options).url as string,
                title: media_share.user.username,
                videoURL: getLargestCandidate(media_share.video_versions, options).url as string
              },
              mediaType: MESSAGE_TYPE.VIDEO
            })
          } else {
            body.push({
              body: getLargestCandidate(media_share.carousel_media[i].image_versions2.candidates, options).url as string,
              mediaType: MESSAGE_TYPE.PHOTO
            })
          }
        })
        return {
          type: MESSAGE_TYPE.CAROUSEL,
          body
        }
      } else {
        const carouselChildMediaID = media_share.carousel_share_child_media_id.split('_')[0]
        const focusedCarouselChild = (media_share.carousel_media as any[]).find(media => media.pk === carouselChildMediaID)
        const isVideo = focusedCarouselChild.media_type === 2
        if (isVideo) return handlePostVideo(focusedCarouselChild, options)
        else return {
          type: MESSAGE_TYPE.POST_PHOTO,
          body: getLargestCandidate(focusedCarouselChild.image_versions2.candidates, options).url as string
        }
      }
    } else {
      const isVideo = media_share.media_type === 2
      if (isVideo) return handlePostVideo(media_share, options)
      else return {
        type: MESSAGE_TYPE.POST_PHOTO,
        body: getLargestCandidate(media_share.image_versions2.candidates, options).url as string
      }
    }
  } catch(err) {
    console.error(err)
    return {
      type: MESSAGE_TYPE.TEXT,
      body: 'Unknown Message Type'
    }
  }
}

export const handleStoryShare = async (
  message: any,
  options?: InstaZapOptions
): Promise<StructuredMessage> => {
  const media = message.story_share.media
  const isVideo = media.media_type === 2
  if (isVideo) return {
    type: MESSAGE_TYPE.STORY_VIDEO,
    body: {
      thumbnailURL: getLargestCandidate(media.image_versions2.candidates, options).url,
      title: media.user.username,
      videoURL: getLargestCandidate(media.video_versions, options).url as string
    }
  }
  else return {
    type: MESSAGE_TYPE.STORY_PHOTO,
    body: getLargestCandidate(media.image_versions2.candidates, options).url as string
  }
}

export const getStructuredMessage = async (
  ig: IgApiClientRealtime,
  message: MessageSyncMessage,
  options?: InstaZapOptions
): Promise<StructuredMessage> => {
  if ((message as any).processed_business_suggestion) return {
    type: MESSAGE_TYPE.TEXT,
    body: 'Unknown Message Type'
  }
  if (message.item_type === 'text') return {
    type: MESSAGE_TYPE.TEXT,
    body: message.text ?? ''
  }
  if (message.item_type === 'placeholder') {
    if ((message as any).placeholder.message === 'Use the latest version of the Instagram app to see this reel.') {
      try {
        const response = await axios
          .get(`https://www.instagram.com/api/v1/direct_v2/threads/${ message.thread_id }/get_items/?item_ids=%5B%22${ message.item_id }%22%5D&original_message_client_contexts=%5B%22${ (message as any).client_context }%22%5D`, {
          headers: await getInstagramHeaders(ig),
          method: 'GET'
        })
        const media = response.data.items?.[0].clip.clip
        return {
          type: MESSAGE_TYPE.REEL,
          body: {
            thumbnailURL: getLargestCandidate(media.image_versions2.candidates, options).url as string,
            title: media.user.username,
            videoURL: getLargestCandidate(media.video_versions, options).url as string,
          }
        }
      } catch(err) {
        console.error(err)
        return {
          type: MESSAGE_TYPE.TEXT,
          body: 'Unknown Message Type'
        }
      }
    } else if ((message as any).placeholder.message === 'Use the latest version of the Instagram app to see this type of message.') {
      try {
        return await handleMediaShare(ig, message, options)
      } catch(err) {
        console.error(err)
        return {
          type: MESSAGE_TYPE.TEXT,
          body: 'Unknown Message Type'
        }
      }
    }
  }
  if (message.item_type === 'media_share') {
    return await handleMediaShare(ig, message, options)
  }
  if (message.item_type === 'story_share') {
    return await handleStoryShare(message, options)
  }
  return {
    type: MESSAGE_TYPE.TEXT,
    body: 'Unknown Message Type'
  }
}

export const isPhoto = (type: MESSAGE_TYPE) => [
  MESSAGE_TYPE.PHOTO,
  MESSAGE_TYPE.POST_PHOTO,
  MESSAGE_TYPE.STORY_PHOTO,
].includes(type)

export const isVideo = (type: MESSAGE_TYPE) => [
  MESSAGE_TYPE.POST_VIDEO,
  MESSAGE_TYPE.REEL,
  MESSAGE_TYPE.STORY_VIDEO,
  MESSAGE_TYPE.VIDEO,
].includes(type)

export const uploadPhoto = async (
  slack: App<StringIndexed>,
  URL: string,
  channel: string,
  options: InstaZapOptions
) => {
  await slack.client.files.uploadV2({
    token: options.slack.credentials.OAUTH_TOKEN,
    channel_id: channel,
    file: Readable.from((await axios.get(URL, {
      responseType: 'stream'
    })).data),
    filename: URL.split('/')?.slice(-1)?.[0]?.split('?')?.[0] ?? 'photo.jpg'
  })
}

export const uploadVideo = async (
  slack: App<StringIndexed>,
  URL: string,
  channel: string,
  options: InstaZapOptions
) => {
  await slack.client.files.uploadV2({
    token: options.slack.credentials.OAUTH_TOKEN,
    channel_id: channel,
    file: Readable.from((await axios.get(URL, {
      responseType: 'stream'
    })).data),
    filename: URL.split('/')?.slice(-1)?.[0]?.split('?')?.[0] ?? 'video.mp4',
  })
}

export const handleNewMessages = async (
  ig: IgApiClientRealtime,
  slack: App<StringIndexed>,
  message: MessageSyncMessage,
  options: InstaZapOptions
) => {
  const structuredMessage = await getStructuredMessage(ig, message, options)
  if (options.enableLogging) console.log('⚡ Received Instagram message: ', structuredMessage)
  const channel = options.slack.customChannelMapper !== undefined ?
    options.slack.customChannelMapper(structuredMessage) :
    options.slack.channel
  const messageHasMultipleNonTextMedia = Array.isArray(structuredMessage.body) || structuredMessage.type === MESSAGE_TYPE.CAROUSEL
  if (messageHasMultipleNonTextMedia) {
    try {
      for await (const item of (structuredMessage.body as CarouselMediaItem[])) {
        if (item.mediaType === MESSAGE_TYPE.PHOTO) {
          await uploadPhoto(slack, item.body, channel, options)
        } else {
          await uploadVideo(slack, item.body.videoURL, channel, options)
        }
      }
      if (options.enableLogging) console.log('⚡ Posted media from carousel successfully!')
    } catch (err) {
      console.error(err)
    }
  } else {
    try {
      if (structuredMessage.type === MESSAGE_TYPE.TEXT) {
        await slack.client.chat.postMessage({
          token: options.slack.credentials.OAUTH_TOKEN,
          channel,
          blocks: [{
            type: 'section',
            text: {
              text: structuredMessage.body,
              type: 'plain_text'
            }
          }]
        })
      } else if (isPhoto(structuredMessage.type)) {
        await uploadPhoto(slack, structuredMessage.body as string, channel, options)
      } else if (isVideo(structuredMessage.type)) {
        await uploadVideo(slack, (structuredMessage.body as VideoMessageBody).videoURL, channel, options)
      }
      if (options.enableLogging) console.log('⚡ Posted message successfully!')
    } catch(err) {
      console.error(err)
    }
  }
}
