import { useState, useMemo } from "react"; // <--- 修复点：补上了 useMemo
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { ArrowLeft, Calendar, Clock, Gift, Pencil, MapPin, Heart, Zap, Bell, StickyNote, Trash2, Scale } from "lucide-react"; 
import { cn, THEME_COLORS } from "../lib/utils";
import AddInteractionModal from "../components/AddInteractionModal";
import AddFriendModal from "../components/AddFriendModal";

export default function FriendDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState(null);
  
  const [newMemo, setNewMemo] = useState("");
  const [isAddingMemo, setIsAddingMemo] = useState(false);

  const friend = useLiveQuery(() => db.friends.get(Number(id)), [id]);
  const interactions = useLiveQuery(
    () => db.interactions.where('friendId').equals(Number(id)).reverse().sortBy('date'),
    [id]
  );
  const memos = useLiveQuery(
    () => db.memos.where('friendId').equals(Number(id)).reverse().sortBy('createdAt'),
    [id]
  );

  // === 人情账本计算 ===
  const balanceData = useMemo(() => {
    if (!interactions) return { val: 0, text: "计算中...", color: "text-gray-500" };
    let total = 0;
    interactions.forEach(item => {
      const price = item.price ? Number(item.price) : 0;
      if (price === 0) return;
      if (item.giftDirection === 'out' || item.splitType === 'me') {
        total += price;
      } else if (item.giftDirection === 'in' || item.splitType === 'they') {
        total -= price;
      }
    });
    if (total > 0) return { val: total, label: "我付出更多", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" };
    else if (total < 0) return { val: Math.abs(total), label: "Ta付出更多", color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" };
    else return { val: 0, label: "扯平", color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-100 dark:bg-white/5" };
  }, [interactions]);

  if (!friend) return null;

  const theme = THEME_COLORS[friend.color] || THEME_COLORS.default;

  const getLastSeenText = () => {
    if (!interactions || interactions.length === 0) return "暂无记录";
    const lastMeetup = interactions.find(i => i.type === 'meetup' && i.isMeetup !== false);
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

  const handleInteractionClick = (item) => {
    setEditingInteraction(item);
    setIsRecordModalOpen(true);
  };

  const handleRecordModalClose = () => {
    setIsRecordModalOpen(false);
    setTimeout(() => setEditingInteraction(null), 300);
  };

  const handleAddMemo = async (e) => {
    e.preventDefault();
    if (!newMemo.trim()) return;
    try {
      await db.memos.add({
        friendId: Number(id),
        content: newMemo,
        createdAt: new Date()
      });
      setNewMemo("");
      setIsAddingMemo(false);
    } catch (error) {
      alert("添加失败");
    }
  };

  const handleDeleteMemo = async (memoId) => {
    if(confirm("删除这条记忆碎片？")) {
      await db.memos.delete(memoId);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#fafaf9] dark:bg-black text-gray-800 dark:text-white">
      
      <div className={cn("absolute top-0 left-0 right-0 h-[350px] rounded-b-[3rem] transition-colors duration-500 ease-in-out", theme.paper)} />
      
      <div className="relative z-50 px-6 pt-14 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="p-3 rounded-full bg-white/40 dark:bg-black/20 backdrop-blur-md hover:bg-white/60 transition-all active:scale-95">
          <ArrowLeft size={22} className={theme.text} />
        </button>

        <div className="flex gap-3">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className={cn("px-4 py-2 rounded-full bg-white/40 dark:bg-black/20 backdrop-blur-md hover:bg-white/60 transition-all active:scale-95 flex items-center gap-2 text-sm font-bold", theme.text)}
          >
            <Pencil size={16} />
            编辑
          </button>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center mt-6 px-6 pb-32">
        
        {/* 头像 */}
        <div className="relative">
           <div className={cn("absolute inset-0 rounded-full blur-xl opacity-50 scale-110", theme.photo)} />
           <div className={cn("relative w-32 h-32 flex items-center justify-center rounded-full shadow-lg border-4 border-white/50 overflow-hidden", theme.photo)}>
             {friend.photo ? (
               <img src={friend.photo} alt={friend.name} className="w-full h-full object-cover" />
             ) : (
               <div className="text-7xl font-bold opacity-60 select-none">
                 {friend.name ? friend.name.charAt(0).toUpperCase() : "?"}
               </div>
             )}
          </div>
          {friend.tag && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-[10px] font-bold tracking-wide uppercase text-gray-500 whitespace-nowrap z-20">
              {friend.tag}
            </div>
          )}
        </div>

        {/* 名字 & 昵称 */}
        <div className="mt-6 text-center">
          <h1 className={cn("text-4xl font-bold tracking-tight text-center font-hand", theme.text)}>
            {friend.name}
          </h1>
          {friend.nickname && (
            <p className={cn("text-lg font-hand opacity-70 mt-1", theme.text)}>
              "{friend.nickname}"
            </p>
          )}
        </div>
        
        <div className="mt-2 flex flex-col items-center gap-1">
          {friend.metAt && (
            <p className={cn("text-sm font-medium opacity-60 font-hand", theme.text)}>
              相识于 {new Date(friend.metAt).toLocaleDateString()}
            </p>
          )}
          {friend.isMaintenanceOn && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 mt-1">
              <Bell size={10} className="text-gray-500 dark:text-gray-400" />
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                每 {friend.maintenanceInterval} 天联系
              </span>
            </div>
          )}
        </div>

        {/* 统计卡片 (Birthday / Last Seen / Balance) */}
        <div className="w-full max-w-sm mt-8 space-y-3">
          
          {/* Birthday */}
          <div className="group flex items-center p-4 bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-3xl border border-white/40 dark:border-white/5 shadow-sm">
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-sm">
              <Calendar size={20} className={theme.text} />
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Birthday</p>
              <p className="text-base font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{getBirthdayText()}</p>
            </div>
          </div>

          {/* Last Seen */}
          <div className="flex items-center p-4 bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-3xl border border-white/40 dark:border-white/5 shadow-sm">
             <div className="p-3 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-sm">
              <Clock size={20} className={theme.text} />
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Last Seen</p>
              <p className="text-base font-semibold text-gray-800 dark:text-gray-100 mt-0.5">
                {getLastSeenText()}
              </p>
            </div>
          </div>

          {/* Balance */}
          <div className="flex items-center p-4 bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-3xl border border-white/40 dark:border-white/5 shadow-sm">
             <div className="p-3 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-sm">
              <Scale size={20} className={theme.text} />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Balance</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
                  {balanceData.label}
                </p>
                {balanceData.val > 0 && (
                  <span className={cn("text-xs font-bold px-2 py-1 rounded-lg", balanceData.color, balanceData.bg)}>
                    ¥{balanceData.val}
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* 喜好与雷点 */}
        {(friend.likes || friend.dislikes) && (
          <div className="w-full max-w-sm mt-4 grid grid-cols-2 gap-4">
            {friend.likes && (
              <div className="bg-rose-50/80 dark:bg-rose-900/10 p-4 rounded-3xl border border-rose-100 dark:border-rose-900/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={16} className="text-rose-400" fill="currentColor" />
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Likes</span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-rose-100 leading-snug">{friend.likes}</p>
              </div>
            )}
            {friend.dislikes && (
              <div className={cn("bg-amber-50/80 dark:bg-amber-900/10 p-4 rounded-3xl border border-amber-100 dark:border-amber-900/20 backdrop-blur-sm", !friend.likes && "col-span-2")}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} className="text-amber-400" fill="currentColor" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Dislikes</span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-amber-100 leading-snug">{friend.dislikes}</p>
              </div>
            )}
          </div>
        )}

        {/* Memos */}
        <div className="w-full max-w-sm mt-8">
          <div className="flex justify-between items-end mb-4 px-2">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Memos
            </h3>
            <button onClick={() => setIsAddingMemo(!isAddingMemo)} className="text-xs text-blue-500 font-bold hover:underline">
              {isAddingMemo ? "取消" : "+ 新增"}
            </button>
          </div>

          {isAddingMemo && (
            <form onSubmit={handleAddMemo} className="mb-4 flex gap-2">
              <input 
                type="text" 
                value={newMemo} 
                onChange={e => setNewMemo(e.target.value)} 
                placeholder="记点什么..." 
                className="flex-1 h-10 px-4 rounded-xl border-none outline-none bg-white dark:bg-white/10 text-sm shadow-sm"
                autoFocus
              />
              <button type="submit" className="h-10 px-4 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold shadow-sm">
                保存
              </button>
            </form>
          )}

          <div className="space-y-2">
            {memos?.map(memo => (
              <div key={memo.id} className="group flex items-start gap-3 p-3 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100/50 dark:border-yellow-500/10 hover:border-yellow-200 transition-colors">
                <StickyNote size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-200 flex-1 leading-snug font-hand">{memo.content}</p>
                <button onClick={() => handleDeleteMemo(memo.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {(!memos || memos.length === 0) && !isAddingMemo && (
              <div className="text-center py-4 opacity-30 text-xs">暂无记忆碎片</div>
            )}
          </div>
        </div>

        <button onClick={() => setIsRecordModalOpen(true)} className="mt-8 w-full max-w-sm py-4 rounded-3xl bg-black dark:bg-white text-white dark:text-black font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2">
            <span>+ 记一笔</span>
        </button>

        <div className="w-full max-w-sm mt-8 pb-10">
           <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 mb-4 px-2 uppercase tracking-wider">
             History
           </h3>
           {!interactions || interactions.length === 0 ? (
             <div className="text-center py-10 opacity-30 text-sm">暂无互动记录</div>
           ) : (
             <div className="space-y-3">
               {interactions.map(item => (
                 <div key={item.id} onClick={() => handleInteractionClick(item)} className="flex items-center p-4 bg-white dark:bg-white/10 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm active:scale-98 transition-transform cursor-pointer">
                    <div className={cn("flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg", item.type === 'meetup' ? "bg-blue-50 text-blue-600" : (item.giftDirection === 'out' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"))}>
                       {item.type === 'meetup' ? <Calendar size={18}/> : <Gift size={18}/>}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                       <div className="flex justify-between items-start">
                          <p className="font-medium truncate pr-2 text-gray-900 dark:text-white">{item.title}</p>
                          {item.price && (
                             <div className="flex flex-col items-end">
                               <span className={cn("text-sm font-bold font-mono", (item.splitType === 'me' || item.giftDirection === 'out') && "text-blue-600 dark:text-blue-400", item.splitType === 'aa' && "text-orange-500 dark:text-orange-400", (item.splitType === 'they' || item.giftDirection === 'in') && "text-emerald-600 dark:text-emerald-400")}>
                                 {item.giftDirection === 'out' || item.splitType === 'me' ? '-' : ''}{item.splitType === 'aa' ? 'AA ' : ''}{item.splitType === 'they' ? '+' : ''}¥{item.price}
                               </span>
                             </div>
                          )}
                       </div>
                       <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 dark:text-gray-400">
                          <span>{item.date.toLocaleDateString()}</span>
                          {item.type === 'meetup' && item.isMeetup !== false && (<MapPin size={10} className="text-blue-400" />)}
                          {item.type === 'gift' && (<span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10">{item.giftDirection === 'out' ? '送出' : '收到'}</span>)}
                          {item.type === 'meetup' && item.splitType && (<span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10">{item.splitType === 'me' ? '我买单' : ''}{item.splitType === 'aa' ? 'AA制' : ''}{item.splitType === 'they' ? 'Ta请客' : ''}</span>)}
                       </div>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
      
      <AddInteractionModal 
        isOpen={isRecordModalOpen}
        onClose={handleRecordModalClose}
        friendId={id}
        friendName={friend.name}
        initialData={editingInteraction}
      />

      <AddFriendModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={friend} 
      />

    </div>
  );
}