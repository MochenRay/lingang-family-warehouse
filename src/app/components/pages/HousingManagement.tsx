import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  ChevronRight,
  Grid3x3,
  Home,
  Layers,
  Loader2,
  Warehouse,
} from 'lucide-react';
import { toast } from 'sonner';
import { FinderColumn, type FinderColumnItem } from '../housing/FinderColumn';
import { HouseDetailPanel } from '../housing/HouseDetailPanel';
import {
  deriveHousingFinderModel,
  extractHouseFloor,
  type HousingFinderSelection,
  type HousingFinderStats,
} from '../housing/finderModel';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { houseRepository } from '../../services/repositories/houseRepository';
import type { Grid, House, HousingHistory, Person } from '../../types/core';
import { StatCard } from '../patterns/StatCard';
import { SearchInput } from '../patterns/FilterBar';
import { ConfirmDialog } from '../patterns/ConfirmDialog';
import { DIALOG_CLASS, PANEL_CLASS } from '../patterns/surfaces';
import { PageHeader } from './PageHeader';

const fieldClassName =
  'h-9 border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-08)] focus-visible:ring-[var(--color-brand-primary-hover)]/40';
const labelClassName = 'text-xs font-semibold text-[var(--color-neutral-08)]';
const selectTriggerClassName =
  'h-9 border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]';
const outlineButtonClassName =
  'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]';
const finderColumnClassName = [
  PANEL_CLASS,
  'min-h-[440px]',
  '[&_header]:!border-[var(--color-neutral-03)]',
  '[&_p]:!text-[var(--color-neutral-08)] [&_h3]:!text-[var(--color-neutral-11)]',
].join(' ');

function finderColumnShellClass(collapsed: boolean, expandedClassName = 'min-w-[280px] w-[320px]') {
  return [
    'flex-shrink-0 transition-[width,min-width] duration-300',
    collapsed ? 'w-[112px] min-w-[112px]' : expandedClassName,
  ].join(' ');
}

function sameSelection(left: HousingFinderSelection, right: HousingFinderSelection) {
  return (
    left.community === right.community &&
    left.building === right.building &&
    left.unit === right.unit &&
    left.floor === right.floor &&
    left.houseId === right.houseId
  );
}

function normalizeSelection(
  current: HousingFinderSelection,
  houses: House[],
  grids: Grid[],
  searchKeyword: string,
): HousingFinderSelection {
  const next: HousingFinderSelection = { ...current };
  let model = deriveHousingFinderModel(houses, grids, next, searchKeyword);

  if (next.community && !model.communities.some((item) => item.value === next.community)) {
    next.community = undefined;
    next.building = undefined;
    next.unit = undefined;
    next.floor = undefined;
    next.houseId = undefined;
  }

  model = deriveHousingFinderModel(houses, grids, next, searchKeyword);
  if (next.building && !model.buildings.some((item) => item.value === next.building)) {
    next.building = undefined;
    next.unit = undefined;
    next.floor = undefined;
    next.houseId = undefined;
  }

  model = deriveHousingFinderModel(houses, grids, next, searchKeyword);
  if (next.unit && !model.units.some((item) => item.value === next.unit)) {
    next.unit = undefined;
    next.floor = undefined;
    next.houseId = undefined;
  }

  model = deriveHousingFinderModel(houses, grids, next, searchKeyword);
  if (next.floor && !model.floors.some((item) => item.value === next.floor)) {
    next.floor = undefined;
    next.houseId = undefined;
  }

  model = deriveHousingFinderModel(houses, grids, next, searchKeyword);
  if (next.houseId && !model.houses.some((item) => item.house.id === next.houseId)) {
    next.houseId = undefined;
  }

  return next;
}

type HouseEditForm = {
  communityName: string;
  building: string;
  unit: string;
  room: string;
  address: string;
  ownerName: string;
  ownerPhone: string;
  ownerAddress: string;
  area: string;
  type: House['type'];
  houseType: NonNullable<House['houseType']> | '';
  occupancyStatus: NonNullable<House['occupancyStatus']> | '';
  residenceType: NonNullable<House['residenceType']> | '';
  tagsText: string;
};

