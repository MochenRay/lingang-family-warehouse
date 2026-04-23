import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  ChevronRight,
  Grid3x3,
  Home,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  Warehouse,
} from 'lucide-react';
import { toast } from 'sonner';
import { FinderColumn, type FinderColumnItem } from '../housing/FinderColumn';
import { HouseDetailPanel } from '../housing/HouseDetailPanel';
import {
  deriveHousingFinderModel,
  type HousingFinderSelection,
  type HousingFinderStats,
} from '../housing/finderModel';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { houseRepository } from '../../services/repositories/houseRepository';
import type { Grid, House, HousingHistory, Person } from '../../types/core';

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
  if (!next.community && model.communities[0]) {
    next.community = model.communities[0].value;
  }

  model = deriveHousingFinderModel(houses, grids, next, searchKeyword);
  if (next.building && !model.buildings.some((item) => item.value === next.building)) {
    next.building = undefined;
    next.unit = undefined;
    next.floor = undefined;
    next.houseId = undefined;
  }
  if (!next.building && model.buildings[0]) {
    next.building = model.buildings[0].value;
  }

  model = deriveHousingFinderModel(houses, grids, next, searchKeyword);
  if (next.unit && !model.units.some((item) => item.value === next.unit)) {
    next.unit = undefined;
    next.floor = undefined;
    next.houseId = undefined;
  }
  if (!next.unit && model.units[0]) {
    next.unit = model.units[0].value;
  }

  model = deriveHousingFinderModel(houses, grids, next, searchKeyword);
  if (next.floor && !model.floors.some((item) => item.value === next.floor)) {
    next.floor = undefined;
    next.houseId = undefined;
  }
  if (!next.floor && model.floors[0]) {
    next.floor = model.floors[0].value;
  }

  model = deriveHousingFinderModel(houses, grids, next, searchKeyword);
  if (next.houseId && !model.houses.some((item) => item.house.id === next.houseId)) {
    next.houseId = undefined;
  }
  if (!next.houseId && model.houses[0]) {
    next.houseId = model.houses[0].house.id;
  }

  return next;
}

function statCards(stats: HousingFinderStats) {
  return [
    { label: '房屋总数', value: stats.total, hint: `楼栋 ${stats.buildings}`, tone: 'text-[var(--color-brand-primary)]' },
    { label: '自住', value: stats.selfOccupied, hint: '常住台账', tone: 'text-blue-300' },
    { label: '出租', value: stats.rental, hint: '流动关注', tone: 'text-orange-300' },
    { label: '空置/经营', value: stats.vacant + stats.commercial, hint: `${stats.vacant} 空置 / ${stats.commercial} 经营`, tone: 'text-purple-300' },
  ];
}

function FinderStatsStrip({ stats }: { stats: HousingFinderStats }) {
  return (
    <div className="grid gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(220px,0.9fr)]">
      {statCards(stats).map((item) => (
        <div
          key={item.label}
          className="rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] px-4 py-3"
        >
          <div className="text-xs text-[var(--color-neutral-08)]">{item.label}</div>
          <div className={`mt-1 text-2xl font-semibold ${item.tone}`}>{item.value}</div>
          <div className="mt-1 text-xs text-[var(--color-neutral-08)]">{item.hint}</div>
        </div>
      ))}
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
    count: item.count,
    subtitle: item.subtitle,
    active: item.active,
    icon,
  }));
}

