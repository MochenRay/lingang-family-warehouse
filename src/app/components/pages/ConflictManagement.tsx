import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Calendar,
  Filter,
  Home,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Users,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Textarea } from "../ui/textarea";
import { conflictRepository, type ConflictContext } from "../../services/repositories/conflictRepository";
import { personRepository } from "../../services/repositories/personRepository";
import { ConflictRecord, Grid, Person } from "../../types/core";
import { toast } from "sonner";
import { PageHeader } from "./PageHeader";

interface ConflictManagementProps {
  onRouteChange?: (route: string) => void;
}

const DARK_CARD_CLASS =
  "rounded-[8px] border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none";
const DARK_DIALOG_CLASS =
  "border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] shadow-2xl";
const DARK_PANEL_CLASS = "rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)]";
const DARK_INPUT_CLASS =
  "border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] placeholder:text-[var(--color-neutral-08)]";
const DARK_MUTED_TEXT = "text-[var(--color-neutral-08)]";

function formatNow() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours(),
  )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function parseTime(value?: string) {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value.replace(/\//g, "-"));
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isSameDay(value?: string) {
  const timestamp = parseTime(value);
  if (!timestamp) {
    return false;
  }

  const current = new Date();
  const target = new Date(timestamp);
  return (
    current.getFullYear() === target.getFullYear() &&
    current.getMonth() === target.getMonth() &&
    current.getDate() === target.getDate()
  );
}

function getConflictStatusClass(status: ConflictRecord["status"]) {
  return status === "已化解"
    ? "border border-[#19B172]/40 bg-[#19B172]/10 text-[#6EE7B7] hover:bg-[#19B172]/20"
    : "border border-[#D6730D]/40 bg-[#D6730D]/10 text-[#FDBA74] hover:bg-[#D6730D]/20";
}

function getSourceClass(source: ConflictRecord["source"]) {
  return source === "上级下派"
    ? "border border-[#D6730D]/40 bg-[#D6730D]/10 text-[#FDBA74]"
    : "border border-[#4E86DF]/40 bg-[#4E86DF]/10 text-[#93C5FD]";
}

function getRiskClass(risk: Person["risk"]) {
  switch (risk) {
    case "High":
      return "border border-[#D52132]/40 bg-[#D52132]/10 text-[#FCA5A5]";
    case "Medium":
      return "border border-[#D6730D]/40 bg-[#D6730D]/10 text-[#FDBA74]";
    default:
      return "border border-[#19B172]/40 bg-[#19B172]/10 text-[#6EE7B7]";
  }
}

function getFollowUpClass(code?: string) {
  switch (code) {
    case "resolved":
      return "border border-[#19B172]/40 bg-[#19B172]/10 text-[#6EE7B7]";
    case "overdue":
      return "border border-[#D52132]/40 bg-[#D52132]/10 text-[#FCA5A5]";
    case "watch":
      return "border border-[#D6730D]/40 bg-[#D6730D]/10 text-[#FDBA74]";
    default:
      return "border border-[#4E86DF]/40 bg-[#4E86DF]/10 text-[#93C5FD]";
  }
}

export function ConflictManagement({ onRouteChange }: ConflictManagementProps) {
  const [allConflicts, setAllConflicts] = useState<ConflictRecord[]>([]);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [grids, setGrids] = useState<Grid[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [gridFilter, setGridFilter] = useState("all");

  const [isDispatchDialogOpen, setIsDispatchDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<ConflictRecord | null>(null);
  const [selectedContext, setSelectedContext] = useState<ConflictContext | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [dispatchForm, setDispatchForm] = useState({
    title: "",
    type: "",
    gridId: "",
    description: "",
    targetPerson: "",
  });

  useEffect(() => {
    void loadGrids();
  }, []);

  useEffect(() => {
    void loadConflicts();
  }, [searchQuery, statusFilter, typeFilter, gridFilter]);

  const stats = useMemo(() => {
    const total = allConflicts.length;
    const resolved = allConflicts.filter((conflict) => conflict.status === "已化解").length;
    return {
      total,
      today: allConflicts.filter((conflict) => isSameDay(conflict.createdAt)).length,
      resolved,
      rate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    };
  }, [allConflicts]);

  async function loadGrids() {
    try {
      const nextGrids = await personRepository.getGrids();
      setGrids(nextGrids);
    } catch (error) {
      console.error("Failed to load grids", error);
      toast.error("网格数据加载失败，请稍后重试");
    }
  }

  async function loadConflicts() {
    setIsLoading(true);
    try {
      const query = {
        search: searchQuery.trim() || undefined,
        status: statusFilter === "all" ? undefined : (statusFilter as ConflictRecord["status"]),
        type: typeFilter === "all" ? undefined : (typeFilter as ConflictRecord["type"]),
        gridId: gridFilter === "all" ? undefined : gridFilter,
      };
      const hasFilters = Boolean(query.search || query.status || query.type || query.gridId);
      const [nextConflicts, nextAllConflicts] = await Promise.all([
        conflictRepository.getConflicts(query),
        hasFilters ? conflictRepository.getConflicts() : conflictRepository.getConflicts(query),
      ]);
      setConflicts(nextConflicts);
      setAllConflicts(nextAllConflicts);
    } catch (error) {
      console.error("Failed to load conflict data", error);
      toast.error("矛盾调解数据加载失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOpenDetail(conflict: ConflictRecord) {
    setSelectedConflict(conflict);
    setSelectedContext(null);
    setIsDetailDialogOpen(true);
    setIsDetailLoading(true);

    try {
      const [freshConflict, context] = await Promise.all([
        conflictRepository.getConflict(conflict.id),
        conflictRepository.getConflictContext(conflict.id),
      ]);
      setSelectedConflict(freshConflict ?? conflict);
      setSelectedContext(context);
    } catch (error) {
      console.error("Failed to load conflict detail", error);
      toast.error("纠纷详情加载失败，请稍后重试");
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function handleDispatch() {
    if (!dispatchForm.title || !dispatchForm.type || !dispatchForm.gridId || !dispatchForm.description) {
      toast.error("请填写完整信息");
      return;
    }

    setIsSaving(true);
    const now = formatNow();

    try {
      await conflictRepository.addConflict({
        source: "上级下派",
        title: dispatchForm.title.trim(),
        type: dispatchForm.type as ConflictRecord["type"],
        description: dispatchForm.description.trim(),
        status: "调解中",
        gridId: dispatchForm.gridId,
        location: "待核实",
        involvedParties: dispatchForm.targetPerson.trim()
          ? [
              {
                id: `temp_party_${Date.now()}`,
                name: dispatchForm.targetPerson.trim(),
                type: "resident",
              },
            ]
          : [],
        timeline: [
          {
            date: now,
            content: "街道/社区综治中心下派任务，待网格员核实现场情况。",
            operator: "系统管理员",
          },
        ],
        images: [],
        createdAt: now,
        updatedAt: now,
      });

      toast.success("纠纷任务已下派");
      setDispatchForm({ title: "", type: "", gridId: "", description: "", targetPerson: "" });
      setIsDispatchDialogOpen(false);
      await loadConflicts();
    } catch (error) {
      console.error("Failed to dispatch conflict", error);
      toast.error("下派失败，请稍后重试");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleMarkResolved() {
    if (!selectedConflict) {
      return;
    }

    if (!confirm("确定标记为已化解？")) {
      return;
    }

    setIsSaving(true);
    const now = formatNow();
    const nextTimeline = [
      ...selectedConflict.timeline,
      {
        date: now,
        content: "桌面端确认矛盾已化解，转入后续观察。",
        operator: "系统管理员",
      },
    ];

    try {
      const updated = await conflictRepository.updateConflict(selectedConflict.id, {
        status: "已化解",
        updatedAt: now,
        timeline: nextTimeline,
      });
      if (updated) {
        setSelectedConflict(updated);
        const nextContext = await conflictRepository.getConflictContext(updated.id);
        setSelectedContext(nextContext);
      }
      toast.success("已标记为化解");
      await loadConflicts();
    } catch (error) {
      console.error("Failed to resolve conflict", error);
      toast.error("状态更新失败，请稍后重试");
    } finally {
      setIsSaving(false);
    }
  }

  function getGridName(id: string) {
    return grids.find((grid) => grid.id === id)?.name || id;
  }

  function handleRouteJump(route: string, storageKey: string, id: string) {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(storageKey, id);
    }
    setIsDetailDialogOpen(false);
    onRouteChange?.(route);
  }

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)]">
      <PageHeader
        eyebrow="CONFLICT MEDIATION"
        title="矛盾调解"
        description="串联矛盾登记、处置过程和关联对象，保障纠纷跟进闭环。"
        actions={
          <Button onClick={() => setIsDispatchDialogOpen(true)} className="bg-[#4E86DF] text-white hover:bg-[#2761CB]">
            <Plus className="w-4 h-4 mr-2" />
            下派纠纷任务
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={DARK_MUTED_TEXT}>纠纷总数</CardDescription>
            <CardTitle className="text-2xl font-semibold flex items-baseline gap-2 text-white">
              {stats.total}
              <span className="text-sm font-normal text-[var(--color-neutral-08)]">件</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={DARK_MUTED_TEXT}>今日新增</CardDescription>
            <CardTitle className="text-2xl font-semibold text-[#D6730D] flex items-baseline gap-2">
              {stats.today}
              <span className="text-sm font-normal text-[var(--color-neutral-08)]">件</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={DARK_MUTED_TEXT}>累计化解</CardDescription>
            <CardTitle className="text-2xl font-semibold text-[#19B172] flex items-baseline gap-2">
              {stats.resolved}
              <span className="text-sm font-normal text-[var(--color-neutral-08)]">件</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={DARK_MUTED_TEXT}>化解率</CardDescription>
            <CardTitle className="text-2xl font-semibold text-[#4E86DF] flex items-baseline gap-2">
              {stats.rate}
              <span className="text-sm font-normal text-[var(--color-neutral-08)]">%</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className={DARK_CARD_CLASS}>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 flex-1">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-08)]" />
                <Input
                  placeholder="搜索纠纷标题、地点、当事人..."
                  className={`pl-9 ${DARK_INPUT_CLASS}`}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`w-[140px] ${DARK_INPUT_CLASS}`}>
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
                <SelectTrigger className={`w-[140px] ${DARK_INPUT_CLASS}`}>
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
                <SelectTrigger className={`w-[180px] ${DARK_INPUT_CLASS}`}>
                  <SelectValue placeholder="所属网格" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部网格</SelectItem>
                  {grids.map((grid) => (
                    <SelectItem key={grid.id} value={grid.id}>
                      {grid.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--color-neutral-03)]">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow className="border-b border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-02)]">
                  <TableHead className="w-[24%] min-w-[220px] text-[var(--color-neutral-08)]">标题</TableHead>
                  <TableHead className="whitespace-nowrap text-[var(--color-neutral-08)]">来源</TableHead>
                  <TableHead className="whitespace-nowrap text-[var(--color-neutral-08)]">类型</TableHead>
                  <TableHead className="min-w-[150px] text-[var(--color-neutral-08)]">当事人</TableHead>
                  <TableHead className="min-w-[150px] text-[var(--color-neutral-08)]">所属网格</TableHead>
                  <TableHead className="whitespace-nowrap text-[var(--color-neutral-08)]">状态</TableHead>
                  <TableHead className="whitespace-nowrap text-[var(--color-neutral-08)]">更新时间</TableHead>
                  <TableHead className="w-20 text-right text-[var(--color-neutral-08)]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10">
                      <div className="flex items-center justify-center gap-2 text-[var(--color-neutral-08)]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>正在加载矛盾调解数据...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : conflicts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-[var(--color-neutral-08)]">
                      暂无相关纠纷记录
                    </TableCell>
                  </TableRow>
                ) : (
                  conflicts.map((conflict) => (
                    <TableRow
                      key={conflict.id}
                      className="cursor-pointer border-b border-[var(--color-neutral-03)] transition-colors hover:bg-[rgba(78,134,223,0.08)]"
                      onClick={() => void handleOpenDetail(conflict)}
                    >
                      <TableCell className="w-[24%] min-w-[220px] max-w-[260px] truncate font-medium text-white">{conflict.title}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="secondary" className={getSourceClass(conflict.source)}>
                          {conflict.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-[var(--color-neutral-10)]">{conflict.type}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap max-w-[180px]">
                          {conflict.involvedParties.length === 0 ? (
                            <span className="text-xs text-[var(--color-neutral-08)]">待补充</span>
                          ) : (
                            conflict.involvedParties.map((party) => (
                              <span
                                key={`${conflict.id}-${party.id}-${party.name}`}
                                className="rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] px-1.5 py-0.5 text-xs text-[var(--color-neutral-10)]"
                              >
                                {party.name}
                              </span>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[170px] truncate text-[var(--color-neutral-10)]" title={getGridName(conflict.gridId)}>
                        {getGridName(conflict.gridId)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={getConflictStatusClass(conflict.status)}>{conflict.status}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-[var(--color-neutral-08)]">
                        {conflict.updatedAt.split(" ")[0]}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-[#93C5FD] hover:bg-[#4E86DF]/10 hover:text-white">
                          查看详情
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

      <Dialog open={isDispatchDialogOpen} onOpenChange={setIsDispatchDialogOpen}>
        <DialogContent className={DARK_DIALOG_CLASS}>
          <DialogHeader>
            <DialogTitle>下派矛盾纠纷任务</DialogTitle>
            <DialogDescription className={DARK_MUTED_TEXT}>创建任务并下派给指定网格跟进核实与调解。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                纠纷标题 <span className="text-[#FCA5A5]">*</span>
              </Label>
              <Input
                id="title"
                className={DARK_INPUT_CLASS}
                value={dispatchForm.title}
                onChange={(event) =>
                  setDispatchForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="例如：关于 xxx 的邻里纠纷"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">
                纠纷类型 <span className="text-[#FCA5A5]">*</span>
              </Label>
              <Select
                value={dispatchForm.type}
                onValueChange={(value) => setDispatchForm((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="type" className={DARK_INPUT_CLASS}>
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
              <Label htmlFor="grid">
                所属网格 <span className="text-[#FCA5A5]">*</span>
              </Label>
              <Select
                value={dispatchForm.gridId}
                onValueChange={(value) => setDispatchForm((prev) => ({ ...prev, gridId: value }))}
              >
                <SelectTrigger id="grid" className={DARK_INPUT_CLASS}>
                  <SelectValue placeholder="选择网格" />
                </SelectTrigger>
                <SelectContent>
                  {grids.map((grid) => (
                    <SelectItem key={grid.id} value={grid.id}>
                      {grid.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="person">主要当事人（可选）</Label>
              <Input
                id="person"
                className={DARK_INPUT_CLASS}
                value={dispatchForm.targetPerson}
                onChange={(event) =>
                  setDispatchForm((prev) => ({ ...prev, targetPerson: event.target.value }))
                }
                placeholder="姓名"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">
                详细描述 <span className="text-[#FCA5A5]">*</span>
              </Label>
              <Textarea
                id="desc"
                className={DARK_INPUT_CLASS}
                value={dispatchForm.description}
                onChange={(event) =>
                  setDispatchForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="请输入详细情况..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)] hover:text-white"
              onClick={() => setIsDispatchDialogOpen(false)}
              disabled={isSaving}
            >
              取消
            </Button>
            <Button onClick={() => void handleDispatch()} className="bg-[#4E86DF] text-white hover:bg-[#2761CB]" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              确认下派
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className={`max-w-5xl ${DARK_DIALOG_CLASS}`}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>{selectedConflict?.title ?? "纠纷详情"}</DialogTitle>
              {selectedConflict ? (
                <Badge className={getConflictStatusClass(selectedConflict.status)}>
                  {selectedConflict.status}
                </Badge>
              ) : null}
            </div>
            {selectedConflict ? (
              <DialogDescription className="flex items-center gap-2 mt-1 text-[var(--color-neutral-08)]">
                <span>{selectedConflict.source}</span>
                <span>•</span>
                <span>{selectedConflict.type}</span>
                <span>•</span>
                <span>{getGridName(selectedConflict.gridId)}</span>
              </DialogDescription>
            ) : null}
          </DialogHeader>

          {isDetailLoading ? (
            <div className="py-16">
              <div className="flex items-center justify-center gap-2 text-[var(--color-neutral-08)]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>正在加载案件上下文...</span>
              </div>
            </div>
          ) : selectedConflict ? (
            <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid gap-4 lg:grid-cols-[1.5fr,1fr]">
                <Card className={DARK_CARD_CLASS}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">案件概况</CardTitle>
                    <CardDescription className={DARK_MUTED_TEXT}>以真实案件对象、地点和过程为准。</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={`${DARK_PANEL_CLASS} p-3 text-sm text-[var(--color-neutral-10)]`}>
                      {selectedConflict.description}
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div className={`${DARK_PANEL_CLASS} p-3`}>
                        <div className="text-[var(--color-neutral-08)] flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          发生地点
                        </div>
                        <p className="mt-2 font-medium text-white">{selectedConflict.location}</p>
                      </div>
                      <div className={`${DARK_PANEL_CLASS} p-3`}>
                        <div className="text-[var(--color-neutral-08)] flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          最近更新时间
                        </div>
                        <p className="mt-2 font-medium text-white">{selectedConflict.updatedAt}</p>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        当事人与参与方
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedConflict.involvedParties.length > 0 ? (
                          selectedConflict.involvedParties.map((party) => (
                            <Badge
                              key={`${party.id}-${party.name}`}
                              variant="outline"
                              className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] px-3 py-1 text-[var(--color-neutral-10)]"
                            >
                              {party.name}
                              {party.type === "organization" ? (
                                <span className="text-[var(--color-neutral-08)] ml-1">(单位)</span>
                              ) : null}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-[var(--color-neutral-08)]">暂无明确参与方</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={DARK_CARD_CLASS}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">社工助手建议</CardTitle>
                    <CardDescription className={DARK_MUTED_TEXT}>当前先基于真实案件上下文生成稳定的建议位。</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={`${DARK_PANEL_CLASS} p-3`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-[var(--color-neutral-08)]">回访状态</p>
                          <p className="mt-1 text-sm text-[var(--color-neutral-10)]">
                            {selectedContext?.followUpStatus.detail ?? "暂无回访状态"}
                          </p>
                        </div>
                        <Badge className={getFollowUpClass(selectedContext?.followUpStatus.code)}>
                          {selectedContext?.followUpStatus.label ?? "待补充"}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#4E86DF]" />
                        建议动作
                      </div>
                      {selectedContext?.suggestedActions.length ? (
                        <div className="space-y-2">
                          {selectedContext.suggestedActions.map((action, index) => (
                            <div
                              key={`${selectedConflict.id}-action-${index}`}
                              className="rounded-lg border border-[#4E86DF]/30 bg-[#4E86DF]/10 p-3 text-sm text-[var(--color-neutral-10)]"
                            >
                              {action}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-[var(--color-neutral-03)] p-3 text-sm text-[var(--color-neutral-08)]">
                          暂无建议动作
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
                <Card className={DARK_CARD_CLASS}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">关联人员画像</CardTitle>
                    <CardDescription className={DARK_MUTED_TEXT}>当前案件中的住户对象与风险信息。</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedContext?.relatedPeople.length ? (
                      selectedContext.relatedPeople.map((person) => (
                        <div
                          key={person.id}
                          className={`${DARK_PANEL_CLASS} p-3 flex items-start justify-between gap-3`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white">{person.name}</p>
                              <Badge className={getRiskClass(person.risk)}>{person.risk}</Badge>
                              <Badge variant="outline" className="border-[var(--color-neutral-03)] text-[var(--color-neutral-10)]">
                                {person.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-[var(--color-neutral-10)]">{person.address}</p>
                            <p className="text-xs text-[var(--color-neutral-08)]">
                              标签：{(person.tags ?? []).slice(0, 3).join(" / ") || "暂无标签"}
                            </p>
                          </div>
                          {onRouteChange ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)] hover:text-white"
                              onClick={() =>
                                handleRouteJump("population", "app_focus_person_id", person.id)
                              }
                            >
                              查看人口档案
                              <ArrowUpRight className="w-4 h-4 ml-1" />
                            </Button>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-[var(--color-neutral-03)] p-4 text-sm text-[var(--color-neutral-08)]">
                        当前案件暂无可关联的住户对象。
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className={DARK_CARD_CLASS}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">关联房屋节点</CardTitle>
                    <CardDescription className={DARK_MUTED_TEXT}>用于校验人房一致性和居住状态。</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedContext?.relatedHouse ? (
                      <div className={`${DARK_PANEL_CLASS} p-4 space-y-3`}>
                        <div className="flex items-center gap-2 text-white">
                          <Home className="w-4 h-4 text-[#4E86DF]" />
                          <p className="font-medium">{selectedContext.relatedHouse.address}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-[var(--color-neutral-08)]">产权人</p>
                            <p className="mt-1 text-white">{selectedContext.relatedHouse.ownerName}</p>
                          </div>
                          <div>
                            <p className="text-[var(--color-neutral-08)]">房屋类型</p>
                            <p className="mt-1 text-white">{selectedContext.relatedHouse.type}</p>
                          </div>
                          <div>
                            <p className="text-[var(--color-neutral-08)]">居住类型</p>
                            <p className="mt-1 text-white">
                              {selectedContext.relatedHouse.residenceType ?? "待补充"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[var(--color-neutral-08)]">居住人数</p>
                            <p className="mt-1 text-white">{selectedContext.relatedHouse.memberCount} 人</p>
                          </div>
                        </div>
                        {onRouteChange ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)] hover:text-white"
                            onClick={() =>
                              handleRouteJump("housing", "app_focus_house_id", selectedContext.relatedHouse!.id)
                            }
                          >
                            前往房屋管理
                            <ArrowUpRight className="w-4 h-4 ml-1" />
                          </Button>
                        ) : null}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-[var(--color-neutral-03)] p-4 text-sm text-[var(--color-neutral-08)]">
                        当前案件还未能稳定关联到具体房屋，建议先补地点和住户信息。
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className={DARK_CARD_CLASS}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">近期走访与处置过程</CardTitle>
                  <CardDescription className={DARK_MUTED_TEXT}>用真实走访和处理时间线互相印证案件进度。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <div className="text-sm font-medium text-white mb-3">最近走访记录</div>
                    {selectedContext?.recentVisits.length ? (
                      <div className="space-y-2">
                        {selectedContext.recentVisits.map((visit) => (
                          <div
                            key={visit.id}
                            className={`${DARK_PANEL_CLASS} p-3 flex items-start justify-between gap-4`}
                          >
                            <div>
                              <p className="text-sm font-medium text-white">{visit.content}</p>
                              <p className="mt-1 text-xs text-[var(--color-neutral-08)]">
                                {visit.date} · {visit.visitorName} · {visit.targetType === "person" ? "人员走访" : "房屋走访"}
                              </p>
                            </div>
                            {visit.tags?.length ? (
                              <Badge variant="outline" className="border-[var(--color-neutral-03)] text-[var(--color-neutral-10)]">
                                {visit.tags[0]}
                              </Badge>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-[var(--color-neutral-03)] p-4 text-sm text-[var(--color-neutral-08)]">
                        当前案件暂无最近走访记录，建议补一次跟进。
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-medium text-white mb-3">处理进度</div>
                    <div className="space-y-4 pl-2 border-l-2 border-[var(--color-neutral-03)] ml-2">
                      {[...selectedConflict.timeline].reverse().map((item, index) => (
                        <div key={`${selectedConflict.id}-timeline-${index}`} className="relative pl-6 pb-2">
                          <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#4E86DF] ring-2 ring-[var(--color-neutral-01)]" />
                          <div className="flex justify-between text-xs text-[var(--color-neutral-08)] mb-1">
                            <span>{item.date}</span>
                            <span>{item.operator}</span>
                          </div>
                          <div className="text-sm text-[var(--color-neutral-10)]">{item.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="py-12 text-center text-[var(--color-neutral-08)]">未找到案件详情</div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)] hover:text-white"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              关闭
            </Button>
            {selectedConflict?.status !== "已化解" ? (
              <Button
                className="bg-[#19B172] text-white hover:bg-[#138F5B]"
                onClick={() => void handleMarkResolved()}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                标记化解
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled
                className="border-[#19B172]/40 bg-[#19B172]/10 text-[#6EE7B7]"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                已进入回访观察
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
