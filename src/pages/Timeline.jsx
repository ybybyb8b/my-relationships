import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { db } from "../db";
import { Calendar, Gift, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { cn } from "../lib/utils";

export default function Timeline() {
  // 1. 获取所有互动 (按日期倒序)
  const interactions = useLiveQuery(() => 
    db.interactions.orderBy('date').reverse().toArray()
  );

  // 2. 获取所有朋友 (用于把 friendId 变成名字和头像)
  const friends = useLiveQuery(() => db.friends.toArray());

  if (!interactions || !friends) return null;

  // === 数据处理：把朋友信息拼到互动记录里 ===
  // 做一个字典：{ 1: {name: "阿强", avatar: "🦁", ...}, 2: ... }
  const friendMap = friends.reduce((acc, friend) => {
    acc[friend.id] = friend;
    return acc;
  }, {});

  // === 数据处理：按月份分组 ===
  // 结果结构：{ "2025年11月": [record1, record2], "2025年10月": [...] }
  const groupedInteractions = interactions.reduce((groups, item) => {
    const date = item.date;
    const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(item);
    return groups;
  }, {});

  // 获取所有月份的 key (保持倒序)
  const monthKeys = Object.keys(groupedInteractions);

  return (
    <div className="min-h-screen pb-32 bg-ios-bg dark:bg-black text-ios-text dark:text-white px-6 pt-16">
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold">动态</h1>
        <p className="text-ios-gray dark:text-ios-subtext-dark text-sm mt-1">
          共 {interactions.length} 条记忆
        </p>
      </header>

      {interactions.length === 0 ? (
        // 空状态
        <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
          <div className="text-6xl">🍃</div>
          <p>这里静悄悄的</p>
          <p className="text-xs">去朋友详情页记录第一笔互动吧</p>
        </div>
      ) : (
        // === 时间轴列表 ===
        <div className="space-y-8">
          {monthKeys.map(month => (
            <div key={month}>
              {/* 月份标题 (sticky 效果会让它吸顶，很原生) */}
              <h3 className="sticky top-0 py-2 bg-ios-bg/80 dark:bg-black/80 backdrop-blur-md z-10 text-xs font-bold text-ios-gray uppercase tracking-wider mb-3">
                {month}
              </h3>
              
              <div className="space-y-3">
                {groupedInteractions[month].map(item => {
                  const friend = friendMap[item.friendId];
                  if (!friend) return null; // 防止朋友被删了导致报错

                  return (
                    <Link 
                      key={item.id}
                      to={`/friend/${friend.id}`}
                      className="block group"
                    >
                      <div className="flex items-center p-4 bg-white dark:bg-white/5 rounded-2xl border border-transparent dark:border-white/5 shadow-sm active:scale-98 transition-all">
                        
                        {/* 左侧：朋友头像 (带一个小角标显示类型) */}
                        <div className="relative mr-4">
                          <div className="w-12 h-12 flex items-center justify-center text-2xl bg-gray-100 dark:bg-white/10 rounded-full">
                            {friend.avatar}
                          </div>
                          {/* 类型角标 */}
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-black text-[10px]",
                            item.type === 'meetup' 
                              ? "bg-blue-100 text-blue-600" 
                              : "bg-rose-100 text-rose-600"
                          )}>
                             {item.type === 'meetup' ? <Calendar size={10} /> : <Gift size={10} />}
                          </div>
                        </div>

                        {/* 中间：内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                             <h4 className="font-bold text-base truncate pr-2">
                               {friend.name}
                             </h4>
                             {/* 金额 */}
                             {item.price && (
                               <span className={cn(
                                 "text-xs font-mono font-medium",
                                 (item.splitType === 'me' || item.giftDirection === 'out') ? "text-blue-600 dark:text-blue-400" :
                                 item.splitType === 'aa' ? "text-orange-500" :
                                 "text-emerald-500"
                               )}>
                                 {item.giftDirection === 'out' ? '-' : ''}
                                 {item.splitType === 'me' ? '-' : ''}
                                 ¥{item.price}
                               </span>
                             )}
                          </div>
                          
                          <p className="text-sm text-black/70 dark:text-white/70 truncate">
                            {item.title}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                             <span>{item.date.getDate()}日</span>
                             <span>·</span>
                             {item.type === 'meetup' ? (
                               <span>
                                 {item.splitType === 'me' && '我买单'}
                                 {item.splitType === 'aa' && 'AA制'}
                                 {item.splitType === 'they' && 'Ta请客'}
                               </span>
                             ) : (
                               <span>
                                 {item.giftDirection === 'out' ? '送出礼物' : '收到礼物'}
                               </span>
                             )}
                          </div>
                        </div>

                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}