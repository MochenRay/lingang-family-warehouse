import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  User, 
  Home, 
  ChevronRight,
  X
} from 'lucide-react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
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
import { Slider } from '../ui/slider';
import { db } from '../../services/db';
import { Person, House } from '../../types/core';
import { tagStore } from '../../utils/tagStore';

interface MobileSearchProps {
  onBack: () => void;
  onRouteChange: (route: string) => void;
}

export function MobileSearch({ onBack, onRouteChange }: MobileSearchProps) {
  const [activeTab, setActiveTab] = useState('people');
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [houses, setHouses] = useState<House[]>([]);

  // 筛选状态
  const [selectedGrid, setSelectedGrid] = useState<string>('all');
  // 人员筛选
  const [personType, setPersonType] = useState<string>('all');
  const [riskLevel, setRiskLevel] = useState<string>('all');
  const [ageRange, setAgeRange] = useState<number[]>([0, 100]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // 房屋筛选
  const [houseStatus, setHouseStatus] = useState<string>('all');

  // 模拟：获取当前网格员所属网格
  const currentGrid = JSON.parse(localStorage.getItem('current_grid') || '{"id":"g1","name":"竹岛街道海源社区第一网格"}');

  // 获取所有网格
  const [grids, setGrids] = useState(() => db.getGrids());

  // 获取所有可用标签
  const availableTags = tagStore.getTags().map(tag => ({
    id: tag.id,
    label: tag.name,
    category: tag.category === '重点关注' ? 'risk' : 
              tag.category === '健康状况' || tag.category === '社会保障' ? 'health' :
              tag.category === '政治面貌' || tag.category === '年龄段' || tag.category === '性别' || tag.category === '居住类型' ? 'identity' :
              'other'
  }));

  useEffect(() => {
    const loadData = () => {
      setPeople(db.getPeople());
      setHouses(db.getHouses());
      setGrids(db.getGrids());
    };

    loadData();
    window.addEventListener('db-change', loadData);
    return () => window.removeEventListener('db-change', loadData);
  }, []);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
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

  // 核心逻辑：先过滤权限，再过滤搜索词，最后过滤高级筛选条件
  const filteredPeople = people
    .filter(p => selectedGrid === 'all' ? p.gridId === currentGrid.id : p.gridId === selectedGrid)
    .filter(p => 
      p.name.includes(searchQuery) || 
      p.address.includes(searchQuery) ||
      p.idCard.includes(searchQuery) ||
      p.tags.some(t => t.includes(searchQuery))
    )
    .filter(p => {
      // 类型筛选
      if (personType !== 'all' && p.type !== personType) return false;
      // 风险筛选
      if (riskLevel !== 'all' && p.risk !== riskLevel) return false;
      // 年龄筛选
      if (p.age < ageRange[0] || p.age > ageRange[1]) return false;
      // 标签筛选 (OR逻辑：只要包含任一选中标签即可)
      if (selectedTags.length > 0) {
        const hasTag = selectedTags.some(selected => p.tags.includes(selected));
        if (!hasTag) return false;
      }
      return true;
    });

  const filteredHouses = houses
    .filter(h => selectedGrid === 'all' ? h.gridId === currentGrid.id : h.gridId === selectedGrid)
    .filter(h => 
      h.address.includes(searchQuery) || 
      h.ownerName.includes(searchQuery) ||
      h.communityName.includes(searchQuery) ||
      h.tags.some(t => t.includes(searchQuery))
    )
    .filter(h => {
      if (houseStatus !== 'all' && h.type !== houseStatus) return false;
      // 标签筛选
      if (selectedTags.length > 0) {
        const hasTag = selectedTags.some(selected => h.tags.includes(selected));
        if (!hasTag) return false;
      }
      return true;
    });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getTagCategory = (tagLabel: string) => {
    const tag = availableTags.find(t => t.label === tagLabel);
    return tag?.category || 'other';
  };

  const getTagColor = (tagLabel: string) => {
    const category = getTagCategory(tagLabel);
    switch (category) {
      case 'identity': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'risk': return 'bg-red-50 text-red-600 border-red-100';
      case 'health': return 'bg-green-50 text-green-600 border-green-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Search Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100 pb-2">
        <MobileStatusBar variant="dark" />
        <div className="px-4 flex items-center gap-3 py-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              className="pl-9 bg-gray-100 border-none h-9 text-sm focus-visible:ring-0" 
              placeholder={activeTab === 'people' ? "搜索姓名/地址/标签..." : "搜索房主/地址/标签..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={onBack} className="text-gray-600 font-medium text-sm">
            取消
          </button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

      {/* Filter Bar */}
      <div className="px-4 py-2 bg-white mb-2 flex justify-between items-center shadow-sm">
        <div className="text-xs text-gray-500">
          共找到 {activeTab === 'people' ? filteredPeople.length : filteredHouses.length} 条结果
        </div>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="sm" className={`h-8 text-xs ${
              (ageRange[0] !== 0 || ageRange[1] !== 100 || selectedTags.length > 0 || personType !== 'all' || riskLevel !== 'all' || houseStatus !== 'all' || selectedGrid !== 'all') 
                ? 'text-blue-600 font-bold bg-blue-50' 
                : 'text-gray-600'
            } hover:bg-gray-50`}>
              <Filter className="w-3.5 h-3.5 mr-1" />
              筛选
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>高级筛选</DrawerTitle>
              <DrawerDescription>
                设置更多筛选条件以精确查找。
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-6 overflow-y-auto">
              {/* 网格选择 (通用) */}
              <div>
                <Label className="mb-2 block text-sm font-medium">所属网格</Label>
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

              {activeTab === 'people' && (
                <>
                  {/* 人员类型 & 风险等级 */}
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

                  {/* 年龄范围 */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-sm font-medium">年龄范围</Label>
                      <span className="text-xs text-blue-600 font-bold">{ageRange[0]}岁 - {ageRange[1]}岁</span>
                    </div>
                    <Slider 
                      value={ageRange} 
                      max={100} 
                      step={1} 
                      onValueChange={setAgeRange}
                      className="py-4"
                    />
                  </div>
                </>
              )}

              {activeTab === 'house' && (
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

              {/* 标签选择 (通用) - 按分类显示 */}
              <div>
                <Label className="mb-3 block text-sm font-medium">包含标签 (多选)</Label>
                
                {/* 身份标签 */}
                {availableTags.filter(t => t.category === 'identity').length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2 font-medium">身份标签</div>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.filter(t => t.category === 'identity').map(tag => (
                        <Badge 
                          key={tag.id} 
                          variant="outline" 
                          className={`cursor-pointer py-1.5 px-3 transition-colors ${
                            selectedTags.includes(tag.label) 
                              ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                              : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
                          }`}
                          onClick={() => handleTagToggle(tag.label)}
                        >
                          {tag.label}
                          {selectedTags.includes(tag.label) && <X className="w-3 h-3 ml-1" />}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 风险标签 */}
                {availableTags.filter(t => t.category === 'risk').length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2 font-medium">风险隐患</div>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.filter(t => t.category === 'risk').map(tag => (
                        <Badge 
                          key={tag.id} 
                          variant="outline" 
                          className={`cursor-pointer py-1.5 px-3 transition-colors ${
                            selectedTags.includes(tag.label) 
                              ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' 
                              : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                          }`}
                          onClick={() => handleTagToggle(tag.label)}
                        >
                          {tag.label}
                          {selectedTags.includes(tag.label) && <X className="w-3 h-3 ml-1" />}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 健康标签 */}
                {availableTags.filter(t => t.category === 'health').length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2 font-medium">民生服务</div>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.filter(t => t.category === 'health').map(tag => (
                        <Badge 
                          key={tag.id} 
                          variant="outline" 
                          className={`cursor-pointer py-1.5 px-3 transition-colors ${
                            selectedTags.includes(tag.label) 
                              ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' 
                              : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'
                          }`}
                          onClick={() => handleTagToggle(tag.label)}
                        >
                          {tag.label}
                          {selectedTags.includes(tag.label) && <X className="w-3 h-3 ml-1" />}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 其他标签 */}
                {availableTags.filter(t => t.category === 'other').length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2 font-medium">其他标签</div>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.filter(t => t.category === 'other').map(tag => (
                        <Badge 
                          key={tag.id} 
                          variant="outline" 
                          className={`cursor-pointer py-1.5 px-3 transition-colors ${
                            selectedTags.includes(tag.label) 
                              ? 'bg-gray-600 text-white border-gray-600 hover:bg-gray-700' 
                              : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                          }`}
                          onClick={() => handleTagToggle(tag.label)}
                        >
                          {tag.label}
                          {selectedTags.includes(tag.label) && <X className="w-3 h-3 ml-1" />}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
            <DrawerFooter>
              <Button onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}>确认筛选</Button>
              <Button variant="outline" onClick={resetFilters}>重置条件</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {activeTab === 'people' ? (
          filteredPeople.length > 0 ? (
            filteredPeople.map(p => (
              <Card 
                key={p.id} 
                className="border-none shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
                onClick={() => onRouteChange(`person-detail/${p.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getRiskColor(p.risk)}`} />
                      <span className="font-bold text-gray-900 text-lg">{p.name}</span>
                      <Badge variant="secondary" className="text-xs font-normal h-5">{p.type}</Badge>
                    </div>
                    <Badge variant={p.risk === 'High' ? 'destructive' : 'outline'} className="text-xs">
                      {p.risk === 'High' ? '重点关注' : p.risk === 'Medium' ? '中风险' : '正常'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1.5 text-sm text-gray-500 mb-3">
                     <div className="flex items-center gap-2">
                       <User className="w-3.5 h-3.5" />
                       {p.gender} | {p.age}岁 | {p.idCard.substring(0, 6)}****{p.idCard.substring(14)}
                     </div>
                     <div className="flex items-center gap-2">
                       <MapPin className="w-3.5 h-3.5" />
                       {p.address}
                     </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {p.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className={`text-[10px] px-1.5 ${getTagColor(tag)}`}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">
              未找到匹配的人员信息
            </div>
          )
        ) : (
          filteredHouses.length > 0 ? (
            filteredHouses.map(h => (
              <Card 
                key={h.id} 
                className="border-none shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
                onClick={() => onRouteChange(`house-detail/${h.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                        <Home className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-gray-900 line-clamp-1 flex-1">
                        {h.communityName} {h.building} {h.unit} {h.room}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-50 my-2">
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-0.5">户主</div>
                      <div className="text-sm font-medium text-gray-700">{h.ownerName}</div>
                    </div>
                    <div className="text-center border-l border-gray-100">
                      <div className="text-xs text-gray-400 mb-0.5">面积</div>
                      <div className="text-sm font-medium text-gray-700">{h.area}</div>
                    </div>
                    <div className="text-center border-l border-gray-100">
                      <div className="text-xs text-gray-400 mb-0.5">居住人数</div>
                      <div className="text-sm font-medium text-gray-700">{h.memberCount}人</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={h.type === '出租' ? 'secondary' : 'outline'} className="text-xs">
                        {h.type}
                      </Badge>
                      {h.tags.map((tag, i) => (
                         <Badge key={i} variant="outline" className={`text-xs ${getTagColor(tag)}`}>
                           {tag}
                         </Badge>
                      ))}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
             <div className="text-center py-10 text-gray-400 text-sm">
              未找到匹配的房屋信息
            </div>
          )
        )}
      </div>
    </div>
  );
}