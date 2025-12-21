import { LocalNotifications } from '@capacitor/local-notifications';
import { db } from '../db';

// 1. 申请权限
export const requestNotificationPermission = async () => {
  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted';
};

// 2. 核心逻辑：重新计算并调度所有通知
export const scheduleNotifications = async () => {
  // 先取消所有已有的通知
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel(pending);
  }

  const friends = await db.friends.toArray();
  if (friends.length === 0) return;

  // 获取用户设置的提醒偏好 (例如 ['0', '3', '7'])
  const setting = await db.settings.get('birthdayReminders');
  const reminders = setting?.value || ['0'];

  const interactions = await db.interactions.toArray();
  const notifications = [];
  const now = new Date();
  
  // 设置时间：每天上午 9:30 提醒
  const NOTIFY_HOUR = 9;
  const NOTIFY_MINUTE = 30;

  friends.forEach(friend => {
    
    // === 关键修改：智能称呼逻辑 ===
    // 优先显示昵称，如果没有昵称，再显示名字
    const displayName = friend.nickname || friend.name;

    // ==========================================
    // 🔔 逻辑 A: 维系提醒
    // ==========================================
    if (friend.isMaintenanceOn && friend.maintenanceInterval) {
      const friendInteractions = interactions.filter(i => i.friendId === friend.id);
      friendInteractions.sort((a, b) => b.date - a.date);
      
      const lastDate = friendInteractions.length > 0 
        ? friendInteractions[0].date 
        : (friend.metAt || friend.createdAt);

      if (lastDate) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + friend.maintenanceInterval);

        if (nextDate > now) {
          nextDate.setHours(10, 0, 0, 0); 
          notifications.push({
            id: friend.id,
            title: "好久不见",
            // 使用 displayName
            body: `是不是好久没跟 ${displayName} 见面了？`,
            schedule: { at: nextDate },
            sound: null, 
          });
        }
      }
    }

    // ==========================================
    // 🎂 逻辑 B: 多重生日提醒
    // ==========================================
    if (friend.birthday && friend.birthday.month && friend.birthday.day) {
      
      reminders.forEach(offsetStr => {
        const offset = parseInt(offsetStr, 10);
        const currentYear = now.getFullYear();
        
        let bdayTarget = new Date(currentYear, friend.birthday.month - 1, friend.birthday.day);
        bdayTarget.setHours(NOTIFY_HOUR, NOTIFY_MINUTE, 0, 0);

        let triggerDate = new Date(bdayTarget);
        triggerDate.setDate(triggerDate.getDate() - offset);

        if (triggerDate < now) {
           bdayTarget.setFullYear(currentYear + 1);
           triggerDate = new Date(bdayTarget);
           triggerDate.setDate(triggerDate.getDate() - offset);
        }

        let title = "";
        let body = "";
        let uniqueId = 0;

        if (offset === 0) {
          // --- 当天 ---
          uniqueId = friend.id + 100000;
          title = "Birthday!";
          // 使用 displayName
          body = `今天是 ${displayName} 的生日，别忘了发个消息！`;
        } else {
          // --- 提前 X 天 ---
          const multiplier = offset === 3 ? 2 : 3; 
          uniqueId = friend.id + (multiplier * 100000);
          
          title = `📅 生日预告 (${offset}天后)`;
          // 使用 displayName
          body = `${displayName} 的生日快到了，礼物准备好了吗？`;
        }

        notifications.push({
          id: uniqueId,
          title: title,
          body: body,
          schedule: { at: triggerDate },
          sound: null,
        });
      });
    }
  });

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
    console.log(`已更新: ${notifications.length} 个提醒 (优先使用昵称)`);
  }
};