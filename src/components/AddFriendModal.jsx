// src/components/AddFriendModal.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
// 引入 Palette 图标
import { X, User, Calendar, Tag, Sparkles, ChevronDown, Trash2, Camera, Bell, Check, Heart, Zap, Smile, Palette } from "lucide-react"; 
import { db } from "../db";
import { cn, processImage, THEME_COLORS } from "../lib/utils"; // 引入 THEME_COLORS 以获取预设列表

// 获取预设颜色的 key 数组
const PRESET_COLORS = Object.keys(THEME_COLORS).filter(k => k !== 'default');

const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);

export default function AddFriendModal({ isOpen, onClose, initialData = null }) {
  const navigate = useNavigate();
  // ... (其他状态保持不变)
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [tag, setTag] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [metAt, setMetAt] = useState(""); 
  const [photo, setPhoto] = useState(null); 
  const [isMaintenanceOn, setIsMaintenanceOn] = useState(false); 
  const [maintenanceInterval, setMaintenanceInterval] = useState(30); 
  const [likes, setLikes] = useState("");
  const [dislikes, setDislikes] = useState("");

  // === 新增：颜色状态 ===
  const [selectedColor, setSelectedColor] = useState('blue'); // 存储最终颜色值（可能是 'blue' 或 '#ffaabb'）
  const [showColorPicker, setShowColorPicker] = useState(false); // 控制是否显示自定义取色器

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // ... (其他回填逻辑保持不变)
        setName(initialData.name || "");
        setNickname(initialData.nickname || "");
        setPhoto(initialData.photo || null);
        setTag(initialData.tag || "");
        
        const b = initialData.birthday || {}; 
        setBirthMonth(b.month || "");
        setBirthDay(b.day || "");
        setBirthYear(b.year || "");

        if (initialData.metAt) {
           // ... (日期处理保持不变)
           try {
            const dateObj = initialData.metAt instanceof Date ? initialData.metAt : new Date(initialData.metAt);
            if (!isNaN(dateObj.getTime())) setMetAt(dateObj.toISOString().split('T')[0]);
            else setMetAt("");
          } catch (e) { setMetAt(""); }
        } else { setMetAt(""); }

        setIsMaintenanceOn(initialData.isMaintenanceOn || false);
        setMaintenanceInterval(initialData.maintenanceInterval || 30);
        setLikes(initialData.likes || "");
        setDislikes(initialData.dislikes || "");
        
        // 回填颜色
        setSelectedColor(initialData.color || 'blue');

      } else {
        // ... (重置逻辑)
        setName("");
        setNickname("");
        setPhoto(null);
        setTag("");
        setBirthMonth("");
        setBirthDay("");
        setBirthYear("");
        setMetAt("");
        setIsMaintenanceOn(false); 
        setMaintenanceInterval(30);
        setLikes("");
        setDislikes("");
        
        // 默认随机一个预设色
        setSelectedColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    // ... (保持不变)
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedDataUrl = await processImage(file);
        setPhoto(compressedDataUrl); 
      } catch (error) {
        alert("图片处理失败，请重试");
      }
    }
  };

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

      const friendData = {
        name,
        nickname,
        photo, 
        tag: tag || null,
        birthday: birthdayData,
        metAt: metAt ? new Date(metAt) : null,
        isMaintenanceOn,
        maintenanceInterval: isMaintenanceOn ? parseInt(maintenanceInterval) : null,
        likes,
        dislikes,
        color: selectedColor, // 保存选中的颜色
      };

      if (initialData) {
        await db.friends.update(initialData.id, friendData);
      } else {
        await db.friends.add({
          ...friendData,
          createdAt: new Date(),
        });
      }
      onClose();
    } catch (error) {
      alert("保存失败: " + error);
    }
  };

  const handleDelete = async () => {
    // ... (保持不变)
    if (!initialData) return;
    if (confirm(`确定要删除好友“${initialData.name}”吗？`)) {
      try {
        await db.transaction('rw', db.friends, db.interactions, db.memos, async () => {
          await db.friends.delete(initialData.id);
          await db.interactions.where('friendId').equals(initialData.id).delete();
          await db.memos.where('friendId').equals(initialData.id).delete();
        });
        onClose();
        navigate('/', { replace: true });
      } catch (error) {
        alert("删除失败: " + error);
      }
    }
  };

  const inputClass = "w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-blue-500/30 focus:bg-white dark:focus:bg-black/50 rounded-xl px-4 h-12 transition-all outline-none text-base text-ios-text dark:text-white placeholder:text-gray-400";
  const selectClass = cn(inputClass, "appearance-none text-center relative cursor-pointer");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white/95 dark:bg-ios-card-dark/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/20 dark:border-white/10 p-6 animate-in zoom-in-95 duration-200 h-auto max-h-[85vh] overflow-y-auto no-scrollbar">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-full text-blue-600 dark:text-blue-300">
               <User size={20} strokeWidth={2.5}/>
            </span>
            <h2 className="text-xl font-bold text-ios-text dark:text-white">
              {initialData ? "编辑资料" : "新朋友"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 transition-colors">
            <X size={18} className="text-gray-500 dark:text-white/70" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="flex gap-4">
             {/* ... Photo Input (保持不变) ... */}
            <div className="flex-shrink-0 relative">
               <span className="text-xs font-bold text-gray-400 ml-1 mb-1.5 block uppercase tracking-wider">Photo</span>
               <label className="block w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-blue-400 transition-all bg-gray-50 dark:bg-white/5 relative group cursor-pointer">
                  <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                  {photo ? (
                    <img src={photo} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-300 group-hover:text-blue-400 transition-colors select-none">
                        {name ? name.charAt(0).toUpperCase() : "?"}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={24} /></div>
                  <div className="absolute -bottom-0 -right-0 w-6 h-6 bg-blue-500 text-white rounded-tl-lg flex items-center justify-center shadow-sm"><Camera size={12} strokeWidth={2.5} /></div>
               </label>
            </div>
            
            {/* 名字和昵称 */}
            <div className="flex-1 space-y-3">
               <div>
                 <label className="text-xs font-bold text-gray-400 ml-1 mb-1 block uppercase tracking-wider">Name</label>
                 <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="全名" className={cn(inputClass, "h-10 text-lg font-bold px-4")} autoFocus={!initialData} />
               </div>
               <div>
                 <label className="text-xs font-bold text-gray-400 ml-1 mb-1 flex items-center gap-1 uppercase tracking-wider">
                   <Smile size={12} /> Nickname
                 </label>
                 <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="平时叫啥" className={cn(inputClass, "h-10 text-sm")} />
               </div>
            </div>
          </div>

          {/* === 颜色选择器 === */}
          <div>
            <label className="text-xs font-bold text-gray-400 ml-1 mb-2 flex items-center gap-1 uppercase tracking-wider"><Palette size={12} /> Card Color</label>
            <div className="flex flex-wrap gap-2">
              {/* 预设颜色圆点 */}
              {PRESET_COLORS.map(c => {
                 const bgClass = THEME_COLORS[c].paper.replace('bg-', 'bg-'); // 简单提取
                 // 为了显示准确的预览色，这里我们利用 Tailwind 类名其实很难直接拿到Hex。
                 // 但我们可以直接硬编码预览颜色，或者渲染一个小 div
                 // 更简单的：直接渲染该颜色的 div
                 return (
                   <button
                     key={c}
                     type="button"
                     onClick={() => { setSelectedColor(c); setShowColorPicker(false); }}
                     className={cn(
                       "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                       THEME_COLORS[c].paper, // 使用预设背景色
                       selectedColor === c ? "border-blue-500 scale-110" : "border-transparent hover:scale-105"
                     )}
                   >
                     {selectedColor === c && <Check size={14} className="text-gray-600/50" />}
                   </button>
                 )
              })}
              
              {/* 自定义颜色按钮 */}
              <div className="relative">
                <button
                   type="button"
                   onClick={() => setShowColorPicker(!showColorPicker)}
                   className={cn(
                     "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center bg-white dark:bg-white/10",
                     !PRESET_COLORS.includes(selectedColor) ? "border-blue-500 scale-110" : "border-gray-200 dark:border-white/20 hover:scale-105"
                   )}
                   // 如果选中了非预设色，显示那个颜色作为背景
                   style={!PRESET_COLORS.includes(selectedColor) ? { backgroundColor: selectedColor } : {}}
                >
                  {!PRESET_COLORS.includes(selectedColor) ? <Check size={14} className="mix-blend-difference text-white" /> : <Sparkles size={14} className="text-gray-400"/>}
                </button>
                
                {/* 弹出的原生取色器 (定位在按钮旁) */}
                {showColorPicker && (
                  <div className="absolute top-10 left-0 z-50 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 animate-in fade-in zoom-in-95">
                    <input 
                      type="color" 
                      value={PRESET_COLORS.includes(selectedColor) ? "#ffffff" : selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-10 h-10 cursor-pointer rounded overflow-hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ... Birthday (保持不变) ... */}
          <div>
            <label className="text-xs font-bold text-gray-400 ml-1 mb-1.5 flex items-center gap-1 uppercase tracking-wider"><Calendar size={12} /> Birthday <span className="text-[10px] font-normal opacity-50 lowercase">(Optional)</span></label>
            <div className="flex gap-3">
              <div className="relative flex-1"><select value={birthMonth} onChange={e => setBirthMonth(e.target.value)} className={selectClass}><option value="">月</option>{months.map(m => <option key={m} value={m}>{m}月</option>)}</select><ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} /></div>
              <div className="relative flex-1"><select value={birthDay} onChange={e => setBirthDay(e.target.value)} className={selectClass}><option value="">日</option>{days.map(d => <option key={d} value={d}>{d}日</option>)}</select><ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} /></div>
              <div className="flex-[1.2]"><input type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)} placeholder="年份" className={cn(inputClass, "text-center")} min="1900" max="2025"/></div>
            </div>
          </div>

          {/* ... Likes/Dislikes (保持不变) ... */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-rose-400 ml-1 mb-1.5 flex items-center gap-1 uppercase tracking-wider"><Heart size={12} fill="currentColor" /> Likes</label>
              <input type="text" value={likes} onChange={e => setLikes(e.target.value)} placeholder="咖啡、火锅..." className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 ml-1 mb-1.5 flex items-center gap-1 uppercase tracking-wider"><Zap size={12} fill="currentColor" className="text-yellow-500" /> Dislikes</label>
              <input type="text" value={dislikes} onChange={e => setDislikes(e.target.value)} placeholder="香菜、海鲜..." className={inputClass} />
            </div>
          </div>

          {/* ... Met Date (保持不变) ... */}
          <div>
            <label className="text-xs font-bold text-gray-400 ml-1 mb-1.5 flex items-center gap-1 uppercase tracking-wider"><Sparkles size={12} /> Met Date <span className="text-[10px] font-normal opacity-50 lowercase">(Optional)</span></label>
            <div className="relative"><input type="date" value={metAt} onChange={e => setMetAt(e.target.value)} className={cn(inputClass, "w-full appearance-none")} /></div>
          </div>

          {/* ... Maintenance (保持不变) ... */}
          <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300">
                <Bell size={16} className={isMaintenanceOn ? "text-green-500" : "text-gray-400"} />
                维系提醒
              </label>
              <button type="button" onClick={() => setIsMaintenanceOn(!isMaintenanceOn)} className={cn("w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out relative", isMaintenanceOn ? "bg-green-500" : "bg-gray-300 dark:bg-white/20")}>
                <div className={cn("w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out", isMaintenanceOn ? "translate-x-5" : "translate-x-0")} />
              </button>
            </div>
            {isMaintenanceOn && (
              <div className="mt-4 flex items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
                <span className="text-xs text-gray-400">提醒周期:</span>
                <div className="flex-1 flex items-center gap-2">
                  <input type="number" value={maintenanceInterval} onChange={e => setMaintenanceInterval(e.target.value)} className={cn(inputClass, "h-10 text-center")} min="1" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">天</span>
                </div>
              </div>
            )}
          </div>

          {/* ... Tag (保持不变) ... */}
          <div>
            <label className="text-xs font-bold text-gray-400 ml-1 mb-1.5 flex items-center gap-1 uppercase tracking-wider"><Tag size={12} /> Tag</label>
            <input type="text" value={tag} onChange={e => setTag(e.target.value)} placeholder="例如：高中同学" className={inputClass} />
          </div>

          {/* ... Buttons (保持不变) ... */}
          <button type="submit" className="w-full py-4 mt-4 bg-black dark:bg-white hover:scale-[1.02] active:scale-95 text-white dark:text-black font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2">
            <Check size={20} strokeWidth={3} />
            <span>{initialData ? "保存修改" : "确认添加"}</span>
          </button>

          {initialData && (
            <div className="pt-4 border-t border-gray-100 dark:border-white/10 text-center">
              <button type="button" onClick={handleDelete} className="text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 mx-auto">
                <Trash2 size={16} />
                删除这位好友
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}