export function HousingManagement() {
  const [houses, setHouses] = useState<House[]>([]);
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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [nextHouses, nextGrids] = await Promise.all([
        houseRepository.getHouses(),
        houseRepository.getGrids(),
      ]);
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

  const handleDelete = async (house: House) => {
    if (!confirm('确定要删除此房屋吗？仅允许删除没有住户和历史记录的空房屋。')) {
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
    count: item.house.type,
    active: item.active,
    icon: Home,
  }));

  const crumbItems = [
    selection.community,
    selection.building,
    selection.unit,
    selection.floor,
    selectedHouse?.room,
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] px-4 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-neutral-08)]">
              <Badge variant="outline" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]">
                Finder 台账
              </Badge>
              <span>真实接口 /houses 口径</span>
              <span>·</span>
              <span>当前 {finderModel.filteredHouses.length} / {houses.length} 套</span>
            </div>
            <h1 className="mt-2 text-xl font-semibold text-[var(--color-neutral-11)]">房屋管理</h1>
            <div className="mt-2 flex flex-wrap items-center gap-1 text-sm text-[var(--color-neutral-08)]">
              {crumbItems.length > 0 ? (
                crumbItems.map((item, index) => (
                  <span key={`${item}-${index}`} className="flex items-center gap-1">
                    {index > 0 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
                    <span className={index === crumbItems.length - 1 ? 'text-[var(--color-neutral-11)]' : undefined}>
                      {item}
                    </span>
                  </span>
                ))
              ) : (
                <span>选择左侧区域后开始浏览楼栋、单元、楼层与房屋详情。</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-[280px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-neutral-08)]" />
              <Input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="搜索地址、产权人、楼栋、单元、房号、标签"
                className="h-10 border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] pl-9 text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-08)]"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => void loadData()}
              disabled={isLoading}
              className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)]"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              刷新
            </Button>
          </div>
        </div>
      </div>

      <FinderStatsStrip stats={finderModel.stats} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
        <div className="grid min-h-[560px] gap-3 xl:grid-cols-5">
          <FinderColumn
            title="社区"
            description="按现有房屋 communityName 派生"
            items={toFinderItems(finderModel.communities, Warehouse)}
            loading={isLoading}
            error={loadError}
            onRetry={loadData}
            onItemClick={selectCommunity}
            emptyTitle="没有社区数据"
            emptyDescription="当前接口没有返回可浏览房屋，或搜索条件没有命中社区。"
            className="bg-[var(--color-neutral-02)]"
          />
          <FinderColumn
            title="楼栋"
            description={selection.community ?? '先选社区'}
            items={toFinderItems(finderModel.buildings, Building2)}
            loading={isLoading}
            error={loadError}
            onRetry={loadData}
            onItemClick={selectBuilding}
            emptyTitle="没有楼栋"
            emptyDescription="当前社区下没有可浏览楼栋，请切换社区或清空搜索条件。"
            className="bg-[var(--color-neutral-02)]"
          />
          <FinderColumn
            title="单元"
            description={selection.building ?? '先选楼栋'}
            items={toFinderItems(finderModel.units, Layers)}
            loading={isLoading}
            error={loadError}
            onRetry={loadData}
            onItemClick={selectUnit}
            emptyTitle="没有单元"
            emptyDescription="当前楼栋下没有可浏览单元，请切换楼栋或清空搜索条件。"
            className="bg-[var(--color-neutral-02)]"
          />
          <FinderColumn
            title="楼层"
            description={selection.unit ?? '先选单元'}
            items={toFinderItems(finderModel.floors, Grid3x3)}
            loading={isLoading}
            error={loadError}
            onRetry={loadData}
            onItemClick={selectFloor}
            emptyTitle="没有楼层"
            emptyDescription="当前单元下没有可浏览楼层，请切换单元或清空搜索条件。"
            className="bg-[var(--color-neutral-02)]"
          />
          <FinderColumn
            title="房屋"
            description={selection.floor ?? '先选楼层'}
            items={houseItems}
            selectedId={selection.houseId}
            loading={isLoading}
            error={loadError}
            onRetry={loadData}
            onItemClick={selectHouse}
            emptyTitle="没有房屋"
            emptyDescription="当前楼层下没有可浏览房屋，请切换楼层或清空搜索条件。"
            className="bg-[var(--color-neutral-02)]"
          />
        </div>

        <HouseDetailPanel
          house={selectedHouse}
          residents={residents}
          history={history}
          loading={isDetailLoading}
          error={detailError}
          onDelete={(house) => void handleDelete(house)}
          onRefresh={refreshSelectedHouse}
          isDeleting={isSaving}
        />
      </div>
    </div>
  );
}
