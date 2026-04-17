// 路由页面组件
import { PopulationManagement } from './pages/PopulationManagement';
import { HousingManagement } from './pages/HousingManagement';
import { RelationshipManagement } from './pages/RelationshipManagement';
import { BatchImport } from './pages/BatchImport';
import { TagOverview } from './pages/TagOverview';
import { StatisticsOverview } from './pages/StatisticsOverview';
import { DemographicsAnalysis } from './pages/DemographicsAnalysis';
import { PopulationTags } from './pages/PopulationTags';
import { MigrationTrends } from './pages/MigrationTrends';
import { DataReports } from './pages/DataReports';
import { DataComparison } from './pages/DataComparison';
import { HousingStatistics } from './pages/HousingStatistics';
import { AnomalyAnalysis } from './pages/AnomalyAnalysis';
import { TimeSeriesAnalysis } from './pages/TimeSeriesAnalysis';
import { FactorIdentification } from './pages/FactorIdentification';
import { ContributionRanking } from './pages/ContributionRanking';
import { WarningMap } from './pages/WarningMap';
import { UserManagement } from './pages/UserManagement';
import { RoleManagement } from './pages/RoleManagement';
import { PermissionManagement } from './pages/PermissionManagement';
import { LogManagement } from './pages/LogManagement';
import { KnowledgeAccumulation } from './pages/KnowledgeAccumulation';
import { PolicyInterpretation, OfficialDocumentWriting, SmartQuery } from './pages/SmartAgentPages';
import { BehaviorSupervision } from './pages/BehaviorSupervision';
import { ConflictManagement } from './pages/ConflictManagement';
import { RuleConfig } from './pages/RuleConfig';
import { PublishNotice } from './pages/PublishNotice';
import { NoticeManagement } from './pages/NoticeManagement';
import { ActivityManagement } from './pages/ActivityManagement';
import { MobileApp } from './mobile/MobileApp';

interface RoutesProps {
  currentRoute: string;
  onRouteChange?: (route: string) => void;
}

export function Routes({ currentRoute, onRouteChange }: RoutesProps) {
  // 渲染对应的页面
  switch (currentRoute) {
    // 统计分析
    case 'statistics-overview':
      return <StatisticsOverview onRouteChange={onRouteChange} />;
    case 'demographics-analysis':
      return <DemographicsAnalysis />;
    case 'population-tags':
      return <PopulationTags />;
    case 'migration-trends':
      return <MigrationTrends />;
    case 'data-reports':
      return <DataReports />;
    case 'data-comparison':
      return <DataComparison />;
    case 'housing-statistics':
      return <HousingStatistics />;
    case 'heatmap':
      return <WarningMap />;
    // 数据管理
    case 'population':
      return <PopulationManagement />;
    case 'housing':
      return <HousingManagement />;
    case 'relationship':
      return <RelationshipManagement />;
    case 'batch-import':
      return <BatchImport />;
    
    // 标签管理
    case 'tag-overview':
      return <TagOverview />;
    case 'anomaly-analysis':
      return <AnomalyAnalysis />;
    case 'time-series':
      return <TimeSeriesAnalysis />;
    case 'factor-identification':
      return <FactorIdentification />;
    case 'contribution-ranking':
      return <ContributionRanking />;
    
    // 数仓智能体
    case 'knowledge-accumulation':
      return <KnowledgeAccumulation onRouteChange={onRouteChange} />;
    case 'policy-interpretation':
      return <PolicyInterpretation />;
    case 'document-writing':
      return <OfficialDocumentWriting />;
    case 'smart-query':
      return <SmartQuery />;
    
    // 行为督导
    case 'behavior-supervision':
      return <BehaviorSupervision />;
    case 'conflict-management':
      return <ConflictManagement onRouteChange={onRouteChange} />;

    // 规则引擎
    case 'rule-config':
      return <RuleConfig />;

    // 用户管理
    case 'user-management':
      return <UserManagement />;
    case 'role-management':
      return <RoleManagement />;
    case 'permission-management':
      return <PermissionManagement />;
    case 'log-management':
      return <LogManagement />;
    
    // 发布通知
    case 'publish-notice':
      return <PublishNotice />;
    case 'notice-management':
      return <NoticeManagement />;
    
    // 活动管理
    case 'activity-management':
      return <ActivityManagement />;
    
    // 移动端
    case 'mobile':
      return <MobileApp onExitMobile={() => onRouteChange?.('statistics-overview')} />;
    
    default:
      return <StatisticsOverview />;
  }
}
