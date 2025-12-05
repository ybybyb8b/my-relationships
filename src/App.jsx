import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import FriendDetail from "./pages/FriendDetail";
import Timeline from "./pages/Timeline";
import Settings from "./pages/Settings";
// 引入通知工具
import { requestNotificationPermission, scheduleNotifications } from "./lib/notification";

function App() {
  useEffect(() => {
    // 1. 深色模式逻辑 (保持不变)
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => { if (e.matches) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); };
    mediaQuery.addEventListener('change', handleChange);

    // 2. === 新增：初始化通知 ===
    const initNotifications = async () => {
      // 尝试申请权限 (如果是 Web 版可能会失败或不弹窗，但在 App 里会弹)
      try {
        await requestNotificationPermission();
        // 计算并调度
        await scheduleNotifications();
      } catch (e) {
        console.log("通知功能暂不可用 (可能是浏览器环境)");
      }
    };
    initNotifications();

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/friend/:id" element={<FriendDetail />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

export default App;