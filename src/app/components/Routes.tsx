import { lazy, Suspense } from 'react';

const PopulationManagement = lazy(() => import('./pages/PopulationManagement').then((module) => ({ default: module.PopulationManagement })));
const HousingManagement = lazy(() => import('./pages/HousingManagement').then((module) => ({ default: module.HousingManagement })));
const RelationshipManagement = lazy(() => import('./pages/RelationshipManagement').then((module) => ({ default: module.RelationshipManagement })));
const BatchImport = lazy(() => import('./pages/BatchImport').then((module) => ({ default: module.BatchImport })));
const TagOverview = lazy(() => import('./pages/TagOverview').then((module) => ({ default: module.TagOverview })));
const StatisticsOverview = lazy(() => import('./pages/StatisticsOverview').then((module) => ({ default: module.StatisticsOverview })));
const DemographicsAnalysis = lazy(() => import('./pages/DemographicsAnalysis').then((module) => ({ default: module.DemographicsAnalysis })));
const PopulationTags = lazy(() => import('./pages/PopulationTags').then((module) => ({ default: module.PopulationTags })));
const MigrationTrends = lazy(() => import('./pages/MigrationTrends').then((module) => ({ default: module.MigrationTrends })));
const DataReports = lazy(() => import('./pages/DataReports').then((module) => ({ default: module.DataReports })));
const DataComparison = lazy(() => import('./pages/DataComparison').then((module) => ({ default: module.DataComparison })));
const HousingStatistics = lazy(() => import('./pages/HousingStatistics').then((module) => ({ default: module.HousingStatistics })));
const AnomalyAnalysis = lazy(() => import('./pages/AnomalyAnalysis').then((module) => ({ default: module.AnomalyAnalysis })));
const TimeSeriesAnalysis = lazy(() => import('./pages/TimeSeriesAnalysis').then((module) => ({ default: module.TimeSeriesAnalysis })));
const FactorIdentification = lazy(() => import('./pages/FactorIdentification').then((module) => ({ default: module.FactorIdentification })));
const ContributionRanking = lazy(() => import('./pages/ContributionRanking').then((module) => ({ default: module.ContributionRanking })));
const WarningMap = lazy(() => import('./pages/WarningMap').then((module) => ({ default: module.WarningMap })));
const UserManagement = lazy(() => import('./pages/UserManagement').then((module) => ({ default: module.UserManagement })));
const RoleManagement = lazy(() => import('./pages/RoleManagement').then((module) => ({ default: module.RoleManagement })));
const PermissionManagement = lazy(() => import('./pages/PermissionManagement').then((module) => ({ default: module.PermissionManagement })));
const LogManagement = lazy(() => import('./pages/LogManagement').then((module) => ({ default: module.LogManagement })));
const KnowledgeAccumulation = lazy(() => import('./pages/KnowledgeAccumulation').then((module) => ({ default: module.KnowledgeAccumulation })));
const PolicyInterpretation = lazy(() => import('./pages/SmartAgentPages').then((module) => ({ default: module.PolicyInterpretation })));
const OfficialDocumentWriting = lazy(() => import('./pages/SmartAgentPages').then((module) => ({ default: module.OfficialDocumentWriting })));
const SmartQuery = lazy(() => import('./pages/SmartAgentPages').then((module) => ({ default: module.SmartQuery })));
const BehaviorSupervision = lazy(() => import('./pages/BehaviorSupervision').then((module) => ({ default: module.BehaviorSupervision })));
const ConflictManagement = lazy(() => import('./pages/ConflictManagement').then((module) => ({ default: module.ConflictManagement })));
const RuleConfig = lazy(() => import('./pages/RuleConfig').then((module) => ({ default: module.RuleConfig })));
const PublishNotice = lazy(() => import('./pages/PublishNotice').then((module) => ({ default: module.PublishNotice })));
const NoticeManagement = lazy(() => import('./pages/NoticeManagement').then((module) => ({ default: module.NoticeManagement })));
const ActivityManagement = lazy(() => import('./pages/ActivityManagement').then((module) => ({ default: module.ActivityManagement })));
const MobileApp = lazy(() => import('./mobile/MobileApp').then((module) => ({ default: module.MobileApp })));

interface RoutesProps {
  currentRoute: string;
  onRouteChange?: (route: string) => void;
}

export function Routes({ currentRoute, onRouteChange }: RoutesProps) {
  let content;

  // 渲染对应的页面
  switch (currentRoute) {
    // 统计分析
    case 'statistics-overview':
      content = <StatisticsOverview onRouteChange={onRouteChange} />;
      break;
    case 'demographics-analysis':
      content = <DemographicsAnalysis />;
      break;
    case 'population-tags':
      content = <PopulationTags />;
      break;
    case 'migration-trends':
      content = <MigrationTrends />;
      break;
    case 'data-reports':
      content = <DataReports />;
      break;
    case 'data-comparison':
      content = <DataComparison />;
      break;
    case 'housing-statistics':
      content = <HousingStatistics />;
      break;
    case 'heatmap':
      content = <WarningMap />;
      break;
    // 数据管理
    case 'population':
      content = <PopulationManagement />;
      break;
    case 'housing':
      content = <HousingManagement />;
      break;
    case 'relationship':
      content = <RelationshipManagement />;
      break;
    case 'batch-import':
      content = <BatchImport />;
      break;
    
    // 标签管理
    case 'tag-overview':
      content = <TagOverview />;
      break;
    case 'anomaly-analysis':
      content = <AnomalyAnalysis />;
      break;
    case 'time-series':
      content = <TimeSeriesAnalysis />;
      break;
    case 'factor-identification':
      content = <FactorIdentification />;
      break;
    case 'contribution-ranking':
      content = <ContributionRanking />;
      break;
    
    // 数仓智能体
    case 'knowledge-accumulation':
      content = <KnowledgeAccumulation onRouteChange={onRouteChange} />;
      break;
    case 'policy-interpretation':
      content = <PolicyInterpretation />;
      break;
    case 'document-writing':
      content = <OfficialDocumentWriting />;
      break;
    case 'smart-query':
      content = <SmartQuery />;
      break;
    
    // 行为督导
    case 'behavior-supervision':
      content = <BehaviorSupervision />;
      break;
    case 'conflict-management':
      content = <ConflictManagement onRouteChange={onRouteChange} />;
      break;

    // 规则引擎
    case 'rule-config':
      content = <RuleConfig />;
      break;

    // 用户管理
    case 'user-management':
      content = <UserManagement />;
      break;
    case 'role-management':
      content = <RoleManagement />;
      break;
    case 'permission-management':
      content = <PermissionManagement />;
      break;
    case 'log-management':
      content = <LogManagement />;
      break;
    
    // 发布通知
    case 'publish-notice':
      content = <PublishNotice />;
      break;
    case 'notice-management':
      content = <NoticeManagement />;
      break;
    
    // 活动管理
    case 'activity-management':
      content = <ActivityManagement />;
      break;
    
    // 移动端
    case 'mobile':
      content = <MobileApp onExitMobile={() => onRouteChange?.('statistics-overview')} />;
      break;
    
    default:
      content = <StatisticsOverview />;
  }

  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--color-neutral-08)]">加载中...</div>}>
      {content}
    </Suspense>
  );
}
