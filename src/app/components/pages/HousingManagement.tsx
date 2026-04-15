import { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Home, 
  ChevronRight,
  ChevronDown,
  MapPin,
  Layers,
  Grid3x3,
  Plus,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Building,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  Package,
  Users,
  History,
  Calendar
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { houseRepository } from '../../services/repositories/houseRepository';
import { Grid, House, Person, HousingHistory } from '../../types/core';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

// 行政区划数据
const REGIONS: Record<string, Record<string, string[]>> = {
  '环翠区': {
    '竹岛街道': ['海源一品', '翠竹社区', '青竹社区', '四方社区'],
    '环翠楼街道': ['东北村社区', '东南村社区', '西北村社区'],
    '鲸园街道': ['古陌社区', '北门外社区', '花园社区'],
  },
  '文登区': {
    '龙山路街道': ['龙山社区', '五龙社区'],
    '天福路街道': ['天福社区', '文山社区']
  },
  '临港区': {
    '草庙子镇': ['草庙子村', '林泉社区'],
    '蔄山镇': ['蔄山村', '汶口社区']
  }
};

// 类型色彩配置
const TYPE_COLORS = {
  '自住': { bg: 'bg-blue-500', text: 'text-blue-500', lightBg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800', hex: '#2761CB' },
  '出租': { bg: 'bg-orange-500', text: 'text-orange-500', lightBg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800', hex: '#D6730D' },
  '空置': { bg: 'bg-gray-500', text: 'text-gray-500', lightBg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-800', hex: '#6B7280' },
  '经营': { bg: 'bg-purple-500', text: 'text-purple-500', lightBg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800', hex: '#9333EA' }
};

type ViewLevel = 'city' | 'district' | 'street' | 'community' | 'grid';

interface HierarchyNode {
  level: ViewLevel;
  name: string;
}

interface HouseStats {
  total: number;
  selfOccupied: number;
  rental: number;
  vacant: number;
  commercial: number;
  buildings: number;
  avgArea: number;
  avgMembers: number;
  completionRate: number;
}

export function HousingManagement() {
  const [mounted, setMounted] = useState(false);
  // 层级导航状态
  const [hierarchy, setHierarchy] = useState<HierarchyNode[]>([
    { level: 'city', name: '威海市' }
  ]);

  // 数据状态
  const [houses, setHouses] = useState<House[]>([]);
  const [grids, setGrids] = useState<Grid[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [selectedHouseResidents, setSelectedHouseResidents] = useState<Person[]>([]);
  const [selectedHouseHistory, setSelectedHouseHistory] = useState<HousingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 对话框状态
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [isCreateStreetDialogOpen, setIsCreateStreetDialogOpen] = useState(false);
  const [isCreateCommunityDialogOpen, setIsCreateCommunityDialogOpen] = useState(false);
  const [isCreateGridDialogOpen, setIsCreateGridDialogOpen] = useState(false);
  const [isCreateHouseDialogOpen, setIsCreateHouseDialogOpen] = useState(false);

  // 楼栋树形结构展开/折叠状态
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  // 表单状态
  const [streetForm, setStreetForm] = useState({ name: '' });
  const [communityForm, setCommunityForm] = useState({ name: '' });
  const [gridForm, setGridForm] = useState({ name: '', managerName: '' });
  const [houseForm, setHouseForm] = useState({
    building: '',
    unit: '',
    room: '',
    ownerName: '',
    area: '',
    type: '自住' as '自住' | '出租' | '空置' | '经营',
    memberCount: 0
  });
  
  // 加载数据
  useEffect(() => {
    setMounted(true);
    void loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allHouses, nextGrids] = await Promise.all([
        houseRepository.getHouses(),
        houseRepository.getGrids(),
      ]);
      setHouses(allHouses);
      setGrids(nextGrids);
    } catch (error) {
      console.error('Failed to load housing data', error);
      toast.error('房屋数据加载失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取当前层级
  const currentLevel = hierarchy[hierarchy.length - 1];

  // 获取当前选中的区域名称
  const getSelectedRegion = (level: ViewLevel): string | null => {
    const node = hierarchy.find(h => h.level === level);
    return node ? node.name : null;
  };

  // 筛选当前层级的房屋
  const getCurrentHouses = (): House[] => {
    let filtered = houses;

    const district = getSelectedRegion('district');
    const street = getSelectedRegion('street');
    const community = getSelectedRegion('community');
    const grid = getSelectedRegion('grid');

    if (grid) {
      filtered = filtered.filter(h => h.gridId === grid);
    } else if (community) {
      filtered = filtered.filter(h => h.communityName === community);
    } else if (street && district) {
      const communities = REGIONS[district]?.[street] || [];
      filtered = filtered.filter(h => communities.includes(h.communityName));
    } else if (district) {
      const allCommunities: string[] = [];
      Object.values(REGIONS[district] || {}).forEach(communities => {
        allCommunities.push(...communities);
      });
      filtered = filtered.filter(h => allCommunities.includes(h.communityName));
    }

    if (searchKeyword) {
      filtered = filtered.filter(h =>
        h.address.includes(searchKeyword) ||
        h.ownerName?.includes(searchKeyword) ||
        h.building?.includes(searchKeyword)
      );
    }

    return filtered;
  };

  // 计算统计数据
  const calculateStats = (houseList: House[]): HouseStats => {
    const total = houseList.length;
    const selfOccupied = houseList.filter(h => h.type === '自住').length;
    const rental = houseList.filter(h => h.type === '出租').length;
    const vacant = houseList.filter(h => h.type === '空置').length;
    const commercial = houseList.filter(h => h.type === '经营').length;
    
    const buildings = new Set(houseList.map(h => `${h.communityName}-${h.building}`)).size;
    
    const totalArea = houseList.reduce((sum, h) => {
      const area = parseFloat(h.area?.replace('㎡', '') || '0');
      return sum + area;
    }, 0);
    const avgArea = total > 0 ? Math.round(totalArea / total) : 0;
    
    const totalMembers = houseList.reduce((sum, h) => sum + (h.memberCount || 0), 0);
    const avgMembers = total > 0 ? (totalMembers / total).toFixed(1) : '0';
    
    const completeCount = houseList.filter(h => h.ownerName && h.area && h.type).length;
    const completionRate = total > 0 ? Math.round((completeCount / total) * 100) : 0;

    return {
      total,
      selfOccupied,
      rental,
      vacant,
      commercial,
      buildings,
      avgArea,
      avgMembers: parseFloat(avgMembers),
      completionRate
    };
  };

  // 导航到下一级
  const navigateToLevel = (level: ViewLevel, name: string) => {
    setHierarchy([...hierarchy, { level, name }]);
  };

  // 返回上一级
  const navigateBack = () => {
    if (hierarchy.length > 1) {
      setHierarchy(hierarchy.slice(0, -1));
    }
  };

  // 查看详情
  const handleViewDetail = async (house: House) => {
    setSelectedHouse(house);
    try {
      const [residents, history] = await Promise.all([
        houseRepository.getHouseResidents(house.id),
        houseRepository.getHousingHistory(house.id),
      ]);
      setSelectedHouseResidents(residents);
      setSelectedHouseHistory(history);
      setIsDetailDialogOpen(true);
    } catch (error) {
      console.error('Failed to load house detail', error);
      toast.error('房屋详情加载失败，请稍后重试');
    }
  };

  // 删除房屋
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此房屋吗？仅允许删除没有住户和历史记录的空房屋。')) {
      return;
    }
    setIsSaving(true);
    try {
      await houseRepository.deleteHouse(id);
      toast.success('房屋删除成功');
      await loadData();
    } catch (error) {
      console.error('Failed to delete house', error);
      toast.error(error instanceof Error ? error.message : '房屋删除失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 直接查看房屋列表
  const handleViewList = () => {
    setIsListDialogOpen(true);
  };

  const handleStructureCreate = (entityName: '街道' | '社区' | '网格') => {
    toast.info(`当前版本暂不直接维护${entityName}层级，请先聚焦房屋与人房关系数据。`);
  };

  const handleEditPlaceholder = () => {
    toast.info('房屋编辑将在后续迁居流程中接入，当前版本先提供真实查看与新增。');
  };

  const getRelationToOwner = (person: Person) => {
    if (!selectedHouse) {
      return '-';
    }
    if (person.name === selectedHouse.ownerName) {
      return '户主';
    }

    const ownerResident = selectedHouseResidents.find(
      (resident) => resident.name === selectedHouse.ownerName,
    );
    const directRelation =
      person.familyRelations?.find((relation) => relation.relatedPersonId === ownerResident?.id)?.relationType ??
      ownerResident?.familyRelations?.find((relation) => relation.relatedPersonId === person.id)?.relationType;

    if (directRelation) {
      return directRelation;
    }

    if (selectedHouse.type === '出租') {
      return '租客';
    }

    return '同住';
  };

  // 渲染Hero区（统计概览）
  const renderHeroSection = () => {
    const currentHouses = getCurrentHouses();
    const stats = calculateStats(currentHouses);

    // 准备饼图数据
    const pieData = [
      { name: '自住', value: stats.selfOccupied, color: TYPE_COLORS['自住'].hex },
      { name: '出租', value: stats.rental, color: TYPE_COLORS['出租'].hex },
      { name: '空置', value: stats.vacant, color: TYPE_COLORS['空置'].hex },
      { name: '经营', value: stats.commercial, color: TYPE_COLORS['经营'].hex }
    ].filter(item => item.value > 0);

    // 准备柱状图数据
    const barData = [
      { name: '自住', value: stats.selfOccupied },
      { name: '出租', value: stats.rental },
      { name: '空置', value: stats.vacant },
      { name: '经营', value: stats.commercial }
    ];

    return (
      <div className="relative bg-gradient-to-br from-[var(--color-neutral-01)] to-[var(--color-neutral-02)] rounded-lg p-8 mb-6 overflow-hidden border border-[var(--color-neutral-03)]">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-brand-primary)]/5 rounded-full -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--color-brand-primary)]/5 rounded-full -ml-32 -mb-32" />
        {/* 顶部蓝色装饰线 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--color-brand-primary)] to-transparent" />
        
        <div className="relative z-10">
          {/* 面包屑和搜索 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {hierarchy.map((node, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="w-5 h-5 text-[var(--color-neutral-08)]" />}
                  <button
                    onClick={() => {
                      if (index < hierarchy.length - 1) {
                        setHierarchy(hierarchy.slice(0, index + 1));
                      }
                    }}
                    className={`text-lg transition-colors ${
                      index === hierarchy.length - 1 
                        ? 'text-[var(--color-neutral-11)] font-semibold' 
                        : 'text-[var(--color-neutral-10)] hover:text-[var(--color-neutral-11)]'
                    }`}
                  >
                    {node.name}
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-neutral-08)] w-5 h-5" />
                <Input
                  placeholder="搜索房屋地址、业主姓名..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10 bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)] text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-08)] focus:bg-[var(--color-neutral-03)] focus:border-[var(--color-brand-primary)] transition-colors h-10"
                />
              </div>
              
              {hierarchy.length > 1 && (
                <Button 
                  variant="outline" 
                  onClick={navigateBack}
                  className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)] text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-03)] hover:border-[var(--color-brand-primary)] h-10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回上级
                </Button>
              )}
              
              {(currentLevel.level === 'district' || currentLevel.level === 'street' || 
                currentLevel.level === 'community' || currentLevel.level === 'grid') && (
                <Button 
                  onClick={() => {
                    if (currentLevel.level === 'district') setIsCreateStreetDialogOpen(true);
                    else if (currentLevel.level === 'street') setIsCreateCommunityDialogOpen(true);
                    else if (currentLevel.level === 'community') setIsCreateGridDialogOpen(true);
                    else if (currentLevel.level === 'grid') setIsCreateHouseDialogOpen(true);
                  }}
                  className="bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)] h-10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {currentLevel.level === 'district' && '新建乡镇/街道'}
                  {currentLevel.level === 'street' && '新建社区'}
                  {currentLevel.level === 'community' && '新建网格'}
                  {currentLevel.level === 'grid' && '新建房屋'}
                </Button>
              )}
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-4 gap-6">
            {/* 房屋总数 */}
            <div 
              className="bg-[var(--color-neutral-02)] backdrop-blur-sm rounded-lg p-6 border border-[var(--color-neutral-03)] cursor-pointer hover:bg-[var(--color-neutral-03)] hover:border-[var(--color-brand-primary)] transition-all group"
              onClick={handleViewList}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-[var(--color-brand-primary)]/10 rounded-lg border border-[var(--color-brand-primary)]/20">
                  <Home className="w-6 h-6 text-[var(--color-brand-primary)]" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-[var(--color-neutral-08)] group-hover:text-[var(--color-brand-primary)] transition-colors" />
              </div>
              <div className="space-y-1">
                <p className="text-[var(--color-neutral-08)] text-sm">房屋总数</p>
                <p className="text-5xl font-bold text-[var(--color-neutral-11)]">{stats.total}</p>
                <p className="text-[var(--color-neutral-08)] text-xs">楼栋数 {stats.buildings}</p>
              </div>
            </div>

            {/* 房屋类型分布 */}
            <div className="bg-[var(--color-neutral-02)] backdrop-blur-sm rounded-lg p-6 border border-[var(--color-neutral-03)]">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-[var(--color-brand-primary)]/10 rounded-lg border border-[var(--color-brand-primary)]/20">
                  <Package className="w-6 h-6 text-[var(--color-brand-primary)]" />
                </div>
              </div>
              <div className="space-y-1 mb-3">
                <p className="text-[var(--color-neutral-08)] text-sm">类型分布</p>
                <div className="flex items-center gap-3">
                  <div className="shrink-0" style={{ width: '80px', height: '80px' }}>
                    {pieData.length > 0 && mounted && (
                      <div style={{ width: '100%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={80}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={20}
                              outerRadius={35}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1 text-xs">
                    <div className="flex justify-between text-[var(--color-neutral-10)]">
                      <span>自住</span>
                      <span className="font-medium">{stats.selfOccupied}</span>
                    </div>
                    <div className="flex justify-between text-[var(--color-neutral-10)]">
                      <span>出租</span>
                      <span className="font-medium">{stats.rental}</span>
                    </div>
                    <div className="flex justify-between text-[var(--color-neutral-10)]">
                      <span>空置</span>
                      <span className="font-medium">{stats.vacant}</span>
                    </div>
                    <div className="flex justify-between text-[var(--color-neutral-10)]">
                      <span>经营</span>
                      <span className="font-medium">{stats.commercial}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 平均指标 */}
            <div className="bg-[var(--color-neutral-02)] backdrop-blur-sm rounded-lg p-6 border border-[var(--color-neutral-03)]">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-[var(--color-brand-primary)]/10 rounded-lg border border-[var(--color-brand-primary)]/20">
                  <TrendingUp className="w-6 h-6 text-[var(--color-brand-primary)]" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[var(--color-neutral-08)] text-sm">平均指标</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-neutral-10)] text-sm">面积</span>
                    <span className="text-[var(--color-neutral-11)] font-semibold text-lg">{stats.avgArea}㎡</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-neutral-10)] text-sm">入住人数</span>
                    <span className="text-[var(--color-neutral-11)] font-semibold text-lg">{stats.avgMembers}人</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 信息完整度 */}
            <div className="bg-[var(--color-neutral-02)] backdrop-blur-sm rounded-lg p-6 border border-[var(--color-neutral-03)]">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-[var(--color-brand-primary)]/10 rounded-lg border border-[var(--color-brand-primary)]/20">
                  <BarChart3 className="w-6 h-6 text-[var(--color-brand-primary)]" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[var(--color-neutral-08)] text-sm">信息完整度</p>
                <p className="text-5xl font-bold text-[var(--color-neutral-11)]">{stats.completionRate}%</p>
                <div className="w-full bg-[var(--color-neutral-03)] rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-[var(--color-brand-primary)] h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染区县卡片
  const renderDistrictCards = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(REGIONS).map(district => {
          const allCommunities: string[] = [];
          Object.values(REGIONS[district]).forEach(communities => {
            allCommunities.push(...communities);
          });
          const districtHouses = houses.filter(h => allCommunities.includes(h.communityName));
          const stats = calculateStats(districtHouses);
          const districtGrids = grids.filter(g => {
            return allCommunities.some(comm => g.name.includes(comm));
          });

          return (
            <Card
              key={district}
              className="group cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-t-4 border-t-primary relative overflow-hidden"
              onClick={() => navigateToLevel('district', district)}
            >
              {/* 右上角装饰 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
              
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xl">{district}</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </CardTitle>
                <CardDescription className="text-sm">
                  {Object.keys(REGIONS[district]).length} 个街道 · {allCommunities.length} 个社区 · {districtGrids.length} 个网格
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 relative z-10">
                {/* 核心指标 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">房屋总数</p>
                    <p className="text-3xl font-bold text-primary">{stats.total}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">楼栋数</p>
                    <p className="text-3xl font-bold text-gray-700">{stats.buildings}</p>
                  </div>
                </div>

                {/* 类型分布进度条 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="flex h-full">
                        {stats.total > 0 && (
                          <>
                            <div 
                              className="bg-blue-500" 
                              style={{ width: `${(stats.selfOccupied / stats.total) * 100}%` }}
                            />
                            <div 
                              className="bg-orange-500" 
                              style={{ width: `${(stats.rental / stats.total) * 100}%` }}
                            />
                            <div 
                              className="bg-gray-400" 
                              style={{ width: `${(stats.vacant / stats.total) * 100}%` }}
                            />
                            <div 
                              className="bg-purple-500" 
                              style={{ width: `${(stats.commercial / stats.total) * 100}%` }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-gray-600">自住 {stats.selfOccupied}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-gray-600">出租 {stats.rental}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-gray-600">空置 {stats.vacant}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-gray-600">经营 {stats.commercial}</span>
                    </div>
                  </div>
                </div>

                {/* 底部指标 */}
                <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
                  <span>平均面积 {stats.avgArea}㎡</span>
                  <span>完整度 {stats.completionRate}%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // 渲染街道卡片（样式同区县）
  const renderStreetCards = () => {
    const district = getSelectedRegion('district');
    if (!district) return null;

    const streets = Object.keys(REGIONS[district] || {});
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {streets.map(street => {
          const communities = REGIONS[district][street] || [];
          const streetHouses = houses.filter(h => communities.includes(h.communityName));
          const streetGrids = grids.filter(g => {
            return communities.some(comm => g.name.includes(comm));
          });
          const stats = calculateStats(streetHouses);

          return (
            <Card
              key={street}
              className="group cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-t-4 border-t-orange-500 relative overflow-hidden"
              onClick={() => navigateToLevel('street', street)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-colors" />
              
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                      <Layers className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-xl">{street}</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                </CardTitle>
                <CardDescription className="text-sm">
                  {communities.length} 个社区 · {streetGrids.length} 个网格
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">房屋总数</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.total}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">楼栋数</p>
                    <p className="text-3xl font-bold text-gray-700">{stats.buildings}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="flex h-full">
                      {stats.total > 0 && (
                        <>
                          <div className="bg-blue-500" style={{ width: `${(stats.selfOccupied / stats.total) * 100}%` }} />
                          <div className="bg-orange-500" style={{ width: `${(stats.rental / stats.total) * 100}%` }} />
                          <div className="bg-gray-400" style={{ width: `${(stats.vacant / stats.total) * 100}%` }} />
                          <div className="bg-purple-500" style={{ width: `${(stats.commercial / stats.total) * 100}%` }} />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-gray-600">自住 {stats.selfOccupied}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-gray-600">出租 {stats.rental}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-gray-600">空置 {stats.vacant}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-gray-600">经营 {stats.commercial}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
                  <span>平均面积 {stats.avgArea}㎡</span>
                  <span>完整度 {stats.completionRate}%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // 渲染社区卡片
  const renderCommunityCards = () => {
    const district = getSelectedRegion('district');
    const street = getSelectedRegion('street');
    if (!district || !street) return null;

    const communities = REGIONS[district]?.[street] || [];
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communities.map(community => {
          const communityHouses = houses.filter(h => h.communityName === community);
          const communityGrids = grids.filter(g => g.name.includes(community));
          const stats = calculateStats(communityHouses);

          return (
            <Card
              key={community}
              className="group cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-t-4 border-t-green-500 relative overflow-hidden"
              onClick={() => navigateToLevel('community', community)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-green-500/10 transition-colors" />
              
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                      <Building2 className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-xl">{community}</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                </CardTitle>
                <CardDescription className="text-sm">
                  {communityGrids.length} 个网格
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">房屋总数</p>
                    <p className="text-3xl font-bold text-green-600">{stats.total}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">楼栋数</p>
                    <p className="text-3xl font-bold text-gray-700">{stats.buildings}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="flex h-full">
                      {stats.total > 0 && (
                        <>
                          <div className="bg-blue-500" style={{ width: `${(stats.selfOccupied / stats.total) * 100}%` }} />
                          <div className="bg-orange-500" style={{ width: `${(stats.rental / stats.total) * 100}%` }} />
                          <div className="bg-gray-400" style={{ width: `${(stats.vacant / stats.total) * 100}%` }} />
                          <div className="bg-purple-500" style={{ width: `${(stats.commercial / stats.total) * 100}%` }} />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-gray-600">自住 {stats.selfOccupied}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-gray-600">出租 {stats.rental}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-gray-600">空置 {stats.vacant}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-gray-600">经营 {stats.commercial}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
                  <span>平均面积 {stats.avgArea}㎡</span>
                  <span>完整度 {stats.completionRate}%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // 渲染楼栋树形结构（小区层级）
  const renderBuildingTree = () => {
    const community = getSelectedRegion('community');
    if (!community) return null;

    const communityHouses = houses.filter(h => h.communityName === community);
    
    // 按楼栋分组
    const buildingMap = new Map<string, House[]>();
    communityHouses.forEach(house => {
      const building = house.building;
      if (!buildingMap.has(building)) {
        buildingMap.set(building, []);
      }
      buildingMap.get(building)!.push(house);
    });

    const toggleBuilding = (building: string) => {
      const newSet = new Set(expandedBuildings);
      if (newSet.has(building)) {
        newSet.delete(building);
      } else {
        newSet.add(building);
      }
      setExpandedBuildings(newSet);
    };

    const toggleUnit = (key: string) => {
      const newSet = new Set(expandedUnits);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      setExpandedUnits(newSet);
    };

    // 从房间号提取楼层
    const getFloor = (room: string): string => {
      // 例如: "101" -> "1层", "602" -> "6层", "1201" -> "12层", "2301" -> "23层"
      const roomNum = room.replace(/\D/g, ''); // 移除所有非数字字符
      if (roomNum.length === 0) return '未知楼层';
      
      // 3位数房间号：第1位是楼层（如 101 -> 1层, 602 -> 6层）
      if (roomNum.length === 3) {
        return `${roomNum[0]}层`;
      }
      // 4位数房间号：前2位是楼层（如 1201 -> 12层, 2305 -> 23层）
      else if (roomNum.length === 4) {
        return `${roomNum.substring(0, 2)}层`;
      }
      // 其他情况，取前半部分作为楼层
      else {
        const floorDigits = Math.ceil(roomNum.length / 2);
        return `${roomNum.substring(0, floorDigits)}层`;
      }
    };

    const TYPE_COLORS_BG: Record<string, string> = {
      '自住': 'bg-[#3370FF]/10',
      '出租': 'bg-[#FF6B2C]/10',
      '空置': 'bg-[#8C8C8C]/10',
      '经营': 'bg-[#7C3AED]/10',
      '其他': 'bg-[#64748B]/10'
    };

    const TYPE_COLORS_TEXT: Record<string, string> = {
      '自住': 'text-[#3370FF]',
      '出租': 'text-[#FF6B2C]',
      '空置': 'text-[#8C8C8C]',
      '经营': 'text-[#7C3AED]',
      '其他': 'text-[#64748B]'
    };

    const TYPE_COLORS_BORDER: Record<string, string> = {
      '自住': 'border-[#3370FF]/20',
      '出租': 'border-[#FF6B2C]/20',
      '空置': 'border-[#8C8C8C]/20',
      '经营': 'border-[#7C3AED]/20',
      '其他': 'border-[#64748B]/20'
    };

    return (
      <div className="space-y-4">
        {Array.from(buildingMap.entries())
          .sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
          .map(([building, buildingHouses]) => {
            const isExpanded = expandedBuildings.has(building);
            
            // 按单元分组
            const unitMap = new Map<string, House[]>();
            buildingHouses.forEach(house => {
              const unit = house.unit;
              if (!unitMap.has(unit)) {
                unitMap.set(unit, []);
              }
              unitMap.get(unit)!.push(house);
            });

            return (
              <Card key={building} className="bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)]">
                <CardHeader
                  className="cursor-pointer hover:bg-[var(--color-neutral-02)] transition-colors"
                  onClick={() => toggleBuilding(building)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-[var(--color-brand-primary)]" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-[var(--color-neutral-08)]" />
                      )}
                      <Building className="w-5 h-5 text-[var(--color-brand-primary)]" />
                      <CardTitle className="text-[var(--color-neutral-11)]">{building}</CardTitle>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-[var(--color-neutral-10)]">
                        {unitMap.size} 个单元
                      </span>
                      <span className="text-[var(--color-neutral-10)]">
                        {buildingHouses.length} 套房
                      </span>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-3 pt-0">
                    {Array.from(unitMap.entries())
                      .sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
                      .map(([unit, unitHouses]) => {
                        const unitKey = `${building}-${unit}`;
                        const isUnitExpanded = expandedUnits.has(unitKey);
                        
                        // 按楼层分组
                        const floorMap = new Map<string, House[]>();
                        unitHouses.forEach(house => {
                          const floor = getFloor(house.room);
                          if (!floorMap.has(floor)) {
                            floorMap.set(floor, []);
                          }
                          floorMap.get(floor)!.push(house);
                        });

                        return (
                          <div key={unitKey} className="border border-[var(--color-neutral-03)] rounded-lg overflow-hidden">
                            <div
                              className="flex items-center justify-between p-4 bg-[var(--color-neutral-02)] cursor-pointer hover:bg-[var(--color-neutral-03)] transition-colors"
                              onClick={() => toggleUnit(unitKey)}
                            >
                              <div className="flex items-center gap-3">
                                {isUnitExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-[var(--color-brand-primary)]" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-[var(--color-neutral-08)]" />
                                )}
                                <Layers className="w-4 h-4 text-[var(--color-neutral-10)]" />
                                <span className="font-medium text-[var(--color-neutral-11)]">{unit}</span>
                              </div>
                              <span className="text-sm text-[var(--color-neutral-10)]">
                                {unitHouses.length} 套房
                              </span>
                            </div>

                            {isUnitExpanded && (
                              <div className="p-4 space-y-2 bg-[var(--color-neutral-01)]">
                                {Array.from(floorMap.entries())
                                  .sort(([a], [b]) => {
                                    const numA = parseInt(a);
                                    const numB = parseInt(b);
                                    return numB - numA; // 从高到低排序
                                  })
                                  .map(([floor, floorHouses]) => {
                                    const floorKey = `${unitKey}-${floor}`;

                                    return (
                                      <div key={floorKey} className="space-y-3">
                                        <div className="flex items-center gap-2 px-2">
                                          <span className="text-sm font-medium text-[var(--color-neutral-11)]">{floor}</span>
                                          <span className="text-xs text-[var(--color-neutral-08)]">
                                            {floorHouses.length} 套房
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                          {floorHouses
                                            .sort((a, b) => a.room.localeCompare(b.room, 'zh-CN'))
                                            .map(house => (
                                              <div
                                                key={house.id}
                                                className={`p-3 rounded-lg border ${TYPE_COLORS_BG[house.type]} ${TYPE_COLORS_BORDER[house.type]} hover:border-[var(--color-brand-primary)] hover:shadow-md transition-all cursor-pointer group`}
                                                onClick={() => void handleViewDetail(house)}
                                              >
                                                <div className="flex items-center gap-2 mb-2">
                                                  <Home className={`w-4 h-4 ${TYPE_COLORS_TEXT[house.type]}`} />
                                                  <span className="font-semibold text-[var(--color-neutral-11)]">
                                                    {house.room}
                                                  </span>
                                                </div>
                                                <Badge variant="outline" className={`${TYPE_COLORS_BG[house.type]} ${TYPE_COLORS_TEXT[house.type]} ${TYPE_COLORS_BORDER[house.type]} border text-xs mb-2`}>
                                                  {house.type}
                                                </Badge>
                                                <div className="text-xs text-[var(--color-neutral-09)] space-y-1">
                                                  <div className="truncate">{house.ownerName}</div>
                                                  <div>{house.area}㎡ · {house.memberCount}人</div>
                                                </div>
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </CardContent>
                )}
              </Card>
            );
          })}
      </div>
    );
  };

  // 渲染网格卡片
  const renderGridCards = () => {
    const community = getSelectedRegion('community');
    if (!community) return null;

    const currentGrids = grids.filter(g => g.name.includes(community));

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentGrids.map(grid => {
          const gridHouses = houses.filter(h => h.gridId === grid.id);
          const stats = calculateStats(gridHouses);

          return (
            <Card
              key={grid.id}
              className="group cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-t-4 border-t-purple-500 relative overflow-hidden"
              onClick={() => navigateToLevel('grid', grid.id)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-purple-500/10 transition-colors" />
              
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                      <Grid3x3 className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-xl">{grid.name}</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </CardTitle>
                <CardDescription className="text-sm">
                  网格长: {grid.managerName}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">房屋总数</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.total}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">楼栋数</p>
                    <p className="text-3xl font-bold text-gray-700">{stats.buildings}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="flex h-full">
                      {stats.total > 0 && (
                        <>
                          <div className="bg-blue-500" style={{ width: `${(stats.selfOccupied / stats.total) * 100}%` }} />
                          <div className="bg-orange-500" style={{ width: `${(stats.rental / stats.total) * 100}%` }} />
                          <div className="bg-gray-400" style={{ width: `${(stats.vacant / stats.total) * 100}%` }} />
                          <div className="bg-purple-500" style={{ width: `${(stats.commercial / stats.total) * 100}%` }} />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-gray-600">自住 {stats.selfOccupied}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-gray-600">出租 {stats.rental}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-gray-600">空置 {stats.vacant}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-gray-600">经营 {stats.commercial}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
                  <span>平均面积 {stats.avgArea}㎡</span>
                  <span>完整度 {stats.completionRate}%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // 渲染房屋列表（网格层级）
  const renderHouseList = () => {
    const currentHouses = getCurrentHouses();

    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            房屋列表
          </CardTitle>
          <CardDescription>共 {currentHouses.length} 套房屋</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>房屋地址</TableHead>
                <TableHead>业主</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>面积</TableHead>
                <TableHead>入住人数</TableHead>
                <TableHead>标签</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentHouses.length > 0 ? (
                currentHouses.map(house => (
                  <TableRow key={house.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{house.address}</div>
                          <div className="text-sm text-gray-500">
                            {house.building} {house.unit} {house.room}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{house.ownerName || '-'}</TableCell>
                    <TableCell>
                      <Badge className={TYPE_COLORS[house.type]?.badge || 'bg-gray-100 text-gray-800'}>
                        {house.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{house.area}</TableCell>
                    <TableCell>{house.memberCount || 0} 人</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {house.tags?.slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {(house.tags?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{house.tags!.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleViewDetail(house)}
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleEditPlaceholder}
                          className="hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleDelete(house.id)}
                          className="hover:bg-red-50 hover:text-red-600"
                          disabled={isSaving}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>暂无房屋数据</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero 统计区 */}
      {renderHeroSection()}

      {/* 内容区 */}
      <div>
        {currentLevel.level === 'city' && renderDistrictCards()}
        {currentLevel.level === 'district' && renderStreetCards()}
        {currentLevel.level === 'street' && renderCommunityCards()}
        {currentLevel.level === 'community' && renderBuildingTree()}
        {currentLevel.level === 'grid' && renderHouseList()}
      </div>

      {/* 房屋详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="w-5 h-5 text-primary" />
              房屋详情
            </DialogTitle>
            <DialogDescription>
              查看房屋的详细信息、居住人员和历史记录
            </DialogDescription>
          </DialogHeader>
          {selectedHouse && (
            <div className="space-y-6 py-4 overflow-y-auto flex-1">
              {/* 基础信息 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  基础信息
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Label className="text-gray-500 text-xs">房屋地址</Label>
                    <p className="mt-1 font-medium">{selectedHouse.address}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Label className="text-gray-500 text-xs">业主姓名</Label>
                    <p className="mt-1">{selectedHouse.ownerName || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Label className="text-gray-500 text-xs">房屋类型</Label>
                    <p className="mt-1">
                      <Badge className={TYPE_COLORS[selectedHouse.type]?.badge}>
                        {selectedHouse.type}
                      </Badge>
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Label className="text-gray-500 text-xs">建筑面积</Label>
                    <p className="mt-1">{selectedHouse.area}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Label className="text-gray-500 text-xs">入住人数</Label>
                    <p className="mt-1">{selectedHouse.memberCount || 0} 人</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Label className="text-gray-500 text-xs">更新时间</Label>
                    <p className="mt-1">{selectedHouse.updatedAt}</p>
                  </div>
                </div>
                {selectedHouse.tags && selectedHouse.tags.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 mt-4">
                    <Label className="text-gray-500 text-xs">房屋标签</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedHouse.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 居住人员 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  居住人员
                  <Badge variant="secondary" className="ml-1">{selectedHouseResidents.length}人</Badge>
                </h3>
                {selectedHouseResidents.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>姓名</TableHead>
                          <TableHead>性别</TableHead>
                          <TableHead>年龄</TableHead>
                          <TableHead>人员类型</TableHead>
                          <TableHead>与户主关系</TableHead>
                          <TableHead>标签</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedHouseResidents.map((person) => (
                          <TableRow key={person.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {person.name}
                                {person.name === selectedHouse.ownerName && (
                                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                                    户主
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{person.gender}</TableCell>
                            <TableCell>{person.age}岁</TableCell>
                            <TableCell>
                              <Badge variant={person.type === '户籍' ? 'default' : 'secondary'}>
                                {person.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getRelationToOwner(person)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {person.tags.slice(0, 2).map((tag, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {person.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{person.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">暂无居住人员</p>
                  </div>
                )}
              </div>

              {/* 居住历史 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-600" />
                  居住历史
                  <Badge variant="secondary" className="ml-1">{selectedHouseHistory.length}条记录</Badge>
                </h3>
                {selectedHouseHistory.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="relative pl-6 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                      {selectedHouseHistory.map((item, i) => (
                        <div key={item.id} className="relative">
                          <div className={`absolute -left-[1.4rem] w-4 h-4 rounded-full border-2 border-white ring-2 ${
                            item.type === '业主' ? 'bg-orange-500 ring-orange-200' : 
                            item.type === '租客' ? 'bg-blue-500 ring-blue-200' : 
                            item.type === '家属' ? 'bg-green-500 ring-green-200' :
                            'bg-gray-400 ring-gray-200'
                          }`} />
                          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-700">{item.period}</span>
                              <Badge variant="outline" className={`text-xs ${
                                item.type === '业主' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                item.type === '租客' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                item.type === '家属' ? 'bg-green-50 text-green-700 border-green-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }`}>
                                {item.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-900 mb-1">
                              <span className="font-medium">{item.personName}</span>
                            </p>
                            {item.moveOutReason && (
                              <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                                <span className="text-gray-400">迁出原因：</span>
                                {item.moveOutReason}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">暂无居住历史记录</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 房屋列表对话框 */}
      <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              房屋列表 - {currentLevel.name}
            </DialogTitle>
            <DialogDescription>共 {getCurrentHouses().length} 套房屋</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>房屋地址</TableHead>
                  <TableHead>业主</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>面积</TableHead>
                  <TableHead>入住人数</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getCurrentHouses().map(house => (
                  <TableRow key={house.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-gray-400" />
                        {house.address}
                      </div>
                    </TableCell>
                    <TableCell>{house.ownerName || '-'}</TableCell>
                    <TableCell>
                      <Badge className={TYPE_COLORS[house.type]?.badge}>
                        {house.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{house.area}</TableCell>
                    <TableCell>{house.memberCount || 0} 人</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void handleViewDetail(house);
                          setIsListDialogOpen(false);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* 创建对话框（省略，代码太长，保留原有逻辑） */}
      <Dialog open={isCreateStreetDialogOpen} onOpenChange={setIsCreateStreetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增街道</DialogTitle>
            <DialogDescription>
              在 {getSelectedRegion('district')} 下新增街道
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>街道名称 *</Label>
              <Input
                placeholder="请输入街道名称"
                value={streetForm.name}
                onChange={(e) => setStreetForm({ name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateStreetDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => {
              if (!streetForm.name) {
                toast.error('请输入街道名称');
                return;
              }
              handleStructureCreate('街道');
              setStreetForm({ name: '' });
              setIsCreateStreetDialogOpen(false);
            }}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateCommunityDialogOpen} onOpenChange={setIsCreateCommunityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增社区</DialogTitle>
            <DialogDescription>
              在 {getSelectedRegion('street')} 下新增社区
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>社区名称 *</Label>
              <Input
                placeholder="请输入社区名称"
                value={communityForm.name}
                onChange={(e) => setCommunityForm({ name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateCommunityDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => {
              if (!communityForm.name) {
                toast.error('请输入社区名称');
                return;
              }
              handleStructureCreate('社区');
              setCommunityForm({ name: '' });
              setIsCreateCommunityDialogOpen(false);
            }}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateGridDialogOpen} onOpenChange={setIsCreateGridDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增网格</DialogTitle>
            <DialogDescription>
              在 {getSelectedRegion('community')} 下新增网格
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>网格名称 *</Label>
              <Input
                placeholder="请输入网格名称"
                value={gridForm.name}
                onChange={(e) => setGridForm({ ...gridForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>网格长姓名 *</Label>
              <Input
                placeholder="请输入网格长姓名"
                value={gridForm.managerName}
                onChange={(e) => setGridForm({ ...gridForm, managerName: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateGridDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => {
              if (!gridForm.name || !gridForm.managerName) {
                toast.error('请填写完整信息');
                return;
              }
              handleStructureCreate('网格');
              setGridForm({ name: '', managerName: '' });
              setIsCreateGridDialogOpen(false);
            }}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateHouseDialogOpen} onOpenChange={setIsCreateHouseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新增房屋</DialogTitle>
            <DialogDescription>
              在 {currentLevel.name} 下新增房屋。不存在的楼栋、单元、楼层将自动创建。
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>楼栋 *</Label>
              <Input
                placeholder="如: 1号楼"
                value={houseForm.building}
                onChange={(e) => setHouseForm({ ...houseForm, building: e.target.value })}
              />
            </div>
            <div>
              <Label>单元 *</Label>
              <Input
                placeholder="如: 1单元"
                value={houseForm.unit}
                onChange={(e) => setHouseForm({ ...houseForm, unit: e.target.value })}
              />
            </div>
            <div>
              <Label>房号 *</Label>
              <Input
                placeholder="如: 101"
                value={houseForm.room}
                onChange={(e) => setHouseForm({ ...houseForm, room: e.target.value })}
              />
            </div>
            <div>
              <Label>业主姓名</Label>
              <Input
                placeholder="请输入业主姓名"
                value={houseForm.ownerName}
                onChange={(e) => setHouseForm({ ...houseForm, ownerName: e.target.value })}
              />
            </div>
            <div>
              <Label>建筑面积 *</Label>
              <Input
                placeholder="如: 89㎡"
                value={houseForm.area}
                onChange={(e) => setHouseForm({ ...houseForm, area: e.target.value })}
              />
            </div>
            <div>
              <Label>房屋类型 *</Label>
              <Select
                value={houseForm.type}
                onValueChange={(value: any) => setHouseForm({ ...houseForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="自住">自住</SelectItem>
                  <SelectItem value="出租">出租</SelectItem>
                  <SelectItem value="空置">空置</SelectItem>
                  <SelectItem value="经营">经营</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>入住人数</Label>
              <Input
                type="number"
                placeholder="0"
                value={houseForm.memberCount}
                onChange={(e) => setHouseForm({ ...houseForm, memberCount: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateHouseDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={async () => {
              if (!houseForm.building || !houseForm.unit || !houseForm.room || !houseForm.area) {
                toast.error('请填写完整的必填信息');
                return;
              }
              const community = getSelectedRegion('community');
              const gridId = getSelectedRegion('grid');
              const occupancyStatus: House['occupancyStatus'] =
                houseForm.memberCount > 0 ? '人在户在' : '人不在户不在';
              const residenceType: House['residenceType'] =
                houseForm.type === '出租' ? '租住' : houseForm.type === '空置' ? '闲置' : '自住';
              const newHouse = {
                gridId: gridId || '',
                communityName: community || '',
                building: houseForm.building,
                unit: houseForm.unit,
                room: houseForm.room,
                address: `${community}${houseForm.building}${houseForm.unit}${houseForm.room}`,
                ownerName: houseForm.ownerName,
                type: houseForm.type,
                area: houseForm.area,
                memberCount: houseForm.memberCount,
                tags: [],
                updatedAt: new Date().toISOString().split('T')[0],
                occupancyStatus,
                residenceType,
                houseType: '普通住宅' as const,
              };
              setIsSaving(true);
              try {
                await houseRepository.addHouse(newHouse);
                toast.success('房屋添加成功');
                setHouseForm({
                  building: '',
                  unit: '',
                  room: '',
                  ownerName: '',
                  area: '',
                  type: '自住',
                  memberCount: 0
                });
                setIsCreateHouseDialogOpen(false);
                await loadData();
              } catch (error) {
                console.error('Failed to add house', error);
                toast.error('房屋添加失败，请稍后重试');
              } finally {
                setIsSaving(false);
              }
            }}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
