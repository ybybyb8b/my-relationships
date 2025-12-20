import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { X, Check, Calendar, Gift, ArrowUpRight, ArrowDownLeft, MapPin, Trash2, Search, DollarSign } from "lucide-react";
import { db } from "../db";
import { cn } from "../lib/utils";

export default function AddInteractionModal({ isOpen, onClose, friendId = null, friendName = "", initialData = null }) {
  const [type, setType] = useState("meetup"); 
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [price, setPrice] = useState(""); 
  const [giftDirection, setGiftDirection] = useState("out"); 
  const [splitType, setSplitType] = useState("me"); 
  const [isMeetup, setIsMeetup] = useState(true);

  // === 多选逻辑优化 (保留你原来的逻辑) ===
  const allFriends = useLiveQuery(() => db.friends.orderBy('name').toArray());
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); 

  // 数据初始化
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // 编辑模式
        setType(initialData.type || "meetup");
        setTitle(initialData.title || "");
        if (initialData.date) {
           try { setDate(new Date(initialData.date).toISOString().split('T')[0]); } catch(e) { setDate(""); }
        }
        setPrice(initialData.price || "");
        setGiftDirection(initialData.giftDirection || "out");
        setSplitType(initialData.splitType || "me");
        setIsMeetup(initialData.isMeetup !== false); 
        setSelectedFriendIds([initialData.friendId]); 
      } else {
        // 新增模式
        setTitle("");
        setPrice("");
        setType("meetup");
        setSplitType("me"); 
        setIsMeetup(true);
        setDate(new Date().toISOString().split('T')[0]); 
        setSearchTerm(""); 
        
        if (friendId) {
          setSelectedFriendIds([Number(friendId)]);
        } else {
          setSelectedFriendIds([]); 
        }
      }
    }
  }, [isOpen, initialData, friendId]);

  if (!isOpen) return null;

  // 切换选中
  const toggleFriend = (id) => {
    if (initialData || (friendId && id === Number(friendId))) return; 

    if (selectedFriendIds.includes(id)) {
      setSelectedFriendIds(selectedFriendIds.filter(fid => fid !== id));
    } else {
      setSelectedFriendIds([...selectedFriendIds, id]);
      setSearchTerm(""); 
    }
  };

  const filteredFriends = allFriends?.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (f.nickname && f.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 允许标题为空，如果为空自动填充默认值
    const finalTitle = title.trim() || (type === 'meetup' ? '碰个面' : '礼物');

    if (selectedFriendIds.length === 0) {
      alert("请至少选择一位朋友");
      return;
    }

    try {
      const baseData = {
        type, 
        title: finalTitle,
        date: new Date(date),
        price: price ? Number(price) : 0, // 确保是数字
        giftDirection: type === 'gift' ? giftDirection : null, 
        splitType: type === 'meetup' ? splitType : null,
        isMeetup: type === 'meetup' ? isMeetup : false,
        createdAt: new Date(),
      };

      if (initialData) {
        await db.interactions.update(initialData.id, baseData);
      } else {
        const records = selectedFriendIds.map(fid => ({
          ...baseData,
          friendId: fid
        }));
        await db.interactions.bulkAdd(records);
      }
      
      onClose();
    } catch (error) {
      alert("保存失败: " + error);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    if (confirm("确定要删除这条记录吗？")) {
      try {
        await db.interactions.delete(initialData.id);
        onClose();
      } catch (error) {
        alert("删除失败: " + error);
      }
    }
  };

  const inputClass = "w-full appearance-none block bg-gray-50 dark:bg-white/5 border border-transparent focus:border-blue-500/30 focus:bg-white dark:focus:bg-black/50 rounded-xl px-4 h-12 transition-all outline-none text-base text-ios-text dark:text-white placeholder:text-gray-400";

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:px-4">
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" onClick={onClose} />
      
      {/* 修改点 1: max-w-sm -> max-w-md 
        让弹窗宽一点，给并排的输入框更多空间 
      */}
      <div className="relative w-full max-w-md bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-white/20 dark:border-white/10 p-6 animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* 顶部把手 (移动端视觉优化) */}
        <div className="w-10 h-1 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mb-6 sm:hidden" />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {initialData ? "编辑记录" : "记一笔"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 transition-colors">
            <X size={20} className="text-gray-500 dark:text-white/70" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* === 多选器 (Search & Tags) === */}
          {!initialData && (
            <div className="space-y-3">
              {selectedFriendIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedFriendIds.map(id => {
                    const f = allFriends?.find(item => item.id === id);
                    if (!f) return null;
                    return (
                      <div key={id} className="flex items-center gap-1 pl-2 pr-1 py-1 bg-black text-white dark:bg-white dark:text-black rounded-full text-xs font-bold animate-in zoom-in-50 duration-200">
                        <span>{f.name}</span>
                        {!(friendId && Number(friendId) === id) && (
                          <button type="button" onClick={() => toggleFriend(id)} className="p-0.5 hover:bg-white/20 rounded-full">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={selectedFriendIds.length === 0 ? "搜索并添加参与人..." : "继续添加..."}
                  className="w-full h-10 bg-gray-50 dark:bg-white/5 rounded-xl pl-9 pr-4 text-sm outline-none border border-transparent focus:border-blue-500/30 transition-all placeholder:text-gray-400 dark:text-white"
                />
              </div>

              {searchTerm && (
                <div className="max-h-32 overflow-y-auto border border-gray-100 dark:border-white/5 rounded-xl divide-y divide-gray-50 dark:divide-white/5 bg-white dark:bg-[#2C2C2E]">
                  {filteredFriends?.map(f => {
                    if (selectedFriendIds.includes(f.id)) return null;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => toggleFriend(f.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/10 text-left transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-xs overflow-hidden text-gray-500 dark:text-white">
                          {f.photo ? <img src={f.photo} className="w-full h-full object-cover"/> : f.name[0]}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-200">{f.name}</span>
                      </button>
                    );
                  })}
                  {filteredFriends?.length === 0 && (
                    <div className="p-3 text-center text-xs text-gray-400">没有找到这位朋友</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 类型切换 */}
          <div className="flex p-1 bg-gray-100 dark:bg-black/40 rounded-xl">
            <button type="button" onClick={() => setType("meetup")} className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all", type === "meetup" ? "bg-white dark:bg-[#2C2C2E] shadow-sm text-blue-600 dark:text-sky-400" : "text-gray-400 hover:text-gray-500 dark:text-white/30")}><Calendar size={16} /> 见面/活动</button>
            <button type="button" onClick={() => setType("gift")} className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all", type === "gift" ? "bg-white dark:bg-[#2C2C2E] shadow-sm text-rose-500 dark:text-rose-400" : "text-gray-400 hover:text-gray-500 dark:text-white/30")}><Gift size={16} /> 礼物往来</button>
          </div>

          {type === 'gift' && (
            <div className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
               <button type="button" onClick={() => setGiftDirection("out")} className={cn("flex-1 py-3 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all", giftDirection === "out" ? "border-rose-200 dark:border-rose-400/30 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-200" : "border-transparent bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/40")}><ArrowUpRight size={16} /> 我送TA</button>
              <button type="button" onClick={() => setGiftDirection("in")} className={cn("flex-1 py-3 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all", giftDirection === "in" ? "border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-200" : "border-transparent bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/40")}><ArrowDownLeft size={16} /> TA送我</button>
            </div>
          )}

          {type === 'meetup' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex gap-2">
                <button type="button" onClick={() => setSplitType("me")} className={cn("flex-1 py-3 rounded-xl border text-xs sm:text-sm font-medium transition-all", splitType === "me" ? "border-blue-200 dark:border-blue-400/30 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-200" : "border-transparent bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/40")}>我付</button>
                <button type="button" onClick={() => setSplitType("aa")} className={cn("flex-1 py-3 rounded-xl border text-xs sm:text-sm font-medium transition-all", splitType === "aa" ? "border-orange-200 dark:border-orange-400/30 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-200" : "border-transparent bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/40")}>AA制</button>
                <button type="button" onClick={() => setSplitType("they")} className={cn("flex-1 py-3 rounded-xl border text-xs sm:text-sm font-medium transition-all", splitType === "they" ? "border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-200" : "border-transparent bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/40")}>Ta请客</button>
              </div>

              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl cursor-pointer active:scale-98 transition-transform" onClick={() => setIsMeetup(!isMeetup)}>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className={isMeetup ? "text-blue-500" : "text-gray-400"} />
                  <span className="text-sm font-medium text-gray-700 dark:text-white">确实见面了</span>
                </div>
                <div className={cn("w-10 h-6 rounded-full p-1 transition-colors duration-200", isMeetup ? "bg-blue-500" : "bg-gray-300 dark:bg-white/20")}>
                  <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200", isMeetup ? "translate-x-4" : "translate-x-0")} />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-400 ml-1 mb-1.5 block uppercase tracking-wider">{type === 'gift' ? '礼物名称' : '活动名称'}</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={type === 'gift' ? "例如：乐高积木" : "例如：吃火锅"} className={inputClass} />
          </div>

          {/* 修改点 2: 布局修复 
             原来是 flex gap-4，现在改为 grid grid-cols-2 gap-4
             强制让两个输入框各占一半宽度，不再因为日期组件过宽而挤压
          */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
             <div className="min-w-0">
                <label className="text-xs font-bold text-gray-400 ml-1 mb-1.5 block uppercase tracking-wider">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={cn(inputClass, "px-2 text-center sm:text-left")} style={{ WebkitAppearance: 'none' }}/>
             </div>
             <div className="min-w-0 relative">
                <label className="text-xs font-bold text-gray-400 ml-1 mb-1.5 block uppercase tracking-wider">Price</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={price} 
                    onChange={e => setPrice(e.target.value)} 
                    placeholder="0.00" 
                    className={cn(inputClass, "pl-8 appearance-none")}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none">¥</span>
                </div>
             </div>
          </div>

          <button type="submit" className="w-full py-4 mt-4 bg-black dark:bg-white hover:opacity-90 active:scale-95 text-white dark:text-black font-bold rounded-2xl shadow-xl transition-all duration-200 flex items-center justify-center gap-2">
            <Check size={20} strokeWidth={3} />
            <span>{initialData ? "保存修改" : "保存记录"}</span>
          </button>

          {initialData && (
            <div className="pt-4 border-t border-gray-100 dark:border-white/10 text-center">
              <button type="button" onClick={handleDelete} className="text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 mx-auto">
                <Trash2 size={16} />
                删除这条记录
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}