import { LocalNotifications } from '@capacitor/local-notifications';
import { db } from '../db';

// 1. 申请权限
export const requestNotificationPermission = async () => {
  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted';
};

// 2. 核心逻辑：重新计算并调度所有通知
export const scheduleNotifications = async () => {
  // 先取消所有已有的通知，防止重复
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel(pending);
  }

  // 获取所有需要提醒的朋友
  const friends = await db.friends
    .filter(f => f.isMaintenanceOn === true && !!f.maintenanceInterval)
    .toArray();

  if (friends.length === 0) return;

  const interactions = await db.interactions.toArray();
  const notifications = [];

  // 遍历计算
  friends.forEach(friend => {
    // 找最近一次互动
    const friendInteractions = interactions.filter(i => i.friendId === friend.id);
    // 排序：最新的在前面
    friendInteractions.sort((a, b) => b.date - a.date);
    
    // 如果有互动，取最近一次；如果没有，取相识日期；如果都没有，取录入日期
    const lastDate = friendInteractions.length > 0 
      ? friendInteractions[0].date 
      : (friend.metAt || friend.createdAt);

    if (!lastDate) return;

    // 计算下一次应该联系的日期
    // 下次联系 = 上次见面 + 周期天数
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + friend.maintenanceInterval);

    // 如果这个时间还没到（在未来），就定个闹钟
    if (nextDate > new Date()) {
      // 设定时间：那天的上午 10:00 提醒
      nextDate.setHours(10, 0, 0, 0);

      notifications.push({
        title: "该联系老友啦 👋",
        body: `是不是好久没跟 ${friend.name} 聊聊了？`,
        id: friend.id, 
        schedule: { at: nextDate },
        sound: null, 
        attachments: null,
        actionTypeId: "",
        extra: null
      });
    }
  });

  // 批量添加到系统日程
  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
    console.log(`已设定 ${notifications.length} 个未来的维系提醒`);
  }
};