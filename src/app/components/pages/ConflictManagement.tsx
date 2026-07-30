import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Calendar,
  FileText,
  Filter,
  History,
  Home,
  Loader2,
  MapPin,
  MessageSquare,
  Percent,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Table,
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
} from "../ui/card";
import { Textarea } from "../ui/textarea";
import { conflictRepository, type ConflictContext } from "../../services/repositories/conflictRepository";
import { personRepository } from "../../services/repositories/personRepository";
import { ConflictRecord, Grid, Person } from "../../types/core";
import { getRiskLevelLabel } from "../../utils/riskLevel";
import { toast } from "sonner";
import { PageHeader } from "./PageHeader";
import { StatCard } from "../patterns/StatCard";
import { StatusBadge, type StatusTone } from "../patterns/StatusBadge";
import { DataTableBody, TablePagination } from "../patterns/DataTableShell";
import { SearchInput } from "../patterns/FilterBar";
import { ConfirmDialog } from "../patterns/ConfirmDialog";
import { DetailDialogShell, DetailField, DetailFieldGrid, DetailSection } from "../patterns/DetailDialog";
import { DIALOG_CLASS, PANEL_CLASS } from "../patterns/surfaces";

interface ConflictManagementProps {
  onRouteChange?: (route: string) => void;
}

const DARK_INPUT_CLASS =
  "border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] placeholder:text-[var(--color-neutral-08)]";
const DARK_MUTED_TEXT = "text-[var(--color-neutral-08)]";
const PAGE_SIZE = 20;

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

function getConflictStatusTone(status: ConflictRecord["status"]): StatusTone {
  return status === "已化解" ? "success" : "warning";
}

function getSourceTone(source: ConflictRecord["source"]): StatusTone {
  return source === "上级下派" ? "warning" : "info";
}

function getRiskTone(risk: Person["risk"]): StatusTone {
  switch (risk) {
    case "High":
      return "error";
    case "Medium":
      return "warning";
    default:
      return "success";
  }
}

