import Dexie from 'dexie';

export const db = new Dexie('RelationshipsDB');

db.version(1).stores({
  // 1. friends: 增加 nickname
  friends: '++id, name, nickname, color, tag, createdAt, isMaintenanceOn, maintenanceInterval, likes, dislikes', 
  
  // 2. interactions: 保持不变
  interactions: '++id, friendId, date, type, isMeetup',

  // 3. 新增: memos (记忆碎片)
  // friendId: 关联是谁的记忆, content: 内容
  memos: '++id, friendId, content, createdAt' 
});