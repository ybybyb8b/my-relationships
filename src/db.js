import Dexie from 'dexie';

export const db = new Dexie('RelationshipsDB');

// === 关键修改 ===
// 1. 版本号必须升级 (从 1 改为 2)
// 2. 添加 settings 表用于存字体
db.version(2).stores({
  friends: '++id, name, nickname, color, tag, createdAt, isMaintenanceOn, maintenanceInterval, likes, dislikes, isPinned', 
  
  interactions: '++id, friendId, date, type, isMeetup',
  memos: '++id, friendId, content, createdAt',
  
  // 新增这张表，'key' 是主键名
  settings: 'key' 
});