function getFollowUpTone(code?: string): StatusTone {
  switch (code) {
    case "resolved":
      return "success";
    case "overdue":
      return "error";
    case "watch":
      return "warning";
    default:
      return "info";
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
  const [currentPage, setCurrentPage] = useState(1);

  const [isDispatchDialogOpen, setIsDispatchDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isResolveConfirmOpen, setIsResolveConfirmOpen] = useState(false);
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

  // 筛选/搜索变化时回到第 1 页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, gridFilter]);

  const totalPages = Math.max(1, Math.ceil(conflicts.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedConflicts = conflicts.slice(pageStart, pageStart + PAGE_SIZE);

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
          <Button onClick={() => setIsDispatchDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            下派纠纷任务
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="纠纷总数"
          value={
            <>
              {stats.total}
              <span className="ml-1 text-sm font-normal text-[var(--color-neutral-08)]">件</span>
            </>
          }
          icon={FileText}
          tone="brand"
        />
        <StatCard
          label="今日新增"
          value={
            <>
              {stats.today}
              <span className="ml-1 text-sm font-normal text-[var(--color-neutral-08)]">件</span>
            </>
          }
          icon={Calendar}
          tone="warning"
        />
        <StatCard
          label="累计化解"
          value={
            <>
              {stats.resolved}
              <span className="ml-1 text-sm font-normal text-[var(--color-neutral-08)]">件</span>
            </>
          }
          icon={ShieldCheck}
          tone="success"
        />
        <StatCard
          label="化解率"
          value={
            <>
              {stats.rate}
              <span className="ml-1 text-sm font-normal text-[var(--color-neutral-08)]">%</span>
            </>
          }
          icon={Percent}
          tone="brand"
        />
      </div>

      <Card className={PANEL_CLASS}>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 flex-1">
              <SearchInput
                className="w-64"
                placeholder="搜索纠纷标题、地点、当事人..."
                value={searchQuery}
                onChange={setSearchQuery}
              />

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
              <DataTableBody
                loading={isLoading}
                loadingText="正在加载矛盾调解数据..."
                empty={conflicts.length === 0}
                emptyText="暂无相关纠纷记录"
                columnCount={8}
              >
                {paginatedConflicts.map((conflict) => (
                  <TableRow
                    key={conflict.id}
                    className="cursor-pointer border-b border-[var(--color-neutral-03)] transition-colors hover:bg-[var(--color-brand-primary)]/8"
                    onClick={() => void handleOpenDetail(conflict)}
                  >
                    <TableCell className="w-[24%] min-w-[220px] max-w-[260px] truncate font-medium text-[var(--color-neutral-11)]">{conflict.title}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge tone={getSourceTone(conflict.source)}>
                        {conflict.source}
                      </StatusBadge>
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
                      <StatusBadge tone={getConflictStatusTone(conflict.status)}>{conflict.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-[var(--color-neutral-08)]">
                      {conflict.updatedAt.split(" ")[0]}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-[var(--color-status-info-text)] hover:bg-[var(--color-brand-primary-hover)]/10 hover:text-[var(--color-neutral-11)]">
                        查看详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </DataTableBody>
            </Table>
          </div>
          <TablePagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={conflicts.length}
            pageStart={pageStart}
            pageEnd={Math.min(pageStart + PAGE_SIZE, conflicts.length)}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      <Dialog open={isDispatchDialogOpen} onOpenChange={setIsDispatchDialogOpen}>
        <DialogContent className={DIALOG_CLASS}>
          <DialogHeader>
            <DialogTitle>下派矛盾纠纷任务</DialogTitle>
            <DialogDescription className={DARK_MUTED_TEXT}>创建任务并下派给指定网格跟进核实与调解。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                纠纷标题 <span className="text-[var(--color-status-error-text)]">*</span>
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
                纠纷类型 <span className="text-[var(--color-status-error-text)]">*</span>
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
                所属网格 <span className="text-[var(--color-status-error-text)]">*</span>
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
                详细描述 <span className="text-[var(--color-status-error-text)]">*</span>
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
              className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]"
              onClick={() => setIsDispatchDialogOpen(false)}
              disabled={isSaving}
            >
              取消
            </Button>
            <Button onClick={() => void handleDispatch()} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              确认下派
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DetailDialogShell
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        contentLabel="纠纷详情"
        maxWidth="5xl"
        actions={
          selectedConflict ? (
            <div data-testid="conflict-detail-statuses" className="flex flex-wrap gap-2 max-sm:w-[calc(100vw-2.75rem)]">
              <StatusBadge tone={getConflictStatusTone(selectedConflict.status)}>{selectedConflict.status}</StatusBadge>
              <StatusBadge tone={getSourceTone(selectedConflict.source)}>{selectedConflict.source}</StatusBadge>
              <StatusBadge tone="neutral">{selectedConflict.type}</StatusBadge>
            </div>
          ) : undefined
        }
        title={selectedConflict?.title ?? "纠纷详情"}
        description={
          selectedConflict
            ? `${getGridName(selectedConflict.gridId)} · 更新于 ${selectedConflict.updatedAt}`
            : undefined
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              关闭
            </Button>
            {selectedConflict?.status !== "已化解" ? (
              <Button
                className="bg-[var(--color-status-success)] text-[var(--color-neutral-11)] hover:bg-[var(--color-status-success)]/90"
                onClick={() => setIsResolveConfirmOpen(true)}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                标记化解
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled
                className="border-[var(--color-status-success)]/40 bg-[var(--color-status-success)]/10 text-[var(--color-status-success-text)]"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                已进入回访观察
              </Button>
            )}
          </div>
        }
      >
        {isDetailLoading ? (
          <div className="flex h-full items-center justify-center gap-2 text-[var(--color-neutral-08)]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>正在加载案件详情...</span>
          </div>
        ) : selectedConflict ? (
          <div className="space-y-4">
            <DetailSection icon={FileText} title="案件概况" description="登记信息、发生地点与当事人一览。">
              <div className="space-y-3">
                <div className="rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] px-3 py-2 text-sm leading-6 text-[var(--color-neutral-10)]">
                  {selectedConflict.description}
                </div>
                <DetailFieldGrid>
                  <DetailField label="发生地点" icon={<MapPin className="h-3.5 w-3.5" />} value={selectedConflict.location} />
                  <DetailField label="登记时间" icon={<Calendar className="h-3.5 w-3.5" />} value={selectedConflict.createdAt} />
                  <DetailField label="最近更新" icon={<Calendar className="h-3.5 w-3.5" />} value={selectedConflict.updatedAt} />
                </DetailFieldGrid>
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-[var(--color-neutral-08)]">
                    <Users className="h-3.5 w-3.5" />
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
              </div>
            </DetailSection>

            <div className="grid gap-4 lg:grid-cols-2">
              <DetailSection icon={MessageSquare} title="调解建议" description="结合案件进度给出的回访状态与建议动作。">
                <div className="space-y-3">
                  <div className="rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-[var(--color-neutral-08)]">回访状态</p>
                        <p className="mt-1 text-sm text-[var(--color-neutral-10)]">
                          {selectedContext?.followUpStatus.detail ?? "暂无回访状态"}
                        </p>
                      </div>
                      <StatusBadge tone={getFollowUpTone(selectedContext?.followUpStatus.code)}>
                        {selectedContext?.followUpStatus.label ?? "待补充"}
                      </StatusBadge>
                    </div>
                  </div>
                  {selectedContext?.suggestedActions.length ? (
                    <div className="space-y-2">
                      {selectedContext.suggestedActions.map((action, index) => (
                        <div
                          key={`${selectedConflict.id}-action-${index}`}
                          className="rounded border border-[var(--color-brand-primary-hover)]/30 bg-[var(--color-brand-primary-hover)]/10 px-3 py-2 text-sm leading-6 text-[var(--color-neutral-10)]"
                        >
                          {action}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded border border-dashed border-[var(--color-neutral-03)] px-3 py-2 text-sm text-[var(--color-neutral-08)]">
                      暂无建议动作
                    </div>
                  )}
                </div>
              </DetailSection>

              <DetailSection icon={Home} title="关联房屋" description="用于核对居住情况和人房一致性。">
                {selectedContext?.relatedHouse ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[var(--color-neutral-11)]">
                      <Home className="w-4 h-4 text-[var(--color-brand-text)]" />
                      <p className="font-medium">{selectedContext.relatedHouse.address}</p>
                    </div>
                    <DetailFieldGrid className="sm:grid-cols-2 xl:grid-cols-2">
                      <DetailField label="产权人" value={selectedContext.relatedHouse.ownerName} />
                      <DetailField label="房屋类型" value={selectedContext.relatedHouse.type} />
                      <DetailField label="居住类型" value={selectedContext.relatedHouse.residenceType ?? "待补充"} />
                      <DetailField label="居住人数" value={`${selectedContext.relatedHouse.memberCount} 人`} />
                    </DetailFieldGrid>
                    {onRouteChange ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]"
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
                  <div className="rounded border border-dashed border-[var(--color-neutral-03)] px-3 py-2 text-sm text-[var(--color-neutral-08)]">
                    暂未关联到具体房屋，建议先补充地点和住户信息。
                  </div>
                )}
              </DetailSection>
            </div>

            <DetailSection
              icon={Users}
              title="关联人员"
              description="案件涉及的住户与需要关注的风险等级。"
              trailing={
                selectedContext?.relatedPeople.length ? (
                  <span className="text-xs text-[var(--color-neutral-08)]">{selectedContext.relatedPeople.length} 人</span>
                ) : undefined
              }
            >
              {selectedContext?.relatedPeople.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedContext.relatedPeople.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-start justify-between gap-3 rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] px-3 py-2"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-[var(--color-neutral-11)]">{person.name}</p>
                          <StatusBadge tone={getRiskTone(person.risk)}>{getRiskLevelLabel(person.risk)}</StatusBadge>
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
                          className="shrink-0 border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]"
                          onClick={() =>
                            handleRouteJump("population", "app_focus_person_id", person.id)
                          }
                        >
                          人口档案
                          <ArrowUpRight className="w-4 h-4 ml-1" />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded border border-dashed border-[var(--color-neutral-03)] px-3 py-2 text-sm text-[var(--color-neutral-08)]">
                  当前案件暂无关联住户记录。
                </div>
              )}
            </DetailSection>

            <DetailSection icon={History} title="走访与处置过程" description="走访记录与处理进度按时间排列。">
              <div className="space-y-5">
                <div>
                  <div className="mb-2 text-xs text-[var(--color-neutral-08)]">最近走访记录</div>
                  {selectedContext?.recentVisits.length ? (
                    <div className="space-y-2">
                      {selectedContext.recentVisits.map((visit) => (
                        <div
                          key={visit.id}
                          className="flex items-start justify-between gap-4 rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-[var(--color-neutral-11)]">{visit.content}</p>
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
                    <div className="rounded border border-dashed border-[var(--color-neutral-03)] px-3 py-2 text-sm text-[var(--color-neutral-08)]">
                      暂无走访记录，建议安排一次跟进走访。
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-3 text-xs text-[var(--color-neutral-08)]">处理进度</div>
                  <div className="space-y-4 pl-2 border-l-2 border-[var(--color-neutral-03)] ml-2">
                    {[...selectedConflict.timeline].reverse().map((item, index) => (
                      <div key={`${selectedConflict.id}-timeline-${index}`} className="relative pl-6 pb-2">
                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--color-brand-primary-hover)] ring-2 ring-[var(--color-neutral-01)]" />
                        <div className="flex justify-between text-xs text-[var(--color-neutral-08)] mb-1">
                          <span>{item.date}</span>
                          <span>{item.operator}</span>
                        </div>
                        <div className="text-sm text-[var(--color-neutral-10)]">{item.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DetailSection>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--color-neutral-08)]">未找到案件详情</div>
        )}
      </DetailDialogShell>

      <ConfirmDialog
        open={isResolveConfirmOpen}
        onOpenChange={setIsResolveConfirmOpen}
        title="标记为已化解"
        description="确定将该纠纷标记为已化解吗？"
        confirmText="标记化解"
        destructive
        onConfirm={() => void handleMarkResolved()}
      />
    </div>
  );
}
