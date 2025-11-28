import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import FriendCard from "../components/FriendCard";
import AddFriendModal from "../components/AddFriendModal";
import AddInteractionModal from "../components/AddInteractionModal"; // 引入
import { Plus, Search, AlertCircle, UserPlus, CalendarPlus } from "lucide-react";
import { cn } from "../lib/utils";

export default function Home() {
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false); // 记账弹窗
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false); // 菜单开关
  const [searchTerm, setSearchTerm] = useState(""); 

  const friends = useLiveQuery(() => db.friends.orderBy('createdAt').reverse().toArray());
  const interactions = useLiveQuery(() => db.interactions.toArray());

  const processedFriends = useMemo(() => {
    if (!friends || !interactions) return [];
    const lastSeenMap = {};
    interactions.forEach(record => {
      const isValidMeetup = record.type === 'meetup' && record.isMeetup !== false;
      if (isValidMeetup) {
        const currentLast = lastSeenMap[record.friendId];
        if (!currentLast || record.date > currentLast) {
          lastSeenMap[record.friendId] = record.date;
        }
      }
    });

    return friends.map(friend => {
      const lastSeenDate = lastSeenMap[friend.id] || (friend.metAt ? new Date(friend.metAt) : null);
      let status = "normal"; 
      let daysDiff = -1;

      if (lastSeenDate) {
        const diffTime = new Date().getTime() - lastSeenDate.getTime();
        daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      if (friend.isMaintenanceOn && friend.maintenanceInterval) {
        if (daysDiff >= 0 && daysDiff > friend.maintenanceInterval) {
          status = "overdue"; 
        } else {
          status = "safe"; 
        }
      } else if (friend.isMaintenanceOn && !lastSeenDate) {
        status = "overdue";
      }

      return { ...friend, lastSeenDate, daysDiff, status };
    }).filter(f => {
      if (!searchTerm) return true;
      const lowerTerm = searchTerm.toLowerCase();
      return (
        f.name.toLowerCase().includes(lowerTerm) || 
        (f.tag && f.tag.toLowerCase().includes(lowerTerm))
      );
    });
  }, [friends, interactions, searchTerm]);

  const sortedFriends = useMemo(() => {
    return [...processedFriends].sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (a.status !== 'overdue' && b.status === 'overdue') return 1;
      return 0; 
    });
  }, [processedFriends]);

  return (
    <div className="min-h-screen w-full bg-[#FAFAF9] dark:bg-black pb-32">
      
      {/* 标题栏 */}
      <header className="px-6 pt-14 pb-4 sticky top-0 z-20 bg-[#FAFAF9]/90 dark:bg-black/90 backdrop-blur-sm transition-colors">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">朋友</h1>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 font-medium">
              {sortedFriends.length} 位好友
            </p>
          </div>
          
          <button 
            onClick={() => setIsActionSheetOpen(!isActionSheetOpen)}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all",
              isActionSheetOpen ? "bg-gray-200 text-gray-600 rotate-45" : "bg-black dark:bg-white text-white dark:text-black"
            )}
          >
            <Plus size={22} />
          </button>

          {/* === 悬浮菜单 === */}
          {isActionSheetOpen && (
            <div className="absolute top-16 right-6 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 p-2 min-w-[160px] animate-in slide-in-from-top-2 fade-in duration-200 z-50">
              <button 
                onClick={() => { setIsFriendModalOpen(true); setIsActionSheetOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-white/10 rounded-xl transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">添加朋友</span>
              </button>
              
              <button 
                onClick={() => { setIsInteractionModalOpen(true); setIsActionSheetOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-white/10 rounded-xl transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                  <CalendarPlus size={16} />
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">记录活动</span>
              </button>
            </div>
          )}
          {/* 点击外部关闭菜单的遮罩 */}
          {isActionSheetOpen && <div className="fixed inset-0 z-40" onClick={() => setIsActionSheetOpen(false)} />}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索名字或标签..." 
            className="w-full h-10 bg-white dark:bg-white/10 rounded-xl pl-10 pr-4 text-sm outline-none border border-gray-100 dark:border-white/5 focus:border-blue-400 transition-colors shadow-sm"
          />
        </div>
      </header>

      {sortedFriends.some(f => f.status === 'overdue') && (
        <div className="px-6 mb-4 animate-in slide-in-from-top-2">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl p-3 flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle size={18} />
            <span className="text-xs font-bold">有朋友很久没联系了，快去看看！</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-6 px-6 mt-2">
        {sortedFriends.length === 0 ? (
          <div className="col-span-2 py-24 text-center text-gray-300">
             <div className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-lg flex items-center justify-center text-4xl mx-auto mb-4 opacity-50">
               {searchTerm ? "🔍" : "+"}
             </div>
             <p className="text-sm font-medium">
               {searchTerm ? "没找到相关朋友" : "添加一个朋友"}
             </p>
          </div>
        ) : (
          sortedFriends.map(friend => (
            <div key={friend.id} className="relative group">
              <FriendCard friend={friend} />
              
              {friend.daysDiff >= 0 && (
                <div className={cn(
                  "absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-md border flex items-center gap-1 z-10 transition-all",
                  friend.status === 'overdue' 
                    ? "bg-red-100/90 text-red-600 border-red-200" 
                    : friend.status === 'safe'
                      ? "bg-green-100/90 text-green-700 border-green-200" 
                      : "bg-white/80 text-gray-500 border-white/40" 
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

      <AddFriendModal 
        isOpen={isFriendModalOpen} 
        onClose={() => setIsFriendModalOpen(false)} 
      />

      <AddInteractionModal
        isOpen={isInteractionModalOpen}
        onClose={() => setIsInteractionModalOpen(false)}
        // 不传 friendId，表示多选模式
      />
    </div>
  );
}