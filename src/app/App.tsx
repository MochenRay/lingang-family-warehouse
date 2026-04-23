import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Routes } from './components/Routes';
import { SPACING_CLASSES, TRANSITION_CLASSES } from './config/ui-constants';
import {
  DEFAULT_ROUTE_ID,
  getPathForRoute,
  getRouteForPath,
  isKnownPath,
  normalizeRouteInput,
} from './navigation/routes';

function App() {
  const [currentRoute, setCurrentRoute] = useState(() => getRouteForPath(window.location.pathname));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 永久启用深色模式
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getRouteForPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);

    if (!isKnownPath(window.location.pathname)) {
      window.history.replaceState({ route: DEFAULT_ROUTE_ID }, '', getPathForRoute(DEFAULT_ROUTE_ID));
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleRouteChange = (route: string) => {
    const nextRoute = normalizeRouteInput(route);
    const nextPath = getPathForRoute(nextRoute);
    const currentPath = window.location.pathname;

    setCurrentRoute(nextRoute);

    if (currentPath !== nextPath) {
      window.history.pushState({ route: nextRoute }, '', nextPath);
    }
  };

  // 判断是否为移动端路由
  const isMobileRoute = currentRoute === 'mobile';

  // 如果是移动端路由，渲染特殊布局
  if (isMobileRoute) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-gray-50 dark:bg-[var(--color-neutral-00)]">
        <Routes currentRoute={currentRoute} onRouteChange={handleRouteChange} />
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-[var(--color-neutral-00)] ${TRANSITION_CLASSES.default}`}>
      {/* 侧边导航 */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        currentRoute={currentRoute}
        onRouteChange={handleRouteChange}
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
          <Routes currentRoute={currentRoute} onRouteChange={handleRouteChange} />
        </main>
      </div>
    </div>
  );
}

export default App;
