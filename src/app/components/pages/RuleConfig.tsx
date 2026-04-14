import { useState } from 'react';
import { RuleEditDialog } from '../rules/RuleEditDialog';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  ListTodo,
  Zap,
  Users
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface Rule {
  id: number;
  name: string;
  description: string;
  conditions: { field: string; operator: string; value: string }[];
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: boolean;
  lastRun: string;
  triggerType: '事件触发' | '周期触发';
  coveredCount: number;
}

const initialRules: Rule[] = [
  {
    id: 1,
    name: "独居老人走访提醒",
    description: "对标记为'独居老人'且超过7天未走访的人员生成待办任务",
    conditions: [
      { field: "关爱标签", operator: "包含", value: "独居老人" },
      { field: "最后走访时间", operator: "早于", value: "7天前" }
    ],
    action: "生成待办任务",
    priority: "high",
    status: true,
    lastRun: "2026-01-20 10:00",
    triggerType: '事件触发',
    coveredCount: 126,
  },
  {
    id: 2,
    name: "群租房风险预警",
    description: "房屋居住人数超过8人时触发预警",
    conditions: [
      { field: "居住人数", operator: "大于", value: "8" }
    ],
    action: "发送风险预警",
    priority: "critical",
    status: true,
    lastRun: "2026-01-20 09:30",
    triggerType: '事件触发',
    coveredCount: 34,
  },
  {
    id: 3,
    name: "低保户定期关怀",
    description: "每月1号对低保户生成关怀任务",
    conditions: [
      { field: "关爱标签", operator: "包含", value: "低保户" },
      { field: "频率", operator: "是", value: "每月1号" }
    ],
    action: "生成关怀任务",
    priority: "medium",
    status: true,
    lastRun: "2026-01-15 08:00",
    triggerType: '周期触发',
    coveredCount: 89,
  },
  {
    id: 4,
    name: "重点人员动态监控",
    description: "社区矫正、信访人员等重点人群信息变更时生成核查任务",
    conditions: [
      { field: "重点人员类型", operator: "包含", value: "社区矫正/信访人员" },
      { field: "数据操作", operator: "是", value: "信息变更" }
    ],
    action: "生成核查任务",
    priority: "critical",
    status: true,
    lastRun: "2026-01-20 11:20",
    triggerType: '事件触发',
    coveredCount: 18,
  },
  {
    id: 5,
    name: "重症患者健康回访",
    description: "对重症患者每周生成健康回访任务",
    conditions: [
      { field: "健康状态", operator: "是", value: "重症患者" },
      { field: "频率", operator: "是", value: "每周一" }
    ],
    action: "生成回访任务",
    priority: "high",
    status: true,
    lastRun: "2026-01-20 09:00",
    triggerType: '周期触发',
    coveredCount: 42,
  },
  {
    id: 6,
    name: "孕产妇定期关怀",
    description: "每两周对孕产妇生成关怀走访任务",
    conditions: [
      { field: "健康状态", operator: "是", value: "孕产妇" },
      { field: "频率", operator: "是", value: "每两周" }
    ],
    action: "生成关怀任务",
    priority: "medium",
    status: false,
    lastRun: "2023-12-25 09:00",
    triggerType: '周期触发',
    coveredCount: 15,
  },
  {
    id: 7,
    name: "流动人口信息核查",
    description: "流动人口超过90天未更新信息时生成核查任务",
    conditions: [
      { field: "人员类型", operator: "等于", value: "流动" },
      { field: "最后更新时间", operator: "早于", value: "90天前" }
    ],
    action: "生成核查任务",
    priority: "medium",
    status: true,
    lastRun: "2026-01-19 08:00",
    triggerType: '事件触发',
    coveredCount: 203,
  },
];

