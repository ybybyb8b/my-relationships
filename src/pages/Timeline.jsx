import { useLiveQuery } from "dexie-react-hooks";
// remove Link import
import { db } from "../db";
import { Calendar, Gift } from "lucide-react";
import { cn } from "../lib/utils";

export default function Timeline() {
  const interactions = useLiveQuery(() => 
    db.interactions.orderBy('date').reverse().toArray()
  );

  const friends = useLiveQuery(() => db.friends.toArray());

  if (!interactions || !friends) return null;

  const friendMap = friends.reduce((acc, friend) => {
    acc[friend.id] = friend;
    return acc;
  }, {});

  const groupedInteractions = interactions.reduce((groups, item) => {
    const date = item.date;
    const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(item);
    return groups;
  }, {});

  const monthKeys = Object.keys(groupedInteractions);

  return (
    <div className="min-h-screen pb-32 bg-[#fafaf9] dark:bg-black text-[#1c1c1e] dark:text-white px-6 pt-16">
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold">动态</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          共 {interactions.length} 条记忆
        </p>
      </header>

      {interactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
          <div className="text-6xl grayscale">🍃</div>
          <p>这里静悄悄的</p>
          <p className="text-xs">去朋友详情页记录第一笔互动吧</p>
        </div>
      ) : (
        <div className="space-y-8">
          {monthKeys.map(month => (
            <div key={month}>
              {/* 月份标题 */}
              <h3 className="sticky top-0 py-2 bg-[#fafaf9]/80 dark:bg-black/80 backdrop-blur-md z-10 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                {month}
              </h3>
              
              <div className="space-y-3">
                {groupedInteractions[month].map(item => {
                  const friend = friendMap[item.friendId];
                  if (!friend) return null; 

                  return (
                    // === 修改点：不再是 Link，而是普通的 div ===
                    <div 
                      key={item.id}
                      className="block group"
                    >
                      {/* 移除了 active:scale-98 和 cursor-pointer，变成纯展示卡片 */}
                      <div className="flex items-center p-4 bg-white dark:bg-white/10 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm transition-all">
                        
                        {/* 左侧：头像 + 类型角标 */}
                        <div className="relative mr-4">
                          <div className="w-12 h-12 flex items-center justify-center text-2xl bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                            {friend.photo ? (
                               <img src={friend.photo} alt={friend.name} className="w-full h-full object-cover" />
                            ) : (
                               <span className="font-bold text-gray-400 dark:text-gray-500 select-none">
                                 {friend.name ? friend.name.charAt(0).toUpperCase() : "?"}
                               </span>
                            )}
                          </div>
                          
                          {/* 角标 (样式保持统一) */}
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#1C1C1E] text-[10px]",
                            item.type === 'meetup' && "bg-blue-100 dark:bg-blue-500 text-blue-600 dark:text-white",
                            item.type === 'gift' && item.giftDirection === 'out' && "bg-rose-100 dark:bg-rose-500 text-rose-600 dark:text-white",
                            item.type === 'gift' && item.giftDirection === 'in' && "bg-emerald-100 dark:bg-emerald-500 text-emerald-600 dark:text-white"
                          )}>
                             {item.type === 'meetup' ? <Calendar size={10} /> : <Gift size={10} />}
                          </div>
                        </div>

                        {/* 中间：内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                             <h4 className="font-bold text-base truncate pr-2 text-gray-900 dark:text-white">
                               {friend.name}
                             </h4>
                             {/* 金额 */}
                             {item.price && (
                               <span className={cn(
                                 "text-xs font-mono font-medium",
                                 (item.splitType === 'me' || item.giftDirection === 'out') ? "text-blue-600 dark:text-blue-400" :
                                 item.splitType === 'aa' ? "text-orange-500 dark:text-orange-400" :
                                 "text-emerald-500 dark:text-emerald-400"
                               )}>
                                 {item.giftDirection === 'out' ? '-' : ''}
                                 {item.splitType === 'me' ? '-' : ''}
                                 {item.splitType === 'they' ? '+' : ''}
                                 ¥{item.price}
                               </span>
                             )}
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {item.title}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 dark:text-gray-500">
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
                    </div>
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