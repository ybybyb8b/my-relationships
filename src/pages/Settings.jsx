// src/pages/Settings.jsx
import { useRef, useState } from "react";
import { db } from "../db";
import { Download, Upload, Trash2, Database, AlertTriangle, Loader2, Type } from "lucide-react"; 
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function Settings() {
  const fileInputRef = useRef(null);
  const fontInputRef = useRef(null); // 新增 ref
  const [isProcessing, setIsProcessing] = useState(false);

  // === 1. 导出逻辑 (保留) ===
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
          const fileName = `friend_${friend.id}.jpg`;
          const base64Data = friend.photo.split(',')[1];
          imgFolder.file(fileName, base64Data, { base64: true });
          friendCopy.photo = `images/${fileName}`; 
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

      const content = await zip.generateAsync({ type: "blob" });
      const dateStr = new Date().toISOString().split('T')[0];
      saveAs(content, `DeepRelations_Backup_${dateStr}.zip`);

    } catch (error) {
      alert("导出失败: " + error.message);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // === 2. 导入逻辑 (保留) ===
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm("⚠️ 警告：恢复备份将【清空并覆盖】当前所有数据！\n\n确定要继续吗？")) {
      event.target.value = ""; 
      return;
    }

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const zip = await JSZip.loadAsync(e.target.result);
        
        const dataFile = zip.file("data.json");
        if (!dataFile) throw new Error("无效的备份文件：找不到 data.json");
        
        const dataStr = await dataFile.async("string");
        const data = JSON.parse(dataStr);

        const restoredFriends = await Promise.all(data.friends.map(async (f) => {
          const restoredFriend = {
            ...f,
            createdAt: new Date(f.createdAt),
            metAt: f.metAt ? new Date(f.metAt) : null
          };

          if (f.photo && f.photo.startsWith('images/')) {
            const imgFile = zip.file(f.photo);
            if (imgFile) {
              const base64 = await imgFile.async("base64");
              restoredFriend.photo = `data:image/jpeg;base64,${base64}`;
            } else {
              restoredFriend.photo = null;
            }
          }
          return restoredFriend;
        }));

        const restoredInteractions = data.interactions.map(i => ({
          ...i,
          date: new Date(i.date),
          createdAt: new Date(i.createdAt)
        }));
        
        const restoredMemos = (data.memos || []).map(m => ({
          ...m,
          createdAt: new Date(m.createdAt)
        }));

        await db.transaction('rw', db.friends, db.interactions, db.memos, async () => {
          await db.friends.clear();
          await db.interactions.clear();
          await db.memos.clear();
          
          await db.friends.bulkAdd(restoredFriends);
          await db.interactions.bulkAdd(restoredInteractions);
          await db.memos.bulkAdd(restoredMemos);
        });

        alert(`成功恢复！\n包含 ${restoredFriends.length} 位朋友, ${restoredInteractions.length} 条互动。`);
        window.location.reload(); 

      } catch (error) {
        alert("导入失败：" + error.message);
        console.error(error);
      } finally {
        setIsProcessing(false);
        event.target.value = ""; 
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleClearAll = async () => {
    if (confirm("🧨 核弹级警告：\n这会删除所有数据且无法恢复！\n\n你真的要删库吗？")) {
      await db.friends.clear();
      await db.interactions.clear();
      await db.memos.clear();
      window.location.reload();
    }
  };

  // === 3. 新增：字体上传逻辑 ===
  const handleFontUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['.ttf', '.otf', '.woff', '.woff2'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(ext)) {
      alert("不支持的字体格式。请上传 .ttf 或 .otf 文件。");
      return;
    }

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      // 存入 settings 表
      await db.settings.put({
        key: 'customFont',
        value: arrayBuffer,
        fileName: file.name
      });
      alert("字体上传成功！应用即将刷新...");
      window.location.reload(); 
    } catch (error) {
      alert("字体上传失败：" + error.message);
    } finally {
      setIsProcessing(false);
      event.target.value = "";
    }
  };

  const handleResetFont = async () => {
    if (confirm("确定要重置回默认手写字体吗？")) {
      await db.settings.delete('customFont');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-[#fafaf9] dark:bg-black text-[#1c1c1e] dark:text-white px-6 pt-16">
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold">设置</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          数据管理与个性化
        </p>
      </header>

      <div className="space-y-6">

        {/* === 新增：个性化字体卡片 === */}
        <div className="bg-white dark:bg-white/10 rounded-2xl overflow-hidden shadow-sm border border-transparent dark:border-white/5">
          <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
             <Type className="text-purple-500" size={20}/>
             <span className="font-bold">个性化字体</span>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            <button 
              onClick={() => fontInputRef.current.click()}
              disabled={isProcessing}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex flex-col">
                <span className="font-medium">上传手写字体</span>
                <span className="text-xs text-gray-400">支持 .ttf, .otf 格式</span>
              </div>
              {isProcessing ? <Loader2 className="animate-spin text-gray-400"/> : <Upload size={18} className="text-gray-400" />}
            </button>
            <input 
              type="file" 
              ref={fontInputRef} 
              onChange={handleFontUpload} 
              accept=".ttf,.otf,.woff,.woff2"
              className="hidden" 
            />

            <button 
              onClick={handleResetFont}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex flex-col">
                <span className="font-medium text-gray-600 dark:text-gray-300">恢复默认字体</span>
              </div>
            </button>
          </div>
        </div>
        
        {/* === 数据备份卡片 (完整保留) === */}
        <div className="bg-white dark:bg-white/10 rounded-2xl overflow-hidden shadow-sm border border-transparent dark:border-white/5">
          <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
             <Database className="text-blue-500" size={20}/>
             <span className="font-bold">数据备份 (ZIP)</span>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {/* 导出按钮 */}
            <button 
              onClick={handleExport}
              disabled={isProcessing}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left disabled:opacity-50"
            >
              <div className="flex flex-col">
                <span className="font-medium">导出完整备份</span>
                <span className="text-xs text-gray-400">包含所有数据和照片</span>
              </div>
              {isProcessing ? <Loader2 className="animate-spin text-gray-400"/> : <Download size={18} className="text-gray-400" />}
            </button>

            {/* 导入按钮 */}
            <button 
              onClick={() => fileInputRef.current.click()}
              disabled={isProcessing}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left disabled:opacity-50"
            >
              <div className="flex flex-col">
                <span className="font-medium">恢复备份</span>
                <span className="text-xs text-gray-400">支持恢复 ZIP 格式备份</span>
              </div>
              {isProcessing ? <Loader2 className="animate-spin text-gray-400"/> : <Upload size={18} className="text-gray-400" />}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImport} 
              accept=".zip,.json" 
              className="hidden" 
            />
          </div>
        </div>

        {/* === 危险区域 (完整保留) === */}
        <div className="bg-white dark:bg-white/10 rounded-2xl overflow-hidden shadow-sm border border-transparent dark:border-white/5">
          <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
             <AlertTriangle className="text-red-500" size={20}/>
             <span className="font-bold text-red-500">危险区域</span>
          </div>
          
          <button 
            onClick={handleClearAll}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
          >
            <div className="flex flex-col">
              <span className="font-medium text-red-500">清空所有数据</span>
              <span className="text-xs text-red-400/70">无法撤销，请谨慎操作</span>
            </div>
            <Trash2 size={18} className="text-red-500" />
          </button>
        </div>

        {/* 关于信息 */}
        <div className="text-center mt-10">
          <p className="text-xs text-gray-300 dark:text-gray-700 font-mono">
            Deep Relations v2.1
          </p>
        </div>

      </div>
    </div>
  );
}