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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Packages:
require("dotenv/config");
const instagram_private_api_1 = require("instagram-private-api");
const instagram_mqtt_1 = require("instagram_mqtt");
const bolt_1 = require("@slack/bolt");
const testing_1 = __importDefault(require("./testing"));
const utils_1 = require("./utils");
// Functions:
const InstaZap = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const ig = (0, instagram_mqtt_1.withRealtime)(new instagram_private_api_1.IgApiClient());
    ig.state.generateDevice(options.instagram.credentials.USERNAME);
    const slack = options.slack.mock ? (0, testing_1.default)() : new bolt_1.App({
        token: options.slack.credentials.OAUTH_TOKEN,
        signingSecret: options.slack.credentials.SIGNING_SECRET
    });
    console.log('⚡ Starting Slack Bot...');
    yield slack.start(options.slack.port || 3000);
    console.log('⚡ Started Slack Bot');
    console.log('⚡ Logging in to Instagram...');
    const loggedInUser = yield (0, utils_1.login)(ig, options.instagram.credentials.USERNAME, options.instagram.credentials.PASSWORD);
    if (!loggedInUser) {
        console.error('⚡ There was some error while logging in to Instagram');
        return;
    }
    console.log('⚡ Ready');
    ig.realtime.on('message', ({ message }) => __awaiter(void 0, void 0, void 0, function* () { return yield (0, utils_1.handleNewMessages)(ig, slack, message, options); }));
    // ig.realtime.on('message', async ({ message }) => console.log((message['media_share'] as any)['carousel_media']))
    ig.realtime.on('error', console.error);
    ig.realtime.on('close', () => __awaiter(void 0, void 0, void 0, function* () {
        console.error('⚡ Instagram RealtimeClient closed');
        yield (0, utils_1.attemptReconnection)(ig);
    }));
    if (!(yield (0, utils_1.connectToRealtime)(ig))) {
        console.error(`⚡ Turning off InstaZap - Please restart service manually`);
        return;
    }
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
    (0, utils_1.startRandomSleepService)(ig, options);
});
// Exports:
exports.default = InstaZap;
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
