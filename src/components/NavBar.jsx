import { NavLink } from "react-router-dom";
import { Users, History, Settings } from "lucide-react";
import { cn } from "../lib/utils";

export default function NavBar() {
  const navItems = [
    { name: "朋友", path: "/", icon: Users },
    { name: "动态", path: "/timeline", icon: History },
    { name: "设置", path: "/settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-[280px]">
      {/* 外层容器：
         1. backdrop-blur-2xl: 极高强度的毛玻璃
         2. bg-white/70: 提高透明度，增加通透感
         3. shadow-2xl: 增加悬浮的投影深度
         4. border-white/20: 玻璃边缘的反光质感
      */}
      <nav className="flex items-center justify-between px-6 py-3 rounded-full 
                      bg-white/70 dark:bg-black/60 
                      backdrop-blur-2xl 
                      border border-white/40 dark:border-white/10 
                      shadow-2xl shadow-black/5 dark:shadow-black/20
                      transition-all duration-300">
        
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "relative flex flex-col items-center justify-center p-3 rounded-full transition-all duration-300 ease-out",
                isActive 
                  ? "text-black dark:text-white scale-110 bg-white/50 dark:bg-white/10 shadow-sm" // 选中：放大、加亮背景
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" // 未选中：低调
              )
            }
          >
            <item.icon size={22} strokeWidth={2.5} />
            
            {/* 选中时底部的小光点，增加灵动感 */}
            {/* <span className={cn(
                "absolute -bottom-1 w-1 h-1 rounded-full bg-current transition-opacity duration-300",
                isActive ? "opacity-100" : "opacity-0"
            )} /> */}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}