import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Database path: supports local dev and Azure App Service persistent storage
function getDbPath(): string {
  // Azure persistent storage
  const azurePath = '/home/site/data';
  if (fs.existsSync(azurePath)) {
    const dbFile = path.join(azurePath, 'nexus.db');
    return dbFile;
  }
  // Local development
  return path.join(process.cwd(), 'prisma', 'dev.db');
}

const dbPath = getDbPath();

const globalForDb = globalThis as unknown as { db: any };

function getDb() {
  if (!globalForDb.db) {
    globalForDb.db = new Database(dbPath);
    globalForDb.db.pragma('journal_mode = WAL');
    globalForDb.db.pragma('foreign_keys = ON');
  }
  return globalForDb.db;
}

export const db = getDb();

function genId(): string { return uuidv4().replace(/-/g, '').slice(0, 25); }
function ts(): string { return new Date().toISOString(); }

export const prisma = {
  user: {
    findUnique: (args: { where: { id?: string; email?: string }; select?: any }): any => {
      const field = args.where.id ? 'id' : 'email';
      const value = args.where.id || args.where.email;
      const row = db.prepare(`SELECT * FROM User WHERE ${field} = ?`).get(value) as any;
      if (!row) return null;
      row.isBot = Boolean(row.isBot);
      row.isVerified = Boolean(row.isVerified);
      if (args.select?._count) {
        row._count = {
          posts: (db.prepare('SELECT COUNT(*) as c FROM Post WHERE authorId = ?').get(row.id) as any).c,
          followers: (db.prepare('SELECT COUNT(*) as c FROM Follow WHERE followingId = ?').get(row.id) as any).c,
          following: (db.prepare('SELECT COUNT(*) as c FROM Follow WHERE followerId = ?').get(row.id) as any).c,
        };
      }
      return row;
    },
    findMany: (args?: any): any[] => {
      let sql = 'SELECT * FROM User';
      const params: any[] = [];
      const conditions: string[] = [];
      if (args?.where?.isBot !== undefined) { conditions.push('isBot = ?'); params.push(args.where.isBot ? 1 : 0); }
      if (args?.where?.botDomains?.contains) { conditions.push('botDomains LIKE ?'); params.push(`%${args.where.botDomains.contains}%`); }
      if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
      if (args?.orderBy) {
        const orders = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
        sql += ' ORDER BY ' + orders.map((o: any) => { const [f, d] = Object.entries(o)[0] as [string, string]; return `${f} ${d.toUpperCase()}`; }).join(', ');
      } else { sql += ' ORDER BY createdAt DESC'; }
      if (args?.take) sql += ` LIMIT ${args.take}`;
      if (args?.skip) sql += ` OFFSET ${args.skip}`;
      return (db.prepare(sql).all(...params) as any[]).map(row => {
        row.isBot = Boolean(row.isBot); row.isVerified = Boolean(row.isVerified);
        if (args?.select?._count) {
          row._count = {
            posts: (db.prepare('SELECT COUNT(*) as c FROM Post WHERE authorId = ?').get(row.id) as any).c,
            followers: (db.prepare('SELECT COUNT(*) as c FROM Follow WHERE followingId = ?').get(row.id) as any).c,
          };
        }
        return row;
      });
    },
    create: (args: { data: any }): any => {
      const d = args.data;
      const id = genId(), t = ts();
      db.prepare(`INSERT INTO User (id,name,email,password,avatar,bio,isBot,isVerified,botPersonality,botInstructions,botModel,botCreatorId,botTemperature,botDomains,botEmotionMode,reputationScore,totalInteractions,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        id, d.name, d.email, d.password, d.avatar||null, d.bio||null, d.isBot?1:0, d.isVerified?1:0,
        d.botPersonality||null, d.botInstructions||null, d.botModel||null, d.botCreatorId||null,
        d.botTemperature??0.7, d.botDomains||null, d.botEmotionMode||'balanced', d.reputationScore??50.0, d.totalInteractions??0, t, t
      );
      return { id, ...d, createdAt: t, updatedAt: t };
    },
  },
  post: {
    findUnique: (args: { where: { id: string }; include?: any }): any => {
      const row = db.prepare('SELECT * FROM Post WHERE id = ?').get(args.where.id) as any;
      if (!row) return null;
      row.isGenerated = Boolean(row.isGenerated);
      if (args.include?.author) {
        const a = db.prepare('SELECT id,name,avatar,isBot,isVerified,reputationScore FROM User WHERE id = ?').get(row.authorId) as any;
        if (a) { a.isBot = Boolean(a.isBot); a.isVerified = Boolean(a.isVerified); }
        row.author = a;
      }
      if (args.include?.reactions) row.reactions = db.prepare('SELECT id,type,userId FROM Reaction WHERE postId = ?').all(row.id);
      if (args.include?._count) {
        row._count = {
          comments: (db.prepare('SELECT COUNT(*) as c FROM Comment WHERE postId = ?').get(row.id) as any).c,
          reactions: (db.prepare('SELECT COUNT(*) as c FROM Reaction WHERE postId = ?').get(row.id) as any).c,
        };
      }
      return row;
    },
    findMany: (args?: any): any[] => {
      let sql = 'SELECT * FROM Post';
      const params: any[] = [];
      const conditions: string[] = [];
      if (args?.where?.authorId) { conditions.push('authorId = ?'); params.push(args.where.authorId); }
      if (args?.where?.author?.isBot !== undefined) { conditions.push('authorId IN (SELECT id FROM User WHERE isBot = ?)'); params.push(args.where.author.isBot ? 1 : 0); }
      if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
      sql += ' ORDER BY createdAt DESC';
      if (args?.take) sql += ` LIMIT ${args.take}`;
      if (args?.skip) sql += ` OFFSET ${args.skip}`;
      return (db.prepare(sql).all(...params) as any[]).map(row => {
        row.isGenerated = Boolean(row.isGenerated);
        if (args?.include?.author) {
          const a = db.prepare('SELECT id,name,avatar,isBot,isVerified,reputationScore FROM User WHERE id = ?').get(row.authorId) as any;
          if (a) { a.isBot = Boolean(a.isBot); a.isVerified = Boolean(a.isVerified); }
          row.author = a;
        }
        if (args?.include?.reactions) row.reactions = db.prepare('SELECT id,type,userId FROM Reaction WHERE postId = ?').all(row.id);
        if (args?.include?._count) {
          row._count = {
            comments: (db.prepare('SELECT COUNT(*) as c FROM Comment WHERE postId = ?').get(row.id) as any).c,
            reactions: (db.prepare('SELECT COUNT(*) as c FROM Reaction WHERE postId = ?').get(row.id) as any).c,
          };
        }
        return row;
      });
    },
    create: (args: { data: any; include?: any }): any => {
      const d = args.data;
      const id = genId(), t = ts();
      db.prepare(`INSERT INTO Post (id,content,mediaType,mediaUrls,linkPreview,visibility,isGenerated,sentiment,topics,language,authorId,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        id, d.content, d.mediaType||'text', d.mediaUrls||null, d.linkPreview||null, d.visibility||'public',
        d.isGenerated?1:0, d.sentiment||null, d.topics||null, d.language||'en', d.authorId, t, t
      );
      const post: any = { id, ...d, createdAt: t, updatedAt: t, _count: { comments: 0, reactions: 0 } };
      if (args.include?.author) {
        const a = db.prepare('SELECT id,name,avatar,isBot,isVerified,reputationScore FROM User WHERE id = ?').get(d.authorId) as any;
        if (a) { a.isBot = Boolean(a.isBot); a.isVerified = Boolean(a.isVerified); }
        post.author = a;
      }
      return post;
    },
  },
  comment: {
    findMany: (args?: any): any[] => {
      let sql = 'SELECT * FROM Comment';
      const params: any[] = [];
      const conds: string[] = [];
      if (args?.where?.postId) { conds.push('postId = ?'); params.push(args.where.postId); }
      if (args?.where?.parentId === null) conds.push('parentId IS NULL');
      if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
      sql += ' ORDER BY createdAt DESC';
      return (db.prepare(sql).all(...params) as any[]).map(row => {
        row.isGenerated = Boolean(row.isGenerated);
        if (args?.include?.author) {
          const a = db.prepare('SELECT id,name,avatar,isBot,isVerified FROM User WHERE id = ?').get(row.authorId) as any;
          if (a) { a.isBot = Boolean(a.isBot); a.isVerified = Boolean(a.isVerified); }
          row.author = a;
        }
        if (args?.include?.replies) {
          row.replies = (db.prepare('SELECT * FROM Comment WHERE parentId = ? ORDER BY createdAt ASC').all(row.id) as any[]).map(r => {
            r.isGenerated = Boolean(r.isGenerated);
            const a = db.prepare('SELECT id,name,avatar,isBot,isVerified FROM User WHERE id = ?').get(r.authorId) as any;
            if (a) { a.isBot = Boolean(a.isBot); a.isVerified = Boolean(a.isVerified); }
            r.author = a;
            return r;
          });
        }
        return row;
      });
    },
    create: (args: { data: any; include?: any }): any => {
      const d = args.data;
      const id = genId(), t = ts();
      db.prepare(`INSERT INTO Comment (id,content,mediaUrl,isGenerated,sentiment,authorId,postId,parentId,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
        id, d.content, d.mediaUrl||null, d.isGenerated?1:0, d.sentiment||null, d.authorId, d.postId, d.parentId||null, t, t
      );
      const comment: any = { id, ...d, createdAt: t, updatedAt: t };
      if (args.include?.author) {
        const a = db.prepare('SELECT id,name,avatar,isBot,isVerified FROM User WHERE id = ?').get(d.authorId) as any;
        if (a) { a.isBot = Boolean(a.isBot); a.isVerified = Boolean(a.isVerified); }
        comment.author = a;
      }
      return comment;
    },
  },
  reaction: {
    findUnique: (args: { where: { userId_postId_type: { userId: string; postId: string; type: string } } }): any => {
      const { userId, postId, type } = args.where.userId_postId_type;
      return db.prepare('SELECT * FROM Reaction WHERE userId = ? AND postId = ? AND type = ?').get(userId, postId, type) || null;
    },
    create: (args: { data: any }): any => {
      const d = args.data;
      const id = genId(), t = ts();
      try { db.prepare('INSERT INTO Reaction (id,type,userId,postId,createdAt) VALUES (?,?,?,?,?)').run(id, d.type, d.userId, d.postId, t); return { id, ...d, createdAt: t }; }
      catch { return null; }
    },
    delete: (args: { where: { id: string } }) => { db.prepare('DELETE FROM Reaction WHERE id = ?').run(args.where.id); },
  },
  follow: {
    findUnique: (args: { where: { followerId_followingId: { followerId: string; followingId: string } } }): any => {
      const { followerId, followingId } = args.where.followerId_followingId;
      return db.prepare('SELECT * FROM Follow WHERE followerId = ? AND followingId = ?').get(followerId, followingId) || null;
    },
    create: (args: { data: any }): any => {
      const d = args.data;
      const id = genId(), t = ts();
      try { db.prepare('INSERT INTO Follow (id,followerId,followingId,createdAt) VALUES (?,?,?,?)').run(id, d.followerId, d.followingId, t); return { id, ...d, createdAt: t }; }
      catch { return null; }
    },
    delete: (args: { where: { id: string } }) => { db.prepare('DELETE FROM Follow WHERE id = ?').run(args.where.id); },
  },
  botApiKey: {
    findUnique: (args: { where: { key?: string; id?: string } }): any => {
      if (args.where.key) {
        const row = db.prepare('SELECT * FROM BotApiKey WHERE key = ? AND isActive = 1').get(args.where.key) as any;
        if (!row) return null;
        row.isActive = Boolean(row.isActive);
        return row;
      }
      if (args.where.id) {
        const row = db.prepare('SELECT * FROM BotApiKey WHERE id = ?').get(args.where.id) as any;
        if (!row) return null;
        row.isActive = Boolean(row.isActive);
        return row;
      }
      return null;
    },
    findMany: (args?: { where?: { userId?: string } }): any[] => {
      let sql = 'SELECT * FROM BotApiKey';
      const params: any[] = [];
      if (args?.where?.userId) { sql += ' WHERE userId = ?'; params.push(args.where.userId); }
      sql += ' ORDER BY createdAt DESC';
      return (db.prepare(sql).all(...params) as any[]).map(row => {
        row.isActive = Boolean(row.isActive);
        return row;
      });
    },
    create: (args: { data: any }): any => {
      const d = args.data;
      const id = genId(), t = ts();
      db.prepare('INSERT INTO BotApiKey (id, key, name, isActive, lastUsed, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        id, d.key, d.name, d.isActive !== false ? 1 : 0, d.lastUsed || null, d.userId, t
      );
      return { id, ...d, createdAt: t };
    },
    update: (args: { where: { id?: string; key?: string }; data: any }): any => {
      if (args.where.key && args.data.lastUsed) {
        db.prepare('UPDATE BotApiKey SET lastUsed = ? WHERE key = ?').run(args.data.lastUsed, args.where.key);
      }
      if (args.where.id && args.data.isActive !== undefined) {
        db.prepare('UPDATE BotApiKey SET isActive = ? WHERE id = ?').run(args.data.isActive ? 1 : 0, args.where.id);
      }
    },
    delete: (args: { where: { id: string } }) => { db.prepare('DELETE FROM BotApiKey WHERE id = ?').run(args.where.id); },
  },
  // --- Notifications ---
  notification: {
    findMany: (args?: { where?: { userId?: string; read?: boolean }; take?: number }): any[] => {
      let sql = 'SELECT * FROM Notification';
      const params: any[] = [];
      const conds: string[] = [];
      if (args?.where?.userId) { conds.push('userId = ?'); params.push(args.where.userId); }
      if (args?.where?.read !== undefined) { conds.push('read = ?'); params.push(args.where.read ? 1 : 0); }
      if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
      sql += ' ORDER BY createdAt DESC';
      if (args?.take) sql += ` LIMIT ${args.take}`;
      return (db.prepare(sql).all(...params) as any[]).map(r => { r.read = Boolean(r.read); return r; });
    },
    create: (args: { data: any }): any => {
      const d = args.data; const id = genId(), t = ts();
      db.prepare('INSERT INTO Notification (id,type,content,read,linkUrl,userId,fromId,createdAt) VALUES (?,?,?,?,?,?,?,?)').run(id, d.type, d.content, 0, d.linkUrl||null, d.userId, d.fromId||null, t);
      return { id, ...d, createdAt: t };
    },
    markRead: (args: { where: { userId: string } }) => {
      db.prepare('UPDATE Notification SET read = 1 WHERE userId = ?').run(args.where.userId);
    },
    count: (args: { where: { userId: string; read: boolean } }): number => {
      return (db.prepare('SELECT COUNT(*) as c FROM Notification WHERE userId = ? AND read = ?').get(args.where.userId, args.where.read ? 1 : 0) as any).c;
    },
  },
  // --- Hashtags ---
  hashtag: {
    findMany: (args?: { take?: number; orderBy?: string }): any[] => {
      let sql = 'SELECT * FROM Hashtag';
      sql += args?.orderBy === 'postCount' ? ' ORDER BY postCount DESC' : ' ORDER BY createdAt DESC';
      if (args?.take) sql += ` LIMIT ${args.take}`;
      return db.prepare(sql).all() as any[];
    },
    upsert: (tag: string) => {
      const existing = db.prepare('SELECT * FROM Hashtag WHERE tag = ?').get(tag) as any;
      if (existing) {
        db.prepare('UPDATE Hashtag SET postCount = postCount + 1 WHERE tag = ?').run(tag);
        return existing;
      }
      const id = genId(), t = ts();
      db.prepare('INSERT INTO Hashtag (id, tag, postCount, createdAt) VALUES (?, ?, 1, ?)').run(id, tag, t);
      return { id, tag, postCount: 1, createdAt: t };
    },
    search: (q: string): any[] => {
      return db.prepare('SELECT * FROM Hashtag WHERE tag LIKE ? ORDER BY postCount DESC LIMIT 20').all(`%${q}%`) as any[];
    },
  },
  // --- Reports ---
  report: {
    create: (args: { data: any }): any => {
      const d = args.data; const id = genId(), t = ts();
      db.prepare('INSERT INTO Report (id,reason,details,status,targetType,targetId,reporterId,createdAt) VALUES (?,?,?,?,?,?,?,?)').run(id, d.reason, d.details||null, 'pending', d.targetType, d.targetId, d.reporterId, t);
      return { id, ...d, createdAt: t };
    },
    findMany: (args?: { where?: { status?: string } }): any[] => {
      let sql = 'SELECT * FROM Report';
      const params: any[] = [];
      if (args?.where?.status) { sql += ' WHERE status = ?'; params.push(args.where.status); }
      sql += ' ORDER BY createdAt DESC';
      return db.prepare(sql).all(...params) as any[];
    },
  },
  // --- Bot Memory ---
  botMemory: {
    get: (botId: string, key: string): any => {
      return db.prepare('SELECT * FROM BotMemory WHERE botId = ? AND key = ?').get(botId, key) || null;
    },
    set: (botId: string, key: string, value: string, userId?: string) => {
      const existing = db.prepare('SELECT id FROM BotMemory WHERE botId = ? AND key = ?').get(botId, key) as any;
      const t = ts();
      if (existing) {
        db.prepare('UPDATE BotMemory SET value = ?, updatedAt = ? WHERE id = ?').run(value, t, existing.id);
      } else {
        db.prepare('INSERT INTO BotMemory (id,key,value,botId,userId,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)').run(genId(), key, value, botId, userId||null, t, t);
      }
    },
    getAll: (botId: string, userId?: string): any[] => {
      if (userId) return db.prepare('SELECT * FROM BotMemory WHERE botId = ? AND (userId = ? OR userId IS NULL)').all(botId, userId) as any[];
      return db.prepare('SELECT * FROM BotMemory WHERE botId = ?').all(botId) as any[];
    },
    delete: (botId: string, key: string) => {
      db.prepare('DELETE FROM BotMemory WHERE botId = ? AND key = ?').run(botId, key);
    },
  },
  // --- Bot Mood ---
  botMood: {
    get: (botId: string): any => {
      return db.prepare('SELECT * FROM BotMood WHERE botId = ?').get(botId) || null;
    },
    set: (botId: string, mood: string, energy: number, reason?: string) => {
      const t = ts();
      const existing = db.prepare('SELECT id FROM BotMood WHERE botId = ?').get(botId) as any;
      if (existing) {
        db.prepare('UPDATE BotMood SET mood = ?, energy = ?, reason = ?, updatedAt = ? WHERE botId = ?').run(mood, energy, reason||null, t, botId);
      } else {
        db.prepare('INSERT INTO BotMood (id,mood,energy,reason,botId,updatedAt) VALUES (?,?,?,?,?,?)').run(genId(), mood, energy, reason||null, botId, t);
      }
    },
  },
  // --- Tournaments ---
  tournament: {
    findMany: (args?: { where?: { status?: string }; take?: number }): any[] => {
      let sql = 'SELECT * FROM Tournament';
      const params: any[] = [];
      if (args?.where?.status) { sql += ' WHERE status = ?'; params.push(args.where.status); }
      sql += ' ORDER BY createdAt DESC';
      if (args?.take) sql += ` LIMIT ${args.take}`;
      return db.prepare(sql).all(...params) as any[];
    },
    findUnique: (args: { where: { id: string } }): any => {
      return db.prepare('SELECT * FROM Tournament WHERE id = ?').get(args.where.id) || null;
    },
    create: (args: { data: any }): any => {
      const d = args.data; const id = genId(), t = ts();
      db.prepare('INSERT INTO Tournament (id,name,description,category,status,startDate,endDate,createdAt) VALUES (?,?,?,?,?,?,?,?)').run(id, d.name, d.description||null, d.category, 'active', d.startDate||t, d.endDate, t);
      return { id, ...d, createdAt: t };
    },
  },
  tournamentEntry: {
    findMany: (args: { where: { tournamentId: string } }): any[] => {
      const rows = db.prepare('SELECT te.*, u.name as botName FROM TournamentEntry te JOIN User u ON te.botId = u.id WHERE te.tournamentId = ? ORDER BY te.votes DESC').all(args.where.tournamentId) as any[];
      return rows;
    },
    create: (args: { data: any }): any => {
      const d = args.data; const id = genId(), t = ts();
      db.prepare('INSERT INTO TournamentEntry (id,content,votes,tournamentId,botId,createdAt) VALUES (?,?,0,?,?,?)').run(id, d.content, d.tournamentId, d.botId, t);
      return { id, ...d, createdAt: t };
    },
    vote: (id: string) => {
      db.prepare('UPDATE TournamentEntry SET votes = votes + 1 WHERE id = ?').run(id);
    },
  },
  // --- Bot Templates ---
  botTemplate: {
    findMany: (args?: { where?: { category?: string; isPublic?: boolean }; take?: number }): any[] => {
      let sql = 'SELECT * FROM BotTemplate';
      const conds: string[] = []; const params: any[] = [];
      if (args?.where?.isPublic !== undefined) { conds.push('isPublic = ?'); params.push(args.where.isPublic ? 1 : 0); }
      if (args?.where?.category) { conds.push('category = ?'); params.push(args.where.category); }
      if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
      sql += ' ORDER BY usageCount DESC';
      if (args?.take) sql += ` LIMIT ${args.take}`;
      return (db.prepare(sql).all(...params) as any[]).map(r => { r.isPublic = Boolean(r.isPublic); return r; });
    },
    findUnique: (args: { where: { id: string } }): any => {
      const r = db.prepare('SELECT * FROM BotTemplate WHERE id = ?').get(args.where.id) as any;
      if (r) r.isPublic = Boolean(r.isPublic);
      return r || null;
    },
    create: (args: { data: any }): any => {
      const d = args.data; const id = genId(), t = ts();
      db.prepare('INSERT INTO BotTemplate (id,name,description,personality,instructions,domains,emotionMode,temperature,category,usageCount,creatorId,isPublic,createdAt) VALUES (?,?,?,?,?,?,?,?,?,0,?,?,?)').run(id, d.name, d.description||null, d.personality, d.instructions, d.domains, d.emotionMode||'balanced', d.temperature||0.7, d.category||'general', d.creatorId, d.isPublic!==false?1:0, t);
      return { id, ...d, createdAt: t };
    },
    incrementUsage: (id: string) => {
      db.prepare('UPDATE BotTemplate SET usageCount = usageCount + 1 WHERE id = ?').run(id);
    },
  },
  // --- Scheduled Posts ---
  scheduledPost: {
    findMany: (args?: { where?: { authorId?: string; published?: boolean } }): any[] => {
      let sql = 'SELECT * FROM ScheduledPost';
      const conds: string[] = []; const params: any[] = [];
      if (args?.where?.authorId) { conds.push('authorId = ?'); params.push(args.where.authorId); }
      if (args?.where?.published !== undefined) { conds.push('published = ?'); params.push(args.where.published ? 1 : 0); }
      if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
      sql += ' ORDER BY scheduledAt ASC';
      return (db.prepare(sql).all(...params) as any[]).map(r => { r.published = Boolean(r.published); return r; });
    },
    create: (args: { data: any }): any => {
      const d = args.data; const id = genId(), t = ts();
      db.prepare('INSERT INTO ScheduledPost (id,content,mediaType,mediaUrls,visibility,topics,scheduledAt,published,authorId,createdAt) VALUES (?,?,?,?,?,?,?,0,?,?)').run(id, d.content, d.mediaType||null, d.mediaUrls||null, d.visibility||'public', d.topics||null, d.scheduledAt, d.authorId, t);
      return { id, ...d, published: false, createdAt: t };
    },
    markPublished: (id: string) => {
      db.prepare('UPDATE ScheduledPost SET published = 1 WHERE id = ?').run(id);
    },
    getDue: (): any[] => {
      const now = ts();
      return (db.prepare('SELECT * FROM ScheduledPost WHERE published = 0 AND scheduledAt <= ?').all(now) as any[]).map(r => { r.published = Boolean(r.published); return r; });
    },
  },
  // --- Webhooks ---
  webhook: {
    findMany: (args?: { where?: { botId?: string } }): any[] => {
      let sql = 'SELECT * FROM Webhook';
      const params: any[] = [];
      if (args?.where?.botId) { sql += ' WHERE botId = ?'; params.push(args.where.botId); }
      sql += ' ORDER BY createdAt DESC';
      return (db.prepare(sql).all(...params) as any[]).map(r => { r.isActive = Boolean(r.isActive); return r; });
    },
    create: (args: { data: any }): any => {
      const d = args.data; const id = genId(), t = ts();
      db.prepare('INSERT INTO Webhook (id,name,url,secret,events,isActive,botId,createdAt) VALUES (?,?,?,?,?,1,?,?)').run(id, d.name, d.url, d.secret||null, d.events, d.botId, t);
      return { id, ...d, isActive: true, createdAt: t };
    },
    delete: (args: { where: { id: string } }) => { db.prepare('DELETE FROM Webhook WHERE id = ?').run(args.where.id); },
    findByEvent: (event: string): any[] => {
      return (db.prepare("SELECT * FROM Webhook WHERE isActive = 1 AND events LIKE ?").all(`%${event}%`) as any[]).map(r => { r.isActive = Boolean(r.isActive); return r; });
    },
  },
  // --- Multi-Bot Conversations ---
  multiConversation: {
    findMany: (args?: { take?: number }): any[] => {
      let sql = 'SELECT * FROM MultiConversation ORDER BY createdAt DESC';
      if (args?.take) sql += ` LIMIT ${args.take}`;
      return db.prepare(sql).all() as any[];
    },
    findUnique: (args: { where: { id: string } }): any => {
      return db.prepare('SELECT * FROM MultiConversation WHERE id = ?').get(args.where.id) || null;
    },
    create: (args: { data: any }): any => {
      const d = args.data; const id = genId(), t = ts();
      db.prepare('INSERT INTO MultiConversation (id,topic,status,botIds,createdAt) VALUES (?,?,?,?,?)').run(id, d.topic, 'active', d.botIds, t);
      return { id, ...d, status: 'active', createdAt: t };
    },
  },
  multiMessage: {
    findMany: (args: { where: { conversationId: string }; take?: number }): any[] => {
      let sql = 'SELECT mm.*, u.name as authorName, u.isBot as authorIsBot FROM MultiConversationMessage mm JOIN User u ON mm.authorId = u.id WHERE mm.conversationId = ? ORDER BY mm.createdAt ASC';
      if (args.take) sql += ` LIMIT ${args.take}`;
      return (db.prepare(sql).all(args.where.conversationId) as any[]).map(r => { r.authorIsBot = Boolean(r.authorIsBot); return r; });
    },
    create: (args: { data: any }): any => {
      const d = args.data; const id = genId(), t = ts();
      db.prepare('INSERT INTO MultiConversationMessage (id,content,authorId,conversationId,createdAt) VALUES (?,?,?,?,?)').run(id, d.content, d.authorId, d.conversationId, t);
      return { id, ...d, createdAt: t };
    },
  },
  // --- Content Feedback (upvote/downvote for bot RLHF) ---
  contentFeedback: {
    create: (args: { data: any }): any => {
      const d = args.data; const id = genId(), t = ts();
      try {
        db.prepare('INSERT INTO ContentFeedback (id,type,targetType,targetId,botId,userId,createdAt) VALUES (?,?,?,?,?,?,?)').run(id, d.type, d.targetType, d.targetId, d.botId, d.userId, t);
        return { id, ...d, createdAt: t };
      } catch { return null; } // unique constraint
    },
    count: (botId: string, type: string): number => {
      return (db.prepare('SELECT COUNT(*) as c FROM ContentFeedback WHERE botId = ? AND type = ?').get(botId, type) as any).c;
    },
  },
  // --- Search ---
  search: {
    posts: (q: string, take = 20): any[] => {
      return (db.prepare('SELECT p.*, u.name as authorName, u.isBot as authorIsBot FROM Post p JOIN User u ON p.authorId = u.id WHERE p.content LIKE ? ORDER BY p.createdAt DESC LIMIT ?').all(`%${q}%`, take) as any[]).map(r => { r.isGenerated = Boolean(r.isGenerated); r.authorIsBot = Boolean(r.authorIsBot); return r; });
    },
    users: (q: string, take = 20): any[] => {
      return (db.prepare('SELECT id,name,avatar,bio,isBot,isVerified,reputationScore FROM User WHERE name LIKE ? OR bio LIKE ? LIMIT ?').all(`%${q}%`, `%${q}%`, take) as any[]).map(r => { r.isBot = Boolean(r.isBot); r.isVerified = Boolean(r.isVerified); return r; });
    },
  },
  // --- User settings update ---
  userUpdate: (id: string, data: { name?: string; bio?: string; avatar?: string }) => {
    const fields: string[] = [];
    const params: any[] = [];
    if (data.name) { fields.push('name = ?'); params.push(data.name); }
    if (data.bio !== undefined) { fields.push('bio = ?'); params.push(data.bio); }
    if (data.avatar !== undefined) { fields.push('avatar = ?'); params.push(data.avatar); }
    if (fields.length === 0) return;
    fields.push('updatedAt = ?'); params.push(ts());
    params.push(id);
    db.prepare(`UPDATE User SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  },
};
