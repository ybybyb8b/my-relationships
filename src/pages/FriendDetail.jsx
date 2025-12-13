import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { 
  ArrowLeft, Calendar, Clock, Gift, Pencil, MapPin, Heart, Zap, Bell, 
  StickyNote, Trash2, Scale, Plus, History, LayoutGrid, Check 
} from "lucide-react"; 
import { cn, getThemeStyles } from "../lib/utils"; 
import AddInteractionModal from "../components/AddInteractionModal";
import AddFriendModal from "../components/AddFriendModal";

export default function FriendDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // === 状态管理 ===
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const [newMemo, setNewMemo] = useState("");
  const [isAddingMemo, setIsAddingMemo] = useState(false);

  // === 数据查询 ===
  const friend = useLiveQuery(() => db.friends.get(Number(id)), [id]);
  const interactions = useLiveQuery(
    () => db.interactions.where('friendId').equals(Number(id)).reverse().sortBy('date'),
    [id]
  );
  const memos = useLiveQuery(
    () => db.memos.where('friendId').equals(Number(id)).reverse().sortBy('createdAt'),
    [id]
  );

  const styles = getThemeStyles(friend?.color || 'default');

  // === 核心数据计算 ===
  const balanceData = useMemo(() => {
    if (!interactions) return { val: 0, text: "..." };
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
    total = Number(total.toFixed(2));
    
    // === 用户自定义莫兰迪配色 ===
    const morandiGreen = "text-[#248067] dark:text-[#96c24e]"; 
    const morandiOrange = "text-[#cf4813] dark:text-[#e3b4b8]";
    const morandiGray = "text-[#8E8E93] dark:text-[#98989D]";

    if (total > 0) return { val: total, label: "我付出", color: morandiGreen };
    else if (total < 0) return { val: Math.abs(total), label: "Ta付出", color: morandiOrange };
    else return { val: 0, label: "扯平", color: morandiGray };
  }, [interactions]);

  // === 辅助文本函数 ===
  const getLastSeenText = () => {
    if (!interactions || interactions.length === 0) return "无记录";
    const lastMeetup = interactions.find(i => i.type === 'meetup' && i.isMeetup !== false);
    if (!lastMeetup) return "未见过";
    const diff = new Date().getTime() - lastMeetup.date.getTime();
    const days = Math.floor(diff / (1000 * 3600 * 24));
    if (days === 0) return "今天";
    if (days < 0) return "计划中"; 
    if (days < 30) return `${days}天前`;
    return diff > 365 * 24 * 3600 * 1000 ? "很久前" : `${Math.floor(days / 30)}个月前`;
  };

  const getBirthdayText = () => {
    if (!friend.birthday) return "未填";
    const { month, day } = friend.birthday;
    return `${month}月${day}日`;
  };
  
  // === 事件处理 ===
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
      await db.memos.add({ friendId: Number(id), content: newMemo, createdAt: new Date() });
      setNewMemo("");
      setIsAddingMemo(false);
    } catch (error) { alert("添加失败"); }
  };
  const handleDeleteMemo = async (memoId) => {
    if(confirm("删除这条记忆碎片？")) { await db.memos.delete(memoId); }
  };

  if (!friend) return null;

  return (
    <div className="relative min-h-screen w-full bg-[#FAFAF9] dark:bg-black text-gray-800 dark:text-white pb-32 overflow-hidden transition-colors duration-500">
      
      {/* 1. 全局噪点纹理 */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.15] dark:opacity-[0.08] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* 2. 背景氛围光晕 */}
      <div 
        className={cn(
          "fixed top-[-10%] left-[-10%] w-[120%] h-[50vh] rounded-full blur-[120px] pointer-events-none z-0 transition-opacity duration-500",
          styles.paperClass, 
          "opacity-30 dark:opacity-10" 
        )}
        style={styles.paperStyle} 
      />
      {!styles.paperClass && !styles.paperStyle?.backgroundColor && (
        <div className="fixed top-[-10%] left-[-10%] w-[120%] h-[50vh] rounded-full blur-[120px] bg-gray-200 dark:bg-gray-800 opacity-30 dark:opacity-10 pointer-events-none z-0" />
      )}

      {/* 顶部导航 */}
      <div className="relative z-50 px-6 pt-14 pb-4 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="p-3 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-md shadow-sm border border-white/20 hover:scale-105 transition-all active:scale-95 text-gray-700 dark:text-white">
          <ArrowLeft size={20} />
        </button>
        <button 
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-md shadow-sm border border-white/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-white"
        >
            <Pencil size={14} />
            <span>编辑</span>
        </button>
      </div>

      <div className="relative z-10 px-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* === 人物名片 (Header Card) === */}
        <div 
          className={cn(
            "w-full max-w-sm rounded-[2rem] shadow-xl overflow-hidden relative p-6 text-center transition-all duration-500",
            "dark:brightness-[0.85] dark:border dark:border-white/5",
            styles.paperClass 
          )}
          style={styles.paperStyle}
        >
           <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>

           <div className="relative mx-auto w-28 h-28 mb-4 group">
             <div className={cn("w-full h-full rounded-full border-[5px] border-white/40 shadow-inner overflow-hidden flex items-center justify-center bg-black/5 transition-transform duration-500 group-hover:scale-105", styles.photoClass)} style={styles.photoStyle}>
                {friend.photo ? (
                  <img src={friend.photo} alt={friend.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold opacity-40">{friend.name?.[0]}</span>
                )}
             </div>
             {friend.tag && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-white/50 text-[10px] font-bold tracking-wide uppercase text-gray-600 whitespace-nowrap z-10">
                  {friend.tag}
                </div>
             )}
           </div>

           <h1 className={cn("text-3xl font-bold font-hand tracking-wide mb-1", styles.textClass)} style={styles.textStyle}>
             {friend.name}
           </h1>
           {friend.nickname && (
             <p className={cn("text-sm font-medium opacity-60 font-hand mb-4", styles.textClass)} style={styles.textStyle}>
               "{friend.nickname}"
             </p>
           )}

           <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/30 backdrop-blur-md border border-white/20 shadow-sm">
              {friend.isMaintenanceOn ? (
                <>
                  <Bell size={12} className={cn(styles.textClass, "opacity-70")} style={styles.textStyle} />
                  <span className={cn("text-xs font-bold opacity-80", styles.textClass)} style={styles.textStyle}>
                    每 {friend.maintenanceInterval} 天联系
                  </span>
                </>
              ) : (
                <span className={cn("text-xs font-bold opacity-60", styles.textClass)} style={styles.textStyle}>
                  随缘联系
                </span>
              )}
           </div>
        </div>

        {/* === 核心数据 (Stats Tiles) - 回归白色背景 + 阴影 === */}
        <div className="w-full max-w-sm grid grid-cols-3 gap-3 mt-6">
           
           {/* Birthday: text-[#c5708b] dark:text-[#e3b4b8] */}
           {/* 背景改为 bg-white (浅色) 并加上 shadow-md 增加立体感 */}
           <div className="bg-white dark:bg-white/5 backdrop-blur-md p-4 rounded-2xl shadow-md border border-gray-50 dark:border-white/5 flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-[1.02]">
             <Calendar size={18} className="text-[#c5708b] dark:text-[#e3b4b8]" />
             <span className="text-[10px] font-bold text-[#A0A09E] dark:text-gray-500 uppercase tracking-widest">Birthday</span>
             <span className="text-sm font-bold text-gray-700 dark:text-[#EAEAEA]">{getBirthdayText()}</span>
           </div>

           {/* Last Seen: text-[#8fb2c9] dark:text-[#baccd9] */}
           <div className="bg-white dark:bg-white/5 backdrop-blur-md p-4 rounded-2xl shadow-md border border-gray-50 dark:border-white/5 flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-[1.02]">
             <Clock size={18} className="text-[#8fb2c9] dark:text-[#baccd9]" />
             <span className="text-[10px] font-bold text-[#A0A09E] dark:text-gray-500 uppercase tracking-widest">Last Seen</span>
             <span className="text-sm font-bold text-gray-700 dark:text-[#EAEAEA]">{getLastSeenText()}</span>
           </div>

           {/* Balance */}
           <div className="bg-white dark:bg-white/5 backdrop-blur-md p-4 rounded-2xl shadow-md border border-gray-50 dark:border-white/5 flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-[1.02]">
             <Scale size={18} className={balanceData.color} />
             <span className="text-[10px] font-bold text-[#A0A09E] dark:text-gray-500 uppercase tracking-widest">Balance</span>
             <span className={cn("text-sm font-bold truncate max-w-full px-1", balanceData.color)}>
               {balanceData.val > 0 ? `¥${balanceData.val}` : balanceData.label}
             </span>
           </div>
        </div>

        {/* === Tabs === */}
        <div className="w-full max-w-sm mt-8 mb-6 sticky top-[80px] z-30">
          {/* 背景色调亮：bg-white/50 或 bg-gray-100 */}
          <div className="p-1 bg-gray-100/80 dark:bg-white/5 backdrop-blur-xl rounded-xl flex relative shadow-inner">
            <button 
              onClick={() => setActiveTab('timeline')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 z-10",
                activeTab === 'timeline' 
                  ? "bg-white dark:bg-[#2C2C2E] text-[#4A4A48] dark:text-[#EAEAEA] shadow-sm scale-[0.98]" 
                  : "text-[#999995] hover:text-[#666664] dark:text-gray-500 dark:hover:text-gray-300"
              )}
            >
              <History size={16} />
              时光轴
            </button>
            <button 
              onClick={() => setActiveTab('memos')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 z-10",
                activeTab === 'memos' 
                  ? "bg-white dark:bg-[#2C2C2E] text-[#4A4A48] dark:text-[#EAEAEA] shadow-sm scale-[0.98]" 
                  : "text-[#999995] hover:text-[#666664] dark:text-gray-500 dark:hover:text-gray-300"
              )}
            >
              <LayoutGrid size={16} />
              印象墙
            </button>
          </div>
        </div>

        {/* === 内容区域 === */}
        <div className="w-full max-w-sm min-h-[300px]">
          
          {/* A. 时光轴视图 - 恢复正常对齐，保持智能隐藏 */}
          {activeTab === 'timeline' && (
            <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
               {!interactions || interactions.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-16 opacity-40">
                   <div className="w-16 h-16 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center mb-4">
                     <History size={32} />
                   </div>
                   <p className="text-sm font-bold">还没有互动记录</p>
                   <p className="text-xs mt-1">点右下角记一笔吧</p>
                 </div>
               ) : (
                 // 恢复 pl-4 和线的对齐，避免拥挤
                 <div className="relative pl-4 space-y-4 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gray-100 dark:before:bg-white/10">
                   {interactions.map(item => {
                     const showMeetup = item.type === 'meetup' && item.isMeetup !== false;
                     const showGift = item.type === 'gift';
                     const showPrice = !!item.price;
                     const hasTags = showMeetup || showGift || showPrice;

                     return (
                       // 恢复 pl-8 缩进，对齐更好看
                       <div key={item.id} onClick={() => handleInteractionClick(item)} className="relative pl-8 group cursor-pointer">
                          <div className={cn(
                            "absolute left-3 top-3.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#121212] shadow-sm z-10 box-content transition-transform group-hover:scale-125",
                            item.type === 'meetup' ? "bg-[#8fb2c9]" : (item.giftDirection === 'out' ? "bg-[#c5708b]" : "bg-[#248067]")
                          )} />
                          
                          <div className={cn(
                            "bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 active:scale-[0.98] transition-all hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-md",
                            "p-3.5" // 稍微增加一点内边距，不那么局促
                          )}>
                             <div className="flex justify-between items-start">
                               <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm">{item.title}</h4>
                               <span className="text-[10px] font-medium text-gray-400 font-mono tracking-tight pt-0.5">
                                 {item.date.toLocaleDateString()}
                               </span>
                             </div>
                             
                             {hasTags && (
                               <div className="flex items-center gap-2 mt-2">
                                  {showMeetup && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 text-[10px] font-bold">
                                      <MapPin size={10} /> 见面
                                    </span>
                                  )}
                                  
                                  {showGift && (
                                    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold", item.giftDirection === 'out' ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300")}>
                                      <Gift size={10} /> {item.giftDirection === 'out' ? "送出" : "收到"}
                                    </span>
                                  )}

                                  {showPrice && (
                                    <span className={cn("ml-auto font-mono text-xs font-bold", 
                                      (item.splitType === 'me' || item.giftDirection === 'out') ? "text-[#248067] dark:text-[#96c24e]" : "",
                                      item.splitType === 'aa' ? "text-orange-500 dark:text-orange-400" : "",
                                      (item.splitType === 'they' || item.giftDirection === 'in') ? "text-[#cf4813] dark:text-[#e3b4b8]" : ""
                                    )}>
                                      {item.giftDirection === 'out' || item.splitType === 'me' ? '-' : ''}
                                      {item.giftDirection === 'in' || item.splitType === 'they' ? '+' : ''}
                                      {item.splitType === 'aa' ? 'AA ' : ''}
                                      ¥{item.price}
                                    </span>
                                  )}
                               </div>
                             )}
                          </div>
                       </div>
                     );
                   })}
                 </div>
               )}
            </div>
          )}

          {/* B. 印象墙视图 */}
          {activeTab === 'memos' && (
            <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 space-y-6">
              
              {(friend.likes || friend.dislikes) && (
                <div className="grid grid-cols-2 gap-3">
                  {friend.likes && (
                    <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                      <div className="flex items-center gap-1.5 mb-2 text-[#d276a3] dark:text-[#e3b4b8]">
                        <Heart size={14} fill="currentColor"/>
                        <span className="text-xs font-bold uppercase tracking-wide">Likes</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-[#EAEAEA] font-hand leading-relaxed">{friend.likes}</p>
                    </div>
                  )}
                  {friend.dislikes && (
                    <div className={cn("bg-white dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm", !friend.likes && "col-span-2")}>
                       <div className="flex items-center gap-1.5 mb-2 text-[#4e7ca1] dark:text-[#8fb2c9]">
                        <Zap size={14} fill="currentColor"/>
                        <span className="text-xs font-bold uppercase tracking-wide">Dislikes</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-[#EAEAEA] font-hand leading-relaxed">{friend.dislikes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Memos 输入 */}
              {isAddingMemo ? (
                <form onSubmit={handleAddMemo} className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                  <input 
                    type="text" 
                    value={newMemo} 
                    onChange={e => setNewMemo(e.target.value)} 
                    placeholder="记下这一刻的想法..." 
                    className="flex-1 h-12 px-4 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white dark:bg-white/10 dark:border-white/10 dark:text-white text-sm shadow-sm transition-all"
                    autoFocus
                  />
                  <button type="submit" className="h-12 w-12 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                    <Check size={20} />
                  </button>
                  <button type="button" onClick={() => setIsAddingMemo(false)} className="h-12 w-12 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white rounded-xl flex items-center justify-center active:scale-90 transition-transform">
                    <History size={20} className="rotate-45" /> 
                  </button>
                </form>
              ) : (
                <button 
                  onClick={() => setIsAddingMemo(true)} 
                  className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl text-gray-400 dark:text-gray-500 text-sm font-bold hover:border-blue-300 hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> 添加记忆碎片
                </button>
              )}

              <div className="columns-2 gap-3 space-y-3 pb-8">
                {memos?.map((memo, idx) => (
                  <div 
                    key={memo.id} 
                    className={cn(
                      "break-inside-avoid p-4 rounded-xl shadow-sm relative group transition-transform hover:scale-[1.02]",
                      idx % 3 === 0 ? "bg-[#fff8dc] dark:bg-[#423C2C] text-yellow-900 dark:text-yellow-100" : 
                      idx % 3 === 1 ? "bg-[#f0f4ff] dark:bg-[#2C3342] text-blue-900 dark:text-blue-100" : "bg-[#fff0f5] dark:bg-[#422C33] text-pink-900 dark:text-pink-100"
                    )}
                  >
                    <p className="text-sm font-hand leading-relaxed">{memo.content}</p>
                    <div className="mt-2 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-mono">{memo.createdAt.toLocaleDateString()}</span>
                      <button onClick={() => handleDeleteMemo(memo.id)} className="text-red-500 dark:text-red-400 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      <button 
        onClick={() => setIsRecordModalOpen(true)}
        className="fixed bottom-8 right-6 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-2xl shadow-blue-900/20 dark:shadow-none flex items-center justify-center z-[60] hover:scale-110 active:scale-90 transition-all duration-300"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

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