const priorityConfig: Record<string, { label: string; dotClass: string; badgeClass: string }> = {
  critical: { label: '极高', dotClass: 'bg-red-500', badgeClass: 'text-red-400 bg-red-500/10 border-red-500/20' },
  high:     { label: '高',   dotClass: 'bg-orange-500', badgeClass: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  medium:   { label: '中',   dotClass: 'bg-blue-400', badgeClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  low:      { label: '低',   dotClass: 'bg-[var(--color-neutral-06)]', badgeClass: 'text-[var(--color-neutral-08)] bg-[var(--color-neutral-03)] border-[var(--color-neutral-04)]' },
};

export function RuleConfig() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [rules, setRules] = useState<Rule[]>(initialRules);

  const filteredRules = rules.filter(r => {
    if (searchTerm && !r.name.includes(searchTerm) && !r.description.includes(searchTerm)) return false;
    if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
    return true;
  });

  const activeCount = rules.filter(r => r.status).length;
  const todayTriggerCount = 128;
  const totalCovered = rules.filter(r => r.status).reduce((sum, r) => sum + r.coveredCount, 0);
  const pendingTasks = 45;

  return (
    <div className="space-y-6">
      {/* 头部区域 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-neutral-11)]">待办规则配置</h1>
          <p className="text-sm text-[var(--color-neutral-08)] mt-1">
            配置自动化规则引擎，基于人口特征、标签和数据变更自动生成待办任务或风险预警
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-[var(--color-neutral-04)] text-[var(--color-neutral-09)] hover:bg-[var(--color-neutral-03)]">
            <Play className="w-4 h-4" />
            立即运行所有
          </Button>
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            新建规则
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-neutral-08)]">运行中规则</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--color-neutral-11)]">{activeCount}</div>
            <p className="text-xs text-[var(--color-neutral-06)]">
              共 {rules.length} 条配置规则
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-neutral-08)]">今日触发</CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--color-neutral-11)]">{todayTriggerCount}</div>
            <p className="text-xs text-[var(--color-neutral-06)]">
              较昨日 +12%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-neutral-08)]">覆盖人群</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--color-neutral-11)]">{totalCovered.toLocaleString()}</div>
            <p className="text-xs text-[var(--color-neutral-06)]">
              占总人口 12.5%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-neutral-08)]">待处理任务</CardTitle>
            <ListTodo className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--color-neutral-11)]">{pendingTasks}</div>
            <p className="text-xs text-[var(--color-neutral-06)]">
              其中紧急 8 个
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 规则列表 */}
      <Card className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[var(--color-neutral-11)]">规则列表</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-[var(--color-neutral-06)]" />
                <Input
                  placeholder="搜索规则名称..."
                  className="pl-8 bg-[var(--color-neutral-01)] border-[var(--color-neutral-04)] text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-06)]"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[100px] bg-[var(--color-neutral-01)] border-[var(--color-neutral-04)] text-[var(--color-neutral-09)]">
                  <Filter className="w-3.5 h-3.5 mr-1" />
                  <SelectValue placeholder="优先级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="critical">极高</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--color-neutral-03)] hover:bg-transparent">
                <TableHead className="text-[var(--color-neutral-08)]">规则名称</TableHead>
                <TableHead className="text-[var(--color-neutral-08)]">触发方式</TableHead>
                <TableHead className="text-[var(--color-neutral-08)]">触发条件</TableHead>
                <TableHead className="text-[var(--color-neutral-08)]">执行动作</TableHead>
                <TableHead className="text-[var(--color-neutral-08)]">优先级</TableHead>
                <TableHead className="text-[var(--color-neutral-08)]">状态</TableHead>
                <TableHead className="text-[var(--color-neutral-08)]">最近运行</TableHead>
                <TableHead className="text-right text-[var(--color-neutral-08)]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.map((rule) => {
                const pc = priorityConfig[rule.priority];
                return (
                  <TableRow key={rule.id} className="border-[var(--color-neutral-03)] hover:bg-[var(--color-neutral-03)]/50">
                    <TableCell>
                      <div className="font-medium text-[var(--color-neutral-11)]">{rule.name}</div>
                      <div className="text-xs text-[var(--color-neutral-07)] truncate max-w-[220px]" title={rule.description}>
                        {rule.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={rule.triggerType === '事件触发'
                        ? 'text-purple-400 bg-purple-500/10 border-purple-500/20 text-xs'
                        : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 text-xs'
                      }>
                        {rule.triggerType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {rule.conditions.map((cond, idx) => (
                          <Badge key={idx} variant="outline" className="w-fit text-xs text-[var(--color-neutral-09)] border-[var(--color-neutral-04)] bg-[var(--color-neutral-03)]">
                            {cond.field} {cond.operator} {cond.value}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-[var(--color-neutral-09)]">{rule.action}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={pc.badgeClass}>
                        <div className={`w-1.5 h-1.5 rounded-full ${pc.dotClass} mr-1.5`} />
                        {pc.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.status}
                          onCheckedChange={(checked) => {
                            setRules(rules.map(r => r.id === rule.id ? { ...r, status: checked } : r));
                          }}
                        />
                        <span className="text-xs text-[var(--color-neutral-07)]">{rule.status ? '启用' : '禁用'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-[var(--color-neutral-07)]">
                        <Clock className="w-3 h-3" />
                        {rule.lastRun}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-[var(--color-neutral-07)] hover:text-[var(--color-neutral-11)] hover:bg-[var(--color-neutral-03)]">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>编辑规则</DropdownMenuItem>
                          <DropdownMenuItem>查看日志</DropdownMenuItem>
                          <DropdownMenuItem>立即运行</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400">删除</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RuleEditDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={(newRule) => {
          const tableRule: Rule = {
            id: rules.length + 1,
            name: newRule.name,
            description: newRule.action?.desc || '新创建的规则',
            conditions: newRule.triggerType === 'event'
              ? newRule.config.conditions.map((c: any) => ({
                  field: c.field,
                  operator: c.op === 'gt' ? '大于' : c.op === 'eq' ? '等于' : c.op === 'contains' ? '包含' : c.op,
                  value: c.value
                }))
              : [{ field: '频率', operator: '是', value: newRule.config.frequency }],
            action: newRule.action?.title || '生成任务',
            priority: newRule.priority,
            status: true,
            lastRun: '-',
            triggerType: newRule.triggerType === 'event' ? '事件触发' : '周期触发',
            coveredCount: 0,
          };
          setRules([tableRule, ...rules]);
        }}
      />
    </div>
  );
}
