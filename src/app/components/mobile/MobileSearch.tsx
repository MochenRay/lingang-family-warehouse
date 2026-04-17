import { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  MapPin,
  User,
  Home,
  ChevronRight,
  X,
  Bell,
  Loader2,
} from 'lucide-react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { MobileStatusBar } from './MobileStatusBar';
import { Button } from '../ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from '../ui/drawer';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import type { House, Person } from '../../types/core';
import { mobileContextRepository } from '../../services/repositories/mobileContextRepository';
import { personRepository } from '../../services/repositories/personRepository';
import { searchRepository } from '../../services/repositories/searchRepository';
import { tagRepository } from '../../services/repositories/tagRepository';

interface MobileSearchProps {
  onBack: () => void;
  onRouteChange: (route: string) => void;
}

interface SearchTagOption {
  id: string;
  label: string;
  category: 'identity' | 'risk' | 'health' | 'other';
}

function getRiskColor(risk: string) {
  switch (risk) {
    case 'High':
      return 'bg-red-500';
    case 'Medium':
      return 'bg-yellow-500';
    default:
      return 'bg-green-500';
  }
}

function getTagColor(category: SearchTagOption['category']) {
  switch (category) {
    case 'identity':
      return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'risk':
      return 'bg-red-50 text-red-600 border-red-100';
    case 'health':
      return 'bg-green-50 text-green-600 border-green-100';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-100';
  }
}

