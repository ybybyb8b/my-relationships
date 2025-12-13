// src/App.jsx
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import FriendDetail from "./pages/FriendDetail";
import Timeline from "./pages/Timeline";
import Settings from "./pages/Settings";
import { requestNotificationPermission, scheduleNotifications } from "./lib/notification";
import { db } from "./db"; // 引入 db

function App() {
  useEffect(() => {
    // 1. 深色模式逻辑
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => { if (e.matches) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); };
    mediaQuery.addEventListener('change', handleChange);

    // 2. 初始化通知
    const initNotifications = async () => {
      try {
        await requestNotificationPermission();
        await scheduleNotifications();
      } catch (e) {
        console.log("通知功能暂不可用");
      }
    };
    initNotifications();

    // 3. === 新增：加载自定义字体 ===
    const loadCustomFont = async () => {
      try {
        const fontRecord = await db.settings.get('customFont');
        if (fontRecord && fontRecord.value) {
          // 创建 FontFace 对象
          // 注意：名字必须和 tailwind.config.js 里定义的一样，这里我们覆盖 'MyHandwriting'
          const customFont = new FontFace('MyHandwriting', fontRecord.value);
          
          await customFont.load();
          document.fonts.add(customFont);
          console.log("自定义字体加载成功");
        }
      } catch (e) {
        console.error("加载自定义字体失败", e);
      }
    };
    loadCustomFont();

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