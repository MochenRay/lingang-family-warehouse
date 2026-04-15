import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  User, 
  Plus,
  Users as UsersIcon
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
  
  // 筛选状态
  const [selectedGrid, setSelectedGrid] = useState<string>('all');
  const [selectedTypes, setSelectedTypes] = useState<PersonType[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<RiskLevel[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [nextPeople, nextGrids] = await Promise.all([
        personRepository.getPeople(),
        personRepository.getGrids(),
      ]);

      if (!active) {
        return;
      }

      setPeople(nextPeople);
      setGrids(nextGrids);
    };

    void load();

    // Listen for changes
    const handleDbChange = () => {
      void load();
    };
    
    window.addEventListener('db-change', handleDbChange);
    return () => {
      active = false;
      window.removeEventListener('db-change', handleDbChange);
    };
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
      return 'bg-[rgba(213,33,50,0.15)] text-[var(--color-status-error)] border-[rgba(213,33,50,0.3)]';
    }
    if (category === '健康状况' || category === '社会保障') {
      return 'bg-[rgba(25,177,114,0.15)] text-[var(--color-status-success)] border-[rgba(25,177,114,0.3)]';
    }
    if (category === '政治面貌' || category === '年龄段' || category === '性别' || category === '居住类型') {
      return 'bg-[rgba(78,134,223,0.15)] text-[#4E86DF] border-[rgba(78,134,223,0.3)]';
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

  return (
    <MobileLayout currentRoute="people" onRouteChange={onRouteChange} onExitMobile={onExitMobile}>
      <div className="h-full bg-[var(--color-neutral-00)] flex flex-col">
        {/* Search Header */}
        <div className="bg-[var(--color-neutral-01)] sticky top-0 z-10 border-b border-[var(--color-neutral-03)]">
          <div className="px-4 flex items-center gap-3 py-2 mt-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-08)]" />
              <Input 
                className="pl-9 bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)] h-9 text-sm text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-07)] focus-visible:ring-1 focus-visible:ring-[#2761CB]" 
                placeholder="搜索姓名/身份证/地址..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
             {/* Add Button */}
             <Button 
              size="icon" 
              className="h-9 w-9 bg-[#2761CB] hover:bg-[#4E86DF] rounded-full shadow-sm"
              onClick={() => onRouteChange('collect-person')}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* 统计卡片 */}
          <div className="px-4 py-3 grid grid-cols-4 gap-2">
            <div className="text-center p-2 rounded-lg bg-[var(--color-neutral-02)] border border-[var(--color-neutral-03)]">
              <div className="text-lg font-bold text-[#2761CB]">{stats.total}</div>
              <div className="text-xs text-[var(--color-neutral-08)] mt-0.5">总人数</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-[var(--color-neutral-02)] border border-[var(--color-neutral-03)]">
              <div className="text-lg font-bold text-[var(--color-status-success)]">{stats.registered}</div>
              <div className="text-xs text-[var(--color-neutral-08)] mt-0.5">户籍</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-[var(--color-neutral-02)] border border-[var(--color-neutral-03)]">
              <div className="text-lg font-bold text-[var(--color-status-warning)]">{stats.floating}</div>
              <div className="text-xs text-[var(--color-neutral-08)] mt-0.5">流动</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-[var(--color-neutral-02)] border border-[var(--color-neutral-03)]">
              <div className="text-lg font-bold text-[var(--color-status-error)]">{stats.highRisk}</div>
              <div className="text-xs text-[var(--color-neutral-08)] mt-0.5">重点</div>
            </div>
          </div>
        </div>

        {/* 快速筛选栏 */}
        <div className="px-4 py-2 bg-[var(--color-neutral-01)] border-b border-[var(--color-neutral-03)] flex items-center gap-2 overflow-x-auto">
          {/* 网格选择 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <UsersIcon className="w-3.5 h-3.5 text-[var(--color-neutral-08)]" />
            <Select value={selectedGrid} onValueChange={setSelectedGrid}>
              <SelectTrigger className="h-7 text-xs border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] min-w-[90px]">
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
              <Button variant="ghost" size="sm" className="h-7 text-xs text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-02)] shrink-0">
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
                          ? 'bg-[#2761CB] text-white border-[#2761CB]' 
                          : 'hover:bg-[var(--color-neutral-02)]'
                      }`}
                      onClick={() => toggleType('户籍')}
                    >户籍</Badge>
                    <Badge 
                      variant="outline" 
                      className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                        selectedTypes.includes('流动') 
                          ? 'bg-[#2761CB] text-white border-[#2761CB]' 
                          : 'hover:bg-[var(--color-neutral-02)]'
                      }`}
                      onClick={() => toggleType('流动')}
                    >流动</Badge>
                    <Badge 
                      variant="outline" 
                      className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                        selectedTypes.includes('留守') 
                          ? 'bg-[#2761CB] text-white border-[#2761CB]' 
                          : 'hover:bg-[var(--color-neutral-02)]'
                      }`}
                      onClick={() => toggleType('留守')}
                    >留守</Badge>
                    <Badge 
                      variant="outline" 
                      className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                        selectedTypes.includes('境外') 
                          ? 'bg-[#2761CB] text-white border-[#2761CB]' 
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
                          : 'bg-[rgba(213,33,50,0.15)] text-[var(--color-status-error)] border-[rgba(213,33,50,0.3)] hover:bg-[rgba(213,33,50,0.25)]'
                      }`}
                      onClick={() => toggleRisk('High')}
                    >高危</Badge>
                    <Badge 
                      variant="outline" 
                      className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                        selectedRisks.includes('Medium') 
                          ? 'bg-[var(--color-status-warning)] text-white border-[var(--color-status-warning)]' 
                          : 'bg-[rgba(214,115,13,0.15)] text-[var(--color-status-warning)] border-[rgba(214,115,13,0.3)] hover:bg-[rgba(214,115,13,0.25)]'
                      }`}
                      onClick={() => toggleRisk('Medium')}
                    >中危</Badge>
                    <Badge 
                      variant="outline" 
                      className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                        selectedRisks.includes('Low') 
                          ? 'bg-[var(--color-status-success)] text-white border-[var(--color-status-success)]' 
                          : 'bg-[rgba(25,177,114,0.15)] text-[var(--color-status-success)] border-[rgba(25,177,114,0.3)] hover:bg-[rgba(25,177,114,0.25)]'
                      }`}
                      onClick={() => toggleRisk('Low')}
                    >低危</Badge>
                  </div>
                </div>
              </div>
              <DrawerFooter>
                <Button onClick={handleConfirm} className="bg-[#2761CB] hover:bg-[#4E86DF]">确认筛选</Button>
                <DrawerClose asChild>
                  <Button variant="outline" onClick={handleReset}>重置</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        {/* 结果计数 */}
        <div className="px-4 py-2 bg-[var(--color-neutral-00)] flex items-center justify-between">
          <div className="text-xs text-[var(--color-neutral-08)]">
            {selectedGrid !== 'all' || selectedTypes.length > 0 || selectedRisks.length > 0 ? (
              <>
                筛选结果：<span className="text-[#2761CB] font-medium">{filteredPeople.length}</span> 条
              </>
            ) : (
              <>共 {filteredPeople.length} 条人员</>
            )}
          </div>
          {(selectedGrid !== 'all' || selectedTypes.length > 0 || selectedRisks.length > 0) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs text-[var(--color-neutral-08)] hover:text-[#2761CB]"
              onClick={handleReset}
            >
              清除筛选
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 px-4 pb-4 space-y-3 overflow-y-auto">
          {filteredPeople.map(p => (
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
                      className="text-xs font-normal h-5 bg-[rgba(78,134,223,0.15)] text-[#4E86DF] border-[rgba(78,134,223,0.3)]"
                    >
                      {p.type}
                    </Badge>
                  </div>
                  {p.risk === 'High' && (
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-[rgba(213,33,50,0.15)] text-[var(--color-status-error)] border-[rgba(213,33,50,0.3)]"
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

          {filteredPeople.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--color-neutral-07)]">
              <User className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">暂无人员信息</p>
              {(selectedGrid !== 'all' || selectedTypes.length > 0 || selectedRisks.length > 0) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-3 text-[#2761CB]"
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
