import Dexie from 'dexie';

export const db = new Dexie('RelationshipsDB');

db.version(1).stores({
  // 在最后加上 isPinned
  friends: '++id, name, nickname, color, tag, createdAt, isMaintenanceOn, maintenanceInterval, likes, dislikes, isPinned', 
  
  interactions: '++id, friendId, date, type, isMeetup',
  memos: '++id, friendId, content, createdAt'
});