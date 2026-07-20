import { useEffect, useMemo, useState } from 'react';
import { Eye, History, Home, Link2, Shield, UserCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
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
import { DIALOG_CLASS, PANEL_CLASS } from '../patterns/surfaces';
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
        actions={
          <Button
            variant="outline"
            disabled
            title="后续将在迁居流程中开放真实写操作"
            className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-08)]"
          >
            迁居流程待接入
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard label="总关系数" value={stats.total} />
        <StatCard label="现居关系" value={stats.current} tone="success" />
        <StatCard label="历史关系" value={stats.history} />
        <StatCard label="现居业主" value={stats.owner} tone="warning" />
      </div>

      <Card className={PANEL_CLASS}>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <SearchInput
              value={searchKeyword}
              onChange={setSearchKeyword}
              placeholder="搜索人员姓名、身份证号、房屋地址..."
              className="flex-1"
            />
            <Badge variant="outline" className="h-9 border-[var(--color-brand-primary-hover)]/35 bg-[var(--color-brand-primary-hover)]/12 px-4 text-sm text-[var(--color-status-info-text)]">
              真实读侧视图
            </Badge>
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

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className={`max-w-3xl ${DIALOG_CLASS}`}>
          <DialogHeader>
            <DialogTitle className="text-[var(--color-neutral-11)]">人房关系详情</DialogTitle>
            <DialogDescription className="text-[var(--color-neutral-08)]">查看当前对象的人房绑定与历史信息。</DialogDescription>
          </DialogHeader>
          {selectedRelationship && (
            <div className="space-y-4 py-2">
              <div className="grid gap-3 md:grid-cols-2">
                <Card className={PANEL_CLASS}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-[var(--color-neutral-11)]">
                      <UserCheck className="h-4 w-4 text-[var(--color-brand-text)]" />
                      人员信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-[var(--color-neutral-08)]">姓名</p>
                      <p className="font-medium text-[var(--color-neutral-11)]">{selectedRelationship.personName}</p>
                    </div>
                    <div>
                      <p className="text-[var(--color-neutral-08)]">身份证号</p>
                      <p className="font-mono text-[var(--color-neutral-10)]">{selectedRelationship.personIdCard ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-[var(--color-neutral-08)]">关系类型</p>
                      <div className="mt-1 flex gap-2">
                        <Badge variant="outline" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)]">{selectedRelationship.relationType}</Badge>
                        <StatusBadge tone={RELATIONSHIP_BADGE_TONE[selectedRelationship.relationship] ?? 'neutral'}>
                          {selectedRelationship.relationship}
                        </StatusBadge>
                      </div>
                    </div>
                    {selectedRelationship.person && (
                      <>
                        <div>
                          <p className="text-[var(--color-neutral-08)]">风险等级</p>
                          <p className="text-[var(--color-neutral-10)]">{selectedRelationship.person.risk}</p>
                        </div>
                        <div>
                          <p className="text-[var(--color-neutral-08)]">人员标签</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {(selectedRelationship.person.tags ?? []).slice(0, 4).map((tag, index) => (
                              <Badge key={index} variant="outline" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)]">{tag}</Badge>
                            ))}
                            {(selectedRelationship.person.tags ?? []).length === 0 && <span className="text-[var(--color-neutral-08)]">-</span>}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className={PANEL_CLASS}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-[var(--color-neutral-11)]">
                      <Home className="h-4 w-4 text-[var(--color-status-success-text)]" />
                      房屋信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-[var(--color-neutral-08)]">房屋地址</p>
                      <p className="font-medium text-[var(--color-neutral-11)]">{selectedRelationship.houseAddress}</p>
                    </div>
                    <div>
                      <p className="text-[var(--color-neutral-08)]">业主姓名</p>
                      <p className="text-[var(--color-neutral-10)]">{selectedRelationship.house.ownerName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[var(--color-neutral-08)]">房屋状态</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)]">{selectedRelationship.house.type}</Badge>
                        {selectedRelationship.house.occupancyStatus && (
                          <Badge variant="secondary" className="bg-[var(--color-brand-primary-hover)]/15 text-[var(--color-status-info-text)]">{selectedRelationship.house.occupancyStatus}</Badge>
                        )}
                        {selectedRelationship.house.residenceType && (
                          <Badge variant="secondary" className="bg-[var(--color-status-success)]/15 text-[var(--color-status-success-text)]">{selectedRelationship.house.residenceType}</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[var(--color-neutral-08)]">绑定时间</p>
                      <p className="text-[var(--color-neutral-10)]">{selectedRelationship.moveInDate}</p>
                    </div>
                    {selectedRelationship.moveOutDate && (
                      <div>
                        <p className="text-[var(--color-neutral-08)]">迁出时间</p>
                        <p className="text-[var(--color-neutral-10)]">{selectedRelationship.moveOutDate}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {selectedRelationship.relationType === '现居' && (
                <Card className={PANEL_CLASS}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-[var(--color-neutral-11)]">
                      <Link2 className="h-4 w-4 text-[var(--color-status-success-text)]" />
                      现居关系摘要
                    </CardTitle>
                    <CardDescription className="text-[var(--color-neutral-08)]">当前房屋内可交叉印证的住户关系。</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
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
                  </CardContent>
                </Card>
              )}

              {selectedRelationship.relationType === '历史' && (
                <Card className={PANEL_CLASS}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-[var(--color-neutral-11)]">
                      <Shield className="h-4 w-4 text-[var(--color-status-warning-text)]" />
                      历史迁居备注
                    </CardTitle>
                    <CardDescription className="text-[var(--color-neutral-08)]">来自房屋历史档案的原始说明。</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-[var(--color-neutral-10)]">
                    {selectedRelationship.moveOutReason ?? '暂无迁出原因备注。'}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
