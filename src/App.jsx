import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import FriendDetail from "./pages/FriendDetail";
import Timeline from "./pages/Timeline";
import Settings from "./pages/Settings"; // <--- 1. 引入

function App() {
  // ... (useEffect 代码不变) ...
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => { if (e.matches) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/friend/:id" element={<FriendDetail />} />
        <Route path="/timeline" element={<Timeline />} />
        
        {/* 2. 添加设置路由 */}
        <Route path="/settings" element={<Settings />} />
        
      </Routes>
    </Layout>
  );
}

export default App;