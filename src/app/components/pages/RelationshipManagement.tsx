import { useState } from 'react';
import { Link2, Plus, Search, Trash2, Eye, UserCheck, Home } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// 数据类型定义
interface Relationship {
  id: string;
  personId: string;
  personName: string;
  personIdCard: string;
  houseId: string;
  houseAddress: string;
  relationType: '现居' | '历史';
  relationship: '业主' | '家属' | '租客' | '其他';
  moveInDate: string;
  moveOutDate?: string;
  createTime: string;
}

// Mock数据
const mockRelationships: Relationship[] = [
  // ========== 现居关系 ==========
  // h1: 海源一品1号楼1单元101 - 张伟家庭（业主3人）
  {
    id: 'r1',
    personId: 'p1',
    personName: '张伟',
    personIdCard: '371002198901011234',
    houseId: 'h1',
    houseAddress: '海源一品1号楼1单元101',
    relationType: '现居',
    relationship: '业主',
    moveInDate: '2025-12-15',
    createTime: '2025-12-15 10:30:00'
  },
  {
    id: 'r2',
    personId: 'p3',
    personName: '刘芳',
    personIdCard: '371002199002150022',
    houseId: 'h1',
    houseAddress: '海源一品1号楼1单元101',
    relationType: '现居',
    relationship: '家属',
    moveInDate: '2025-12-15',
    createTime: '2025-12-15 10:35:00'
  },
  {
    id: 'r3',
    personId: 'p2',
    personName: '张小明',
    personIdCard: '371002201606019999',
    houseId: 'h1',
    houseAddress: '海源一品1号楼1单元101',
    relationType: '现居',
    relationship: '家属',
    moveInDate: '2025-12-15',
    createTime: '2025-12-15 10:40:00'
  },
  
  // h2: 海源一品1号楼1单元102 - 李军独居老人
  {
    id: 'r4',
    personId: 'p4',
    personName: '李军',
    personIdCard: '371002195203031111',
    houseId: 'h2',
    houseAddress: '海源一品1号楼1单元102',
    relationType: '现居',
    relationship: '业主',
    moveInDate: '2025-12-20',
    createTime: '2025-12-20 14:20:00'
  },
  
  // h3: 海源一品8号楼2单元101 - 出租房（陈强租客）
  {
    id: 'r5',
    personId: 'p5',
    personName: '陈强',
    personIdCard: '371002199608082222',
    houseId: 'h3',
    houseAddress: '海源一品8号楼2单元101',
    relationType: '现居',
    relationship: '租客',
    moveInDate: '2025-12-28',
    createTime: '2025-12-28 09:15:00'
  },
  
  // h4: 海源一品2号楼3单元602 - 赵敏家庭（业主4人）
  {
    id: 'r6',
    personId: 'p6',
    personName: '赵敏',
    personIdCard: '371002198511200028',
    houseId: 'h4',
    houseAddress: '海源一品2号楼3单元602',
    relationType: '现居',
    relationship: '业主',
    moveInDate: '2025-12-05',
    createTime: '2025-12-05 16:40:00'
  },
  {
    id: 'r7',
    personId: 'p7',
    personName: '王强',
    personIdCard: '371002198309100017',
    houseId: 'h4',
    houseAddress: '海源一品2号楼3单元602',
    relationType: '现居',
    relationship: '家属',
    moveInDate: '2025-12-05',
    createTime: '2025-12-05 16:45:00'
  },
  
  // h6: 海源一品5号楼2单元404 - 出租房（周杰租客+室友）
  {
    id: 'r8',
    personId: 'p8',
    personName: '周杰',
    personIdCard: '37100219981212001X',
    houseId: 'h6',
    houseAddress: '海源一品5号楼2单元404',
    relationType: '现居',
    relationship: '租客',
    moveInDate: '2026-01-03',
    createTime: '2026-01-03 09:00:00'
  },
  
  // h7: 海源一品6号楼1单元101 - 吴刚经营
  {
    id: 'r9',
    personId: 'p9',
    personName: '吴刚',
    personIdCard: '371002197505050011',
    houseId: 'h7',
    houseAddress: '海源一品6号楼1单元101',
    relationType: '现居',
    relationship: '业主',
    moveInDate: '2025-12-08',
    createTime: '2025-12-08 11:20:00'
  },
  
  // h8: 海源一品7号楼3单元502 - 郑强+孙奶奶
  {
    id: 'r10',
    personId: 'p10',
    personName: '孙奶奶',
    personIdCard: '371002194501010022',
    houseId: 'h8',
    houseAddress: '海源一品7号楼3单元502',
    relationType: '现居',
    relationship: '业主',
    moveInDate: '2010-05-01',
    createTime: '2010-05-01 10:00:00'
  },
  {
    id: 'r11',
    personId: 'p11',
    personName: '郑强',
    personIdCard: '371002197808080013',
    houseId: 'h8',
    houseAddress: '海源一品7号楼3单元502',
    relationType: '现居',
    relationship: '家属',
    moveInDate: '2020-03-01',
    createTime: '2020-03-01 15:30:00'
  },
  
  // 生成更多现居关系（p12-p112 的人员分配到各个房屋）
  ...Array.from({ length: 80 }, (_, i) => {
    const personIndex = i + 12;
    const personId = `p${personIndex}`;
    const houseIndex = (i % 10) + 1;
    const houseMap: Record<number, { id: string, address: string }> = {
      1: { id: 'h1', address: '海源一品1号楼1单元101' },
      2: { id: 'h2', address: '海源一品1号楼1单元102' },
      3: { id: 'h3', address: '海源一品8号楼2单元101' },
      4: { id: 'h4', address: '海源一品2号楼3单元602' },
      5: { id: 'h5', address: '海源一品3号楼1单元201' },
      6: { id: 'h6', address: '海源一品5号楼2单元404' },
      7: { id: 'h7', address: '海源一品6号楼1单元101' },
      8: { id: 'h8', address: '海源一品7号楼3单元502' },
      9: { id: 'h_parents', address: '海源一品4号楼2单元301' },
      10: { id: 'h_brother', address: '海源一品4号楼1单元502' }
    };
    
    const house = houseMap[houseIndex];
    const relationshipTypes = ['业主', '家属', '租客', '其他'];
    const relationship = relationshipTypes[i % 4];
    const year = 2023 + (i % 2);
    const month = String((i % 12) + 1).padStart(2, '0');
    const day = String((i % 28) + 1).padStart(2, '0');
    const moveInDate = `${year}-${month}-${day}`;
    
    return {
      id: `r${i + 12}`,
      personId: personId,
      personName: `居民${personIndex}`,
      personIdCard: `37100219${String(1960 + (i % 50)).slice(2)}${month}${day}${String(i).padStart(4, '0')}`,
      houseId: house.id,
      houseAddress: house.address,
      relationType: '现居' as const,
      relationship: relationship as '业主' | '家属' | '租客' | '其他',
      moveInDate: moveInDate,
      createTime: `${moveInDate} ${String(9 + (i % 12)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00`
    };
  }),
  
  // ========== 历史关系 ==========
  {
    id: 'rh1',
    personId: 'p5',
    personName: '陈强',
    personIdCard: '371002199608082222',
    houseId: 'h2',
    houseAddress: '海源一品1号楼1单元102',
    relationType: '历史',
    relationship: '租客',
    moveInDate: '2022-06-01',
    moveOutDate: '2025-12-20',
    createTime: '2022-06-01 10:00:00'
  },
  {
    id: 'rh2',
    personId: 'p8',
    personName: '周杰',
    personIdCard: '37100219981212001X',
    houseId: 'h3',
    houseAddress: '海源一品8号楼2单元101',
    relationType: '历史',
    relationship: '租客',
    moveInDate: '2021-03-15',
    moveOutDate: '2026-01-05',
    createTime: '2021-03-15 09:00:00'
  },
  {
    id: 'rh3',
    personId: 'p1',
    personName: '张伟',
    personIdCard: '371002198901011234',
    houseId: 'h_parents',
    houseAddress: '海源一品4号楼2单元301',
    relationType: '历史',
    relationship: '家属',
    moveInDate: '2015-01-01',
    moveOutDate: '2025-12-15',
    createTime: '2015-01-01 10:00:00'
  },
  
  // 生成更多历史关系（模拟搬迁历史）
  ...Array.from({ length: 40 }, (_, i) => {
    const personIndex = i + 30;
    const personId = `p${personIndex}`;
    const houseIndex = (i % 8) + 1;
    const houseMap: Record<number, { id: string, address: string }> = {
      1: { id: 'h1', address: '海源一品1号楼1单元101' },
      2: { id: 'h2', address: '海源一品1号楼1单元102' },
      3: { id: 'h3', address: '海源一品8号楼2单元101' },
      4: { id: 'h4', address: '海源一品2号楼3单元602' },
      5: { id: 'h6', address: '海源一品5号楼2单元404' },
      6: { id: 'h7', address: '海源一品6号楼1单元101' },
      7: { id: 'h8', address: '海源一品7号楼3单元502' },
      8: { id: 'h_parents', address: '海源一品4号楼2单元301' }
    };
    
    const house = houseMap[houseIndex];
    const relationshipTypes = ['租客', '家属', '其他'];
    const relationship = relationshipTypes[i % 3];
    const yearIn = 2018 + (i % 4);
    const yearOut = yearIn + 1 + (i % 3);
    const monthIn = String((i % 12) + 1).padStart(2, '0');
    const monthOut = String(((i + 6) % 12) + 1).padStart(2, '0');
    const dayIn = String((i % 28) + 1).padStart(2, '0');
    const dayOut = String(((i + 15) % 28) + 1).padStart(2, '0');
    const moveInDate = `${yearIn}-${monthIn}-${dayIn}`;
    const moveOutDate = `${yearOut}-${monthOut}-${dayOut}`;
    
    return {
      id: `rh${i + 4}`,
      personId: personId,
      personName: `历史居民${personIndex}`,
      personIdCard: `37100219${String(1965 + (i % 45)).slice(2)}${monthIn}${dayIn}${String(i + 1000).padStart(4, '0')}`,
      houseId: house.id,
      houseAddress: house.address,
      relationType: '历史' as const,
      relationship: relationship as '业主' | '家属' | '租客' | '其他',
      moveInDate: moveInDate,
      moveOutDate: moveOutDate,
      createTime: `${moveInDate} ${String(10 + (i % 10)).padStart(2, '0')}:${String((i * 3) % 60).padStart(2, '0')}:00`
    };
  })
];

