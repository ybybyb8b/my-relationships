import Dexie from 'dexie';

export const db = new Dexie('RelationshipsDB');

// 定义数据库结构
db.version(1).stores({
  // 朋友表：id自增，name用于搜索
  friends: '++id, name, color, tag, createdAt', 
  
  // 互动表：以后会用到
  interactions: '++id, friendId, date, type' 
});