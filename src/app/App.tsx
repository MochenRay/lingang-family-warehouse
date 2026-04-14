import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Routes } from './components/Routes';
import { SPACING_CLASSES, TRANSITION_CLASSES } from './config/ui-constants';

function App() {
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 永久启用深色模式
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // 判断是否为移动端路由
  const isMobileRoute = currentRoute === 'mobile';

  // 如果是移动端路由，渲染特殊布局
  if (isMobileRoute) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-gray-50 dark:bg-[var(--color-neutral-00)]">
        <Routes currentRoute={currentRoute} onRouteChange={setCurrentRoute} />
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-[var(--color-neutral-00)] ${TRANSITION_CLASSES.default}`}>
      {/* 侧边导航 */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        currentRoute={currentRoute}
        onRouteChange={setCurrentRoute}
      />
      
      {/* 主内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶部导航 */}
        <Header 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        {/* 页面内容 - 使用标准的 24px 页面边距 */}
        <main className={`flex-1 overflow-auto bg-white dark:bg-[var(--color-neutral-00)] ${SPACING_CLASSES.page}`}>
          <Routes currentRoute={currentRoute} onRouteChange={setCurrentRoute} />
        </main>
      </div>
    </div>
  );
}

export default App;