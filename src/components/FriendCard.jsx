import { Link } from "react-router-dom";
import { cn, THEME_COLORS } from "../lib/utils";

export default function FriendCard({ friend }) {
  const theme = THEME_COLORS[friend.color] || THEME_COLORS.default;

  // 格式化生日文本
  const getBirthdayString = () => {
    if (!friend.birthday || !friend.birthday.month || !friend.birthday.day) {
      return null; // 没填生日返回 null，方便后面判断是否渲染
    }
    // 为了配合手写风，用点号分隔更有感觉，例如 10.20
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
      <div className={cn(
        "relative w-full rounded-lg shadow-md overflow-hidden flex flex-col",
        theme.paper
      )}>
        
        {/* Padding */}
        <div className="p-3 pb-0">
          
          {/* 照片区域 */}
          <div className={cn(
            "aspect-square w-full rounded-sm overflow-hidden flex items-center justify-center relative",
            theme.photo,
            "shadow-inner"
          )}>
            
            {/* 噪点纹理 */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>

            {/* 有照片显示照片，无照片显示首字 */}
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

            {/* 标签依然保留，贴在角落很有感觉 */}
            {friend.tag && (
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white/80 backdrop-blur-sm rounded text-[9px] font-bold text-gray-600 shadow-sm z-20">
                #{friend.tag}
              </div>
            )}
          </div>
        </div>

        {/* === 修改点：手写区 (Name + Birthday 同一行) === */}
        {/* flex items-baseline: 让大字和小字的底部对齐
            justify-center gap-2: 居中，中间空一点间距
        */}
        <div className="pt-3 pb-4 px-3 min-h-[60px] flex items-baseline justify-center gap-2">
          {/* 名字：字号 text-xl (适中)，加粗 */}
          <h3 className={cn(
            "font-bold text-xl leading-tight tracking-wide font-hand truncate max-w-[70%]", 
            "font-hand",
            theme.text
          )}>
            {friend.name}
          </h3>
          
          {/* 生日：只有存在时才显示，小字号 text-sm，颜色淡一点 */}
          {birthdayStr && (
            <span className={cn(
              "text-m font-medium opacity-60 font-hand whitespace-nowrap font-hand", 
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