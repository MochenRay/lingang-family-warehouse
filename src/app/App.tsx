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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(
    () => window.matchMedia('(max-width: 767px)').matches,
  );

  // 永久启用深色模式
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getRouteForPath(window.location.pathname));
      setMobileSidebarOpen(false);
    };

    window.addEventListener('popstate', handlePopState);

    if (!isKnownPath(window.location.pathname)) {
      window.history.replaceState({ route: DEFAULT_ROUTE_ID }, '', getPathForRoute(DEFAULT_ROUTE_ID));
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const syncViewport = () => {
      setIsCompactViewport(mediaQuery.matches);
      if (!mediaQuery.matches) setMobileSidebarOpen(false);
    };
    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);
    return () => mediaQuery.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    if (!mobileSidebarOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileSidebarOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileSidebarOpen]);

  const handleRouteChange = (route: string) => {
    const nextRoute = normalizeRouteInput(route);
    const nextPath = getPathForRoute(nextRoute);
    const currentPath = window.location.pathname;

    setCurrentRoute(nextRoute);
    setMobileSidebarOpen(false);

    if (currentPath !== nextPath) {
      window.history.pushState({ route: nextRoute }, '', nextPath);
    }
  };

  const handleSidebarToggle = () => {
    if (isCompactViewport) {
      setMobileSidebarOpen((open) => !open);
      return;
    }
    setSidebarCollapsed((collapsed) => !collapsed);
  };

  // 判断是否为移动端路由
  const isMobileRoute = currentRoute === 'mobile';

  // 如果是移动端路由，渲染特殊布局
  if (isMobileRoute) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-[var(--color-neutral-00)]">
        <Routes currentRoute={currentRoute} onRouteChange={handleRouteChange} />
      </div>
    );
  }

  return (
    <div className={`relative flex h-screen w-screen overflow-hidden bg-[var(--color-neutral-00)] ${TRANSITION_CLASSES.default}`}>
      {/* 侧边导航 */}
      {isCompactViewport && mobileSidebarOpen && (
        <button
          type="button"
          aria-label="关闭侧边导航"
          className="fixed inset-y-0 left-60 right-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <div
        id="desktop-sidebar"
        data-desktop-sidebar
        className={`fixed inset-y-0 left-0 z-50 shrink-0 transition-transform duration-300 md:static md:z-auto md:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          collapsed={isCompactViewport ? false : sidebarCollapsed}
          currentRoute={currentRoute}
          onRouteChange={handleRouteChange}
        />
      </div>
      
      {/* 主内容区 */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 顶部导航 */}
        <Header
          onToggleSidebar={handleSidebarToggle}
          sidebarCollapsed={isCompactViewport ? !mobileSidebarOpen : sidebarCollapsed}
        />
        
        {/* 页面内容 - 使用标准的 24px 页面边距 */}
        <main className={`flex-1 overflow-auto bg-[var(--color-neutral-00)] ${SPACING_CLASSES.page}`}>
          <Routes currentRoute={currentRoute} onRouteChange={handleRouteChange} />
        </main>
      </div>
    </div>
  );
}

export default App;
