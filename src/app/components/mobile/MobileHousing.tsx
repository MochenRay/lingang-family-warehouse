import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Home, 
  ChevronRight,
  Plus,
  Building2,
  MapPin
} from 'lucide-react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { MobileStatusBar } from './MobileStatusBar';
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
import { db } from '../../services/db';
import { House, HouseType, Grid } from '../../types/core';
import { tagStore } from '../../utils/tagStore';

interface MobileHousingProps {
  onRouteChange: (route: string) => void;
  onExitMobile?: () => void;
}

export function MobileHousing({ onRouteChange, onExitMobile }: MobileHousingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [houses, setHouses] = useState<House[]>([]);
  const [grids, setGrids] = useState<Grid[]>([]);
  
  // 筛选状态
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedTypes, setSelectedTypes] = useState<HouseType[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 模拟：当前网格员负责海源一品1号楼和2号楼
  const responsibleCommunity = '海源一品';
  const responsibleBuildings = ['1号楼', '2号楼'];

  useEffect(() => {
    setHouses(db.getHouses());
    setGrids(db.getGrids());
    const handleDbChange = () => {
      setHouses(db.getHouses());
      setGrids(db.getGrids());
    };
    window.addEventListener('db-change', handleDbChange);
    return () => window.removeEventListener('db-change', handleDbChange);
  }, []);

  // 过滤出当前网格员负责的房屋
  const responsibleHouses = houses.filter(h => 
    h.communityName === responsibleCommunity && 
    responsibleBuildings.includes(h.building)
  );

  // 获取可用的单元列表（基于选中的楼栋）
  const availableUnits = selectedBuilding === 'all' 
    ? Array.from(new Set(responsibleHouses.map(h => h.unit))).sort()
    : Array.from(new Set(responsibleHouses.filter(h => h.building === selectedBuilding).map(h => h.unit))).sort();

  const filteredHouses = responsibleHouses
    // 搜索过滤
    .filter(h => 
      h.address.includes(searchQuery) || 
      h.ownerName.includes(searchQuery) ||
      h.room.includes(searchQuery) ||
      h.tags.some(t => t.includes(searchQuery))
    )
    // 楼栋筛选
    .filter(h => selectedBuilding === 'all' || h.building === selectedBuilding)
    // 单元筛选
    .filter(h => selectedUnit === 'all' || h.unit === selectedUnit)
    // 房屋类型筛选
    .filter(h => selectedTypes.length === 0 || selectedTypes.includes(h.type));

  const toggleType = (type: HouseType) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleReset = () => {
    setSelectedBuilding('all');
    setSelectedUnit('all');
    setSelectedTypes([]);
  };

  const handleConfirm = () => {
    setDrawerOpen(false);
  };

  // 当楼栋改变时，重置单元选择
  const handleBuildingChange = (building: string) => {
    setSelectedBuilding(building);
    setSelectedUnit('all');
  };

  const getTagColor = (tagLabel: string) => {
    const tag = tagStore.getTags().find(t => t.name === tagLabel);
    const category = tag?.category || 'other';
    // 根据 tagStore 中的 category 映射到颜色
    if (category === '政治面貌' || category === '年龄段' || category === '性别' || category === '居住类型') {
      return 'bg-blue-50 text-blue-600 border-blue-100';
    }
    if (category === '重点关注') {
      return 'bg-red-50 text-red-600 border-red-100';
    }
    if (category === '健康状况' || category === '社会保障') {
      return 'bg-green-50 text-green-600 border-green-100';
    }
    return 'bg-gray-50 text-gray-600 border-gray-100';
  };

  // 统计信息
  const stats = {
    total: responsibleHouses.length,
    selfOccupied: responsibleHouses.filter(h => h.type === '自住').length,
    rental: responsibleHouses.filter(h => h.type === '出租').length,
    vacant: responsibleHouses.filter(h => h.type === '空置').length,
  };

  return (
    <MobileLayout currentRoute="housing" onRouteChange={onRouteChange} onExitMobile={onExitMobile}>
      <div className="h-full bg-[var(--color-neutral-00)] flex flex-col">
        {/* Search Header */}
        <div className="bg-[var(--color-neutral-01)] sticky top-0 z-10 border-b border-[var(--color-neutral-03)]">
          <div className="px-4 flex items-center gap-3 py-2 mt-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-08)]" />
              <Input 
                className="pl-9 bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)] h-9 text-sm text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-07)] focus-visible:ring-1 focus-visible:ring-[#2761CB]" 
                placeholder="搜索房主/房号/标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Add Button */}
            <Button 
              size="icon" 
              className="h-9 w-9 bg-[#2761CB] hover:bg-[#4E86DF] rounded-full shadow-sm"
              onClick={() => onRouteChange('collect-house')}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* 统计卡片 */}
          <div className="px-4 py-3 grid grid-cols-4 gap-2">
            <div className="text-center p-2 rounded-lg bg-[var(--color-neutral-02)] border border-[var(--color-neutral-03)]">
              <div className="text-lg font-bold text-[#2761CB]">{stats.total}</div>
              <div className="text-xs text-[var(--color-neutral-08)] mt-0.5">总数</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-[var(--color-neutral-02)] border border-[var(--color-neutral-03)]">
              <div className="text-lg font-bold text-[var(--color-status-success)]">{stats.selfOccupied}</div>
              <div className="text-xs text-[var(--color-neutral-08)] mt-0.5">自住</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-[var(--color-neutral-02)] border border-[var(--color-neutral-03)]">
              <div className="text-lg font-bold text-[var(--color-status-warning)]">{stats.rental}</div>
              <div className="text-xs text-[var(--color-neutral-08)] mt-0.5">出租</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-[var(--color-neutral-02)] border border-[var(--color-neutral-03)]">
              <div className="text-lg font-bold text-[var(--color-neutral-07)]">{stats.vacant}</div>
              <div className="text-xs text-[var(--color-neutral-08)] mt-0.5">空置</div>
            </div>
          </div>
        </div>

        {/* 快速筛选栏 */}
        <div className="px-4 py-2 bg-[var(--color-neutral-01)] border-b border-[var(--color-neutral-03)] flex items-center gap-2 overflow-x-auto">
          {/* 楼栋选择 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Building2 className="w-3.5 h-3.5 text-[var(--color-neutral-08)]" />
            <Select value={selectedBuilding} onValueChange={handleBuildingChange}>
              <SelectTrigger className="h-7 text-xs border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] min-w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部楼栋</SelectItem>
                {responsibleBuildings.map(building => (
                  <SelectItem key={building} value={building}>{building}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 单元选择 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-[var(--color-neutral-08)]" />
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="h-7 text-xs border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] min-w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部单元</SelectItem>
                {availableUnits.map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
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
                <DrawerTitle>房屋筛选</DrawerTitle>
                <DrawerDescription>根据楼栋、单元、房屋类型等条件筛选。</DrawerDescription>
              </DrawerHeader>
              <div className="p-4 space-y-4">
                <div>
                  <Label className="mb-2 block text-sm">楼栋</Label>
                  <Select value={selectedBuilding} onValueChange={handleBuildingChange}>
                    <SelectTrigger><SelectValue placeholder="全部楼栋" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部楼栋</SelectItem>
                      {responsibleBuildings.map(building => (
                        <SelectItem key={building} value={building}>{building}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block text-sm">单元</Label>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger><SelectValue placeholder="全部单元" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部单元</SelectItem>
                      {availableUnits.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                    <Label className="mb-2 block text-sm">房屋类型</Label>
                    <div className="flex gap-2 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                          selectedTypes.includes('自住') 
                            ? 'bg-[#2761CB] text-white border-[#2761CB]' 
                            : 'hover:bg-[var(--color-neutral-02)]'
                        }`}
                        onClick={() => toggleType('自住')}
                      >自住</Badge>
                      <Badge 
                        variant="outline" 
                        className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                          selectedTypes.includes('出租') 
                            ? 'bg-[#2761CB] text-white border-[#2761CB]' 
                            : 'hover:bg-[var(--color-neutral-02)]'
                        }`}
                        onClick={() => toggleType('出租')}
                      >出租</Badge>
                      <Badge 
                        variant="outline" 
                        className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                          selectedTypes.includes('空置') 
                            ? 'bg-[#2761CB] text-white border-[#2761CB]' 
                            : 'hover:bg-[var(--color-neutral-02)]'
                        }`}
                        onClick={() => toggleType('空置')}
                      >空置</Badge>
                      <Badge 
                        variant="outline" 
                        className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                          selectedTypes.includes('经营') 
                            ? 'bg-[#2761CB] text-white border-[#2761CB]' 
                            : 'hover:bg-[var(--color-neutral-02)]'
                        }`}
                        onClick={() => toggleType('经营')}
                      >经营</Badge>
                      <Badge 
                        variant="outline" 
                        className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                          selectedTypes.includes('其他') 
                            ? 'bg-[#2761CB] text-white border-[#2761CB]' 
                            : 'hover:bg-[var(--color-neutral-02)]'
                        }`}
                        onClick={() => toggleType('其他')}
                      >其他</Badge>
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
            {selectedBuilding !== 'all' || selectedUnit !== 'all' || selectedTypes.length > 0 ? (
              <>
                筛选结果：<span className="text-[#2761CB] font-medium">{filteredHouses.length}</span> 条
              </>
            ) : (
              <>共 {filteredHouses.length} 条房屋</>
            )}
          </div>
          {(selectedBuilding !== 'all' || selectedUnit !== 'all' || selectedTypes.length > 0) && (
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
          {filteredHouses.map(h => (
            <Card 
              key={h.id} 
              className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)] shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
              onClick={() => onRouteChange(`house-detail/${h.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded bg-[rgba(78,134,223,0.15)] border border-[rgba(78,134,223,0.3)] flex items-center justify-center text-[#4E86DF] shrink-0">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[var(--color-neutral-11)] text-sm">
                        {h.building} {h.unit} {h.room}
                      </div>
                      <div className="text-xs text-[var(--color-neutral-08)] mt-0.5">
                        {h.communityName}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-[var(--color-neutral-03)] my-2">
                  <div className="text-center">
                    <div className="text-xs text-[var(--color-neutral-07)] mb-0.5">户主</div>
                    <div className="text-sm font-medium text-[var(--color-neutral-10)]">{h.ownerName}</div>
                  </div>
                  <div className="text-center border-l border-[var(--color-neutral-03)]">
                    <div className="text-xs text-[var(--color-neutral-07)] mb-0.5">面积</div>
                    <div className="text-sm font-medium text-[var(--color-neutral-10)]">{h.area}</div>
                  </div>
                  <div className="text-center border-l border-[var(--color-neutral-03)]">
                    <div className="text-xs text-[var(--color-neutral-07)] mb-0.5">居住人数</div>
                    <div className="text-sm font-medium text-[var(--color-neutral-10)]">{h.memberCount}人</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-2 flex-wrap">
                    <Badge 
                      variant="outline"
                      className="text-xs bg-[rgba(78,134,223,0.15)] text-[#4E86DF] border-[rgba(78,134,223,0.3)]"
                    >
                      {h.type}
                    </Badge>
                    {h.tags.slice(0, 2).map((tag, i) => (
                        <Badge 
                          key={i} 
                          variant="outline" 
                          className="text-xs bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] border-[var(--color-neutral-04)]"
                        >
                          {tag}
                        </Badge>
                    ))}
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-neutral-07)]" />
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredHouses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--color-neutral-07)]">
              <Home className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">暂无房屋信息</p>
              {(selectedBuilding !== 'all' || selectedUnit !== 'all' || selectedTypes.length > 0) && (
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