import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Calendar,
  MessageSquare,
  Users
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "../ui/card";
import { Textarea } from "../ui/textarea";
import { db } from "../../services/db";
import { ConflictRecord, Grid } from "../../types/core";
import { toast } from "sonner";

export function ConflictManagement() {
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [grids, setGrids] = useState<Grid[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [gridFilter, setGridFilter] = useState("all");

  // Dialogs
  const [isDispatchDialogOpen, setIsDispatchDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<ConflictRecord | null>(null);

  // Dispatch Form
  const [dispatchForm, setDispatchForm] = useState({
    title: "",
    type: "",
    gridId: "",
    description: "",
    targetPerson: ""
  });

  useEffect(() => {
    loadData();
    window.addEventListener('db-change', loadData);
    return () => window.removeEventListener('db-change', loadData);
  }, []);

  const loadData = () => {
    setConflicts(db.getConflicts());
    setGrids(db.getGrids());
  };

  const filteredConflicts = conflicts.filter(c => {
    const matchSearch = c.title.includes(searchQuery) || c.description.includes(searchQuery);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchType = typeFilter === "all" || c.type === typeFilter;
    const matchGrid = gridFilter === "all" || c.gridId === gridFilter;
    return matchSearch && matchStatus && matchType && matchGrid;
  });

  const stats = {
    total: conflicts.length,
    today: conflicts.filter(c => {
      const date = new Date(c.createdAt);
      const today = new Date();
      return date.getDate() === today.getDate() && 
             date.getMonth() === today.getMonth() && 
             date.getFullYear() === today.getFullYear();
    }).length,
    resolved: conflicts.filter(c => c.status === "已化解").length,
    rate: conflicts.length > 0 
      ? Math.round((conflicts.filter(c => c.status === "已化解").length / conflicts.length) * 100) 
      : 0
  };

  const handleDispatch = () => {
    if (!dispatchForm.title || !dispatchForm.type || !dispatchForm.gridId || !dispatchForm.description) {
      toast.error("请填写完整信息");
      return;
    }

    const newConflict: ConflictRecord = {
      id: `c_${Date.now()}`,
      source: '上级下派',
      title: dispatchForm.title,
      type: dispatchForm.type as any,
      description: dispatchForm.description,
      status: '调解中',
      gridId: dispatchForm.gridId,
      location: '待核实', // Usually filled by grid member
      involvedParties: dispatchForm.targetPerson ? [{
        id: 'temp_p_' + Date.now(),
        name: dispatchForm.targetPerson,
        type: 'resident'
      }] : [],
      timeline: [{
        date: new Date().toLocaleString(),
        content: '街道/社区综治中心下派任务',
        operator: '系统管理员'
      }],
      images: [],
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString()
    };

    db.addConflict(newConflict);
    toast.success("任务下派成功");
    setIsDispatchDialogOpen(false);
    setDispatchForm({ title: "", type: "", gridId: "", description: "", targetPerson: "" });
  };

  const getGridName = (id: string) => grids.find(g => g.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">矛盾调解</h1>
          <p className="text-gray-500">
            全域矛盾纠纷排查化解、任务下派与督导
          </p>
        </div>
        <Button onClick={() => setIsDispatchDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          下派纠纷任务
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>纠纷总数</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-baseline gap-2">
              {stats.total}
              <span className="text-sm font-normal text-gray-500">件</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>今日新增</CardDescription>
            <CardTitle className="text-3xl font-bold text-orange-600 flex items-baseline gap-2">
              {stats.today}
              <span className="text-sm font-normal text-gray-500">件</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>累计化解</CardDescription>
            <CardTitle className="text-3xl font-bold text-green-600 flex items-baseline gap-2">
              {stats.resolved}
              <span className="text-sm font-normal text-gray-500">件</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>化解率</CardDescription>
            <CardTitle className="text-3xl font-bold text-blue-600 flex items-baseline gap-2">
              {stats.rate}
              <span className="text-sm font-normal text-gray-500">%</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 flex-1">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="搜索纠纷标题、当事人..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="调解中">调解中</SelectItem>
                  <SelectItem value="已化解">已化解</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="邻里纠纷">邻里纠纷</SelectItem>
                  <SelectItem value="家庭纠纷">家庭纠纷</SelectItem>
                  <SelectItem value="物业纠纷">物业纠纷</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>

              <Select value={gridFilter} onValueChange={setGridFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="所属网格" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部网格</SelectItem>
                  {grids.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>来源</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>当事人</TableHead>
                  <TableHead>所属网格</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConflicts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      暂无相关纠纷记录
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConflicts.map((conflict) => (
                    <TableRow key={conflict.id} className="cursor-pointer hover:bg-gray-50" onClick={() => {
                      setSelectedConflict(conflict);
                      setIsDetailDialogOpen(true);
                    }}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {conflict.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`
                          ${conflict.source === '上级下派' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}
                        `}>
                          {conflict.source}
                        </Badge>
                      </TableCell>
                      <TableCell>{conflict.type}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap max-w-[150px]">
                          {conflict.involvedParties.map((p, i) => (
                            <span key={i} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate" title={getGridName(conflict.gridId)}>
                        {getGridName(conflict.gridId)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`
                          ${conflict.status === '已化解' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}
                        `}>
                          {conflict.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">{conflict.updatedAt.split(' ')[0]}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dispatch Dialog */}
      <Dialog open={isDispatchDialogOpen} onOpenChange={setIsDispatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>下派矛盾纠纷任务</DialogTitle>
            <DialogDescription>
              创建任务并下派给指定网格员进行核实与化解。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">纠纷标题 <span className="text-red-500">*</span></Label>
              <Input 
                id="title" 
                value={dispatchForm.title} 
                onChange={e => setDispatchForm(prev => ({...prev, title: e.target.value}))}
                placeholder="例如：关于xxx的邻里纠纷"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">纠纷类型 <span className="text-red-500">*</span></Label>
              <Select onValueChange={(val) => setDispatchForm(prev => ({...prev, type: val}))}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="请选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="邻里纠纷">邻里纠纷</SelectItem>
                  <SelectItem value="家庭纠纷">家庭纠纷</SelectItem>
                  <SelectItem value="物业纠纷">物业纠纷</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="grid">所属网格 (承办人) <span className="text-red-500">*</span></Label>
              <Select onValueChange={(val) => setDispatchForm(prev => ({...prev, gridId: val}))}>
                <SelectTrigger id="grid">
                  <SelectValue placeholder="选择网格" />
                </SelectTrigger>
                <SelectContent>
                  {grids.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="person">主要当事人 (可选)</Label>
              <Input 
                id="person" 
                value={dispatchForm.targetPerson} 
                onChange={e => setDispatchForm(prev => ({...prev, targetPerson: e.target.value}))}
                placeholder="姓名"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">详细描述 <span className="text-red-500">*</span></Label>
              <Textarea 
                id="desc" 
                value={dispatchForm.description} 
                onChange={e => setDispatchForm(prev => ({...prev, description: e.target.value}))}
                placeholder="请输入详细情况..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDispatchDialogOpen(false)}>取消</Button>
            <Button onClick={handleDispatch} className="bg-blue-600 hover:bg-blue-700">确认下派</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      {selectedConflict && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <DialogTitle>{selectedConflict.title}</DialogTitle>
                <Badge variant={selectedConflict.status === '已化解' ? 'success' : 'warning'}>
                  {selectedConflict.status}
                </Badge>
              </div>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span>{selectedConflict.source}</span>
                <span>•</span>
                <span>{selectedConflict.type}</span>
                <span>•</span>
                <span>{getGridName(selectedConflict.gridId)}</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              <div className="bg-gray-50 p-3 rounded-lg border text-sm text-gray-700">
                {selectedConflict.description}
              </div>

              {selectedConflict.involvedParties.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> 当事人
                  </h4>
                  <div className="flex gap-2">
                    {selectedConflict.involvedParties.map((p, i) => (
                      <Badge key={i} variant="outline" className="px-3 py-1 bg-white">
                        {p.name}
                        {p.type === 'organization' && <span className="text-gray-400 ml-1">(单位)</span>}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedConflict.images && selectedConflict.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> 附件
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedConflict.images.map((img, i) => (
                      <div key={i} className="aspect-square bg-gray-100 rounded overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="附件" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> 处理进度
                </h4>
                <div className="space-y-4 pl-2 border-l-2 border-gray-100 ml-2">
                  {[...selectedConflict.timeline].reverse().map((item, index) => (
                    <div key={index} className="relative pl-6 pb-2">
                      <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white"></div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{item.date}</span>
                        <span>{item.operator}</span>
                      </div>
                      <div className="text-sm text-gray-800">
                        {item.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>关闭</Button>
              {selectedConflict.status !== '已化解' && (
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => {
                  if(confirm("确定标记为已化解？")) {
                    db.updateConflict(selectedConflict.id, { status: '已化解' });
                    setIsDetailDialogOpen(false);
                    toast.success("已标记为化解");
                  }
                }}>
                  <ShieldCheck className="w-4 h-4 mr-2" /> 标记化解
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
