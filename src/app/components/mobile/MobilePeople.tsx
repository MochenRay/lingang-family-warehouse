import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  User, 
  Plus,
  Users as UsersIcon,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "../ui/drawer";
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MobileLayout } from './MobileLayout';
import { Person, PersonType, RiskLevel, Grid } from '../../types/core';
import { getRiskLevelLabel } from '../../utils/riskLevel';
import { tagStore } from '../../utils/tagStore';
import { personRepository } from '../../services/repositories/personRepository';

interface MobilePeopleProps {
  onRouteChange: (route: string) => void;
  onExitMobile?: () => void;
}

export function MobilePeople({ onRouteChange, onExitMobile }: MobilePeopleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [grids, setGrids] = useState<Grid[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'error' | 'success'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  
  // 筛选状态
  const [selectedGrid, setSelectedGrid] = useState<string>('all');
  const [selectedTypes, setSelectedTypes] = useState<PersonType[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<RiskLevel[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadPeople = async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) {
      setLoadState('loading');
      setLoadError(null);
    }
    try {
      const [nextPeople, nextGrids] = await Promise.all([
        personRepository.getPeople(),
        personRepository.getGrids(),
      ]);

      if (!mountedRef.current) {
        return;
      }

      setPeople(nextPeople);
      setGrids(nextGrids);
      setLoadError(null);
      setLoadState('success');
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }
      if (silent) {
        // 后台刷新失败不打断当前列表，仅记录；首屏/手动重试的失败才进入错误态。
        console.warn('Silent people reload failed', error);
        return;
      }
      setLoadError(error instanceof Error ? error.message : String(error));
      setLoadState('error');
    }
  };

  const handleRetry = () => {
    void loadPeople();
  };

  useEffect(() => {
    let active = true;
    mountedRef.current = true;

    const load = async () => {
      if (!active) {
        return;
      }
      await loadPeople();
    };

    void load();

    // Listen for changes
    const handleDbChange = () => {
      if (!active) {
        return;
      }
      void loadPeople({ silent: true });
    };

    window.addEventListener('db-change', handleDbChange);
    return () => {
      active = false;
      mountedRef.current = false;
      window.removeEventListener('db-change', handleDbChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPeople = people
    // 搜索过滤
    .filter(p => 
      p.name.includes(searchQuery) || 
      p.address.includes(searchQuery) ||
      p.idCard.includes(searchQuery) ||
      (p.phone && p.phone.includes(searchQuery)) ||
      p.tags.some(t => t.includes(searchQuery))
    )
    // 网格筛选
    .filter(p => selectedGrid === 'all' || p.gridId === selectedGrid)
    // 人员类型筛选
    .filter(p => selectedTypes.length === 0 || selectedTypes.includes(p.type))
    // 风险等级筛选
    .filter(p => selectedRisks.length === 0 || selectedRisks.includes(p.risk));
  
  const toggleType = (type: PersonType) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleRisk = (risk: RiskLevel) => {
    setSelectedRisks(prev => 
      prev.includes(risk) ? prev.filter(r => r !== risk) : [...prev, risk]
    );
  };

  const handleReset = () => {
    setSelectedGrid('all');
    setSelectedTypes([]);
    setSelectedRisks([]);
  };

  const handleConfirm = () => {
    setDrawerOpen(false);
  };

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'High': return 'bg-[var(--color-status-error)]';
      case 'Medium': return 'bg-[var(--color-status-warning)]';
      case 'Low': return 'bg-[var(--color-status-success)]';
      default: return 'bg-[var(--color-neutral-05)]';
    }
  };

  const getTagColor = (tagLabel: string) => {
    const tag = tagStore.getTags().find(t => t.name === tagLabel);
    const category = tag?.category || 'other';
    
    if (category === '重点关注') {
      return 'bg-[rgba(213,33,50,0.15)] text-[var(--color-status-error-text)] border-[rgba(213,33,50,0.3)]';
    }
    if (category === '健康状况' || category === '社会保障') {
      return 'bg-[rgba(25,177,114,0.15)] text-[var(--color-status-success-text)] border-[rgba(25,177,114,0.3)]';
    }
    if (category === '政治面貌' || category === '年龄段' || category === '性别' || category === '居住类型') {
      return 'bg-[rgba(78,134,223,0.15)] text-[var(--color-brand-text)] border-[rgba(78,134,223,0.3)]';
    }
    return 'bg-[var(--color-neutral-02)] text-[var(--color-neutral-09)] border-[var(--color-neutral-04)]';
  };

  // 统计信息
  const stats = {
    total: people.length,
    registered: people.filter(p => p.type === '户籍').length,
    floating: people.filter(p => p.type === '流动').length,
    highRisk: people.filter(p => p.risk === 'High').length,
  };

  // loading/error 期间统计卡只显示统一占位符，success 后才展示真实数字，避免假 0 误导
  const statsReady = loadState === 'success';
  const statCards: { testid: string; value: number; readyClass: string; label: string }[] = [
    { testid: 'people-stat-total', value: stats.total, readyClass: 'text-[var(--color-brand-primary)]', label: '总人数' },
    { testid: 'people-stat-registered', value: stats.registered, readyClass: 'text-[var(--color-status-success-text)]', label: '户籍' },
    { testid: 'people-stat-floating', value: stats.floating, readyClass: 'text-[var(--color-status-warning-text)]', label: '流动' },
    { testid: 'people-stat-highrisk', value: stats.highRisk, readyClass: 'text-[var(--color-status-error-text)]', label: '重点' },
  ];

  return (
    <MobileLayout currentRoute="people" onRouteChange={onRouteChange} onExitMobile={onExitMobile}>
      <div className="h-full bg-[var(--color-neutral-00)] flex flex-col">
        {/* Search Header */}
        <div className="bg-[var(--color-neutral-01)] sticky top-0 z-10 border-b border-[var(--color-neutral-03)]">
          <div className="px-4 flex items-center gap-3 py-2 mt-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-08)]" />
              <Input 
                className="pl-9 bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)] h-11 text-sm text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-07)] focus-visible:ring-1 focus-visible:ring-[var(--color-brand-primary)]"
                placeholder="搜索姓名/身份证/地址..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
             {/* Add Button */}
             <Button 
              size="icon" 
              aria-label="采集人员"
              className="h-11 w-11 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] rounded-full shadow-sm"
              onClick={() => onRouteChange('collect-person')}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* 统计卡片 */}
          <div className="px-4 py-3 grid grid-cols-4 gap-2">
            {statCards.map((card) => (
              <div
                key={card.testid}
                data-testid={card.testid}
                className="text-center p-2 rounded-lg bg-[var(--color-neutral-02)] border border-[var(--color-neutral-03)]"
              >
                <div
                  data-testid="people-stat-value"
                  className={`text-lg font-bold tabular-nums ${statsReady ? card.readyClass : 'text-[var(--color-neutral-06)]'}`}
                >
                  {statsReady ? card.value : '—'}
                </div>
                <div className="text-xs text-[var(--color-neutral-08)] mt-0.5">{card.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 快速筛选栏 */}
        <div className="px-4 py-2 bg-[var(--color-neutral-01)] border-b border-[var(--color-neutral-03)] flex items-center gap-2 overflow-x-auto">
          {/* 网格选择 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <UsersIcon className="w-3.5 h-3.5 text-[var(--color-neutral-08)]" />
            <Select value={selectedGrid} onValueChange={setSelectedGrid}>
              <SelectTrigger className="min-h-[44px] text-xs border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] min-w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部网格</SelectItem>
                {grids.map(grid => (
                  <SelectItem key={grid.id} value={grid.id}>{grid.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1"></div>

          {/* 更多筛选 */}
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="sm" className="min-h-[44px] text-xs text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-02)] shrink-0">
                <Filter className="w-3.5 h-3.5 mr-1" />
                更多
              </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-[var(--color-neutral-01)]">
              <DrawerHeader>
                <DrawerTitle>人员筛选</DrawerTitle>
                <DrawerDescription>根据网格、类型或风险等级筛选。</DrawerDescription>
              </DrawerHeader>
              <div className="p-4 space-y-4">
                <div>
                  <Label className="mb-2 block text-sm">所属网格</Label>
                  <Select value={selectedGrid} onValueChange={setSelectedGrid}>
                    <SelectTrigger><SelectValue placeholder="全部网格" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部网格</SelectItem>
                      {grids.map(grid => (
                        <SelectItem key={grid.id} value={grid.id}>{grid.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block text-sm">人员类型</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                        selectedTypes.includes('户籍') 
                          ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]'
                          : 'hover:bg-[var(--color-neutral-02)]'
                      }`}
                      onClick={() => toggleType('户籍')}
                    >户籍</Badge>
                    <Badge 
                      variant="outline" 
                      className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                        selectedTypes.includes('流动') 
                          ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]'
                          : 'hover:bg-[var(--color-neutral-02)]'
                      }`}
                      onClick={() => toggleType('流动')}
                    >流动</Badge>
                    <Badge 
                      variant="outline" 
                      className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                        selectedTypes.includes('留守') 
                          ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]'
                          : 'hover:bg-[var(--color-neutral-02)]'
                      }`}
                      onClick={() => toggleType('留守')}
                    >留守</Badge>
                    <Badge 
                      variant="outline" 
                      className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                        selectedTypes.includes('境外') 
                          ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]'
                          : 'hover:bg-[var(--color-neutral-02)]'
                      }`}
                      onClick={() => toggleType('境外')}
                    >境外</Badge>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block text-sm">风险等级</Label>
                  <div className="flex gap-2">
                    <Badge 
                      variant="outline" 
                      className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                        selectedRisks.includes('High') 
                          ? 'bg-[var(--color-status-error)] text-white border-[var(--color-status-error)]' 
                          : 'bg-[rgba(213,33,50,0.15)] text-[var(--color-status-error-text)] border-[rgba(213,33,50,0.3)] hover:bg-[rgba(213,33,50,0.25)]'
                      }`}
                      onClick={() => toggleRisk('High')}
                    >{getRiskLevelLabel('High')}</Badge>
                    <Badge 
                      variant="outline" 
                      className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                        selectedRisks.includes('Medium') 
                          ? 'bg-[var(--color-status-warning)] text-white border-[var(--color-status-warning)]' 
                          : 'bg-[rgba(214,115,13,0.15)] text-[var(--color-status-warning-text)] border-[rgba(214,115,13,0.3)] hover:bg-[rgba(214,115,13,0.25)]'
                      }`}
                      onClick={() => toggleRisk('Medium')}
                    >{getRiskLevelLabel('Medium')}</Badge>
                    <Badge 
                      variant="outline" 
                      className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                        selectedRisks.includes('Low') 
                          ? 'bg-[var(--color-status-success)] text-white border-[var(--color-status-success)]' 
                          : 'bg-[rgba(25,177,114,0.15)] text-[var(--color-status-success-text)] border-[rgba(25,177,114,0.3)] hover:bg-[rgba(25,177,114,0.25)]'
                      }`}
                      onClick={() => toggleRisk('Low')}
                    >{getRiskLevelLabel('Low')}</Badge>
                  </div>
                </div>
              </div>
              <DrawerFooter>
                <Button onClick={handleConfirm} className="bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)]">确认筛选</Button>
                <DrawerClose asChild>
                  <Button variant="outline" onClick={handleReset}>重置</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        {/* 结果计数：非 success 时只保留中性区域标签， loading/error 主文案统一由中央状态区呈现 */}
        <div className="px-4 py-2 bg-[var(--color-neutral-00)] flex items-center justify-between">
          <div className="text-xs text-[var(--color-neutral-08)]">
            {loadState !== 'success' && <>人员列表</>}
            {loadState === 'success' && (
              selectedGrid !== 'all' || selectedTypes.length > 0 || selectedRisks.length > 0 ? (
                <>
                  筛选结果：<span className="text-[var(--color-brand-primary)] font-medium">{filteredPeople.length}</span> 条
                </>
              ) : (
                <>共 {filteredPeople.length} 条人员</>
              )
            )}
          </div>
          {(selectedGrid !== 'all' || selectedTypes.length > 0 || selectedRisks.length > 0) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs text-[var(--color-neutral-08)] hover:text-[var(--color-brand-primary)]"
              onClick={handleReset}
            >
              清除筛选
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 px-4 pb-4 space-y-3 overflow-y-auto">
          {loadState === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--color-neutral-08)]" data-testid="people-loading">
              <Loader2 className="w-6 h-6 mb-3 animate-spin" />
              <p className="text-sm">正在加载人员信息…</p>
            </div>
          )}

          {loadState === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--color-neutral-08)]" data-testid="people-error">
              <AlertCircle className="w-10 h-10 mb-3 text-[var(--color-status-error)] opacity-70" />
              <p className="text-sm font-medium text-[var(--color-neutral-10)]">人员信息加载失败</p>
              {loadError && (
                <p className="text-xs mt-1 px-6 text-center text-[var(--color-neutral-07)] line-clamp-2">{loadError}</p>
              )}
              <Button
                size="sm"
                className="mt-4 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] text-white"
                onClick={handleRetry}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                重试
              </Button>
            </div>
          )}

          {loadState === 'success' && filteredPeople.map(p => (
            <Card 
              key={p.id} 
              className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)] shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
              onClick={() => onRouteChange(`person-detail/${p.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getRiskColor(p.risk)}`} />
                    <span className="font-bold text-[var(--color-neutral-11)] text-base">{p.name}</span>
                    <Badge 
                      variant="outline" 
                      className="text-xs font-normal h-5 bg-[rgba(78,134,223,0.15)] text-[var(--color-brand-text)] border-[rgba(78,134,223,0.3)]"
                    >
                      {p.type}
                    </Badge>
                  </div>
                  {p.risk === 'High' && (
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-[rgba(213,33,50,0.15)] text-[var(--color-status-error-text)] border-[rgba(213,33,50,0.3)]"
                    >
                      重点关注
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1.5 text-sm text-[var(--color-neutral-09)] mb-3">
                   <div className="flex items-center gap-2">
                     <User className="w-3.5 h-3.5" />
                     {p.gender} | {p.age}岁 | {p.idCard}
                   </div>
                   <div className="flex items-center gap-2">
                     <MapPin className="w-3.5 h-3.5" />
                     {p.address}
                   </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {p.tags.slice(0, 3).map((tag, i) => (
                    <Badge 
                      key={i} 
                      variant="outline" 
                      className={`${getTagColor(tag)} text-[10px] px-1.5`}
                    >
                      {tag}
                    </Badge>
                  ))}
                  {p.tags.length > 3 && (
                    <Badge 
                      variant="outline" 
                      className="text-[10px] px-1.5 bg-[var(--color-neutral-01)] text-[var(--color-neutral-08)] border-[var(--color-neutral-04)]"
                    >
                      +{p.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {loadState === 'success' && filteredPeople.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--color-neutral-07)]">
              <User className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">暂无人员信息</p>
              {(selectedGrid !== 'all' || selectedTypes.length > 0 || selectedRisks.length > 0) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-3 text-[var(--color-brand-primary)]"
                  onClick={handleReset}
                >
                  清除筛选条件
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