function buildHouseEditForm(house: House): HouseEditForm {
  return {
    communityName: house.communityName ?? '',
    building: house.building ?? '',
    unit: house.unit ?? '',
    room: house.room ?? '',
    address: house.address ?? '',
    ownerName: house.ownerName ?? '',
    ownerPhone: house.ownerPhone ?? '',
    ownerAddress: house.ownerAddress ?? '',
    area: house.area ?? '',
    type: house.type,
    houseType: house.houseType ?? '',
    occupancyStatus: house.occupancyStatus ?? '',
    residenceType: house.residenceType ?? '',
    tagsText: (house.tags ?? []).join('，'),
  };
}

function normalizeTags(tagsText: string) {
  return tagsText
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function FinderStatsStrip({ stats }: { stats: HousingFinderStats }) {
  return (
    <div className="grid gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(220px,0.9fr)]">
      <StatCard label="房屋总数" value={stats.total} hint={`楼栋 ${stats.buildings}`} />
      <StatCard label="自住" value={stats.selfOccupied} hint="常住台账" tone="info" />
      <StatCard label="出租" value={stats.rental} hint="流动关注" tone="warning" />
      <StatCard label="空置/经营" value={stats.vacant + stats.commercial} hint={`${stats.vacant} 空置 / ${stats.commercial} 经营`} />
      <div className="rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[var(--color-neutral-08)]">信息完整度</div>
            <div className="mt-1 text-2xl font-semibold text-[var(--color-neutral-11)]">{stats.completionRate}%</div>
          </div>
          <div className="text-right text-xs text-[var(--color-neutral-08)]">
            <div>均面 {stats.avgArea}㎡</div>
            <div className="mt-1">均住 {stats.avgMembers} 人</div>
          </div>
        </div>
        <Progress value={stats.completionRate} className="mt-3 h-1.5" />
      </div>
    </div>
  );
}

function toFinderItems(
  items: Array<{ id: string; label: string; count: number; subtitle?: string; active?: boolean }>,
  icon: FinderColumnItem['icon'],
): FinderColumnItem[] {
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    subtitle: item.subtitle,
    active: item.active,
    icon,
  }));
}

