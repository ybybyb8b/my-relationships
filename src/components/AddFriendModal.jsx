import { useState } from "react";
import { X, Check } from "lucide-react";
import { db } from "../db";
import { cn } from "../lib/utils";

const colors = ['blue', 'pink', 'green', 'yellow', 'purple'];
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);

export default function AddFriendModal({ isOpen, onClose }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("😊"); 
  const [tag, setTag] = useState("");
  
  // 生日
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");

  // === 新增：相识日期 ===
  const [metAt, setMetAt] = useState(""); // 格式: "2023-10-25"

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      let birthdayData = null;
      if (birthMonth && birthDay) {
        birthdayData = {
          month: parseInt(birthMonth),
          day: parseInt(birthDay),
          year: birthYear ? parseInt(birthYear) : null
        };
      }

      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      await db.friends.add({
        name,
        avatar,
        color: randomColor,
        tag: tag || null,
        birthday: birthdayData,
        metAt: metAt ? new Date(metAt) : null, // === 保存相识日期 (如果有填) ===
        createdAt: new Date(), // 这个只作为系统记录，不展示
      });
      
      // 重置
      setName("");
      setAvatar("😊");
      setTag("");
      setBirthMonth("");
      setBirthDay("");
      setBirthYear("");
      setMetAt(""); // 重置相识日期
      onClose();
    } catch (error) {
      alert("保存失败: " + error);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-ios-card/90 dark:bg-ios-card-dark/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 p-6 animate-in zoom-in-95 duration-200 h-[80vh] overflow-y-auto no-scrollbar">
        {/* 加了 h-[80vh] 和 overflow，防止小屏幕手机内容太多显示不全 */}
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-ios-text dark:text-white">新朋友</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <X size={20} className="text-ios-gray" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* 1. 头像名字 (不变) */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
               <label className="block text-xs font-medium text-ios-gray mb-1 ml-1">头像</label>
               <input type="text" value={avatar} onChange={e => setAvatar(e.target.value)} className="w-16 h-16 text-center text-3xl bg-ios-bg dark:bg-black/50 rounded-2xl border-none outline-none" maxLength={2} />
            </div>
            <div className="flex-1">
               <label className="block text-xs font-medium text-ios-gray mb-1 ml-1">名字</label>
               <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="譬如：阿强" className="w-full h-16 px-4 text-lg bg-ios-bg dark:bg-black/50 rounded-2xl border-none outline-none dark:text-white" autoFocus />
            </div>
          </div>

          {/* 2. 生日 (不变) */}
          <div>
            <label className="block text-xs font-medium text-ios-gray mb-1 ml-1">生日 (选填)</label>
            <div className="flex gap-2">
              <select value={birthMonth} onChange={e => setBirthMonth(e.target.value)} className="flex-1 p-3 bg-ios-bg dark:bg-black/50 rounded-xl border-none outline-none text-sm dark:text-white appearance-none text-center"><option value="">月</option>{months.map(m => <option key={m} value={m}>{m}月</option>)}</select>
              <select value={birthDay} onChange={e => setBirthDay(e.target.value)} className="flex-1 p-3 bg-ios-bg dark:bg-black/50 rounded-xl border-none outline-none text-sm dark:text-white appearance-none text-center"><option value="">日</option>{days.map(d => <option key={d} value={d}>{d}日</option>)}</select>
              <input type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)} placeholder="年份" className="flex-[1.2] p-3 bg-ios-bg dark:bg-black/50 rounded-xl border-none outline-none text-sm dark:text-white text-center" min="1900" max="2025"/>
            </div>
          </div>

          {/* 3. 新增：相识日期 (可选) */}
          <div>
            <label className="block text-xs font-medium text-ios-gray mb-1 ml-1">相识日期 (若是新朋友可填)</label>
            <input 
              type="date" 
              value={metAt}
              onChange={e => setMetAt(e.target.value)}
              className="w-full p-4 bg-ios-bg dark:bg-black/50 rounded-2xl border-none outline-none text-sm dark:text-white min-h-[56px]"
            />
          </div>

          {/* 4. 标签 (不变) */}
          <div>
            <label className="block text-xs font-medium text-ios-gray mb-1 ml-1">标签 (可选)</label>
            <input type="text" value={tag} onChange={e => setTag(e.target.value)} placeholder="例如：高中同学" className="w-full p-4 bg-ios-bg dark:bg-black/50 rounded-2xl border-none outline-none text-sm dark:text-white" />
          </div>

          <button type="submit" className="w-full py-4 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2">
            <Check size={20} />
            <span>确认添加</span>
          </button>
        </form>
      </div>
    </div>
  );
}