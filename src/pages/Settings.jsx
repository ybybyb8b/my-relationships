import { useRef, useState } from "react";
import { db } from "../db";
import { Download, Upload, Trash2, Database, AlertTriangle, Loader2, Type } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver"; // 电脑端仍需保留
import { Capacitor } from "@capacitor/core"; 
import { Share } from "@capacitor/share"; 
import { Filesystem, Directory } from "@capacitor/filesystem"; 

export default function Settings() {
  const fileInputRef = useRef(null);
  const fontInputRef = useRef(null); 
  const [isProcessing, setIsProcessing] = useState(false);

  // === 升级版导出：自动适配手机和电脑 ===
  const handleExport = async () => {
    setIsProcessing(true);
    console.log("开始导出...");

    try {
      const zip = new JSZip();
      
      // 1. 获取数据
      const friends = await db.friends.toArray();
      const interactions = await db.interactions.toArray();
      const memos = await db.memos.toArray();

      // 2. 处理图片
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
          } catch (err) {
            console.error("图片处理异常", err);
          }
        }
        return friendCopy;
      });

      // 3. 组装 JSON
      const data = {
        version: 2,
        timestamp: new Date().toISOString(),
        friends: cleanFriends,
        interactions,
        memos
      };
      zip.file("data.json", JSON.stringify(data, null, 2));

      // 4. 生成文件名
      const fileName = `DeepRelations_Backup_${new Date().toISOString().split('T')[0]}.zip`;

      // === 核心判断：是手机 App 还是 网页？ ===
      if (Capacitor.isNativePlatform()) {
        // [手机端逻辑]
        console.log("检测到原生环境，使用 Filesystem 和 Share");
        
        // 1. 生成 Base64 格式的 ZIP
        const base64 = await zip.generateAsync({ type: "base64" });
        
        // 2. 写入手机缓存目录
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache
        });

        // 3. 调用系统分享
        await Share.share({
          title: '备份数据导出',
          url: result.uri, 
        });

      } else {
        // [电脑网页逻辑]
        console.log("检测到网页环境，使用 file-saver");
        const blob = await zip.generateAsync({ type: "blob" });
        saveAs(blob, fileName);
      }

    } catch (error) {
      alert("导出失败: " + error.message);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // === 导入逻辑 (保持不变) ===
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

      } catch (error) {
        alert("导入失败：" + error.message);
      } finally {
        setIsProcessing(false);
        event.target.value = ""; 
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleClearAll = async () => {
    if (confirm("🧨 真的要清空所有数据吗？")) {
      await db.friends.clear();
      await db.interactions.clear();
      await db.memos.clear();
      window.location.reload();
    }
  };

  // === 字体上传逻辑 (保持不变) ===
  const handleFontUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) {
      alert("不支持的格式，请上传 .ttf 或 .otf");
      return;
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

  return (
    <div className="min-h-screen pb-32 bg-[#fafaf9] dark:bg-black text-[#1c1c1e] dark:text-white px-6 pt-16">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">设置</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">数据管理与个性化</p>
      </header>

      <div className="space-y-6">
        {/* 字体设置 */}
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

        {/* 数据备份 */}
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

        {/* 危险区域 */}
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

        <div className="text-center mt-10"><p className="text-xs text-gray-300 dark:text-gray-700 font-mono">Deep Relations v2.1</p></div>
      </div>
    </div>
  );
}