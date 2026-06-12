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

// replyMessage ใช้ replyToken จาก LINE event — ฟรี ไม่นับ quota
async function replyMessage(params) {
  try {
    return await _client.replyMessage(params);
  } catch (err) {
    // replyToken หมดอายุ (>30 วิ) หรือถูกใช้ไปแล้ว → fallback เป็น push
    const status = err.statusCode ?? err.status ?? err.response?.status;
    if (status === 400) {
      console.warn('[LINE] replyToken expired or already used — falling back to pushMessage');
      if (params.to) return pushMessage({ to: params.to, messages: params.messages });
    }
    throw err;
  }
}

module.exports = {
  pushMessage,
  replyMessage,
  getGroupSummary:       (...a) => _client.getGroupSummary(...a),
  getGroupMemberProfile: (...a) => _client.getGroupMemberProfile(...a),
};
