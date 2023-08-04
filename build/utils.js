"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNewMessages = exports.uploadVideo = exports.uploadPhoto = exports.isVideo = exports.isPhoto = exports.getStructuredMessage = exports.handleStoryShare = exports.handleMediaShare = exports.handlePostVideo = exports.getLargestCandidate = exports.getInstagramHeaders = exports.login = exports.executeRequestsFlow = exports.facebookOta = void 0;
// Packages:
const bluebird_1 = __importDefault(require("bluebird"));
const lodash_1 = __importDefault(require("lodash"));
const axios_1 = __importDefault(require("axios"));
const stream_1 = require("stream");
const types_1 = require("./types");
// Functions:
const facebookOta = (ig) => __awaiter(void 0, void 0, void 0, function* () {
    const uid = ig.state.cookieUserId;
    const { body } = yield ig.request.send({
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
    });
    return body;
});
exports.facebookOta = facebookOta;
const executeRequestsFlow = ({ requests, concurrency = 1, toShuffle = true }) => __awaiter(void 0, void 0, void 0, function* () {
    if (toShuffle) {
        requests = (0, lodash_1.default.shuffle)(requests);
    }
    yield bluebird_1.default.map(requests, request => request(), { concurrency });
});
exports.executeRequestsFlow = executeRequestsFlow;
const login = (ig, username, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        try {
            yield ig.simulate.preLoginFlow();
        }
        catch (e) {
            console.log('⚡ Pre-login flow failed, proceeding with login');
        }
        const loggedInUser = yield ig.account.login(username, password);
        process.nextTick(() => __awaiter(void 0, void 0, void 0, function* () {
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
                () => (0, exports.facebookOta)(ig),
                () => ig.status.getViewableStatuses(),
            ];
            yield (0, exports.executeRequestsFlow)({
                requests,
            });
        }));
        return loggedInUser;
    }
    catch (err) {
        console.error(err);
        return false;
    }
});
exports.login = login;
const getInstagramHeaders = (ig) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.get('https://www.instagram.com/apple/');
    const html = response.data;
    const CSRFToken = html.split('csrf_token')[1].split('\\"')[2];
    const IGAppID = html.split('X-IG-App-ID')[1].split(',')[0].replaceAll('"', '').replace(':', '');
    return Object.assign(Object.assign({}, response.headers), { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:104.0) 20100101 Firefox/103.0', 'Accept': '*/*', 'Accept-Language': 'en,en-US;q=0.3', 'X-Csrftoken': CSRFToken, 'X-IG-App-ID': IGAppID, 'X-ASBD-ID': '198337', 'X-IG-WWW-Claim': 'hmac.AR2vqJv-rMUJZ0y3MD6rTCGpFTZHRY8OD0gGoEPuHcCI9jtN', 'Origin': 'https://www.instagram.com', 'DNT': '1', 'Alt-Used': 'i.instagram.com', 'Connection': 'keep-alive', 'Referer': 'https://www.instagram.com/', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="102"', 'sec-ch-ua-mobile': '?0', 'sec-ch-ua-platform': '"Linux"', 'Sec-Fetch-Dest': 'empty', 'Sec-Fetch-Mode': 'cors', 'Sec-Fetch-Site': 'same-site', 'Sec-GPC': '1', 'Cookie': ig.state.cookieJar.getCookieString('https://www.instagram.com') });
});
exports.getInstagramHeaders = getInstagramHeaders;
const getLargestCandidate = (candidates, options) => {
    if (options === null || options === void 0 ? void 0 : options.ignoreAspectRatio)
        return candidates.sort((candidateA, candidateB) => candidateB.width - candidateA.width)[0];
    return candidates[0];
};
exports.getLargestCandidate = getLargestCandidate;
const handlePostVideo = (media, options) => ({
    type: types_1.MESSAGE_TYPE.POST_VIDEO,
    body: {
        thumbnailURL: (0, exports.getLargestCandidate)(media.video_versions, options).url,
        title: media.user.username,
        videoURL: (0, exports.getLargestCandidate)(media.video_versions, options).url
    }
});
exports.handlePostVideo = handlePostVideo;
const handleMediaShare = (ig, message, options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const response = yield axios_1.default
            .get(`https://www.instagram.com/api/v1/direct_v2/threads/${message.thread_id}/get_items/?item_ids=%5B%22${message.item_id}%22%5D&original_message_client_contexts=%5B%22${message.client_context}%22%5D`, {
            headers: yield (0, exports.getInstagramHeaders)(ig),
            method: 'GET'
        });
        const media_share = (_a = response.data.items) === null || _a === void 0 ? void 0 : _a[0].media_share;
        const isCarousel = media_share.carousel_media_count > 0 || ((_b = media_share.carousel_media) === null || _b === void 0 ? void 0 : _b.length) > 1;
        if (isCarousel) {
            if (options === null || options === void 0 ? void 0 : options.getAllItemsFromCarousel) {
                const carouselLength = (_c = media_share.carousel_media_count) !== null && _c !== void 0 ? _c : (_d = media_share.carousel_media) === null || _d === void 0 ? void 0 : _d.length;
                const body = [];
                Array.from(Array(carouselLength)).forEach((_, i) => {
                    const isVideo = media_share.carousel_media[i].media_type === 2;
                    if (isVideo) {
                        body.push({
                            body: {
                                thumbnailURL: (0, exports.getLargestCandidate)(media_share.carousel_media[i].image_versions2.candidates, options).url,
                                title: media_share.user.username,
                                videoURL: (0, exports.getLargestCandidate)(media_share.video_versions, options).url
                            },
                            mediaType: types_1.MESSAGE_TYPE.VIDEO
                        });
                    }
                    else {
                        body.push({
                            body: (0, exports.getLargestCandidate)(media_share.carousel_media[i].image_versions2.candidates, options).url,
                            mediaType: types_1.MESSAGE_TYPE.PHOTO
                        });
                    }
                });
                return {
                    type: types_1.MESSAGE_TYPE.CAROUSEL,
                    body
                };
            }
            else {
                const carouselChildMediaID = media_share.carousel_share_child_media_id.split('_')[0];
                const focusedCarouselChild = media_share.carousel_media.find(media => media.pk === carouselChildMediaID);
                const isVideo = focusedCarouselChild.media_type === 2;
                if (isVideo)
                    return (0, exports.handlePostVideo)(focusedCarouselChild, options);
                else
                    return {
                        type: types_1.MESSAGE_TYPE.POST_PHOTO,
                        body: (0, exports.getLargestCandidate)(focusedCarouselChild.image_versions2.candidates, options).url
                    };
            }
        }
        else {
            const isVideo = media_share.media_type === 2;
            if (isVideo)
                return (0, exports.handlePostVideo)(media_share, options);
            else
                return {
                    type: types_1.MESSAGE_TYPE.POST_PHOTO,
                    body: (0, exports.getLargestCandidate)(media_share.image_versions2.candidates, options).url
                };
        }
    }
    catch (err) {
        console.error(err);
        return {
            type: types_1.MESSAGE_TYPE.TEXT,
            body: 'Unknown Message Type'
        };
    }
});
exports.handleMediaShare = handleMediaShare;
const handleStoryShare = (message, options) => __awaiter(void 0, void 0, void 0, function* () {
    const media = message.story_share.media;
    const isVideo = media.media_type === 2;
    if (isVideo)
        return {
            type: types_1.MESSAGE_TYPE.STORY_VIDEO,
            body: {
                thumbnailURL: (0, exports.getLargestCandidate)(media.image_versions2.candidates, options).url,
                title: media.user.username,
                videoURL: (0, exports.getLargestCandidate)(media.video_versions, options).url
            }
        };
    else
        return {
            type: types_1.MESSAGE_TYPE.STORY_PHOTO,
            body: (0, exports.getLargestCandidate)(media.image_versions2.candidates, options).url
        };
});
exports.handleStoryShare = handleStoryShare;
const getStructuredMessage = (ig, message, options) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    if (message.processed_business_suggestion)
        return {
            type: types_1.MESSAGE_TYPE.TEXT,
            body: 'Unknown Message Type'
        };
    if (message.item_type === 'text')
        return {
            type: types_1.MESSAGE_TYPE.TEXT,
            body: (_e = message.text) !== null && _e !== void 0 ? _e : ''
        };
    if (message.item_type === 'placeholder') {
        if (message.placeholder.message === 'Use the latest version of the Instagram app to see this reel.') {
            try {
                const response = yield axios_1.default
                    .get(`https://www.instagram.com/api/v1/direct_v2/threads/${message.thread_id}/get_items/?item_ids=%5B%22${message.item_id}%22%5D&original_message_client_contexts=%5B%22${message.client_context}%22%5D`, {
                    headers: yield (0, exports.getInstagramHeaders)(ig),
                    method: 'GET'
                });
                const media = (_f = response.data.items) === null || _f === void 0 ? void 0 : _f[0].clip.clip;
                return {
                    type: types_1.MESSAGE_TYPE.REEL,
                    body: {
                        thumbnailURL: (0, exports.getLargestCandidate)(media.image_versions2.candidates, options).url,
                        title: media.user.username,
                        videoURL: (0, exports.getLargestCandidate)(media.video_versions, options).url,
                    }
                };
            }
            catch (err) {
                console.error(err);
                return {
                    type: types_1.MESSAGE_TYPE.TEXT,
                    body: 'Unknown Message Type'
                };
            }
        }
        else if (message.placeholder.message === 'Use the latest version of the Instagram app to see this type of message.') {
            try {
                return yield (0, exports.handleMediaShare)(ig, message, options);
            }
            catch (err) {
                console.error(err);
                return {
                    type: types_1.MESSAGE_TYPE.TEXT,
                    body: 'Unknown Message Type'
                };
            }
        }
    }
    if (message.item_type === 'media_share') {
        return yield (0, exports.handleMediaShare)(ig, message, options);
    }
    if (message.item_type === 'story_share') {
        return yield (0, exports.handleStoryShare)(message, options);
    }
    return {
        type: types_1.MESSAGE_TYPE.TEXT,
        body: 'Unknown Message Type'
    };
});
exports.getStructuredMessage = getStructuredMessage;
const isPhoto = (type) => [
    types_1.MESSAGE_TYPE.PHOTO,
    types_1.MESSAGE_TYPE.POST_PHOTO,
    types_1.MESSAGE_TYPE.STORY_PHOTO,
].includes(type);
exports.isPhoto = isPhoto;
const isVideo = (type) => [
    types_1.MESSAGE_TYPE.POST_VIDEO,
    types_1.MESSAGE_TYPE.REEL,
    types_1.MESSAGE_TYPE.STORY_VIDEO,
    types_1.MESSAGE_TYPE.VIDEO,
].includes(type);
exports.isVideo = isVideo;
const uploadPhoto = (slack, URL, channel, options) => __awaiter(void 0, void 0, void 0, function* () {
    yield slack.client.files.uploadV2({
        token: options.slack.credentials.OAUTH_TOKEN,
        channel_id: channel,
        file: stream_1.Readable.from((yield axios_1.default.get(URL, {
            responseType: 'stream'
        })).data),
        filename: URL.split('/').slice(-1)[0].split('?')[0]
    });
});
exports.uploadPhoto = uploadPhoto;
const uploadVideo = (slack, URL, channel, options) => __awaiter(void 0, void 0, void 0, function* () {
    yield slack.client.files.uploadV2({
        token: options.slack.credentials.OAUTH_TOKEN,
        channel_id: channel,
        file: stream_1.Readable.from((yield axios_1.default.get(URL, {
            responseType: 'stream'
        })).data),
        filename: URL.split('/').slice(-1)[0].split('?')[0],
    });
});
exports.uploadVideo = uploadVideo;
const handleNewMessages = (ig, slack, message, options) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, e_1, _h, _j;
    const structuredMessage = yield (0, exports.getStructuredMessage)(ig, message, options);
    if (options.enableLogging)
        console.log('⚡ Received Instagram message: ', structuredMessage);
    const channel = options.slack.customChannelMapper !== undefined ?
        options.slack.customChannelMapper(structuredMessage) :
        options.slack.channel;
    const messageHasMultipleNonTextMedia = Array.isArray(structuredMessage.body) || structuredMessage.type === types_1.MESSAGE_TYPE.CAROUSEL;
    if (messageHasMultipleNonTextMedia) {
        try {
            try {
                for (var _k = true, _l = __asyncValues(structuredMessage.body), _m; _m = yield _l.next(), _g = _m.done, !_g; _k = true) {
                    _j = _m.value;
                    _k = false;
                    const item = _j;
                    if (item.mediaType === types_1.MESSAGE_TYPE.PHOTO) {
                        yield (0, exports.uploadPhoto)(slack, item.body, channel, options);
                    }
                    else {
                        yield (0, exports.uploadVideo)(slack, item.body.videoURL, channel, options);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_k && !_g && (_h = _l.return)) yield _h.call(_l);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (options.enableLogging)
                console.log('⚡ Posted media from carousel successfully!');
        }
        catch (err) {
            console.error(err);
        }
    }
    else {
        try {
            if (structuredMessage.type === types_1.MESSAGE_TYPE.TEXT) {
                yield slack.client.chat.postMessage({
                    token: options.slack.credentials.OAUTH_TOKEN,
                    channel,
                    blocks: [{
                            type: 'section',
                            text: {
                                text: structuredMessage.body,
                                type: 'plain_text'
                            }
                        }]
                });
            }
            else if ((0, exports.isPhoto)(structuredMessage.type)) {
                yield (0, exports.uploadPhoto)(slack, structuredMessage.body, channel, options);
            }
            else if ((0, exports.isVideo)(structuredMessage.type)) {
                yield (0, exports.uploadVideo)(slack, structuredMessage.body.videoURL, channel, options);
            }
            if (options.enableLogging)
                console.log('⚡ Posted message successfully!');
        }
        catch (err) {
            console.error(err);
        }
    }
});
exports.handleNewMessages = handleNewMessages;