// Mock人口数据 - 扩展到与SEED_PEOPLE匹配
const mockPersons = [
  { id: 'p1', name: '张伟', idCard: '371002198901011234' },
  { id: 'p2', name: '张小明', idCard: '371002201606019999' },
  { id: 'p3', name: '刘芳', idCard: '371002199002150022' },
  { id: 'p4', name: '李军', idCard: '371002195203031111' },
  { id: 'p5', name: '陈强', idCard: '371002199608082222' },
  { id: 'p6', name: '赵敏', idCard: '371002198511200028' },
  { id: 'p7', name: '王强', idCard: '371002198309100017' },
  { id: 'p8', name: '周杰', idCard: '37100219981212001X' },
  { id: 'p9', name: '吴刚', idCard: '371002197505050011' },
  { id: 'p10', name: '孙奶奶', idCard: '371002194501010022' },
  { id: 'p11', name: '郑强', idCard: '371002197808080013' },
  // 添加更多人员以匹配数据库
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `p${i + 12}`,
    name: `居民${i + 12}`,
    idCard: `37100219${String(1960 + (i % 50)).slice(2)}${String((i % 12) + 1).padStart(2, '0')}${String((i % 28) + 1).padStart(2, '0')}${String(i).padStart(4, '0')}`
  }))
];

