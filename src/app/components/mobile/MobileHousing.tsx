import { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Home,
  ChevronRight,
  Plus,
  Building2,
  MapPin,
  Loader2,
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
} from '../ui/drawer';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MobileLayout } from './MobileLayout';
import { houseRepository } from '../../services/repositories/houseRepository';
import { mobileContextRepository } from '../../services/repositories/mobileContextRepository';
import type { House, HouseType } from '../../types/core';

interface MobileHousingProps {
  onRouteChange: (route: string) => void;
  onExitMobile?: () => void;
}

export function MobileHousing({ onRouteChange, onExitMobile }: MobileHousingProps) {
  const currentGrid = mobileContextRepository.getCurrentGridSelection();
  const [searchQuery, setSearchQuery] = useState('');
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedTypes, setSelectedTypes] = useState<HouseType[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const loadHouses = async () => {
      setLoading(true);
      try {
        const items = await houseRepository.getHouses({
          q: searchQuery.trim() || undefined,
          gridId: currentGrid.id,
          limit: 500,
        });
        if (!active) {
          return;
        }
        setHouses(items);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadHouses();

    const handleDbChange = () => {
      void loadHouses();
    };

    window.addEventListener('db-change', handleDbChange);
    return () => {
      active = false;
      window.removeEventListener('db-change', handleDbChange);
    };
  }, [currentGrid.id, searchQuery]);

  const availableBuildings = Array.from(new Set(houses.map((house) => house.building))).sort();
  const availableUnits =
    selectedBuilding === 'all'
      ? Array.from(new Set(houses.map((house) => house.unit))).sort()
      : Array.from(
          new Set(
            houses
              .filter((house) => house.building === selectedBuilding)
              .map((house) => house.unit),
          ),
        ).sort();

  const filteredHouses = houses
    .filter((house) => selectedBuilding === 'all' || house.building === selectedBuilding)
    .filter((house) => selectedUnit === 'all' || house.unit === selectedUnit)
    .filter((house) => selectedTypes.length === 0 || selectedTypes.includes(house.type));

  const toggleType = (type: HouseType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type],
    );
  };

  const handleReset = () => {
    setSelectedBuilding('all');
    setSelectedUnit('all');
    setSelectedTypes([]);
  };

  const stats = {
    total: houses.length,
    selfOccupied: houses.filter((house) => house.type === '自住').length,
    rental: houses.filter((house) => house.type === '出租').length,
    vacant: houses.filter((house) => house.type === '空置').length,
  };

  return (
    <MobileLayout currentRoute="housing" onRouteChange={onRouteChange} onExitMobile={onExitMobile}>
      <div className="h-full bg-[var(--color-neutral-00)] flex flex-col">
        <div className="bg-[var(--color-neutral-01)] sticky top-0 z-10 border-b border-[var(--color-neutral-03)]">
          <div className="px-4 flex items-center gap-3 py-2 mt-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-08)]" />
              <Input
                className="pl-9 bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)] h-9 text-sm text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-07)] focus-visible:ring-1 focus-visible:ring-[#2761CB]"
                placeholder="搜索房主/房号/标签..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <Button
              size="icon"
              className="h-9 w-9 bg-[#2761CB] hover:bg-[#4E86DF] rounded-full shadow-sm"
              onClick={() => onRouteChange('collect-house')}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          <div className="px-4 pb-2 text-xs text-[var(--color-neutral-08)] flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            当前范围：{currentGrid.name || '全部网格'}
          </div>

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

        <div className="px-4 py-2 bg-[var(--color-neutral-01)] border-b border-[var(--color-neutral-03)] flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <Building2 className="w-3.5 h-3.5 text-[var(--color-neutral-08)]" />
            <Select
              value={selectedBuilding}
              onValueChange={(value) => {
                setSelectedBuilding(value);
                setSelectedUnit('all');
              }}
            >
              <SelectTrigger className="h-7 text-xs border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] min-w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部楼栋</SelectItem>
                {availableBuildings.map((building) => (
                  <SelectItem key={building} value={building}>{building}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-[var(--color-neutral-08)]" />
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="h-7 text-xs border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] min-w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部单元</SelectItem>
                {availableUnits.map((unit) => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1" />

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
                <DrawerDescription>基于当前网格房屋台账继续缩小结果范围。</DrawerDescription>
              </DrawerHeader>
              <div className="p-4 space-y-4">
                <div>
                  <Label className="mb-2 block text-sm">楼栋</Label>
                  <Select
                    value={selectedBuilding}
                    onValueChange={(value) => {
                      setSelectedBuilding(value);
                      setSelectedUnit('all');
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="全部楼栋" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部楼栋</SelectItem>
                      {availableBuildings.map((building) => (
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
                      {availableUnits.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block text-sm">房屋类型</Label>
                  <div className="flex gap-2 flex-wrap">
                    {(['自住', '出租', '空置', '经营', '其他'] as HouseType[]).map((type) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className={`py-1.5 px-3 font-normal cursor-pointer transition-colors ${
                          selectedTypes.includes(type)
                            ? 'bg-[#2761CB] text-white border-[#2761CB]'
                            : 'hover:bg-[var(--color-neutral-02)]'
                        }`}
                        onClick={() => toggleType(type)}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DrawerFooter>
                <Button onClick={() => setDrawerOpen(false)} className="bg-[#2761CB] hover:bg-[#4E86DF]">确认筛选</Button>
                <DrawerClose asChild>
                  <Button variant="outline" onClick={handleReset}>重置</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        <div className="px-4 py-2 bg-[var(--color-neutral-00)] flex items-center justify-between">
          <div className="text-xs text-[var(--color-neutral-08)]">
            {loading ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                正在加载房屋台账
              </span>
            ) : selectedBuilding !== 'all' || selectedUnit !== 'all' || selectedTypes.length > 0 ? (
              <>
                筛选结果：<span className="text-[#2761CB] font-medium">{filteredHouses.length}</span> 条
              </>
            ) : (
              <>共 {filteredHouses.length} 条房屋</>
            )}
          </div>
          {(selectedBuilding !== 'all' || selectedUnit !== 'all' || selectedTypes.length > 0) ? (
            <Button variant="ghost" size="sm" className="h-6 text-xs text-[var(--color-neutral-08)] hover:text-[#2761CB]" onClick={handleReset}>
              清除筛选
            </Button>
          ) : null}
        </div>

        <div className="flex-1 px-4 pb-4 space-y-3 overflow-y-auto">
          {filteredHouses.map((house) => (
            <Card
              key={house.id}
              className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)] shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
              onClick={() => onRouteChange(`house-detail/${house.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded bg-[rgba(78,134,223,0.15)] border border-[rgba(78,134,223,0.3)] flex items-center justify-center text-[#4E86DF] shrink-0">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[var(--color-neutral-11)] text-sm">
                        {house.building} {house.unit} {house.room}
                      </div>
                      <div className="text-xs text-[var(--color-neutral-08)] mt-0.5">
                        {house.communityName}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-[var(--color-neutral-03)] my-2">
                  <div className="text-center">
                    <div className="text-xs text-[var(--color-neutral-07)] mb-0.5">户主</div>
                    <div className="text-sm font-medium text-[var(--color-neutral-10)]">{house.ownerName}</div>
                  </div>
                  <div className="text-center border-l border-[var(--color-neutral-03)]">
                    <div className="text-xs text-[var(--color-neutral-07)] mb-0.5">面积</div>
                    <div className="text-sm font-medium text-[var(--color-neutral-10)]">{house.area}</div>
                  </div>
                  <div className="text-center border-l border-[var(--color-neutral-03)]">
                    <div className="text-xs text-[var(--color-neutral-07)] mb-0.5">居住人数</div>
                    <div className="text-sm font-medium text-[var(--color-neutral-10)]">{house.memberCount}人</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="text-xs bg-[rgba(78,134,223,0.15)] text-[#4E86DF] border-[rgba(78,134,223,0.3)]"
                    >
                      {house.type}
                    </Badge>
                    {house.tags.slice(0, 2).map((tag) => (
                      <Badge
                        key={`${house.id}-${tag}`}
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

          {!loading && filteredHouses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--color-neutral-07)]">
              <Home className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">暂无房屋信息</p>
              {selectedBuilding !== 'all' || selectedUnit !== 'all' || selectedTypes.length > 0 ? (
                <Button variant="ghost" size="sm" className="mt-3 text-[#2761CB]" onClick={handleReset}>
                  清除筛选条件
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </MobileLayout>
  );
}
