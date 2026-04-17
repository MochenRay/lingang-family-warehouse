import { useState } from 'react';
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
import { toast } from 'sonner';

interface MobileAppProps {
  onExitMobile?: () => void;
}

export function MobileApp({ onExitMobile }: MobileAppProps) {
  const buildInitialHistory = () => {
    const path = window.location.pathname;
    if (path.includes('/mobile/tasks')) return ['home', 'tasks?mode=today'];
    if (path.includes('/mobile/visit-form/')) {
      const personId = path.split('/mobile/visit-form/')[1];
      if (personId) {
        return ['home', 'people', `person-detail/${personId}`, `visit-form/${personId}`];
      }
    }
    if (path.includes('/mobile/conflict/new')) return ['home', 'conflict', 'conflict-form'];
    if (path.includes('/mobile/conflict/')) {
      const id = path.split('/mobile/conflict/')[1];
      if (id) {
        return ['home', 'conflict', `conflict-detail/${id}`];
      }
    }
    if (path.includes('/mobile/conflict')) return ['home', 'conflict'];
    if (path.includes('/mobile/grid')) return ['home', 'grid-overview'];
    if (path.includes('/mobile/housing')) return ['home', 'housing'];
    if (path.includes('/mobile/people')) return ['home', 'people'];
    if (path.includes('/mobile/profile')) return ['home', 'profile'];
    return ['home'];
  };

  const [history, setHistory] = useState<string[]>(() => {
    return buildInitialHistory();
  });
  
  // 获取当前路由（栈顶）
  const currentRoute = history[history.length - 1];

  // 处理路由导航
  const handleRouteChange = (route: string) => {
    // 如果是导航到首页，清空历史栈
    if (route === 'home') {
      setHistory(['home']);
      return;
    }
    
    // 避免重复推入相同的路由到栈顶
    if (route === currentRoute) return;

    // 简单的栈推入
    setHistory(prev => [...prev, route]);
  };

  // 处理返回上一页
  const handleBack = () => {
    setHistory(prev => {
      if (prev.length <= 1) return prev; // 已经在首页或栈底，不处理
      return prev.slice(0, -1);
    });
  };

  // 退出移动端模式
  const handleExitMobile = () => {
    if (confirm('确定要退出移动端模式吗？')) {
      if (onExitMobile) {
        onExitMobile();
      } else {
        setHistory(['home']);
        toast.info('已返回移动端工作台首页');
      }
    }
  };

  // 根据当前路由渲染对应页面
  const renderPage = () => {
    // Check for dynamic routes first
    if (currentRoute.startsWith('/mobile/tasks/')) {
      const taskId = currentRoute.split('/').pop();
      return <MobileTaskDetail taskId={taskId || ''} onBack={handleBack} onRouteChange={handleRouteChange} />;
    }
    
    if (currentRoute.startsWith('person-detail/')) {
      const id = currentRoute.split('/').pop();
      return <MobilePersonDetail id={id || ''} onBack={handleBack} onRouteChange={handleRouteChange} />;
    }

    if (currentRoute.startsWith('house-detail/')) {
      const id = currentRoute.split('/').pop();
      return <MobileHouseDetail id={id || ''} onBack={handleBack} onRouteChange={handleRouteChange} />;
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
      return <MobileConflictDetail id={id || ''} onBack={handleBack} onRouteChange={handleRouteChange} />;
    }

    if (currentRoute.startsWith('activity-detail/')) {
      const [pathPart, queryPart] = currentRoute.split('?');
      const id = pathPart.split('/').pop();
      let mode = 'execution';
      if (queryPart) {
        const params = new URLSearchParams(queryPart);
        mode = params.get('mode') || 'execution';
      }
      return <MobileActivityDetail id={id || ''} mode={mode as 'execution' | 'application'} onBack={handleBack} onRouteChange={handleRouteChange} />;
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
      return <MobileTasks onRouteChange={handleRouteChange} initialViewMode={mode} onExitMobile={handleExitMobile} />;
    }

    switch (currentRoute) {
      case 'home':
        return <MobileHome onRouteChange={handleRouteChange} onExitMobile={handleExitMobile} />;
      case 'housing':
        return <MobileHousing onRouteChange={handleRouteChange} onExitMobile={handleExitMobile} />;
      case 'people':
        return <MobilePeople onRouteChange={handleRouteChange} onExitMobile={handleExitMobile} />;
      // case 'tasks': handled above
      case 'patrol':
        return <MobilePatrol onRouteChange={handleRouteChange} onExitMobile={handleExitMobile} />;
      case 'profile':
        return <MobileProfile 
          onRouteChange={handleRouteChange} 
          onLogout={() => {
            if (confirm('确定要退出登录并返回电脑端吗？')) {
              if (onExitMobile) {
                onExitMobile();
              } else {
                setHistory(['home']);
                toast.info('已返回移动端工作台首页');
              }
            }
          }} 
          onExitMobile={handleExitMobile}
        />;
      case 'collect-house':
        return <HouseCollect onBack={handleBack} />;
      case 'collect-person':
        return <PersonCollect onBack={handleBack} />;
      case 'quick-note':
        return <QuickNote onBack={handleBack} onRouteChange={handleRouteChange} />;
      case 'scan':
        return (
          <MobileScan
            onBack={handleBack}
            onResult={(result, type) => {
              if (type === 'person') {
                handleRouteChange(`person-detail/${result}`);
                return;
              }
              if (type === 'house') {
                handleRouteChange(`house-detail/${result}`);
                return;
              }
              if (type === 'ocr') {
                handleRouteChange(result || 'collect-person');
              }
            }}
          />
        );
      case 'notices':
        return <MobileNotices onBack={handleBack} onNoticeClick={(id) => handleRouteChange(`notice-detail/${id}`)} />;
      case 'search':
        return <MobileSearch onBack={handleBack} onRouteChange={handleRouteChange} />;
      case 'quick-note-history':
        return <QuickNoteHistory onBack={handleBack} />;
      case 'stats':
        return <MobileStats onBack={handleBack} />;
      case 'update-history':
        return <MobileUpdateHistory onBack={handleBack} />;
      case 'grid-overview':
        return <MobileGridOverview onBack={handleBack} />;
      case 'conflict':
        return <MobileConflictList onRouteChange={handleRouteChange} onExitMobile={handleExitMobile} />;
      case 'conflict-form':
        return <MobileConflictForm onBack={handleBack} onRouteChange={handleRouteChange} />;
      case 'activity':
        return <MobileActivity onRouteChange={handleRouteChange} onExitMobile={handleExitMobile} />;
      case 'policy-interpretation':
        return <MobilePolicyInterpretation onBack={handleBack} />;
      case 'official-writing':
        return <MobileOfficialWriting onBack={handleBack} />;
      case 'smart-query':
        return <MobileSmartQuery onBack={handleBack} />;
      default:
        return <MobileHome onRouteChange={handleRouteChange} />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 md:py-8 font-sans">
      <div id="mobile-viewport" className="w-full h-[100dvh] md:w-[375px] md:h-[812px] md:shadow-2xl md:rounded-[2.5rem] md:border-[10px] md:border-gray-900 bg-white overflow-hidden relative shadow-black/20 ring-1 ring-gray-900/5 transform-gpu">
        {/* 顶部刘海模拟 (仅在桌面模式显示) */}
        <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[24px] bg-gray-900 rounded-b-[1rem] z-[60]"></div>
        
        {renderPage()}
      </div>
    </div>
  );
}
