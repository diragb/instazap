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
Object.defineProperty(exports, "__esModule", { value: true });
// Packages:
require("dotenv/config");
const instagram_private_api_1 = require("instagram-private-api");
const instagram_mqtt_1 = require("instagram_mqtt");
const bolt_1 = require("@slack/bolt");
const utils_1 = require("./utils");
// Functions:
const InstaZap = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const ig = (0, instagram_mqtt_1.withRealtime)(new instagram_private_api_1.IgApiClient());
    ig.state.generateDevice(options.instagram.credentials.USERNAME);
    const slack = new bolt_1.App({
        token: process.env.SLACK_BOT_TOKEN,
        signingSecret: process.env.SLACK_SIGNING_SECRET
    });
    console.log('⚡ Starting Slack Bot...');
    yield slack.start(process.env.PORT || 3000);
    console.log('⚡ Started Slack Bot');
    console.log('⚡ Logging in to Instagram...');
    const loggedInUser = yield (0, utils_1.login)(ig, options.instagram.credentials.USERNAME, options.instagram.credentials.PASSWORD);
    if (!loggedInUser) {
        console.error('⚡ There was some error while logging in to Instagram');
        return;
    }
    console.log('⚡ Ready');
    ig.realtime.on('message', ({ message }) => __awaiter(void 0, void 0, void 0, function* () { return yield (0, utils_1.handleNewMessages)(ig, slack, message, options); }));
    ig.realtime.on('error', console.error);
    ig.realtime.on('close', () => console.error('⚡ Instagram RealtimeClient closed'));
    yield ig.realtime.connect({
        irisData: yield ig.feed.directInbox().request(),
    });
    // Simulate turning the device off after 2s and turning it back on after another 2s
    setTimeout(() => {
        console.log('⚡ Device turned off');
        // From now on, you won't receive any realtime-data as you *aren't in the app*
        // the keepAliveTimeout is somehow a 'constant' by instagram
        ig.realtime.direct.sendForegroundState({
            inForegroundApp: false,
            inForegroundDevice: false,
            keepAliveTimeout: 900,
        });
    }, 2000);
    setTimeout(() => {
        console.log('⚡ Device turned on');
        ig.realtime.direct.sendForegroundState({
            inForegroundApp: true,
            inForegroundDevice: true,
            keepAliveTimeout: 60,
        });
    }, 4000);
});
// Exports:
exports.default = InstaZap;
