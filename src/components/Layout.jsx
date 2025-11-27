import NavBar from "./NavBar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen w-full bg-ios-bg dark:bg-ios-bg-dark text-ios-text dark:text-ios-text-dark transition-colors duration-300">
      {/* 增加底部内边距到 pb-32，防止内容被悬浮岛遮挡 */}
      <main className="max-w-md mx-auto px-5 pt-14 pb-32">
        {children}
      </main>

      <NavBar />
    </div>
  );
}