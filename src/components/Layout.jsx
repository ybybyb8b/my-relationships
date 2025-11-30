import NavBar from "./NavBar";

export default function Layout({ children }) {
  return (
    // 外层容器：确保全屏底色
    <div className="min-h-screen w-full bg-[#fafaf9] dark:bg-black text-[#1c1c1e] dark:text-white">
      
      {/* === 核心修改 === 
         1. 删除了 max-w-md mx-auto (去掉宽度限制，允许 100% 铺满)
         2. 删除了 px-5 (去掉强制左右留白，让内页背景能贴边)
         3. 删除了 pt-14 (去掉顶部留白，防止灵动岛区域重叠)
         只保留 pb-32 (为了底部导航栏不遮挡内容)
      */}
      <main className="w-full pb-32">
        {children}
      </main>

      {/* 底部导航栏 */}
      <NavBar />
    </div>
  );
}