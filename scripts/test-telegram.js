const fs = require('fs');
const path = require('path');

// Try to load env variables from .env or .env.local
let botToken = process.env.TELEGRAM_BOT_TOKEN;
let chatId = process.env.TELEGRAM_CHAT_ID;

console.log('🤖 Cleopatra Telegram Bot Test Script');
console.log('=====================================');

const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

function parseEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

parseEnvFile(envPath);
parseEnvFile(envLocalPath);

botToken = botToken || process.env.TELEGRAM_BOT_TOKEN;
chatId = chatId || process.env.TELEGRAM_CHAT_ID;

// If we still don't have them, check command line arguments
if (!botToken || !chatId) {
  const args = process.argv.slice(2);
  if (args.length >= 2) {
    botToken = args[0];
    chatId = args[1];
  }
}

if (!botToken || !chatId) {
  console.log('❌ Error: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured.');
  console.log('\nHow to run this test:');
  console.log('Method A: Create a .env or .env.local file in the root directory with:');
  console.log('   TELEGRAM_BOT_TOKEN=your_bot_token_here');
  console.log('   TELEGRAM_CHAT_ID=your_chat_id_here');
  console.log('\nMethod B: Pass them as arguments:');
  console.log('   node scripts/test-telegram.js <BOT_TOKEN> <CHAT_ID>');
  process.exit(1);
}

console.log(`📡 Sending test notification...`);
console.log(`🤖 Bot Token: ${botToken.substring(0, 8)}...`);
console.log(`💬 Chat ID: ${chatId}`);

const message = `🔔 <b>فحص تجريبي لـ بوت تلغرام</b>\n\n` +
  `👑 متجر كليوباترا للمجوهرات\n` +
  `✅ تم الاتصال بنجاح وتلقي هذا التنبيه التجريبي.\n\n` +
  `⏰ الوقت: ${new Date().toLocaleString('ar-IQ')}`;

fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML'
  })
})
  .then(async (res) => {
    if (res.ok) {
      console.log('🎉 SUCCESS: Telegram notification sent successfully!');
    } else {
      const err = await res.text();
      console.error(`❌ FAILURE: Telegram API returned an error:`);
      console.error(err);
    }
  })
  .catch(err => {
    console.error('❌ ERROR: Failed to fetch Telegram API:', err.message);
  });
