/**
 * EDUCO LMS - Telegram Bot Webhook Manager
 * Allows switching @EducoLms_Bot between Cloudflare Webhook (24/7 serverless) and Local Polling
 * 
 * Usage:
 *   node scripts/set-telegram-webhook.js info
 *   node scripts/set-telegram-webhook.js set [url]
 *   node scripts/set-telegram-webhook.js delete
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9049935207:AAG2b-t507eJCpf31RMDIm4gFpbUuhFOI7g';
const DEFAULT_WEBHOOK_URL = 'https://educo-lms.pages.dev/api/telegram-webhook';

async function telegram(method, body = {}) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return await res.json();
}

async function main() {
  const args = process.argv.slice(2);
  const command = (args[0] || 'info').toLowerCase();

  console.log('🤖 EDUCO LMS Telegram Bot Webhook Manager');
  console.log('Bot Token:', BOT_TOKEN.slice(0, 10) + '...');

  if (command === 'set') {
    const webhookUrl = args[1] || DEFAULT_WEBHOOK_URL;
    console.log(`\n⏳ Webhook o‘rnatilmoqda: ${webhookUrl} ...`);
    const res = await telegram('setWebhook', {
      url: webhookUrl,
      drop_pending_updates: true,
      allowed_updates: ['message', 'callback_query'],
    });
    console.log('Javob:', res);
    if (res.ok) {
      console.log('✅ Webhook muvaffaqiyatli o‘rnatildi! Bot endi Cloudflare Pages orqali 24/7 ishlaydi.');
    } else {
      console.error('❌ Xatolik yuz berdi:', res.description);
    }
  } else if (command === 'delete') {
    console.log('\n⏳ Webhook o‘chirilmoqda (Lokal polling uchun)...');
    const res = await telegram('deleteWebhook', { drop_pending_updates: true });
    console.log('Javob:', res);
    if (res.ok) {
      console.log('✅ Webhook o‘chirildi! Endi botni kompyuterda "npm run bot" bilan ishlatishingiz mumkin.');
    }
  } else {
    console.log('\n⏳ Webhook holati tekshirilmoqda...');
    const res = await telegram('getWebhookInfo');
    console.log('Webhook ma’lumotlari:', JSON.stringify(res.result, null, 2));
    if (res.result && res.result.url) {
      console.log(`\n🟢 BOT HOZIR CLOUDFLARE WEBHOOK REJIMIDA ISHLAMOQDA:`);
      console.log(`URL: ${res.result.url}`);
      console.log(`Kutilayotgan yangilanishlar: ${res.result.pending_update_count}`);
      console.log(`Oxirgi xatolik sanasi: ${res.result.last_error_date ? new Date(res.result.last_error_date * 1000).toLocaleString() : 'Xatoliklar yo‘q'}`);
    } else {
      console.log('\n⚪ Webhook belgilanmagan. Bot hozir faqat "npm run bot" (Lokal polling) rejimida ishlaydi.');
    }
  }
}

main().catch(console.error);
