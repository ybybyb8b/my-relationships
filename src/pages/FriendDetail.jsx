import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { ArrowLeft, Calendar, User, Clock, Gift, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { cn } from "../lib/utils";
import AddInteractionModal from "../components/AddInteractionModal";

export default function FriendDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const friend = useLiveQuery(() => db.friends.get(Number(id)), [id]);
  const interactions = useLiveQuery(
    () => db.interactions.where('friendId').equals(Number(id)).reverse().sortBy('date'),
    [id]
  );

  if (!friend) return null;

  const getLastSeenText = () => {
    if (!interactions || interactions.length === 0) return "暂无记录";
    const lastMeetup = interactions.find(i => i.type === 'meetup');
    if (!lastMeetup) return "尚未见过";
    const diff = new Date().getTime() - lastMeetup.date.getTime();
    const days = Math.floor(diff / (1000 * 3600 * 24));
    if (days === 0) return "就是今天";
    if (days < 0) return "未来计划"; 
    if (days < 30) return `${days}天前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return `${Math.floor(days / 365)}年前`;
  };

  const getBirthdayText = () => {
    if (!friend.birthday) return "未记录";
    const { month, day, year } = friend.birthday;
    if (!year) return `${month}月${day}日`;
    const today = new Date();
    let age = today.getFullYear() - year;
    if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) { age--; }
    return `${month}月${day}日 (${age}岁)`;
  };

  const bgGradients = {
    blue: "bg-blue-500/30 dark:bg-blue-900/40",
    pink: "bg-pink-500/30 dark:bg-pink-900/40",
    green: "bg-green-500/30 dark:bg-green-900/40",
    yellow: "bg-yellow-500/30 dark:bg-yellow-900/40",
    purple: "bg-purple-500/30 dark:bg-purple-900/40",
  };
  const themeColor = bgGradients[friend.color] || bgGradients.blue;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-ios-bg dark:bg-black text-ios-text dark:text-white">
      
      <div className={cn("fixed -top-[20%] -left-[20%] w-[100%] h-[60%] rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen opacity-70", themeColor)} />
      <div className={cn("fixed top-[20%] -right-[20%] w-[80%] h-[60%] rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen opacity-70 animation-delay-2000", themeColor)} />

      <div className="relative z-50 px-6 pt-6 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="p-3 rounded-full bg-white/30 dark:bg-white/10 backdrop-blur-md hover:bg-white/50 border border-white/20 transition-all shadow-sm active:scale-95">
          <ArrowLeft size={22} />
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center mt-4 px-6 pb-32">
        
        {/* 头像区 */}
        <div className="relative">
          <div className={cn("absolute inset-0 rounded-full blur-xl opacity-50 scale-110", themeColor)} />
          <div className="relative w-32 h-32 text-7xl flex items-center justify-center bg-white/60 dark:bg-white/10 backdrop-blur-xl rounded-full shadow-2xl border border-white/40 dark:border-white/20">
            {friend.avatar}
          </div>
          {friend.tag && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-black/5 text-[10px] font-bold tracking-wide uppercase text-gray-500 whitespace-nowrap">
              {friend.tag}
            </div>
          )}
        </div>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-center drop-shadow-sm">{friend.name}</h1>
        {friend.metAt && (
          <p className="mt-2 text-sm text-black/40 dark:text-white/40 font-medium">
            相识于 {new Date(friend.metAt).toLocaleDateString()}
          </p>
        )}

        {/* 顶部统计卡片 */}
        <div className="w-full max-w-sm mt-8 space-y-4">
          <div className="group flex items-center p-4 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-white/10 shadow-sm hover:bg-white/50 transition-colors">
            <div className="p-3 bg-white/60 dark:bg-white/10 rounded-2xl text-blue-500 dark:text-blue-400 shadow-inner">
              <Calendar size={20} />
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-black/30 dark:text-white/30 uppercase tracking-wider">Birthday</p>
              <p className="text-base font-semibold text-black/80 dark:text-white/90 mt-0.5">{getBirthdayText()}</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-white/10 shadow-sm">
             <div className="p-3 bg-white/60 dark:bg-white/10 rounded-2xl text-purple-500 dark:text-purple-400 shadow-inner">
              <Clock size={20} />
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-black/30 dark:text-white/30 uppercase tracking-wider">Last Seen</p>
              <p className="text-base font-semibold text-black/80 dark:text-white/90 mt-0.5">
                {getLastSeenText()}
              </p>
            </div>
          </div>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="mt-6 w-full max-w-sm py-4 rounded-3xl bg-black dark:bg-white text-white dark:text-black font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2">
            <span>+ 记一笔</span>
        </button>

        {/* === 互动历史列表 (核心修改区域) === */}
        <div className="w-full max-w-sm mt-8 pb-10">
           <h3 className="text-sm font-bold text-black/40 dark:text-white/40 mb-4 px-2 uppercase tracking-wider">
             History
           </h3>
           
           {!interactions || interactions.length === 0 ? (
             <div className="text-center py-10 opacity-30 text-sm">暂无互动记录</div>
           ) : (
             <div className="space-y-3">
               {interactions.map(item => (
                 <div key={item.id} className="flex items-center p-4 bg-white/30 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/5 backdrop-blur-md">
                    
                    {/* 图标列 */}
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg",
                      item.type === 'meetup' 
                        ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300" 
                        : (item.giftDirection === 'out' 
                            ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300" 
                            : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300")
                    )}>
                       {item.type === 'meetup' ? <Calendar size={18}/> : <Gift size={18}/>}
                    </div>

                    {/* 信息列 */}
                    <div className="ml-3 flex-1 min-w-0">
                       <div className="flex justify-between items-start">
                          <p className="font-medium truncate pr-2 text-black/90 dark:text-white/90">
                            {item.title}
                          </p>
                          
                          {/* === 金额展示逻辑 === */}
                          {item.price && (
                             <div className="flex flex-col items-end">
                               <span className={cn(
                                 "text-sm font-bold font-mono",
                                 // 1. 我付的 / 我送礼 -> 蓝色/红色
                                 (item.splitType === 'me' || item.giftDirection === 'out') && "text-blue-600 dark:text-blue-400",
                                 // 2. AA -> 橙色
                                 item.splitType === 'aa' && "text-orange-500 dark:text-orange-400",
                                 // 3. 收礼 / Ta付 -> 绿色
                                 (item.splitType === 'they' || item.giftDirection === 'in') && "text-emerald-600 dark:text-emerald-400"
                               )}>
                                 {/* 前缀符号 */}
                                 {item.giftDirection === 'out' || item.splitType === 'me' ? '-' : ''}
                                 {item.splitType === 'aa' ? 'AA ' : ''}
                                 {item.splitType === 'they' ? '+' : ''}
                                 ¥{item.price}
                               </span>
                             </div>
                          )}
                       </div>

                       <div className="flex items-center gap-2 mt-0.5 text-xs text-black/50 dark:text-white/50">
                          <span>{item.date.toLocaleDateString()}</span>
                          
                          {/* 礼物方向标记 */}
                          {item.type === 'gift' && (
                            <span className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">
                               {item.giftDirection === 'out' ? '送出' : '收到'}
                            </span>
                          )}

                          {/* 见面买单标记 */}
                          {item.type === 'meetup' && item.splitType && (
                             <span className={cn(
                               "px-1.5 py-0.5 rounded",
                               item.splitType === 'me' && "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300",
                               item.splitType === 'aa' && "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-300",
                               item.splitType === 'they' && "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                             )}>
                               {item.splitType === 'me' ? '我买单' : ''}
                               {item.splitType === 'aa' ? 'AA制' : ''}
                               {item.splitType === 'they' ? 'Ta请客' : ''}
                             </span>
                          )}
                       </div>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
      
      <AddInteractionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        friendId={id}
        friendName={friend.name}
      />
    </div>
  );
}