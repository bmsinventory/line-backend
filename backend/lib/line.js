const { messagingApi } = require('@line/bot-sdk');

const _client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

// pushMessage with automatic retry on 429 (rate-limit)
async function pushMessage(params) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await _client.pushMessage(params);
    } catch (err) {
      const status = err.statusCode ?? err.status ?? err.response?.status;
      if (status === 429 && attempt < 2) {
        const delay = (attempt + 1) * 2000; // 2 s, 4 s
        console.warn(`[LINE] 429 rate-limit — retry in ${delay}ms (attempt ${attempt + 1})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

module.exports = {
  pushMessage,
  getGroupSummary:       (...a) => _client.getGroupSummary(...a),
  getGroupMemberProfile: (...a) => _client.getGroupMemberProfile(...a),
};