export function HousingManagement() {
  const [houses, setHouses] = useState<House[]>([]);
  const [houseTotal, setHouseTotal] = useState(0);
  const [grids, setGrids] = useState<Grid[]>([]);
  const [selection, setSelection] = useState<HousingFinderSelection>({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [residents, setResidents] = useState<Person[]>([]);
  const [history, setHistory] = useState<HousingHistory[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [editForm, setEditForm] = useState<HouseEditForm | null>(null);
  const [pendingDeleteHouse, setPendingDeleteHouse] = useState<House | null>(null);
  const columnsContainerRef = useRef<HTMLDivElement>(null);
  const prevSelectionRef = useRef<HousingFinderSelection>({});

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [housesResult, nextGrids] = await Promise.all([
        houseRepository.getHousesList(),
        houseRepository.getGrids(),
      ]);
      const nextHouses = housesResult.items;
      setHouseTotal(housesResult.total);
      setHouses(nextHouses);
      setGrids(nextGrids);
    } catch (error) {
      console.error('Failed to load housing data', error);
      setLoadError(error instanceof Error ? error.message : '房屋台账读取失败');
      toast.error('房屋台账读取失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // 消费 URL 深链；保留 sessionStorage 兼容既有页面跳转。
  useEffect(() => {
    const queryHouseId = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('houseId')
      : null;
    const legacyHouseId = typeof window !== 'undefined' ? window.sessionStorage.getItem('app_focus_house_id') : null;
    const focusHouseId = queryHouseId ?? legacyHouseId;
    if (!focusHouseId || houses.length === 0) {
      return;
    }

    const targetHouse = houses.find((house) => house.id === focusHouseId);
    window.sessionStorage.removeItem('app_focus_house_id');

    if (!targetHouse) {
      if (queryHouseId) {
        const url = new URL(window.location.href);
        url.searchParams.delete('houseId');
        window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
        toast.error('未找到返回房屋，已保留房屋台账列表');
      }
      return;
    }

    const nextSearchKeyword = '';
    setSearchKeyword(nextSearchKeyword);
    setSelection(normalizeSelection(
      {
        community: targetHouse.communityName,
        building: targetHouse.building,
        unit: targetHouse.unit,
        floor: extractHouseFloor(targetHouse.room),
        houseId: targetHouse.id,
      },
      houses,
      grids,
      nextSearchKeyword,
    ));
  }, [houses, grids]);

  useEffect(() => {
    setSelection((current) => {
      const next = normalizeSelection(current, houses, grids, searchKeyword);
      return sameSelection(current, next) ? current : next;
    });
  }, [houses, grids, searchKeyword]);

  const finderModel = useMemo(
    () => deriveHousingFinderModel(houses, grids, selection, searchKeyword),
    [houses, grids, selection, searchKeyword],
  );
  const finderStats = useMemo(
    () => ({ ...finderModel.stats, total: houseTotal }),
    [finderModel.stats, houseTotal],
  );

  const selectedHouse = finderModel.selectedHouse;

  useEffect(() => {
    let cancelled = false;

    if (!selection.houseId) {
      setResidents([]);
      setHistory([]);
      setDetailError(null);
      setIsDetailLoading(false);
      return;
    }

    setIsDetailLoading(true);
    setDetailError(null);

    Promise.all([
      houseRepository.getHouseResidents(selection.houseId),
      houseRepository.getHousingHistory(selection.houseId),
    ])
      .then(([nextResidents, nextHistory]) => {
        if (cancelled) {
          return;
        }
        setResidents(nextResidents);
        setHistory(nextHistory);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.error('Failed to load house detail', error);
        setResidents([]);
        setHistory([]);
        setDetailError(error instanceof Error ? error.message : '房屋详情读取失败');
      })
      .finally(() => {
        if (!cancelled) {
          setIsDetailLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selection.houseId]);

  useEffect(() => {
    const prev = prevSelectionRef.current;
    const shouldScroll =
      (selection.community && !prev.community) ||
      (selection.building && !prev.building) ||
      (selection.unit && !prev.unit) ||
      (selection.floor && !prev.floor) ||
      (selection.houseId && !prev.houseId);

    if (shouldScroll && columnsContainerRef.current) {
      columnsContainerRef.current.scrollTo({
        left: columnsContainerRef.current.scrollWidth,
        behavior: 'smooth',
      });
    }
    prevSelectionRef.current = selection;
  }, [selection]);

  const applySelection = (next: HousingFinderSelection) => {
    setSelection(normalizeSelection(next, houses, grids, searchKeyword));
  };

  const selectCommunity = (item: FinderColumnItem) => {
    applySelection({ community: item.label });
  };

  const selectBuilding = (item: FinderColumnItem) => {
    applySelection({ community: selection.community, building: item.label });
  };

  const selectUnit = (item: FinderColumnItem) => {
    applySelection({
      community: selection.community,
      building: selection.building,
      unit: item.label,
    });
  };

  const selectFloor = (item: FinderColumnItem) => {
    applySelection({
      community: selection.community,
      building: selection.building,
      unit: selection.unit,
      floor: item.label,
    });
  };

  const selectHouse = (item: FinderColumnItem) => {
    setSelection((current) => ({ ...current, houseId: item.id }));
  };

  const refreshSelectedHouse = () => {
    void loadData();
  };

  const openEditDialog = (house: House) => {
    setEditingHouse(house);
    setEditForm(buildHouseEditForm(house));
  };

  const closeEditDialog = () => {
    setEditingHouse(null);
    setEditForm(null);
  };

  const updateEditForm = <K extends keyof HouseEditForm>(key: K, value: HouseEditForm[K]) => {
    setEditForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const handleSaveEdit = async () => {
    if (!editingHouse || !editForm) {
      return;
    }

    const communityName = editForm.communityName.trim();
    const building = editForm.building.trim();
    const unit = editForm.unit.trim();
    const room = editForm.room.trim();
    const ownerName = editForm.ownerName.trim();

    if (!communityName || !building || !unit || !room || !ownerName) {
      toast.error('请补齐社区、楼栋、单元、房号和产权人');
      return;
    }

    setIsSaving(true);
    try {
      const fallbackAddress = `${communityName}${building}${unit}${room}`;
      const updatedHouse = await houseRepository.updateHouse(editingHouse.id, {
        communityName,
        building,
        unit,
        room,
        ownerName,
        address: editForm.address.trim() || fallbackAddress,
        ownerPhone: editForm.ownerPhone.trim() || undefined,
        ownerAddress: editForm.ownerAddress.trim() || undefined,
        area: editForm.area.trim(),
        type: editForm.type,
        houseType: editForm.houseType || undefined,
        occupancyStatus: editForm.occupancyStatus || undefined,
        residenceType: editForm.residenceType || undefined,
        tags: normalizeTags(editForm.tagsText),
        updatedAt: new Date().toISOString().slice(0, 10),
      });

      if (!updatedHouse) {
        throw new Error('房屋不存在或更新未返回结果');
      }

      toast.success('房屋信息已保存');
      closeEditDialog();
      await loadData();
      setSelection((current) => ({ ...current, houseId: editingHouse.id }));
    } catch (error) {
      console.error('Failed to update house', error);
      toast.error(error instanceof Error ? error.message : '房屋信息保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (house: House) => {
    setPendingDeleteHouse(house);
  };

  const confirmDeleteHouse = async () => {
    const house = pendingDeleteHouse;
    if (!house) {
      return;
    }

    setIsSaving(true);
    try {
      await houseRepository.deleteHouse(house.id);
      toast.success('房屋删除成功');
      setSelection((current) => (current.houseId === house.id ? { ...current, houseId: undefined } : current));
      await loadData();
    } catch (error) {
      console.error('Failed to delete house', error);
      toast.error(error instanceof Error ? error.message : '房屋删除失败');
    } finally {
      setIsSaving(false);
    }
  };

  const houseItems: FinderColumnItem[] = finderModel.houses.map((item) => ({
    id: item.house.id,
    label: `${item.house.room}`,
    subtitle: item.subtitle,
    trailing: (
      <Badge variant="outline" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-08)]">
        {item.house.type}
      </Badge>
    ),
    active: item.active,
    icon: Home,
  }));
  const communityColumnCollapsed = false;
  const buildingColumnCollapsed = false;
  const unitColumnCollapsed = false;
  const floorColumnCollapsed = false;

  const breadcrumbItems = [
    { label: selection.community, reset: () => applySelection({ community: selection.community }) },
    { label: selection.building, reset: () => applySelection({ community: selection.community, building: selection.building }) },
    { label: selection.unit, reset: () => applySelection({ community: selection.community, building: selection.building, unit: selection.unit }) },
    { label: selection.floor, reset: () => applySelection({ community: selection.community, building: selection.building, unit: selection.unit, floor: selection.floor }) },
    { label: selectedHouse?.room, reset: () => {} },
  ].filter((item): item is { label: string; reset: () => void } => Boolean(item.label));

  const openPersonDetail = (person: Person) => {
    if (selection.houseId) {
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.set('houseId', selection.houseId);
      window.history.replaceState(window.history.state, '', `${returnUrl.pathname}${returnUrl.search}${returnUrl.hash}`);
    }
    const target = new URL('/population', window.location.origin);
    target.searchParams.set('personId', person.id);
    window.history.pushState({ route: 'population', from: 'housing' }, '', `${target.pathname}${target.search}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="space-y-4 text-[var(--color-neutral-10)]">
      <PageHeader
        eyebrow="HOUSING LEDGER"
        title="房屋管理"
        description="按社区、楼栋、单元、楼层逐级浏览房屋台账，快速定位可查看和编辑的对象。"
      />

      <div className={`${PANEL_CLASS} px-4 py-3`}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-neutral-08)]">
              <Badge variant="outline" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]">
                房屋台账
              </Badge>
              <span>分层浏览</span>
              <span>·</span>
              <span>当前 {finderModel.filteredHouses.length} / {houseTotal} 套</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1 text-sm text-[var(--color-neutral-08)]">
              {breadcrumbItems.length > 0 ? (
                breadcrumbItems.map((item, index) => (
                  <span key={`${item.label}-${index}`} className="flex items-center gap-1">
                    {index > 0 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
                    <button
                      type="button"
                      onClick={item.reset}
                      className={index === breadcrumbItems.length - 1 ? 'text-[var(--color-neutral-11)]' : 'hover:text-[var(--color-neutral-11)] underline-offset-2 hover:underline'}
                    >
                      {item.label}
                    </button>
                  </span>
                ))
              ) : (
                <span>选择社区后开始浏览楼栋、单元、楼层与房屋。</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput
              value={searchKeyword}
              onChange={setSearchKeyword}
              placeholder="搜索地址、产权人、楼栋、单元、房号、标签"
              className="min-w-[280px]"
            />
          </div>
        </div>
      </div>

      <FinderStatsStrip stats={finderStats} />

      <div ref={columnsContainerRef} className="flex gap-3 overflow-x-auto pb-2">
        <div className={finderColumnShellClass(communityColumnCollapsed, !selection.community ? 'flex-1 min-w-0' : 'min-w-[280px] w-[320px]')}>
          <FinderColumn
            title="社区"
            description="社区列表"
            items={toFinderItems(finderModel.communities, Warehouse)}
            loading={isLoading}
            error={loadError}
            onRetry={loadData}
            onItemClick={selectCommunity}
            collapsed={communityColumnCollapsed}
            onHeaderClick={communityColumnCollapsed ? () => applySelection({}) : undefined}
            emptyTitle="没有社区数据"
            emptyDescription="当前接口没有返回可浏览房屋，或搜索条件没有命中社区。"
            className={finderColumnClassName}
          />
        </div>
        {selection.community && (
          <div className={`${finderColumnShellClass(buildingColumnCollapsed)} animate-in slide-in-from-right-4 fade-in duration-300`}>
            <FinderColumn
              title={selection.community}
              description="楼栋列表"
              items={toFinderItems(finderModel.buildings, Building2)}
              loading={isLoading}
              error={loadError}
              onRetry={loadData}
              onItemClick={selectBuilding}
              collapsed={buildingColumnCollapsed}
              onHeaderClick={buildingColumnCollapsed ? () => applySelection({ community: selection.community }) : undefined}
              emptyTitle="没有楼栋"
              emptyDescription="当前社区下没有可浏览楼栋，请切换社区或清空搜索条件。"
              className={finderColumnClassName}
            />
          </div>
        )}
        {selection.building && (
          <div className={`${finderColumnShellClass(unitColumnCollapsed)} animate-in slide-in-from-right-4 fade-in duration-300`}>
            <FinderColumn
              title={selection.building}
              description="单元列表"
              items={toFinderItems(finderModel.units, Layers)}
              loading={isLoading}
              error={loadError}
              onRetry={loadData}
              onItemClick={selectUnit}
              collapsed={unitColumnCollapsed}
              onHeaderClick={unitColumnCollapsed ? () => applySelection({ community: selection.community, building: selection.building }) : undefined}
              emptyTitle="没有单元"
              emptyDescription="当前楼栋下没有可浏览单元，请切换楼栋或清空搜索条件。"
              className={finderColumnClassName}
            />
          </div>
        )}
        {selection.unit && (
          <div className={`${finderColumnShellClass(floorColumnCollapsed)} animate-in slide-in-from-right-4 fade-in duration-300`}>
            <FinderColumn
              title={selection.unit}
              description="楼层列表"
              items={toFinderItems(finderModel.floors, Grid3x3)}
              loading={isLoading}
              error={loadError}
              onRetry={loadData}
              onItemClick={selectFloor}
              collapsed={floorColumnCollapsed}
              onHeaderClick={floorColumnCollapsed ? () => applySelection({ community: selection.community, building: selection.building }) : undefined}
              emptyTitle="没有楼层"
              emptyDescription="当前单元下没有可浏览楼层，请切换单元或清空搜索条件。"
              className={finderColumnClassName}
            />
          </div>
        )}
        {selection.floor && (
          <div className="min-w-[280px] w-[320px] flex-shrink-0 animate-in slide-in-from-right-4 fade-in duration-300">
            <FinderColumn
              title={selection.floor}
              description="房屋列表"
              items={houseItems}
              selectedId={selection.houseId}
              loading={isLoading}
              error={loadError}
              onRetry={loadData}
              onItemClick={selectHouse}
              emptyTitle="没有房屋"
              emptyDescription="当前楼层下没有可浏览房屋，请切换楼层或清空搜索条件。"
              className={finderColumnClassName}
            />
          </div>
        )}
      </div>

      <Dialog open={Boolean(selection.houseId)} onOpenChange={(open) => {
        if (!open) {
          setSelection((current) => ({ ...current, houseId: undefined }));
          const url = new URL(window.location.href);
          if (url.searchParams.has('houseId')) {
            url.searchParams.delete('houseId');
            window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
          }
        }
      }}>
        <DialogContent className={`max-h-[90vh] max-w-4xl overflow-y-auto shadow-2xl ${DIALOG_CLASS}`}>
          <DialogHeader className="sr-only">
            <DialogTitle>
              {selectedHouse
                ? `${selectedHouse.communityName} ${selectedHouse.building} ${selectedHouse.unit} ${selectedHouse.room}`
                : '房屋详情'}
            </DialogTitle>
            <DialogDescription>查看房屋基础信息、现居住户和居住历史。</DialogDescription>
          </DialogHeader>
          <HouseDetailPanel
            house={selectedHouse}
            residents={residents}
            history={history}
            loading={isDetailLoading}
            error={detailError}
            onEdit={openEditDialog}
            onDelete={handleDelete}
            onRefresh={refreshSelectedHouse}
            onViewPerson={openPersonDetail}
            isDeleting={isSaving}
            className="border-0 min-h-0"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingHouse)} onOpenChange={(open) => {
        if (!open) {
          closeEditDialog();
        }
      }}>
        <DialogContent className={`max-h-[86vh] max-w-3xl overflow-y-auto shadow-2xl ${DIALOG_CLASS}`}>
          <DialogHeader>
            <DialogTitle className="text-[var(--color-neutral-11)]">编辑房屋信息</DialogTitle>
            <DialogDescription className="text-[var(--color-neutral-08)]">保存后同步刷新房屋台账、详情面板和本地降级数据。</DialogDescription>
          </DialogHeader>

          {editForm ? (
            <div className="grid gap-3 py-2 md:grid-cols-2">
              <div className="space-y-2">
                <Label className={labelClassName}>社区 *</Label>
                <Input className={fieldClassName} value={editForm.communityName} onChange={(event) => updateEditForm('communityName', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className={labelClassName}>楼栋 *</Label>
                <Input className={fieldClassName} value={editForm.building} onChange={(event) => updateEditForm('building', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className={labelClassName}>单元 *</Label>
                <Input className={fieldClassName} value={editForm.unit} onChange={(event) => updateEditForm('unit', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className={labelClassName}>房号 *</Label>
                <Input className={fieldClassName} value={editForm.room} onChange={(event) => updateEditForm('room', event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className={labelClassName}>完整地址</Label>
                <Input className={fieldClassName} value={editForm.address} onChange={(event) => updateEditForm('address', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className={labelClassName}>产权人 *</Label>
                <Input className={fieldClassName} value={editForm.ownerName} onChange={(event) => updateEditForm('ownerName', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className={labelClassName}>产权人电话</Label>
                <Input className={fieldClassName} value={editForm.ownerPhone} onChange={(event) => updateEditForm('ownerPhone', event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className={labelClassName}>产权人居住地址</Label>
                <Input className={fieldClassName} value={editForm.ownerAddress} onChange={(event) => updateEditForm('ownerAddress', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className={labelClassName}>建筑面积</Label>
                <Input className={fieldClassName} value={editForm.area} onChange={(event) => updateEditForm('area', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className={labelClassName}>房屋用途</Label>
                <Select value={editForm.type} onValueChange={(value) => updateEditForm('type', value as House['type'])}>
                  <SelectTrigger className={selectTriggerClassName}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="自住">自住</SelectItem>
                    <SelectItem value="出租">出租</SelectItem>
                    <SelectItem value="空置">空置</SelectItem>
                    <SelectItem value="经营">经营</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={labelClassName}>房屋类型</Label>
                <Select value={editForm.houseType || "none"} onValueChange={(value) => updateEditForm('houseType', value === "none" ? "" : value as HouseEditForm['houseType'])}>
                  <SelectTrigger className={selectTriggerClassName}><SelectValue placeholder="选择房屋类型" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未设置</SelectItem>
                    <SelectItem value="普通住宅">普通住宅</SelectItem>
                    <SelectItem value="门市">门市</SelectItem>
                    <SelectItem value="草厦子">草厦子</SelectItem>
                    <SelectItem value="车库">车库</SelectItem>
                    <SelectItem value="阁楼">阁楼</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={labelClassName}>人房关系</Label>
                <Select value={editForm.occupancyStatus || "none"} onValueChange={(value) => updateEditForm('occupancyStatus', value === "none" ? "" : value as HouseEditForm['occupancyStatus'])}>
                  <SelectTrigger className={selectTriggerClassName}><SelectValue placeholder="选择人房关系" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未设置</SelectItem>
                    <SelectItem value="人在户在">人在户在</SelectItem>
                    <SelectItem value="户在人不在">户在人不在</SelectItem>
                    <SelectItem value="人不在户不在">人不在户不在</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={labelClassName}>居住类型</Label>
                <Select value={editForm.residenceType || "none"} onValueChange={(value) => updateEditForm('residenceType', value === "none" ? "" : value as HouseEditForm['residenceType'])}>
                  <SelectTrigger className={selectTriggerClassName}><SelectValue placeholder="选择居住类型" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">未设置</SelectItem>
                    <SelectItem value="自住">自住</SelectItem>
                    <SelectItem value="租住">租住</SelectItem>
                    <SelectItem value="闲置">闲置</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className={labelClassName}>标签</Label>
                <Input className={fieldClassName} value={editForm.tagsText} onChange={(event) => updateEditForm('tagsText', event.target.value)} placeholder="多个标签用逗号分隔" />
              </div>
            </div>
          ) : null}

          <DialogFooter className="border-t border-[var(--color-neutral-03)] pt-3">
            <Button variant="outline" className={outlineButtonClassName} onClick={closeEditDialog} disabled={isSaving}>取消</Button>
            <Button onClick={() => void handleSaveEdit()} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDeleteHouse)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteHouse(null);
          }
        }}
        title="删除房屋"
        description="确定要删除此房屋吗？仅允许删除没有住户和历史记录的空房屋。"
        confirmText="删除"
        destructive
        onConfirm={() => void confirmDeleteHouse()}
      />
    </div>
  );
}
