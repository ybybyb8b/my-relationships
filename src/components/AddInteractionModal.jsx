import { useState } from "react";
import { X, Check, Calendar, Gift, ArrowUpRight, ArrowDownLeft, User, Users } from "lucide-react";
import { db } from "../db";
import { cn } from "../lib/utils";

export default function AddInteractionModal({ isOpen, onClose, friendId, friendName }) {
  const [type, setType] = useState("meetup"); 
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [price, setPrice] = useState(""); 
  
  // 礼物方向: 'out'(我送) / 'in'(收礼)
  const [giftDirection, setGiftDirection] = useState("out"); 
  
  // === 新增：买单情况 ===
  // 'me'(我付) / 'aa'(AA制) / 'they'(Ta付)
  const [splitType, setSplitType] = useState("me"); 

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await db.interactions.add({
        friendId: Number(friendId),
        type, 
        title,
        date: new Date(date),
        price: price ? Number(price) : null,
        
        // 根据类型保存不同的额外字段
        giftDirection: type === 'gift' ? giftDirection : null, 
        splitType: type === 'meetup' ? splitType : null, // 保存买单情况
        
        createdAt: new Date(),
      });
      
      setTitle("");
      setPrice("");
      setType("meetup");
      // 保留默认选项，方便下次录入
      setSplitType("me"); 
      onClose();
    } catch (error) {
      alert("保存失败: " + error);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-ios-card/95 dark:bg-ios-card-dark/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-white/20 dark:border-white/10 p-6 animate-in slide-in-from-bottom-full duration-300">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-ios-text dark:text-white">
            记一笔
            <span className="text-sm font-normal text-ios-gray ml-2">with {friendName}</span>
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
            <X size={20} className="text-ios-gray" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. 类型切换 */}
          <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl">
            <button
              type="button"
              onClick={() => setType("meetup")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                type === "meetup" 
                  ? "bg-white dark:bg-white/10 shadow-sm text-blue-600 dark:text-sky-300" 
                  : "text-gray-400 hover:text-gray-500 dark:text-white/30"
              )}
            >
              <Calendar size={16} />
              见面/活动
            </button>
            <button
              type="button"
              onClick={() => setType("gift")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                type === "gift" 
                  ? "bg-white dark:bg-white/10 shadow-sm text-rose-500 dark:text-rose-300" 
                  : "text-gray-400 hover:text-gray-500 dark:text-white/30"
              )}
            >
              <Gift size={16} />
              礼物往来
            </button>
          </div>

          {/* === 2. 动态选项区 === */}
          
          {/* A. 如果是【礼物】，显示方向 */}
          {type === 'gift' && (
            <div className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
               <button type="button" onClick={() => setGiftDirection("out")} className={cn("flex-1 py-3 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all", giftDirection === "out" ? "border-rose-200 dark:border-rose-400/30 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-200" : "border-transparent bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/40")}>
                <ArrowUpRight size={16} /> 我送TA
              </button>
              <button type="button" onClick={() => setGiftDirection("in")} className={cn("flex-1 py-3 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all", giftDirection === "in" ? "border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-200" : "border-transparent bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/40")}>
                <ArrowDownLeft size={16} /> TA送我
              </button>
            </div>
          )}

          {/* B. 如果是【见面】，显示买单情况 (新增部分) */}
          {type === 'meetup' && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* 我付 */}
              <button type="button" onClick={() => setSplitType("me")} className={cn("flex-1 py-3 rounded-xl border text-xs sm:text-sm font-medium transition-all", splitType === "me" ? "border-blue-200 dark:border-blue-400/30 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-200" : "border-transparent bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/40")}>
                我付
              </button>
              {/* AA */}
              <button type="button" onClick={() => setSplitType("aa")} className={cn("flex-1 py-3 rounded-xl border text-xs sm:text-sm font-medium transition-all", splitType === "aa" ? "border-orange-200 dark:border-orange-400/30 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-200" : "border-transparent bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/40")}>
                AA制
              </button>
              {/* Ta付 */}
              <button type="button" onClick={() => setSplitType("they")} className={cn("flex-1 py-3 rounded-xl border text-xs sm:text-sm font-medium transition-all", splitType === "they" ? "border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-200" : "border-transparent bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/40")}>
                Ta请客
              </button>
            </div>
          )}

          {/* 3. 内容输入 */}
          <div>
            <label className="block text-xs font-medium text-ios-gray mb-1 ml-1">
               {type === 'gift' ? '礼物名称' : '活动内容'}
            </label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={type === 'gift' ? "例如：乐高积木" : "例如：吃火锅"} className="w-full h-14 px-4 text-base bg-ios-bg dark:bg-black/50 rounded-2xl border-none outline-none dark:text-white placeholder:text-gray-400/50" autoFocus />
          </div>

          {/* 4. 日期和金额 */}
          <div className="flex gap-4">
             <div className="flex-1">
                <label className="block text-xs font-medium text-ios-gray mb-1 ml-1">日期</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full h-14 px-4 bg-ios-bg dark:bg-black/50 rounded-2xl border-none outline-none text-sm dark:text-white" />
             </div>
             <div className="flex-1">
                <label className="block text-xs font-medium text-ios-gray mb-1 ml-1">
                  {type === 'gift' ? '预估价值' : '金额'}
                </label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" className="w-full h-14 px-4 bg-ios-bg dark:bg-black/50 rounded-2xl border-none outline-none text-sm dark:text-white placeholder:text-gray-400/50" />
             </div>
          </div>

          <button type="submit" className="w-full py-4 bg-black dark:bg-white hover:opacity-90 active:scale-95 text-white dark:text-black font-bold rounded-2xl shadow-xl transition-all duration-200 flex items-center justify-center gap-2">
            <Check size={20} />
            <span>保存记录</span>
          </button>
        </form>
      </div>
    </div>
  );
}