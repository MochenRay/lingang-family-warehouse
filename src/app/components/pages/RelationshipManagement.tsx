import { useEffect, useMemo, useState } from 'react';
import { Eye, History, Home, Link2, Shield, UserCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { relationshipLedgerRepository } from '../../services/repositories/relationshipLedgerRepository';
import type { House, HousingHistory, Person } from '../../types/core';
import { toast } from 'sonner';
import { StatCard } from '../patterns/StatCard';
import { StatusBadge, type StatusTone } from '../patterns/StatusBadge';
import { DataTableBody } from '../patterns/DataTableShell';
import { SearchInput } from '../patterns/FilterBar';
import { PANEL_CLASS } from '../patterns/surfaces';
import { DetailDialogShell, DetailField, DetailSection } from '../patterns/DetailDialog';
import { PageHeader } from './PageHeader';

type RelationType = '现居' | '历史';
type OccupancyRelationship = '业主' | '家属' | '租客' | '其他';

interface RelationshipRow {
  id: string;
  relationType: RelationType;
  relationship: OccupancyRelationship;
  personId?: string;
  personName: string;
  personIdCard?: string;
  houseId: string;
  houseAddress: string;
  moveInDate: string;
  moveOutDate?: string;
  moveOutReason?: string;
  risk?: Person['risk'];
  tags?: string[];
  person?: Person;
  house: House;
  history?: HousingHistory;
}

const RELATIONSHIP_BADGE_TONE: Record<OccupancyRelationship, StatusTone> = {
  业主: 'info',
  家属: 'success',
  租客: 'warning',
  其他: 'neutral',
};

const RISK_BADGE_TONE: Record<string, StatusTone> = {
  High: 'error',
  Medium: 'warning',
  Low: 'success',
};

const RELATION_TYPE_TONE: Record<RelationType, StatusTone> = {
  现居: 'info',
  历史: 'neutral',
};

const HOUSE_TYPE_TONE: Record<House['type'], StatusTone> = {
  自住: 'info',
  出租: 'warning',
  空置: 'neutral',
  经营: 'success',
  其他: 'neutral',
};

function parseHistoryPeriod(period: string): { moveInDate: string; moveOutDate?: string } {
  const [rawMoveIn, rawMoveOut] = period.split('~').map((item) => item.trim());
  return {
    moveInDate: rawMoveIn || '-',
    moveOutDate: rawMoveOut && rawMoveOut !== '至今' ? rawMoveOut : undefined,
  };
}

function inferRelationship(person: Person, house: House, residents: Person[]): OccupancyRelationship {
  if (person.name === house.ownerName) {
    return '业主';
  }

  const ownerResident = residents.find((resident) => resident.name === house.ownerName);
  const hasFamilyLink =
    person.familyRelations?.some((relation) => relation.relatedPersonId === ownerResident?.id) ||
    ownerResident?.familyRelations?.some((relation) => relation.relatedPersonId === person.id);

  if (hasFamilyLink) {
    return '家属';
  }

  if (house.type === '出租' || house.residenceType === '租住') {
    return '租客';
  }

  return '其他';
}

export function RelationshipManagement() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentRelationships, setCurrentRelationships] = useState<RelationshipRow[]>([]);
  const [historyRelationships, setHistoryRelationships] = useState<RelationshipRow[]>([]);
  const [selectedRelationship, setSelectedRelationship] = useState<RelationshipRow | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { people, houses, history } = await relationshipLedgerRepository.getSnapshot();

      const houseMap = new Map(houses.map((house) => [house.id, house]));
      const residentsByHouseId = people.reduce<Map<string, Person[]>>((acc, person) => {
        if (!person.houseId) {
          return acc;
        }
        const current = acc.get(person.houseId) ?? [];
        current.push(person);
        acc.set(person.houseId, current);
        return acc;
      }, new Map());

      const nextCurrentRelationships = people.reduce<RelationshipRow[]>((items, person) => {
        if (!person.houseId || !houseMap.has(person.houseId)) {
          return items;
        }
          const house = houseMap.get(person.houseId!);
          if (!house) {
            return items;
          }
          const residents = residentsByHouseId.get(house.id) ?? [];
          items.push({
            id: `current-${person.id}-${house.id}`,
            relationType: '现居',
            relationship: inferRelationship(person, house, residents),
            personId: person.id,
            personName: person.name,
            personIdCard: person.idCard,
            houseId: house.id,
            houseAddress: house.address,
            moveInDate: person.updatedAt,
            risk: person.risk,
            tags: person.tags,
            person,
            house,
          });
          return items;
        }, []);

      const nextHistoryRelationships = history.reduce<RelationshipRow[]>((items, item) => {
        const house = houseMap.get(item.houseId);
        if (!house) {
          return items;
        }
        const period = parseHistoryPeriod(item.period);
        items.push({
          id: `history-${item.id}`,
          relationType: '历史' as const,
          relationship: item.type as OccupancyRelationship,
          personName: item.personName,
          houseId: house.id,
          houseAddress: house.address,
          moveInDate: period.moveInDate,
          moveOutDate: period.moveOutDate,
          moveOutReason: item.moveOutReason ?? undefined,
          house,
          history: item,
        });
        return items;
      }, []);

      setCurrentRelationships(nextCurrentRelationships);
      setHistoryRelationships(nextHistoryRelationships);
    } catch (error) {
      console.error('Failed to load relationship data', error);
      toast.error('人房关系数据加载失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const keyword = searchKeyword.trim();
  const filteredCurrentRelationships = useMemo(() => {
    if (!keyword) {
      return currentRelationships;
    }
    return currentRelationships.filter((relationship) =>
      [
        relationship.personName,
        relationship.personIdCard ?? '',
        relationship.houseAddress,
        relationship.relationship,
      ].some((field) => field.includes(keyword)),
    );
  }, [currentRelationships, keyword]);

  const filteredHistoryRelationships = useMemo(() => {
    if (!keyword) {
      return historyRelationships;
    }
    return historyRelationships.filter((relationship) =>
      [
        relationship.personName,
        relationship.houseAddress,
        relationship.relationship,
        relationship.moveOutReason ?? '',
      ].some((field) => field.includes(keyword)),
    );
  }, [historyRelationships, keyword]);

  const stats = {
    total: currentRelationships.length + historyRelationships.length,
    current: currentRelationships.length,
    history: historyRelationships.length,
    owner: currentRelationships.filter((relationship) => relationship.relationship === '业主').length,
  };

  const openRelationshipDetail = (relationship: RelationshipRow) => {
    setSelectedRelationship(relationship);
    setIsViewDialogOpen(true);
  };

  const currentHousemates = selectedRelationship?.relationType === '现居'
    ? currentRelationships.filter(
        (relationship) =>
          relationship.houseId === selectedRelationship.houseId &&
          relationship.personId !== selectedRelationship.personId,
      )
    : [];

  return (
    <div className="space-y-4 text-[var(--color-neutral-10)]">
      <PageHeader
        eyebrow="RELATIONSHIP LEDGER"
        title="人房关系管理"
        description="对齐人员、房屋和迁入迁出记录，识别人房分离与关系异常。"
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard label="总关系数" value={stats.total} />
        <StatCard label="现居关系" value={stats.current} tone="success" />
        <StatCard label="历史关系" value={stats.history} />
        <StatCard label="现居业主" value={stats.owner} tone="warning" />
      </div>

      <Card className={PANEL_CLASS}>
        <CardContent className="py-4">
          <div className="flex items-center">
            <SearchInput
              value={searchKeyword}
              onChange={setSearchKeyword}
              placeholder="搜索人员姓名、身份证号、房屋地址..."
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card className={`overflow-hidden ${PANEL_CLASS}`}>
        <Tabs defaultValue="current" className="w-full">
          <CardHeader className="pb-3 pt-4">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-[var(--color-neutral-01)]">
              <TabsTrigger value="current" className="data-[state=active]:bg-[var(--color-brand-primary-hover)]/20 data-[state=active]:text-[var(--color-neutral-11)]">现居关系 ({filteredCurrentRelationships.length})</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-[var(--color-brand-primary-hover)]/20 data-[state=active]:text-[var(--color-neutral-11)]">历史关系 ({filteredHistoryRelationships.length})</TabsTrigger>
            </TabsList>
          </CardHeader>

          <TabsContent value="current">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-[var(--color-neutral-03)] hover:bg-transparent">
                    <TableHead className="text-xs text-[var(--color-neutral-08)]">人员姓名</TableHead>
                    <TableHead className="text-xs text-[var(--color-neutral-08)]">身份证号</TableHead>
                    <TableHead className="text-xs text-[var(--color-neutral-08)]">房屋地址</TableHead>
                    <TableHead className="text-xs text-[var(--color-neutral-08)]">关系</TableHead>
                    <TableHead className="text-xs text-[var(--color-neutral-08)]">风险</TableHead>
                    <TableHead className="text-xs text-[var(--color-neutral-08)]">绑定时间</TableHead>
                    <TableHead className="text-right text-xs text-[var(--color-neutral-08)]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <DataTableBody
                  loading={isLoading}
                  loadingText="正在加载现居关系..."
                  empty={filteredCurrentRelationships.length === 0}
                  emptyText="暂无现居关系数据"
                  columnCount={7}
                >
                  {filteredCurrentRelationships.map((relationship) => (
                    <TableRow key={relationship.id} className="border-[var(--color-neutral-03)]/45 hover:bg-[var(--color-brand-primary)]/8">
                      <TableCell className="text-[var(--color-neutral-10)]">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-[var(--color-brand-text)]" />
                          {relationship.personName}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-[var(--color-neutral-08)]">{relationship.personIdCard}</TableCell>
                      <TableCell className="text-[var(--color-neutral-10)]">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-[var(--color-status-success-text)]" />
                          {relationship.houseAddress}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={RELATIONSHIP_BADGE_TONE[relationship.relationship] ?? 'neutral'}>
                          {relationship.relationship}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={RISK_BADGE_TONE[relationship.risk ?? 'Low'] ?? 'neutral'}>
                          {relationship.risk ?? 'Low'}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-sm text-[var(--color-neutral-08)]">{relationship.moveInDate}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" aria-label="查看关系详情" onClick={() => openRelationshipDetail(relationship)} className="hover:bg-[var(--color-brand-primary-hover)]/12 hover:text-[var(--color-neutral-11)]">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </DataTableBody>
              </Table>
            </CardContent>
          </TabsContent>

          <TabsContent value="history">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-[var(--color-neutral-03)] hover:bg-transparent">
                    <TableHead className="text-xs text-[var(--color-neutral-08)]">人员姓名</TableHead>
                    <TableHead className="text-xs text-[var(--color-neutral-08)]">房屋地址</TableHead>
                    <TableHead className="text-xs text-[var(--color-neutral-08)]">关系</TableHead>
                    <TableHead className="text-xs text-[var(--color-neutral-08)]">入住时间</TableHead>
                    <TableHead className="text-xs text-[var(--color-neutral-08)]">迁出时间</TableHead>
                    <TableHead className="text-right text-xs text-[var(--color-neutral-08)]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <DataTableBody
                  loading={isLoading}
                  loadingText="正在加载历史关系..."
                  empty={filteredHistoryRelationships.length === 0}
                  emptyText="暂无历史关系数据"
                  columnCount={6}
                >
                  {filteredHistoryRelationships.map((relationship) => (
                    <TableRow key={relationship.id} className="border-[var(--color-neutral-03)]/45 hover:bg-[var(--color-brand-primary)]/8">
                      <TableCell className="text-[var(--color-neutral-10)]">
                        <div className="flex items-center gap-2">
                          <History className="h-4 w-4 text-[var(--color-brand-text)]" />
                          {relationship.personName}
                        </div>
                      </TableCell>
                      <TableCell className="text-[var(--color-neutral-10)]">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-[var(--color-status-success-text)]" />
                          {relationship.houseAddress}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={RELATIONSHIP_BADGE_TONE[relationship.relationship] ?? 'neutral'}>
                          {relationship.relationship}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-sm text-[var(--color-neutral-08)]">{relationship.moveInDate}</TableCell>
                      <TableCell className="text-sm text-[var(--color-neutral-08)]">{relationship.moveOutDate ?? '至今'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" aria-label="查看关系详情" onClick={() => openRelationshipDetail(relationship)} className="hover:bg-[var(--color-brand-primary-hover)]/12 hover:text-[var(--color-neutral-11)]">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </DataTableBody>
              </Table>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      <DetailDialogShell
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        maxWidth="4xl"
        contentLabel="人房关系详情"
        title={selectedRelationship ? `人房关系详情 · ${selectedRelationship.personName}` : '人房关系详情'}
        description={selectedRelationship ? (
          <span data-testid="relationship-detail-meta" className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span data-testid="relationship-detail-address" className="min-w-0 break-words">
              {selectedRelationship.houseAddress}
            </span>
            <span data-testid="relationship-detail-pills" className="flex shrink-0 flex-wrap gap-2">
              <StatusBadge tone={RELATION_TYPE_TONE[selectedRelationship.relationType]}>{selectedRelationship.relationType}</StatusBadge>
              <StatusBadge tone={RELATIONSHIP_BADGE_TONE[selectedRelationship.relationship] ?? 'neutral'}>
                {selectedRelationship.relationship}
              </StatusBadge>
              {selectedRelationship.risk ? (
                <StatusBadge tone={RISK_BADGE_TONE[selectedRelationship.risk] ?? 'neutral'}>{selectedRelationship.risk}</StatusBadge>
              ) : null}
            </span>
          </span>
        ) : '查看当前对象的人房绑定与历史信息。'}
      >
        {selectedRelationship && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailSection icon={UserCheck} title="人员信息">
                <div className="space-y-2 text-sm">
                  <DetailField label="姓名" value={selectedRelationship.personName} />
                  <DetailField label="身份证号" value={<span className="font-mono text-[13px]">{selectedRelationship.personIdCard ?? '-'}</span>} />
                  <DetailField
                    label="关系类型"
                    value={
                      <span className="flex flex-wrap gap-2">
                        <StatusBadge tone={RELATION_TYPE_TONE[selectedRelationship.relationType]}>{selectedRelationship.relationType}</StatusBadge>
                        <StatusBadge tone={RELATIONSHIP_BADGE_TONE[selectedRelationship.relationship] ?? 'neutral'}>
                          {selectedRelationship.relationship}
                        </StatusBadge>
                      </span>
                    }
                  />
                  {selectedRelationship.person && (
                    <>
                      <DetailField
                        label="风险等级"
                        value={
                          <StatusBadge tone={RISK_BADGE_TONE[selectedRelationship.person.risk] ?? 'neutral'}>
                            {selectedRelationship.person.risk}
                          </StatusBadge>
                        }
                      />
                      <DetailField
                        label="人员标签"
                        value={
                          (selectedRelationship.person.tags ?? []).length > 0 ? (
                            <span className="flex flex-wrap gap-2">
                              {(selectedRelationship.person.tags ?? []).slice(0, 4).map((tag, index) => (
                                <Badge key={index} variant="outline" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)]">{tag}</Badge>
                              ))}
                            </span>
                          ) : (
                            <span className="text-[var(--color-neutral-08)]">-</span>
                          )
                        }
                      />
                    </>
                  )}
                </div>
              </DetailSection>

              <DetailSection icon={Home} title="房屋信息">
                <div className="space-y-2 text-sm">
                  <DetailField label="房屋地址" value={selectedRelationship.houseAddress} />
                  <DetailField label="业主姓名" value={selectedRelationship.house.ownerName || '-'} />
                  <DetailField
                    label="房屋状态"
                    value={
                      <span className="flex flex-wrap gap-2">
                        <StatusBadge tone={HOUSE_TYPE_TONE[selectedRelationship.house.type]}>{selectedRelationship.house.type}</StatusBadge>
                        {selectedRelationship.house.occupancyStatus && (
                          <StatusBadge tone="info">{selectedRelationship.house.occupancyStatus}</StatusBadge>
                        )}
                        {selectedRelationship.house.residenceType && (
                          <StatusBadge tone="success">{selectedRelationship.house.residenceType}</StatusBadge>
                        )}
                      </span>
                    }
                  />
                  <DetailField label="绑定时间" value={selectedRelationship.moveInDate} />
                  {selectedRelationship.moveOutDate && (
                    <DetailField label="迁出时间" value={selectedRelationship.moveOutDate} />
                  )}
                </div>
              </DetailSection>
            </div>

            {selectedRelationship.relationType === '现居' && (
              <DetailSection
                icon={Link2}
                title="现居关系摘要"
                description="当前房屋内可交叉印证的住户关系。"
              >
                <div className="space-y-3 text-sm">
                  <p className="text-[var(--color-neutral-10)]">
                    当前房屋共有 <span className="font-medium">{currentHousemates.length + 1}</span> 名现居人员，
                    房屋标签为 {(selectedRelationship.house.tags ?? []).slice(0, 2).join(' / ') || '无重点标签'}。
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentHousemates.slice(0, 6).map((relationship) => (
                      <Badge key={relationship.id} variant="outline" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)]">
                        {relationship.personName} · {relationship.relationship}
                      </Badge>
                    ))}
                    {currentHousemates.length === 0 && <span className="text-[var(--color-neutral-08)]">暂无其他同住人员</span>}
                  </div>
                </div>
              </DetailSection>
            )}

            {selectedRelationship.relationType === '历史' && (
              <DetailSection
                icon={Shield}
                title="历史迁居备注"
                description="来自房屋历史档案的原始说明。"
              >
                <p className="text-sm leading-6 text-[var(--color-neutral-10)]">
                  {selectedRelationship.moveOutReason ?? '暂无迁出原因备注。'}
                </p>
              </DetailSection>
            )}
          </div>
        )}
      </DetailDialogShell>
    </div>
  );
}
