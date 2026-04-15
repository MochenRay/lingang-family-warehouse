import { useEffect, useMemo, useState } from 'react';
import { Eye, History, Home, Link2, Search, Shield, UserCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { houseRepository } from '../../services/repositories/houseRepository';
import { personRepository } from '../../services/repositories/personRepository';
import { House, HousingHistory, Person } from '../../types/core';
import { toast } from 'sonner';

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

function parseHistoryPeriod(period: string): { moveInDate: string; moveOutDate?: string } {
  const [rawMoveIn, rawMoveOut] = period.split('~').map((item) => item.trim());
  return {
    moveInDate: rawMoveIn || '-',
    moveOutDate: rawMoveOut && rawMoveOut !== '至今' ? rawMoveOut : undefined,
  };
}

function getRelationshipBadge(relationship: OccupancyRelationship) {
  switch (relationship) {
    case '业主':
      return 'bg-purple-100 text-purple-800';
    case '家属':
      return 'bg-blue-100 text-blue-800';
    case '租客':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
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
      const [people, houses] = await Promise.all([
        personRepository.getPeople(),
        houseRepository.getHouses(),
      ]);

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

      const historyGroups = await Promise.all(
        houses.map(async (house) => ({
          house,
          items: await houseRepository.getHousingHistory(house.id),
        })),
      );

      const nextHistoryRelationships = historyGroups.flatMap(({ house, items }) =>
        items.map((item) => {
          const period = parseHistoryPeriod(item.period);
          return {
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
          };
        }),
      );

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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-2">人房关系管理</h1>
          <p className="text-gray-500">基于真实人、房、居住历史对象生成现居/历史双视角关系。</p>
        </div>
        <Button variant="outline" disabled title="后续将在迁居流程中开放真实写操作">
          迁居流程待接入
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
            <CardDescription>现居业主</CardDescription>
            <CardTitle className="text-3xl">{stats.owner}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索人员姓名、身份证号、房屋地址..."
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline" className="h-10 px-4 text-sm">
              真实读侧视图
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Tabs defaultValue="current" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="current">现居关系 ({filteredCurrentRelationships.length})</TabsTrigger>
              <TabsTrigger value="history">历史关系 ({filteredHistoryRelationships.length})</TabsTrigger>
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
                    <TableHead>风险</TableHead>
                    <TableHead>绑定时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCurrentRelationships.length > 0 ? (
                    filteredCurrentRelationships.map((relationship) => (
                      <TableRow key={relationship.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-gray-400" />
                            {relationship.personName}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{relationship.personIdCard}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-gray-400" />
                            {relationship.houseAddress}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRelationshipBadge(relationship.relationship)}>
                            {relationship.relationship}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              relationship.risk === 'High'
                                ? 'border-red-200 bg-red-50 text-red-700'
                                : relationship.risk === 'Medium'
                                  ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                                  : 'border-green-200 bg-green-50 text-green-700'
                            }
                          >
                            {relationship.risk ?? 'Low'}
                          </Badge>
                        </TableCell>
                        <TableCell>{relationship.moveInDate}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openRelationshipDetail(relationship)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                        {isLoading ? '正在加载现居关系...' : '暂无现居关系数据'}
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
                    <TableHead>房屋地址</TableHead>
                    <TableHead>关系</TableHead>
                    <TableHead>入住时间</TableHead>
                    <TableHead>迁出时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistoryRelationships.length > 0 ? (
                    filteredHistoryRelationships.map((relationship) => (
                      <TableRow key={relationship.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-gray-400" />
                            {relationship.personName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-gray-400" />
                            {relationship.houseAddress}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRelationshipBadge(relationship.relationship)}>
                            {relationship.relationship}
                          </Badge>
                        </TableCell>
                        <TableCell>{relationship.moveInDate}</TableCell>
                        <TableCell>{relationship.moveOutDate ?? '至今'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openRelationshipDetail(relationship)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                        {isLoading ? '正在加载历史关系...' : '暂无历史关系数据'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>人房关系详情</DialogTitle>
            <DialogDescription>查看当前对象的人房绑定与历史信息。</DialogDescription>
          </DialogHeader>
          {selectedRelationship && (
            <div className="space-y-6 py-2">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      人员信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-500">姓名</p>
                      <p className="font-medium">{selectedRelationship.personName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">身份证号</p>
                      <p className="font-mono">{selectedRelationship.personIdCard ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">关系类型</p>
                      <div className="mt-1 flex gap-2">
                        <Badge variant="outline">{selectedRelationship.relationType}</Badge>
                        <Badge className={getRelationshipBadge(selectedRelationship.relationship)}>
                          {selectedRelationship.relationship}
                        </Badge>
                      </div>
                    </div>
                    {selectedRelationship.person && (
                      <>
                        <div>
                          <p className="text-gray-500">风险等级</p>
                          <p>{selectedRelationship.person.risk}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">人员标签</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {(selectedRelationship.person.tags ?? []).slice(0, 4).map((tag, index) => (
                              <Badge key={index} variant="outline">{tag}</Badge>
                            ))}
                            {(selectedRelationship.person.tags ?? []).length === 0 && <span>-</span>}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Home className="h-4 w-4 text-purple-600" />
                      房屋信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-500">房屋地址</p>
                      <p className="font-medium">{selectedRelationship.houseAddress}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">业主姓名</p>
                      <p>{selectedRelationship.house.ownerName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">房屋状态</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant="outline">{selectedRelationship.house.type}</Badge>
                        {selectedRelationship.house.occupancyStatus && (
                          <Badge variant="secondary">{selectedRelationship.house.occupancyStatus}</Badge>
                        )}
                        {selectedRelationship.house.residenceType && (
                          <Badge variant="secondary">{selectedRelationship.house.residenceType}</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500">绑定时间</p>
                      <p>{selectedRelationship.moveInDate}</p>
                    </div>
                    {selectedRelationship.moveOutDate && (
                      <div>
                        <p className="text-gray-500">迁出时间</p>
                        <p>{selectedRelationship.moveOutDate}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {selectedRelationship.relationType === '现居' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-emerald-600" />
                      现居关系摘要
                    </CardTitle>
                    <CardDescription>当前房屋内可交叉印证的住户关系。</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-gray-700">
                      当前房屋共有 <span className="font-medium">{currentHousemates.length + 1}</span> 名现居人员，
                      房屋标签为 {(selectedRelationship.house.tags ?? []).slice(0, 2).join(' / ') || '无重点标签'}。
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {currentHousemates.slice(0, 6).map((relationship) => (
                        <Badge key={relationship.id} variant="outline">
                          {relationship.personName} · {relationship.relationship}
                        </Badge>
                      ))}
                      {currentHousemates.length === 0 && <span className="text-gray-500">暂无其他同住人员</span>}
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedRelationship.relationType === '历史' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4 text-amber-600" />
                      历史迁居备注
                    </CardTitle>
                    <CardDescription>来自房屋历史档案的原始说明。</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-gray-700">
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
