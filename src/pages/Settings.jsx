import { useRef } from "react";
import { db } from "../db";
import { Download, Upload, Trash2, Database, AlertTriangle } from "lucide-react";

export default function Settings() {
  const fileInputRef = useRef(null);

  // === 导出功能 ===
  const handleExport = async () => {
    try {
      const friends = await db.friends.toArray();
      const interactions = await db.interactions.toArray();
      
      const data = {
        version: 1,
        timestamp: new Date().toISOString(),
        friends,
        interactions
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      // 创建临时下载链接
      const link = document.createElement('a');
      link.href = url;
      link.download = `relationship-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("导出失败: " + error);
    }
  };

  // === 导入功能 ===
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm("⚠️ 警告：导入备份将【清空并覆盖】当前所有数据！\n\n确定要继续吗？")) {
      event.target.value = ""; // 重置文件选择
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // 数据清洗：把字符串日期转回 Date 对象
        const cleanFriends = data.friends.map(f => ({
          ...f,
          createdAt: new Date(f.createdAt),
          metAt: f.metAt ? new Date(f.metAt) : null
        }));

        const cleanInteractions = data.interactions.map(i => ({
          ...i,
          date: new Date(i.date),
          createdAt: new Date(i.createdAt)
        }));

        // 事务操作：先清空，再写入
        await db.transaction('rw', db.friends, db.interactions, async () => {
          await db.friends.clear();
          await db.interactions.clear();
          await db.friends.bulkAdd(cleanFriends);
          await db.interactions.bulkAdd(cleanInteractions);
        });

        alert(`成功恢复！\n包含 ${cleanFriends.length} 位朋友和 ${cleanInteractions.length} 条记录。`);
        window.location.reload(); // 刷新页面以加载新数据
      } catch (error) {
        alert("导入失败，文件格式可能不正确。\n错误信息: " + error);
      }
    };
    reader.readAsText(file);
  };

  // === 删库跑路 ===
  const handleClearAll = async () => {
    if (confirm("🧨 核弹级警告：\n这会删除所有数据且无法恢复！\n\n你真的要删库吗？")) {
      await db.friends.clear();
      await db.interactions.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-ios-bg dark:bg-black text-ios-text dark:text-white px-6 pt-16">
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold">设置</h1>
        <p className="text-ios-gray dark:text-ios-subtext-dark text-sm mt-1">
          数据管理与备份
        </p>
      </header>

      <div className="space-y-6">
        
        {/* 数据备份卡片 */}
        <div className="bg-white dark:bg-white/10 rounded-2xl overflow-hidden shadow-sm border border-transparent dark:border-white/5">
          <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
             <Database className="text-blue-500" size={20}/>
             <span className="font-bold">数据备份</span>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {/* 导出按钮 */}
            <button 
              onClick={handleExport}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex flex-col">
                <span className="font-medium">导出数据 (JSON)</span>
                <span className="text-xs text-gray-400">生成一个包含所有数据的备份文件</span>
              </div>
              <Download size={18} className="text-gray-400" />
            </button>

            {/* 导入按钮 */}
            <button 
              onClick={() => fileInputRef.current.click()}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex flex-col">
                <span className="font-medium">恢复备份</span>
                <span className="text-xs text-gray-400">从 JSON 文件恢复数据 (会覆盖当前数据)</span>
              </div>
              <Upload size={18} className="text-gray-400" />
            </button>
            {/* 隐藏的文件输入框 */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImport} 
              accept=".json" 
              className="hidden" 
            />
          </div>
        </div>

        {/* 危险区域 */}
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
            Deep Relationships v1.0
          </p>
        </div>

      </div>
    </div>
  );
}