// Mock房屋数据 - 扩展到与SEED_HOUSES匹配
const mockHouses = [
  { id: 'h1', address: '海源一品1号楼1单元101' },
  { id: 'h2', address: '海源一品1号楼1单元102' },
  { id: 'h3', address: '海源一品8号楼2单元101' },
  { id: 'h4', address: '海源一品2号楼3单元602' },
  { id: 'h5', address: '海源一品3号楼1单元201' },
  { id: 'h6', address: '海源一品5号楼2单元404' },
  { id: 'h7', address: '海源一品6号楼1单元101' },
  { id: 'h8', address: '海源一品7号楼3单元502' },
  { id: 'h_parents', address: '海源一品4号楼2单元301' },
  { id: 'h_brother', address: '海源一品4号楼1单元502' },
];

export function RelationshipManagement() {
  const [relationships, setRelationships] = useState<Relationship[]>(mockRelationships);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [relationTypeFilter, setRelationTypeFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [formData, setFormData] = useState<Partial<Relationship>>({});

  // 筛选数据
  const filteredRelationships = relationships.filter(rel => {
    const matchSearch = 
      rel.personName.includes(searchKeyword) || 
      rel.personIdCard.includes(searchKeyword) ||
      rel.houseAddress.includes(searchKeyword);
    
    const matchType = relationTypeFilter === 'all' || rel.relationType === relationTypeFilter;
    
    return matchSearch && matchType;
  });

  // 按关系类型分组
  const currentRelationships = filteredRelationships.filter(r => r.relationType === '现居');
  const historyRelationships = filteredRelationships.filter(r => r.relationType === '历史');

  // 统计数据
  const stats = {
    total: relationships.length,
    current: relationships.filter(r => r.relationType === '现居').length,
    history: relationships.filter(r => r.relationType === '历史').length,
    owner: relationships.filter(r => r.relationship === '业主' && r.relationType === '现居').length
  };

  // 关系类型徽章
  const getRelationTypeBadge = (type: string) => {
    return type === '现居' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  // 关系徽章
  const getRelationshipBadge = (rel: string) => {
    switch (rel) {
      case '业主': return 'bg-purple-100 text-purple-800';
      case '家属': return 'bg-blue-100 text-blue-800';
      case '租客': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 查看详情
  const handleView = (rel: Relationship) => {
    setSelectedRelationship(rel);
    setIsViewDialogOpen(true);
  };

  // 删除关系
  const handleDelete = (id: string) => {
    if (confirm('确定要删除此人房关系吗？')) {
      setRelationships(relationships.filter(r => r.id !== id));
    }
  };

  // 新增关系
  const handleAdd = () => {
    setFormData({
      relationType: '现居',
      relationship: '业主'
    });
    setIsAddDialogOpen(true);
  };

  // 保存新增
  const handleSave = () => {
    const selectedPerson = mockPersons.find(p => p.id === formData.personId);
    const selectedHouse = mockHouses.find(h => h.id === formData.houseId);

    if (!selectedPerson || !selectedHouse) return;

    const newRelationship: Relationship = {
      id: Date.now().toString(),
      personId: formData.personId || '',
      personName: selectedPerson.name,
      personIdCard: selectedPerson.idCard,
      houseId: formData.houseId || '',
      houseAddress: selectedHouse.address,
      relationType: formData.relationType as any || '现居',
      relationship: formData.relationship as any || '业主',
      moveInDate: formData.moveInDate || '',
      moveOutDate: formData.moveOutDate,
      createTime: new Date().toLocaleString('zh-CN')
    };

    setRelationships([newRelationship, ...relationships]);
    setIsAddDialogOpen(false);
    setFormData({});
  };

  // 迁出（将现居关系转为历史）
  const handleMoveOut = (id: string) => {
    if (confirm('确定要将此关系标记为迁出吗？')) {
      setRelationships(relationships.map(rel =>
        rel.id === id
          ? {
              ...rel,
              relationType: '历史',
              moveOutDate: new Date().toLocaleDateString('zh-CN')
            }
          : rel
      ));
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="mb-2">人房关系管理</h1>
        <p className="text-gray-500">人员与房屋的现居/历史双向绑定关系管理</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>总关系数</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>现居关系</CardDescription>
            <CardTitle className="text-3xl">{stats.current}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>历史关系</CardDescription>
            <CardTitle className="text-3xl">{stats.history}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>业主数</CardDescription>
            <CardTitle className="text-3xl">{stats.owner}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索人员姓名、身份证号或房屋地址..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={relationTypeFilter} onValueChange={setRelationTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="关系类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="现居">现居</SelectItem>
                <SelectItem value="历史">历史</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              新增关系
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 数据表格 - 使用Tabs区分现居和历史 */}
      <Card>
        <Tabs defaultValue="current" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="current">
                现居关系 ({currentRelationships.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                历史关系 ({historyRelationships.length})
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <TabsContent value="current">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>人员姓名</TableHead>
                    <TableHead>身份证号</TableHead>
                    <TableHead>房屋地址</TableHead>
                    <TableHead>关系</TableHead>
                    <TableHead>入住时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRelationships.length > 0 ? (
                    currentRelationships.map((rel) => (
                      <TableRow key={rel.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-gray-400" />
                            {rel.personName}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{rel.personIdCard}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4 text-gray-400" />
                            {rel.houseAddress}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRelationshipBadge(rel.relationship)}>
                            {rel.relationship}
                          </Badge>
                        </TableCell>
                        <TableCell>{rel.moveInDate}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleView(rel)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleMoveOut(rel.id)}
                            >
                              迁出
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(rel.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        暂无现居关系数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </TabsContent>

          <TabsContent value="history">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>人员姓名</TableHead>
                    <TableHead>身份证号</TableHead>
                    <TableHead>房屋地址</TableHead>
                    <TableHead>关系</TableHead>
                    <TableHead>入住时间</TableHead>
                    <TableHead>迁出时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyRelationships.length > 0 ? (
                    historyRelationships.map((rel) => (
                      <TableRow key={rel.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-gray-400" />
                            {rel.personName}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{rel.personIdCard}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4 text-gray-400" />
                            {rel.houseAddress}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRelationshipBadge(rel.relationship)}>
                            {rel.relationship}
                          </Badge>
                        </TableCell>
                        <TableCell>{rel.moveInDate}</TableCell>
                        <TableCell>{rel.moveOutDate || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleView(rel)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(rel.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        暂无历史关系数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      {/* 查看详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>人房关系详情</DialogTitle>
            <DialogDescription>
              查看人员与房屋的关联信息
            </DialogDescription>
          </DialogHeader>
          {selectedRelationship && (
            <div className="space-y-6 py-4">
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  人员信息
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <Label className="text-gray-500">姓名</Label>
                    <p className="mt-1">{selectedRelationship.personName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">身份证号</Label>
                    <p className="mt-1 font-mono">{selectedRelationship.personIdCard}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  房屋信息
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-gray-500">房屋地址</Label>
                  <p className="mt-1">{selectedRelationship.houseAddress}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  关系信息
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <Label className="text-gray-500">关系类型</Label>
                    <p className="mt-1">
                      <Badge className={getRelationTypeBadge(selectedRelationship.relationType)}>
                        {selectedRelationship.relationType}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">人房关系</Label>
                    <p className="mt-1">
                      <Badge className={getRelationshipBadge(selectedRelationship.relationship)}>
                        {selectedRelationship.relationship}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">入住时间</Label>
                    <p className="mt-1">{selectedRelationship.moveInDate}</p>
                  </div>
                  {selectedRelationship.moveOutDate && (
                    <div>
                      <Label className="text-gray-500">迁出时间</Label>
                      <p className="mt-1">{selectedRelationship.moveOutDate}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <Label className="text-gray-500">创建时间</Label>
                    <p className="mt-1">{selectedRelationship.createTime}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 新增关系对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新增人房关系</DialogTitle>
            <DialogDescription>
              建立人员与房屋之间的关联关系
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>选择人员 *</Label>
                <Select 
                  value={formData.personId} 
                  onValueChange={(value) => setFormData({ ...formData, personId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择人员" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPersons.map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name} ({person.idCard})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>选择房屋 *</Label>
                <Select 
                  value={formData.houseId} 
                  onValueChange={(value) => setFormData({ ...formData, houseId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择房屋" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockHouses.map(house => (
                      <SelectItem key={house.id} value={house.id}>
                        {house.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>关系类型 *</Label>
                <Select 
                  value={formData.relationType} 
                  onValueChange={(value) => setFormData({ ...formData, relationType: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择关系类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="现居">现居</SelectItem>
                    <SelectItem value="历史">历史</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>人房关系 *</Label>
                <Select 
                  value={formData.relationship} 
                  onValueChange={(value) => setFormData({ ...formData, relationship: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择人房关系" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="业主">业主</SelectItem>
                    <SelectItem value="家属">家属</SelectItem>
                    <SelectItem value="租客">租客</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>入住时间 *</Label>
                <Input
                  type="date"
                  value={formData.moveInDate || ''}
                  onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                />
              </div>
              {formData.relationType === '历史' && (
                <div>
                  <Label>迁出时间</Label>
                  <Input
                    type="date"
                    value={formData.moveOutDate || ''}
                    onChange={(e) => setFormData({ ...formData, moveOutDate: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}