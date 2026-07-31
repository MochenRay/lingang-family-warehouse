import { useEffect, useState } from 'react';
import { MobileHome } from './MobileHome';
import { HouseCollect } from './HouseCollect';
import { PersonCollect } from './PersonCollect';
import { QuickNote } from './QuickNote';
import { MobileTasks } from './MobileTasks';
import { MobilePatrol } from './MobilePatrol';
import { MobileProfile } from './MobileProfile';
import { MobileTaskDetail } from './MobileTaskDetail';
import { MobileScan } from './MobileScan';
import { MobileNotices } from './MobileNotices';
import { MobileNoticeDetail } from './MobileNoticeDetail';
import { MobileSearch } from './MobileSearch';
import { MobilePersonDetail } from './MobilePersonDetail';
import { MobileHouseDetail } from './MobileHouseDetail';
import { MobileHousing } from './MobileHousing';
import { MobilePeople } from './MobilePeople';
import { QuickNoteHistory } from './QuickNoteHistory';
import { MobileStats } from './MobileStats';
import { MobileUpdateHistory } from './MobileUpdateHistory';
import { MobileGridOverview } from './MobileGridOverview';
import { MobilePersonEdit } from './MobilePersonEdit';
import { MobileHouseEdit } from './MobileHouseEdit';
import { MobileVisitForm } from './MobileVisitForm';
import { MobileConflictList } from './conflict/MobileConflictList';
import { MobileConflictForm } from './conflict/MobileConflictForm';
import { MobileConflictDetail } from './conflict/MobileConflictDetail';
import { MobileActivityDetail } from './MobileActivityDetail';
import { MobileActivityForm } from './MobileActivityForm';
import { MobileActivity } from './MobileActivity';
import { MobilePolicyInterpretation } from './MobilePolicyInterpretation';
import { MobileOfficialWriting } from './MobileOfficialWriting';
import { MobileSmartQuery } from './MobileSmartQuery';
import { ConfirmDialog } from '../patterns/ConfirmDialog';
import { DialogPortalContainerProvider } from '../ui/dialog';
import { mobileContextRepository } from '../../services/repositories/mobileContextRepository';
import { toast } from 'sonner';
import { MobileSandboxNotice } from './MobileSandboxNotice';
import { MobileSandboxProvider } from './MobileSandboxProvider';
import {
  createMobileBrowserHistoryState,
  resolveMobileBackNavigation,
  resolveMobileNavigation,
  restoreMobileBrowserNavigation,
  toMobilePath,
  type MobileNavigateOptions,
  type RestoredMobileNavigation,
} from './mobileNavigation';

interface MobileAppProps {
  onExitMobile?: () => void;
}

