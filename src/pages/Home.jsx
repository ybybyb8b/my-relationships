import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks"; // 自动刷新数据的神器
import { db } from "../db";
import FriendCard from "../components/FriendCard";
import AddFriendModal from "../components/AddFriendModal";
import { Plus } from "lucide-react";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // === 这一行就是连接数据库的全部逻辑 ===
  // 它会自动查询 friends 表，并且一旦数据有变化，页面会自动刷新
  const friends = useLiveQuery(() => db.friends.toArray());

  return (
    <div className="space-y-6">
      <header className="px-2 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-ios-text dark:text-white transition-colors">朋友</h1>
          <p className="text-ios-gray dark:text-ios-subtext-dark text-sm mt-1 transition-colors">
            {friends?.length || 0} 位好友在列
          </p>
        </div>
        
        {/* 顶部的小加号，如果列表长了，底部还有一个大的 */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="p-2 bg-ios-bg dark:bg-white/10 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-white/20 transition-colors"
        >
          <Plus size={24} />
        </button>
      </header>

      {/* === 卡片列表 === */}
      <div className="grid grid-cols-2 gap-4 p-2 pb-20">
        {!friends || friends.length === 0 ? (
          // 空状态提示
          <div className="col-span-2 py-20 text-center text-ios-gray/50">
             <p className="text-6xl mb-4">😶</p>
             <p>还没有朋友<br/>点击加号记录第一个吧</p>
          </div>
        ) : (
          // 真实数据渲染
          friends.map(friend => (
            <FriendCard key={friend.id} friend={friend} />
          ))
        )}
      </div>

      {/* 挂载弹窗组件 */}
      <AddFriendModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}