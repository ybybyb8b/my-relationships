import { Link } from "react-router-dom"; // <--- 1. 引入 Link
import { cn } from "../lib/utils";

const colorVariants = {
  blue: "from-macaron-blue/80 to-macaron-blue/10 dark:from-macaron-blue-dark/60 dark:to-macaron-blue-dark/5",
  pink: "from-macaron-pink/80 to-macaron-pink/10 dark:from-macaron-pink-dark/60 dark:to-macaron-pink-dark/5",
  green: "from-macaron-green/80 to-macaron-green/10 dark:from-macaron-green-dark/60 dark:to-macaron-green-dark/5",
  yellow: "from-macaron-yellow/80 to-macaron-yellow/10 dark:from-macaron-yellow-dark/60 dark:to-macaron-yellow-dark/5",
  purple: "from-macaron-purple/80 to-macaron-purple/10 dark:from-macaron-purple-dark/60 dark:to-macaron-purple-dark/5",
};

export default function FriendCard({ friend }) {
  const colorClass = colorVariants[friend.color] || colorVariants.blue;

  return (
    // <--- 2. 改为 Link，并指向 /friend/ID
    <Link 
      to={`/friend/${friend.id}`} 
      className="group relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden isolate transition-transform duration-300 hover:scale-[1.02] active:scale-95 block"
    >
      {/* ... (中间所有的内容完全保持不变，不需要动) ... */}
      <div
        className={cn(
          "absolute inset-0 -z-10 bg-gradient-to-tl blur-2xl opacity-70 dark:opacity-50 transition-colors duration-500",
          colorClass
        )}
      />
      <div className="absolute inset-0 z-0 bg-white/30 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-[2rem]" />
      <div className="relative z-10 h-full flex flex-col items-center justify-between p-5 text-center">
        <div className="mt-4 relative">
            <div className="w-20 h-20 text-4xl flex items-center justify-center bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-full shadow-sm border border-white/30">
                {friend.avatar}
            </div>
            {friend.tag && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-medium bg-white dark:bg-ios-card-dark/80 backdrop-blur-md rounded-full shadow-sm border border-white/20 whitespace-nowrap">
                {friend.tag}
              </div>
            )}
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-black dark:text-white/90">
            {friend.name}
          </h3>
          {friend.nextAction && (
            <p className="text-xs text-black/60 dark:text-white/60 mt-1 font-medium">
              {friend.nextAction}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}