export function MobileSearch({ onBack, onRouteChange }: MobileSearchProps) {
  const currentGrid = mobileContextRepository.getCurrentGridSelection();
  const [activeTab, setActiveTab] = useState<'people' | 'house'>('people');
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [grids, setGrids] = useState<Array<{ id: string; name: string }>>([]);
  const [availableTags, setAvailableTags] = useState<SearchTagOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [selectedGrid, setSelectedGrid] = useState<string>('all');
  const [personType, setPersonType] = useState<string>('all');
  const [riskLevel, setRiskLevel] = useState<string>('all');
  const [ageRange, setAgeRange] = useState<number[]>([0, 100]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [houseStatus, setHouseStatus] = useState<string>('all');

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      const [nextGrids, snapshot] = await Promise.all([
        personRepository.getGrids(),
        tagRepository.getSnapshot(),
      ]);

      if (!active) {
        return;
      }

      setGrids(nextGrids);
      setAvailableTags(
        snapshot.tags.map((tag) => ({
          id: tag.id,
          label: tag.name,
          category:
            tag.category === '重点关注'
              ? 'risk'
              : tag.category === '重点关爱'
                ? 'health'
                : tag.category === '走访治理' || tag.category === '矛盾治理'
                  ? 'other'
                  : 'identity',
        })),
      );
    };

    void loadOptions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadRecords = async () => {
      setLoading(true);
      try {
        const effectiveGridId = selectedGrid === 'all' ? currentGrid.id : selectedGrid;
        const bundle = await searchRepository.search({
          q: searchQuery,
          endpoint: 'mobile',
          gridId: effectiveGridId,
          kinds: ['person', 'house'],
          limitPerKind: 500,
        });
        if (!active) {
          return;
        }
        setPeople(bundle.people);
        setHouses(bundle.houses);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadRecords();

    const handleDbChange = () => {
      void loadRecords();
    };

    window.addEventListener('db-change', handleDbChange);
    return () => {
      active = false;
      window.removeEventListener('db-change', handleDbChange);
    };
  }, [currentGrid.id, searchQuery, selectedGrid]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  const resetFilters = () => {
    setSelectedGrid('all');
    setPersonType('all');
    setRiskLevel('all');
    setAgeRange([0, 100]);
    setSelectedTags([]);
    setHouseStatus('all');
  };

  const filteredPeople = people.filter((person) => {
    if (personType !== 'all' && person.type !== personType) {
      return false;
    }
    if (riskLevel !== 'all' && person.risk !== riskLevel) {
      return false;
    }
    if (person.age < ageRange[0] || person.age > ageRange[1]) {
      return false;
    }
    if (selectedTags.length > 0 && !selectedTags.some((tag) => person.tags.includes(tag))) {
      return false;
    }
    return true;
  });

  const filteredHouses = houses.filter((house) => {
    if (houseStatus !== 'all' && house.type !== houseStatus) {
      return false;
    }
    if (selectedTags.length > 0 && !selectedTags.some((tag) => house.tags.includes(tag))) {
      return false;
    }
    return true;
  });

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100 pb-2">
        <MobileStatusBar variant="dark" />
        <div className="px-4 flex items-center gap-3 py-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9 bg-gray-100 border-none h-9 text-sm focus-visible:ring-0"
              placeholder={activeTab === 'people' ? '搜索姓名/地址/标签...' : '搜索房主/地址/标签...'}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <button onClick={onBack} className="text-gray-600 font-medium text-sm">
            取消
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'people' | 'house')} className="w-full">
          <TabsList className="w-full flex h-12 bg-transparent p-0 border-b border-gray-100">
            <TabsTrigger
              value="people"
              className="group relative flex-1 rounded-none border-none bg-transparent px-0 data-[state=active]:shadow-none"
            >
              <span className="text-[15px] font-medium text-gray-500 transition-colors group-data-[state=active]:text-blue-600">
                人员信息
              </span>
              <div className="absolute bottom-0 left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-t-full bg-blue-600 opacity-0 transition-all duration-300 group-data-[state=active]:opacity-100" />
            </TabsTrigger>
            <TabsTrigger
              value="house"
              className="group relative flex-1 rounded-none border-none bg-transparent px-0 data-[state=active]:shadow-none"
            >
              <span className="text-[15px] font-medium text-gray-500 transition-colors group-data-[state=active]:text-blue-600">
                房屋信息
              </span>
              <div className="absolute bottom-0 left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-t-full bg-blue-600 opacity-0 transition-all duration-300 group-data-[state=active]:opacity-100" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="px-4 py-2 bg-white mb-2 flex justify-between items-center shadow-sm">
        <div className="text-xs text-gray-500">
          {loading ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              正在检索
            </span>
          ) : (
            <>共找到 {activeTab === 'people' ? filteredPeople.length : filteredHouses.length} 条结果</>
          )}
        </div>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 text-xs ${
                ageRange[0] !== 0 ||
                ageRange[1] !== 100 ||
                selectedTags.length > 0 ||
                personType !== 'all' ||
                riskLevel !== 'all' ||
                houseStatus !== 'all' ||
                selectedGrid !== 'all'
                  ? 'text-blue-600 font-bold bg-blue-50'
                  : 'text-gray-600'
              } hover:bg-gray-50`}
            >
              <Filter className="w-3.5 h-3.5 mr-1" />
              筛选
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>高级筛选</DrawerTitle>
              <DrawerDescription>当前端内统一实体检索基础上，进一步缩小结果范围。</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-6 overflow-y-auto">
              <div>
                <Label className="mb-2 block text-sm font-medium">所属网格</Label>
                <Select value={selectedGrid} onValueChange={setSelectedGrid}>
                  <SelectTrigger><SelectValue placeholder="当前网格" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">当前网格</SelectItem>
                    {grids.map((grid) => (
                      <SelectItem key={grid.id} value={grid.id}>{grid.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  当前默认检索范围：{currentGrid.name || '未设置网格'}
                </div>
              </div>

              {activeTab === 'people' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block text-sm font-medium">人员类型</Label>
                      <Select value={personType} onValueChange={setPersonType}>
                        <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部类型</SelectItem>
                          <SelectItem value="户籍">户籍人口</SelectItem>
                          <SelectItem value="流动">流动人口</SelectItem>
                          <SelectItem value="留守">留守人口</SelectItem>
                          <SelectItem value="境外">境外人口</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm font-medium">风险等级</Label>
                      <Select value={riskLevel} onValueChange={setRiskLevel}>
                        <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部等级</SelectItem>
                          <SelectItem value="High">高危 (红)</SelectItem>
                          <SelectItem value="Medium">关注 (黄)</SelectItem>
                          <SelectItem value="Low">正常 (绿)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-sm font-medium">年龄范围</Label>
                      <span className="text-xs text-blue-600 font-bold">{ageRange[0]}岁 - {ageRange[1]}岁</span>
                    </div>
                    <Slider value={ageRange} max={100} step={1} onValueChange={setAgeRange} className="py-4" />
                  </div>
                </>
              ) : (
                <div>
                  <Label className="mb-2 block text-sm font-medium">居住状态</Label>
                  <Select value={houseStatus} onValueChange={setHouseStatus}>
                    <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="自住">自住</SelectItem>
                      <SelectItem value="出租">出租</SelectItem>
                      <SelectItem value="空置">空置</SelectItem>
                      <SelectItem value="经营">经营</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="mb-3 block text-sm font-medium">包含标签 (多选)</Label>
                {(['identity', 'risk', 'health', 'other'] as const).map((category) => {
                  const tags = availableTags.filter((tag) => tag.category === category);
                  if (tags.length === 0) {
                    return null;
                  }
                  const title =
                    category === 'identity'
                      ? '身份标签'
                      : category === 'risk'
                        ? '风险隐患'
                        : category === 'health'
                          ? '民生服务'
                          : '其他标签';
                  return (
                    <div key={category} className="mb-4">
                      <div className="text-xs text-gray-500 mb-2 font-medium">{title}</div>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => {
                          const active = selectedTags.includes(tag.label);
                          const baseColor = getTagColor(tag.category);
                          return (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className={`cursor-pointer py-1.5 px-3 transition-colors ${
                                active ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : baseColor
                              }`}
                              onClick={() => handleTagToggle(tag.label)}
                            >
                              {tag.label}
                              {active ? <X className="w-3 h-3 ml-1" /> : null}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <DrawerFooter>
              <Button onClick={() => setDrawerOpen(false)}>确认筛选</Button>
              <Button variant="outline" onClick={resetFilters}>重置条件</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {activeTab === 'people' ? (
          filteredPeople.length > 0 ? (
            filteredPeople.map((person) => (
              <Card
                key={person.id}
                className="border-none shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
                onClick={() => onRouteChange(`person-detail/${person.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getRiskColor(person.risk)}`} />
                      <span className="font-bold text-gray-900 text-lg">{person.name}</span>
                      <Badge variant="secondary" className="text-xs font-normal h-5">{person.type}</Badge>
                    </div>
                    <Badge variant={person.risk === 'High' ? 'destructive' : 'outline'} className="text-xs">
                      {person.risk === 'High' ? '重点关注' : person.risk === 'Medium' ? '中风险' : '正常'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />
                      {person.gender} | {person.age}岁 | {person.idCard.substring(0, 6)}****{person.idCard.substring(14)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      {person.address}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {person.tags.map((tag) => {
                      const tagOption = availableTags.find((item) => item.label === tag);
                      return (
                        <Badge key={`${person.id}-${tag}`} variant="outline" className={`text-[10px] px-1.5 ${getTagColor(tagOption?.category ?? 'other')}`}>
                          {tag}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">未找到匹配的人员信息</div>
          )
        ) : filteredHouses.length > 0 ? (
          filteredHouses.map((house) => (
            <Card
              key={house.id}
              className="border-none shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
              onClick={() => onRouteChange(`house-detail/${house.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                      <Home className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-gray-900 line-clamp-1 flex-1">
                      {house.communityName} {house.building} {house.unit} {house.room}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-50 my-2">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-0.5">户主</div>
                    <div className="text-sm font-medium text-gray-700">{house.ownerName}</div>
                  </div>
                  <div className="text-center border-l border-gray-100">
                    <div className="text-xs text-gray-400 mb-0.5">面积</div>
                    <div className="text-sm font-medium text-gray-700">{house.area}</div>
                  </div>
                  <div className="text-center border-l border-gray-100">
                    <div className="text-xs text-gray-400 mb-0.5">居住人数</div>
                    <div className="text-sm font-medium text-gray-700">{house.memberCount}人</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={house.type === '出租' ? 'secondary' : 'outline'} className="text-xs">
                      {house.type}
                    </Badge>
                    {house.tags.map((tag) => {
                      const tagOption = availableTags.find((item) => item.label === tag);
                      return (
                        <Badge key={`${house.id}-${tag}`} variant="outline" className={`text-xs ${getTagColor(tagOption?.category ?? 'other')}`}>
                          {tag}
                        </Badge>
                      );
                    })}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-10 text-gray-400 text-sm">未找到匹配的房屋信息</div>
        )}
      </div>
    </div>
  );
}
