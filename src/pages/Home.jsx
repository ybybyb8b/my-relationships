import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import FriendCard from "../components/FriendCard";
import AddFriendModal from "../components/AddFriendModal";
import AddInteractionModal from "../components/AddInteractionModal"; 
import { Plus, Search, UserPlus, CalendarPlus, Cake, ArrowUpDown, Check, History, Sparkles, Coffee, Bell, X } from "lucide-react"; 
import { cn, THEME_COLORS } from "../lib/utils";

export default function Home() {
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false); 
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false); 
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [sortType, setSortType] = useState('date');

  const friends = useLiveQuery(() => db.friends.orderBy('createdAt').reverse().toArray());
  const interactions = useLiveQuery(() => db.interactions.toArray());
  const memos = useLiveQuery(() => db.memos.toArray());

  const processedData = useMemo(() => {
    if (!friends || !interactions || !memos) return { list: [], birthdays: [], flashbacks: [], overdueFriends: [] };

    const lastSeenMap = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // --- 1. Flashback 计算 (保持不变) ---
    const flashbacks = [];
    interactions.forEach(record => {
      const d = record.date;
      if (d.getMonth() === today.getMonth() && d.getDate() === today.getDate() && d.getFullYear() < today.getFullYear()) {
        const friend = friends.find(f => f.id === record.friendId);
        if (friend) flashbacks.push({ record, friend, yearsAgo: today.getFullYear() - d.getFullYear() });
      }
      const isValidMeetup = record.type === 'meetup' && record.isMeetup !== false;
      if (isValidMeetup) {
        const currentLast = lastSeenMap[record.friendId];
        if (!currentLast || record.date > currentLast) lastSeenMap[record.friendId] = record.date;
      }
    });

    const memoMap = {};
    memos.forEach(m => {
      if (!memoMap[m.friendId]) memoMap[m.friendId] = "";
      memoMap[m.friendId] += m.content.toLowerCase() + " ";
    });

    // --- 2. 遍历计算状态 (保持不变) ---
    const fullList = friends.map(friend => {
      const lastSeenDate = lastSeenMap[friend.id] || (friend.metAt ? new Date(friend.metAt) : null);
      let status = "normal"; 
      let daysDiff = -1;

      if (lastSeenDate) {
        const diffTime = today.getTime() - lastSeenDate.getTime();
        daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      if (friend.isMaintenanceOn && friend.maintenanceInterval) {
        if (daysDiff >= 0 && daysDiff > friend.maintenanceInterval) status = "overdue"; 
        else status = "safe"; 
      } else if (friend.isMaintenanceOn && !lastSeenDate) {
        status = "overdue";
      }

      let daysUntilBirthday = 999;
      if (friend.birthday && friend.birthday.month && friend.birthday.day) {
        const currentYear = today.getFullYear();
        let nextBday = new Date(currentYear, friend.birthday.month - 1, friend.birthday.day);
        if (nextBday < today) nextBday.setFullYear(currentYear + 1);
        const diffTime = nextBday - today;
        daysUntilBirthday = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      const searchableString = [friend.name, friend.nickname, friend.tag, friend.likes, friend.dislikes, memoMap[friend.id] || ""].join(" ").toLowerCase();
      return { ...friend, lastSeenDate, daysDiff, status, daysUntilBirthday, searchableString };
    });

    const filteredList = fullList.filter(f => !searchTerm || f.searchableString.includes(searchTerm.toLowerCase()));
    
    const upcomingBirthdays = fullList
      .filter(f => f.daysUntilBirthday >= 0 && f.daysUntilBirthday <= 30)
      .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

    const overdueFriends = fullList
      .filter(f => f.status === 'overdue')
      .sort((a, b) => b.daysDiff - a.daysDiff);

    return { list: filteredList, birthdays: upcomingBirthdays, flashbacks, overdueFriends };
  }, [friends, interactions, memos, searchTerm]);

  const sortedFriends = useMemo(() => {
    const list = [...processedData.list];
    switch (sortType) {
      case 'birthday': return list.sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
      case 'interaction': return list.sort((a, b) => {
          const dateA = a.lastSeenDate ? a.lastSeenDate.getTime() : 0;
          const dateB = b.lastSeenDate ? b.lastSeenDate.getTime() : 0;
          return dateB - dateA;
        });
      case 'date': default: return list.sort((a, b) => b.createdAt - a.createdAt);
    }
  }, [processedData.list, sortType]);

  const sortOptions = [
    { id: 'date', label: '最近加入' },
    { id: 'birthday', label: '最近生日' },
    { id: 'interaction', label: '最近互动' },
  ];

  const insights = [
    ...processedData.flashbacks.map(fb => ({ type: 'flashback', data: fb })),
    ...processedData.overdueFriends.map(f => ({ type: 'overdue', data: f }))
  ];

  return (
    <div className="min-h-screen w-full bg-[#FAFAF9] dark:bg-black pb-32 transition-colors duration-500">
      
      {/* 标题栏 */}
      <header className="px-6 pt-14 pb-4 sticky top-0 z-20 bg-[#FAFAF9]/95 dark:bg-black/95 backdrop-blur-md transition-colors">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">朋友</h1>
            <div className="relative mt-1">
              <button 
                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-blue-500 transition-colors"
              >
                <span>{sortedFriends.length} 位</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                <ArrowUpDown size={12} />
                <span>{sortOptions.find(o => o.id === sortType).label}</span>
              </button>
              {isSortMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30 cursor-default" onClick={() => setIsSortMenuOpen(false)} />
                  <div className="absolute top-8 left-0 z-40 bg-white dark:bg-[#1C1C1E] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 p-1.5 min-w-[140px] animate-in slide-in-from-top-2 fade-in duration-200">
                    {sortOptions.map(option => (
                      <button key={option.id} onClick={() => { setSortType(option.id); setIsSortMenuOpen(false); }} className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors", sortType === option.id ? "bg-gray-50 dark:bg-white/10 text-blue-600 dark:text-blue-400 font-bold" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5")}>
                        {option.label}
                        {sortType === option.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <button onClick={() => setIsActionSheetOpen(!isActionSheetOpen)} className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all", isActionSheetOpen ? "bg-gray-200 text-gray-600 rotate-45" : "bg-black dark:bg-white text-white dark:text-black")}>
            <Plus size={22} />
          </button>
          {isActionSheetOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsActionSheetOpen(false)} />
              <div className="absolute top-16 right-6 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 p-2 min-w-[160px] animate-in slide-in-from-top-2 fade-in duration-200 z-50">
                {/* 优化后的深色模式图标背景：更淡雅，不突兀 */}
                <button onClick={() => { setIsFriendModalOpen(true); setIsActionSheetOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <UserPlus size={16} />
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">添加朋友</span>
                </button>
                <button onClick={() => { setIsInteractionModalOpen(true); setIsActionSheetOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
                    <CalendarPlus size={16} />
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">记录活动</span>
                </button>
              </div>
            </>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索名字、喜好、记忆..." className="w-full h-10 bg-white dark:bg-white/10 rounded-xl pl-10 pr-4 text-sm outline-none border border-gray-200 dark:border-white/5 focus:border-blue-400 transition-colors shadow-sm text-gray-800 dark:text-white placeholder:text-gray-400/70" />
        </div>
      </header>

      {/* === 情报流 (Horizontal Scroll Deck) === */}
      {!searchTerm && insights.length > 0 && (
        <div className="mb-6 animate-in slide-in-from-top-2">
          <div className="flex gap-3 px-6 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
            
            {insights.map((item, idx) => {
              // 1. 那年今日卡片 (Flashback) - 深色模式优化
              if (item.type === 'flashback') {
                const fb = item.data;
                return (
                  <div key={`fb-${idx}`} className="flex-shrink-0 w-[85vw] sm:w-[340px] snap-center">
                    <div className="relative overflow-hidden bg-white/60 dark:bg-white/5 backdrop-blur-md border border-yellow-200/50 dark:border-white/10 rounded-2xl p-4 shadow-sm h-full flex flex-col justify-between">
                      {/* 深色下背景透明，只保留微弱光晕 */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-yellow-100 dark:bg-yellow-500/10 rounded-full text-yellow-600 dark:text-yellow-400">
                          <History size={16} />
                        </div>
                        <span className="text-[10px] font-bold text-yellow-600/80 dark:text-yellow-500 uppercase tracking-widest">Flashback</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-hand">
                        <span className="font-bold text-lg mx-1 text-gray-900 dark:text-white">{fb.yearsAgo}</span> 年前的今天，
                        你和 <span className="font-bold text-gray-900 dark:text-white mx-1">{fb.friend.name}</span> 
                        {fb.record.title ? ` ${fb.record.title}` : " 曾有过互动"}。
                      </p>
                      {/* 深色模式下的 Sparkles 颜色减淡 */}
                      <Sparkles className="absolute -right-2 -bottom-2 text-yellow-400/20 dark:text-yellow-200/10 rotate-12" size={60} />
                    </div>
                  </div>
                );
              }

              // 2. 好久不见卡片 (Overdue) - 深色模式优化
              if (item.type === 'overdue') {
                const f = item.data;
                const theme = THEME_COLORS[f.color] || THEME_COLORS.default;
                return (
                  <div key={`od-${f.id}`} className="flex-shrink-0 w-[85vw] sm:w-[340px] snap-center">
                    <div className="relative overflow-hidden bg-white/60 dark:bg-white/5 backdrop-blur-md border border-violet-200/50 dark:border-white/10 rounded-2xl p-4 shadow-sm h-full flex items-center gap-4">
                      
                      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-inner flex-shrink-0", theme.photo)}>
                        {f.photo ? (
                          <img src={f.photo} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="font-bold opacity-60">{f.name?.[0]}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {/* 深色模式下 Tag 背景变淡 */}
                          <span className="text-[10px] font-bold text-violet-600 dark:text-violet-300 uppercase tracking-wider bg-violet-50 dark:bg-violet-500/10 px-1.5 py-0.5 rounded">好久不见</span>
                        </div>
                        <p className="text-base font-bold text-gray-800 dark:text-gray-100 truncate">{f.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          已经 <span className="font-bold text-violet-500 dark:text-violet-400">{f.daysDiff}</span> 天没联系了
                        </p>
                      </div>
                      
                      {/* 装饰图标变淡 */}
                      <div className="absolute right-[-10px] bottom-[-10px] opacity-10 dark:opacity-5 rotate-12 pointer-events-none">
                        <Coffee size={80} className="dark:text-white" />
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* === 近期生日 (Banner) === */}
      {processedData.birthdays.length > 0 && !searchTerm && (
        <div className="mb-4 animate-in slide-in-from-top-4">
          <div className="px-6 flex items-center gap-2 mb-2">
            <Cake size={14} className="text-rose-400" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">近期生日</span>
          </div>
          <div className="flex gap-3 px-6 overflow-x-auto no-scrollbar pb-2">
            {processedData.birthdays.map(friend => {
              const theme = THEME_COLORS[friend.color] || THEME_COLORS.default;
              return (
                <div key={friend.id} className="flex-shrink-0 relative group">
                  {/* 深色模式：胶囊背景变 neutral，不再发白 */}
                  <div className="bg-white dark:bg-white/5 p-2 pr-4 rounded-full border border-gray-100 dark:border-white/10 shadow-sm flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-inner", theme.photo)}>
                      {friend.photo ? (
                        <img src={friend.photo} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span className="font-bold opacity-60">{friend.name?.[0]}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-100">{friend.name}</p>
                      <p className="text-[10px] font-medium text-rose-500 dark:text-rose-400">
                        {friend.daysUntilBirthday === 0 ? "今天生日！" : `${friend.daysUntilBirthday} 天后`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 列表区域 */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 px-6 mt-2">
        {sortedFriends.length === 0 ? (
          <div className="col-span-2 py-24 text-center text-gray-300 dark:text-gray-600">
             <div className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-lg flex items-center justify-center text-4xl mx-auto mb-4 opacity-50">
               {searchTerm ? "🔍" : "+"}
             </div>
             <p className="text-sm font-medium">
               {searchTerm ? "没有找到相关记忆" : "添加一个朋友"}
             </p>
          </div>
        ) : (
          sortedFriends.map(friend => (
            <div key={friend.id} className="relative group">
              <FriendCard friend={friend} />
              
              {/* 卡片右上角的状态胶囊 (深色优化) */}
              {friend.daysDiff >= 0 && (
                <div className={cn(
                  "absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-md border flex items-center gap-1 z-10 transition-all",
                  // 这里的状态颜色也需要变柔和
                  friend.status === 'overdue' 
                    ? "bg-red-100/90 dark:bg-red-500/20 text-red-600 dark:text-red-300 border-red-200 dark:border-red-500/10" 
                    : friend.status === 'safe'
                      ? "bg-green-100/90 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/10" 
                      : "bg-white/80 dark:bg-white/20 text-gray-500 dark:text-gray-300 border-white/40 dark:border-white/10" 
                )}>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    friend.status === 'overdue' ? "bg-red-500 animate-pulse" : 
                    friend.status === 'safe' ? "bg-green-500" : "bg-gray-400"
                  )} />
                  {friend.daysDiff === 0 ? "今天" : `${friend.daysDiff}天`}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <AddFriendModal isOpen={isFriendModalOpen} onClose={() => setIsFriendModalOpen(false)} />
      <AddInteractionModal isOpen={isInteractionModalOpen} onClose={() => setIsInteractionModalOpen(false)} />
    </div>
  );
}