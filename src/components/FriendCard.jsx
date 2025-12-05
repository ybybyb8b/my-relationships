import { Link } from "react-router-dom";
import { cn, THEME_COLORS } from "../lib/utils";
import { Pin } from "lucide-react"; // 引入图标

export default function FriendCard({ friend }) {
  const theme = THEME_COLORS[friend.color] || THEME_COLORS.default;

  const getBirthdayString = () => {
    if (!friend.birthday || !friend.birthday.month || !friend.birthday.day) {
      return null; 
    }
    return `${friend.birthday.month}.${friend.birthday.day}`;
  };

  const birthdayStr = getBirthdayString();

  return (
    <Link 
      to={`/friend/${friend.id}`} 
      className={cn(
        "group relative block w-full",
        "transition-transform duration-300 hover:scale-[1.02] hover:-rotate-1 active:scale-95"
      )}
    >
      
      {/* === 核心新增：Pin 贴纸效果 === */}
      {friend.isPinned && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          {/* 模拟一个红色的大头针或贴纸 */}
          <div className="bg-red-500 text-white p-1.5 rounded-full shadow-md border-2 border-white rotate-12 transform hover:scale-110 transition-transform">
            <Pin size={14} fill="currentColor" />
          </div>
        </div>
      )}

      <div className={cn(
        "relative w-full rounded-lg shadow-md overflow-hidden flex flex-col",
        theme.paper,
        // 如果被 Pin 了，边框加粗一点点，或者加一点特殊光晕
        friend.isPinned && "ring-2 ring-offset-2 ring-red-100 dark:ring-red-900"
      )}>
        
        <div className="p-3 pb-0">
          <div className={cn(
            "aspect-square w-full rounded-sm overflow-hidden flex items-center justify-center relative",
            theme.photo,
            "shadow-inner"
          )}>
            <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>

            {friend.photo ? (
              <img 
                src={friend.photo} 
                alt={friend.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="relative z-10 text-5xl font-bold opacity-60 drop-shadow-sm group-hover:scale-110 transition-transform duration-300 select-none">
                {friend.name ? friend.name.charAt(0).toUpperCase() : "?"}
              </div>
            )}

            {friend.tag && (
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white/80 backdrop-blur-sm rounded text-[9px] font-bold text-gray-600 shadow-sm z-20">
                #{friend.tag}
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 pb-4 px-3 min-h-[60px] flex items-baseline justify-center gap-2">
          <h3 className={cn(
            "font-bold text-xl leading-tight tracking-wide font-hand truncate max-w-[70%]", 
            theme.text
          )}>
            {friend.name}
          </h3>
          
          {birthdayStr && (
            <span className={cn(
              "text-sm font-medium opacity-60 font-hand whitespace-nowrap", 
              theme.text
            )}>
              {birthdayStr}
            </span>
          )}
        </div>

      </div>
      
      <div className="absolute inset-0 rounded-lg shadow-xl opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
    </Link>
  );
}