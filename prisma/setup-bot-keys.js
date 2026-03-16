// Setup script: generates API keys for all existing bots
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const dbPath = path.join(__dirname, 'dev.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function genId() { return crypto.randomUUID().replace(/-/g, '').slice(0, 25); }
function ts() { return new Date().toISOString(); }

async function main() {
  console.log('=== NEXUS Bot API Key Generator ===\n');

  // Get all bots
  const bots = db.prepare('SELECT id, name FROM User WHERE isBot = 1').all();
  
  if (bots.length === 0) {
    console.log('No bots found. Run the seed script first.');
    process.exit(0);
  }

  console.log(`Found ${bots.length} bots:\n`);

  const keys = [];
  
  for (const bot of bots) {
    // Check if bot already has an active key
    const existingKey = db.prepare('SELECT key FROM BotApiKey WHERE userId = ? AND isActive = 1').get(bot.id);
    
    if (existingKey) {
      console.log(`✓ ${bot.name}: Already has a key (${existingKey.key.slice(0, 12)}...)`);
      keys.push({ name: bot.name, id: bot.id, key: existingKey.key });
      continue;
    }
    
    // Generate new API key
    const apiKey = 'nxs_' + crypto.randomBytes(32).toString('hex');
    const keyName = `Auto-generated for ${bot.name}`;
    const t = ts();
    
    db.prepare('INSERT INTO BotApiKey (id, key, name, isActive, userId, createdAt) VALUES (?, ?, ?, 1, ?, ?)').run(
      genId(), apiKey, keyName, bot.id, t
    );
    
    console.log(`✓ ${bot.name}: Created key → ${apiKey}`);
    keys.push({ name: bot.name, id: bot.id, key: apiKey });
  }

  console.log('\n=== API Keys Summary ===\n');
  console.log('Use these in Power Automate HTTP actions:');
  console.log('Header: Authorization: Bearer <key>\n');
  
  for (const k of keys) {
    console.log(`Bot: ${k.name}`);
    console.log(`  ID:  ${k.id}`);
    console.log(`  Key: ${k.key}`);
    console.log('');
  }

  console.log('=== Test Command ===\n');
  console.log('Test a bot posting (replace with your URL):');
  console.log(`curl -X POST http://localhost:3001/api/bot-action \\`);
  console.log(`  -H "Authorization: Bearer ${keys[0]?.key}" \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"action":"post","content":"Hello from ${keys[0]?.name}!"}'`);
  
  console.log('\n=== Cron Endpoint ===\n');
  console.log('Trigger all bots at once:');
  console.log('curl http://localhost:3001/api/cron/bot-activity?secret=nexus-cron-2026');
  
  db.close();
}

main().catch(e => { console.error(e); process.exit(1); });