export function MobileApp({ onExitMobile }: MobileAppProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const [navigation, setNavigation] = useState<RestoredMobileNavigation>(() => (
    restoreMobileBrowserNavigation(
      window.history.state,
      window.location.pathname,
      window.location.search,
    )
  ));
  const history = navigation.history;

  // 退出确认弹窗：'mobile'=退出移动端模式，'logout'=退出登录返回电脑端
  const [pendingExitAction, setPendingExitAction] = useState<'mobile' | 'logout' | null>(null);
  
  // 获取当前路由（栈顶）
  const currentRoute = history[history.length - 1];

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      setNavigation(restoreMobileBrowserNavigation(
        event.state,
        window.location.pathname,
        window.location.search,
      ));
    };

    window.addEventListener('popstate', handlePopState);
    window.history.replaceState(
      createMobileBrowserHistoryState(navigation.history, navigation.mobileDepth),
      '',
      toMobilePath(currentRoute),
    );

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 唯一的页内导航入口；浏览器 back/forward 由 popstate 恢复对应条目的完整来源栈。
  const navigate = (route: string, options: MobileNavigateOptions = {}) => {
    const result = resolveMobileNavigation(navigation.history, route, options);
    if (result.method === 'none') return;
    const nextDepth = result.method === 'push'
      ? navigation.mobileDepth + 1
      : navigation.mobileDepth;
    setNavigation({ history: result.history, mobileDepth: nextDepth });
    const browserState = createMobileBrowserHistoryState(result.history, nextDepth);
    if (result.method === 'replace') {
      window.history.replaceState(browserState, '', result.path);
      return;
    }
    window.history.pushState(browserState, '', result.path);
  };

  // 处理返回上一页
  const handleBack = () => {
    const result = resolveMobileBackNavigation(navigation.history, navigation.mobileDepth);
    if (result.method === 'browser') {
      window.history.back();
      return;
    }
    if (result.method === 'replace') navigate(result.route, { replace: true });
  };

  // 退出移动端模式（确认弹窗替代原生 confirm）
  const handleExitMobile = () => {
    setPendingExitAction('mobile');
  };

  const executePendingExit = () => {
    if (pendingExitAction === 'logout') {
      mobileContextRepository.clearCurrentWorkerName();
    }

    if (onExitMobile) {
      onExitMobile();
    } else {
      navigate('home', { replace: true });
      toast.info(pendingExitAction === 'logout' ? '已退出登录' : '已返回移动端工作台首页');
    }
  };

  // 根据当前路由渲染对应页面
  const renderPage = () => {
    // Check for dynamic routes first
    if (currentRoute.startsWith('/mobile/tasks/')) {
      const taskId = currentRoute.split('/').pop();
      return <MobileTaskDetail taskId={taskId || ''} onBack={handleBack} onRouteChange={navigate} />;
    }
    
    if (currentRoute.startsWith('person-detail/')) {
      const id = currentRoute.split('/').pop();
      return <MobilePersonDetail id={id || ''} onBack={handleBack} onRouteChange={navigate} />;
    }

    if (currentRoute.startsWith('house-detail/')) {
      const id = currentRoute.split('/').pop();
      return <MobileHouseDetail id={id || ''} onBack={handleBack} onRouteChange={navigate} />;
    }

    if (currentRoute.startsWith('person-edit/')) {
      const id = currentRoute.split('/').pop();
      return <MobilePersonEdit id={id || ''} onBack={handleBack} />;
    }

    if (currentRoute.startsWith('house-edit/')) {
      const id = currentRoute.split('/').pop();
      return <MobileHouseEdit id={id || ''} onBack={handleBack} />;
    }

    if (currentRoute.startsWith('visit-form/')) {
      const personId = currentRoute.split('/').pop();
      return <MobileVisitForm personId={personId || ''} onBack={handleBack} />;
    }

    if (currentRoute.startsWith('notice-detail/')) {
      const noticeId = currentRoute.split('/').pop();
      return <MobileNoticeDetail noticeId={noticeId || ''} onBack={handleBack} />;
    }

    if (currentRoute.startsWith('conflict-detail/')) {
      const id = currentRoute.split('/').pop();
      return <MobileConflictDetail id={id || ''} onBack={handleBack} onRouteChange={navigate} />;
    }

    if (currentRoute.startsWith('activity-detail/')) {
      const [pathPart, queryPart] = currentRoute.split('?');
      const id = pathPart.split('/').pop();
      let mode = 'execution';
      if (queryPart) {
        const params = new URLSearchParams(queryPart);
        mode = params.get('mode') || 'execution';
      }
      return <MobileActivityDetail id={id || ''} mode={mode as 'execution' | 'application'} onBack={handleBack} onRouteChange={navigate} />;
    }

    if (currentRoute.startsWith('activity-form')) {
      // Check for edit param
      let editId = undefined;
      if (currentRoute.includes('?edit=')) {
        editId = currentRoute.split('?edit=')[1];
      }
      return <MobileActivityForm onBack={handleBack} editId={editId} />;
    }

    // Handle Task List with params
    if (currentRoute.startsWith('tasks')) {
      const mode = currentRoute.includes('mode=month') ? 'month' : 
                   currentRoute.includes('mode=all') ? 'all' : 'today';
      return <MobileTasks onRouteChange={navigate} initialViewMode={mode} onExitMobile={handleExitMobile} />;
    }

    switch (currentRoute) {
      case 'home':
        return <MobileHome onRouteChange={navigate} onExitMobile={handleExitMobile} />;
      case 'housing':
        return <MobileHousing onRouteChange={navigate} onExitMobile={handleExitMobile} />;
      case 'people':
        return <MobilePeople onRouteChange={navigate} onExitMobile={handleExitMobile} />;
      // case 'tasks': handled above
      case 'patrol':
        return <MobilePatrol onRouteChange={navigate} onExitMobile={handleExitMobile} />;
      case 'profile':
        return <MobileProfile 
          onRouteChange={navigate}
          onLogout={() => setPendingExitAction('logout')}
          onExitMobile={handleExitMobile}
        />;
      case 'collect-house':
        return <HouseCollect onBack={handleBack} />;
      case 'collect-person':
        return <PersonCollect onBack={handleBack} />;
      case 'quick-note':
        return <QuickNote onBack={handleBack} onRouteChange={navigate} />;
      case 'scan':
        return (
          <MobileScan
            onBack={handleBack}
            onResult={(result, type) => {
              if (type === 'person') {
                navigate(`person-detail/${result}`);
                return;
              }
              if (type === 'house') {
                navigate(`house-detail/${result}`);
                return;
              }
              if (type === 'ocr') {
                navigate(result || 'collect-person');
              }
            }}
          />
        );
      case 'notices':
        return <MobileNotices onBack={handleBack} onNoticeClick={(id) => navigate(`notice-detail/${id}`)} />;
      case 'search':
        return <MobileSearch onBack={handleBack} onRouteChange={navigate} />;
      case 'quick-note-history':
        return <QuickNoteHistory onBack={handleBack} />;
      case 'stats':
        return <MobileStats onBack={handleBack} />;
      case 'update-history':
        return <MobileUpdateHistory onBack={handleBack} />;
      case 'grid-overview':
        return <MobileGridOverview onBack={handleBack} />;
      case 'conflict':
        return <MobileConflictList onRouteChange={navigate} onExitMobile={handleExitMobile} />;
      case 'conflict-form':
        return <MobileConflictForm onBack={handleBack} onRouteChange={navigate} />;
      case 'activity':
        return <MobileActivity onRouteChange={navigate} onExitMobile={handleExitMobile} />;
      case 'policy-interpretation':
        return <MobilePolicyInterpretation onBack={handleBack} />;
      case 'official-writing':
        return <MobileOfficialWriting onBack={handleBack} />;
      case 'smart-query':
        return <MobileSmartQuery onBack={handleBack} />;
      default:
        return <MobileHome onRouteChange={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-neutral-00)] md:py-8 font-sans">
      <MobileSandboxProvider>
        <DialogPortalContainerProvider container={portalContainer}>
          <div
            id="mobile-viewport"
            ref={setPortalContainer}
            className="w-full h-[100dvh] md:w-[375px] md:h-[812px] md:shadow-2xl md:rounded-[2.5rem] md:border-[10px] md:border-[var(--color-neutral-03)] bg-[var(--color-neutral-00)] overflow-hidden relative shadow-black/20 ring-1 ring-white/5 transform-gpu"
          >
            {/* 顶部刘海模拟 (仅在桌面模式显示) */}
            <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[24px] bg-[var(--color-neutral-03)] rounded-b-[1rem] z-[60]"></div>
            <div className="flex h-full min-h-0 flex-col">
              <MobileSandboxNotice />
              <div className="min-h-0 flex-1">{renderPage()}</div>
            </div>
          </div>

          {/* 退出确认弹窗（替代原生 confirm） */}
          <ConfirmDialog
            open={pendingExitAction !== null}
            onOpenChange={(open) => !open && setPendingExitAction(null)}
            title={pendingExitAction === 'logout' ? '退出登录' : '退出移动端模式'}
            description={pendingExitAction === 'logout' ? '确定要退出登录并返回电脑端吗？' : '确定要退出移动端模式吗？'}
            confirmText="退出"
            destructive
            onConfirm={executePendingExit}
          />
        </DialogPortalContainerProvider>
      </MobileSandboxProvider>
    </div>
  );
}
