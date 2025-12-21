import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../db";
import { 
  Download, Upload, Trash2, Database, AlertTriangle, Loader2, Type, 
  Moon, Sun, Bell, Gift, Calendar, Check, AlertCircle, ArrowLeft 
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver"; 
import { Capacitor } from "@capacitor/core"; 
import { Share } from "@capacitor/share"; 
import { Filesystem, Directory } from "@capacitor/filesystem"; 
import { requestNotificationPermission, scheduleNotifications } from "../lib/notification";

export default function Settings() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const fontInputRef = useRef(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  // === 新增状态 ===
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [reminders, setReminders] = useState(['0']); // 默认只提醒当天

  // === 初始化加载设置 ===
  useEffect(() => {
    const loadSettings = async () => {
      const saved = await db.settings.get('birthdayReminders');
      if (saved && saved.value) {
        setReminders(saved.value);
      }
    };
    loadSettings();
  }, []);

  // === 新增功能：切换主题 ===
  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  // === 新增功能：切换提醒策略 ===
  const toggleReminder = async (key) => {
    let newReminders;
    if (reminders.includes(key)) {
      if (reminders.length === 1) return; // 至少保留一个
      newReminders = reminders.filter(k => k !== key);
    } else {
      newReminders = [...reminders, key];
    }
    setReminders(newReminders);
    
    // 保存并重新调度
    await db.settings.put({ key: 'birthdayReminders', value: newReminders });
    await scheduleNotifications(); 
  };

  // === 原有功能：导出 ===
  const handleExport = async () => {
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const friends = await db.friends.toArray();
      const interactions = await db.interactions.toArray();
      const memos = await db.memos.toArray();

      const imgFolder = zip.folder("images");
      const cleanFriends = friends.map(friend => {
        const friendCopy = { ...friend };
        if (friend.photo && friend.photo.startsWith('data:image')) {
          try {
            const fileName = `friend_${friend.id}.jpg`;
            const base64Data = friend.photo.split(',')[1];
            if (base64Data) {
              imgFolder.file(fileName, base64Data, { base64: true });
              friendCopy.photo = `images/${fileName}`; 
            }
          } catch (err) { console.error(err); }
        }
        return friendCopy;
      });

      const data = {
        version: 2,
        timestamp: new Date().toISOString(),
        friends: cleanFriends,
        interactions,
        memos
      };
      zip.file("data.json", JSON.stringify(data, null, 2));
      const fileName = `DeepRelations_Backup_${new Date().toISOString().split('T')[0]}.zip`;

      if (Capacitor.isNativePlatform()) {
        const base64 = await zip.generateAsync({ type: "base64" });
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache
        });
        await Share.share({ title: '备份数据导出', url: result.uri });
      } else {
        const blob = await zip.generateAsync({ type: "blob" });
        saveAs(blob, fileName);
      }
    } catch (error) {
      alert("导出失败: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // === 原有功能：导入 ===
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!confirm("⚠️ 警告：恢复备份将【清空并覆盖】当前所有数据！\n\n确定要继续吗？")) {
      event.target.value = ""; return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const zip = await JSZip.loadAsync(e.target.result);
        const dataFile = zip.file("data.json");
        if (!dataFile) throw new Error("无效的备份文件");
        
        const dataStr = await dataFile.async("string");
        const data = JSON.parse(dataStr);

        const restoredFriends = await Promise.all(data.friends.map(async (f) => {
          const restoredFriend = { ...f, createdAt: new Date(f.createdAt), metAt: f.metAt ? new Date(f.metAt) : null };
          if (f.photo && f.photo.startsWith('images/')) {
            const imgFile = zip.file(f.photo);
            if (imgFile) {
              const base64 = await imgFile.async("base64");
              restoredFriend.photo = `data:image/jpeg;base64,${base64}`;
            } else { restoredFriend.photo = null; }
          }
          return restoredFriend;
        }));

        const restoredInteractions = data.interactions.map(i => ({ ...i, date: new Date(i.date), createdAt: new Date(i.createdAt) }));
        const restoredMemos = (data.memos || []).map(m => ({ ...m, createdAt: new Date(m.createdAt) }));

        await db.transaction('rw', db.friends, db.interactions, db.memos, async () => {
          await db.friends.clear(); await db.interactions.clear(); await db.memos.clear();
          await db.friends.bulkAdd(restoredFriends);
          await db.interactions.bulkAdd(restoredInteractions);
          await db.memos.bulkAdd(restoredMemos);
        });

        alert("成功恢复备份！");
        window.location.reload(); 
      } catch (error) { alert("导入失败：" + error.message); } 
      finally { setIsProcessing(false); event.target.value = ""; }
    };
    reader.readAsArrayBuffer(file);
  };

  // === 原有功能：清空 ===
  const handleClearAll = async () => {
    if (confirm("🧨 真的要清空所有数据吗？")) {
      await db.friends.clear(); await db.interactions.clear(); await db.memos.clear();
      window.location.reload();
    }
  };

  // === 原有功能：字体上传 ===
  const handleFontUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) {
      alert("不支持的格式"); return;
    }
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      await db.settings.put({ key: 'customFont', value: arrayBuffer, fileName: file.name });
      alert("字体上传成功，即将刷新...");
      window.location.reload(); 
    } catch (error) { alert("上传失败：" + error.message); } 
    finally { setIsProcessing(false); event.target.value = ""; }
  };

  const handleResetFont = async () => {
    if (confirm("重置回默认字体？")) {
      await db.settings.delete('customFont');
      window.location.reload();
    }
  };

  // 提醒选项配置
  const reminderOptions = [
    { key: '7', label: '提前 7 天', desc: '适合海淘礼物、策划聚会', icon: Calendar },
    { key: '3', label: '提前 3 天', desc: '适合网购礼物、订餐厅', icon: Gift },
    { key: '0', label: '生日当天', desc: '必须发消息送祝福！', icon: Bell },
  ];

  return (
    <div className="min-h-screen pb-32 bg-[#fafaf9] dark:bg-black text-[#1c1c1e] dark:text-white px-6 pt-16 transition-colors duration-500">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">设置</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">数据管理与个性化</p>
        </div>
        <button onClick={() => navigate(-1)} className="p-3 rounded-full bg-white/60 dark:bg-white/10 shadow-sm border border-white/20 sm:hidden">
          <ArrowLeft size={20} />
        </button>
      </header>

      <div className="space-y-6 max-w-lg mx-auto sm:mx-0">
        
        {/* === 板块 1: 外观 === */}
        <div className="bg-white dark:bg-white/10 rounded-2xl p-4 shadow-sm border border-transparent dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
              {isDark ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div>
              <p className="font-bold text-base">深色模式</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">切换日间/夜间外观</p>
            </div>
          </div>
          <button onClick={toggleTheme} className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${isDark ? 'bg-indigo-500' : 'bg-gray-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* === 板块 2: 生日提醒策略 (Pro) === */}
        <div className="bg-white dark:bg-white/10 rounded-2xl overflow-hidden shadow-sm border border-transparent dark:border-white/5">
          <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
             <Bell className="text-rose-500" size={20}/>
             <span className="font-bold">生日提醒策略</span>
          </div>
          <div>
            {reminderOptions.map((opt, idx) => {
              const isSelected = reminders.includes(opt.key);
              const Icon = opt.icon;
              return (
                <div key={opt.key} onClick={() => toggleReminder(opt.key)} className={`relative flex items-center gap-4 p-4 cursor-pointer transition-colors active:bg-gray-50 dark:active:bg-white/5 ${idx !== reminderOptions.length - 1 ? 'border-b border-gray-50 dark:border-white/5' : ''}`}>
                   {/* 选中指示条 */}
                   <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${isSelected ? 'bg-blue-500' : 'bg-transparent'}`} />
                   
                   <div className={`p-2.5 rounded-full transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                     <Icon size={20} />
                   </div>
                   <div className="flex-1">
                     <p className={`font-bold text-sm ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{opt.label}</p>
                     <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{opt.desc}</p>
                   </div>
                   <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-200 dark:border-white/20'}`}>
                     {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                   </div>
                </div>
              );
            })}
          </div>
          <p className="p-3 text-xs text-gray-400 flex gap-1.5 leading-relaxed bg-gray-50/50 dark:bg-black/20">
            <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
            修改后，系统会自动规划未来的通知。
          </p>
        </div>

        {/* === 板块 3: 字体设置 === */}
        <div className="bg-white dark:bg-white/10 rounded-2xl overflow-hidden shadow-sm border border-transparent dark:border-white/5">
          <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
             <Type className="text-purple-500" size={20}/>
             <span className="font-bold">个性化字体</span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            <button onClick={() => fontInputRef.current.click()} disabled={isProcessing} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left">
              <div className="flex flex-col"><span className="font-medium">上传手写字体</span><span className="text-xs text-gray-400">支持 .ttf, .otf</span></div>
              {isProcessing ? <Loader2 className="animate-spin text-gray-400"/> : <Upload size={18} className="text-gray-400" />}
            </button>
            <input type="file" ref={fontInputRef} onChange={handleFontUpload} accept=".ttf,.otf,.woff,.woff2" className="hidden" />
            <button onClick={handleResetFont} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left">
              <span className="font-medium text-gray-600 dark:text-gray-300">恢复默认字体</span>
            </button>
          </div>
        </div>

        {/* === 板块 4: 数据备份 === */}
        <div className="bg-white dark:bg-white/10 rounded-2xl overflow-hidden shadow-sm border border-transparent dark:border-white/5">
          <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
             <Database className="text-blue-500" size={20}/>
             <span className="font-bold">数据备份 (ZIP)</span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            <button onClick={handleExport} disabled={isProcessing} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left disabled:opacity-50">
              <div className="flex flex-col"><span className="font-medium">导出完整备份</span><span className="text-xs text-gray-400">包含所有数据和照片</span></div>
              {isProcessing ? <Loader2 className="animate-spin text-gray-400"/> : <Download size={18} className="text-gray-400" />}
            </button>
            <button onClick={() => fileInputRef.current.click()} disabled={isProcessing} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left disabled:opacity-50">
              <div className="flex flex-col"><span className="font-medium">恢复备份</span><span className="text-xs text-gray-400">支持恢复 ZIP</span></div>
              {isProcessing ? <Loader2 className="animate-spin text-gray-400"/> : <Upload size={18} className="text-gray-400" />}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".zip,.json" className="hidden" />
          </div>
        </div>

        {/* === 板块 5: 危险区域 === */}
        <div className="bg-white dark:bg-white/10 rounded-2xl overflow-hidden shadow-sm border border-transparent dark:border-white/5">
          <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
             <AlertTriangle className="text-red-500" size={20}/>
             <span className="font-bold text-red-500">危险区域</span>
          </div>
          <button onClick={handleClearAll} className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left">
            <div className="flex flex-col"><span className="font-medium text-red-500">清空所有数据</span><span className="text-xs text-red-400/70">无法撤销</span></div>
            <Trash2 size={18} className="text-red-500" />
          </button>
        </div>

        {/* 权限检查 */}
        <button onClick={requestNotificationPermission} className="w-full py-3 rounded-xl border border-dashed border-gray-300 dark:border-white/20 text-gray-400 text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            重新检查通知权限
        </button>

        <div className="text-center mt-10"><p className="text-xs text-gray-300 dark:text-gray-700 font-mono">Deep Relations v2.2</p></div>
      </div>
    </div>
  );
}