import type { ReactNode } from 'react';
import {
  AlertCircle,
  Calendar,
  Edit,
  History,
  Home,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Tag,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import type { House, HousingHistory, Person, RiskLevel } from '../../types/core';

export interface HouseDetailPanelProps {
  house?: House | null;
  residents?: Person[];
  history?: HousingHistory[];
  loading?: boolean;
  error?: string | null;
  onEdit?: (house: House) => void;
  onDelete?: (house: House) => void;
  onRefresh: () => void;
  isDeleting?: boolean;
  className?: string;
}

const houseTypeBadgeClass: Record<House['type'], string> = {
  自住: 'border-blue-200 bg-blue-50 text-blue-700',
  出租: 'border-orange-200 bg-orange-50 text-orange-700',
  空置: 'border-gray-200 bg-gray-50 text-gray-700',
  经营: 'border-purple-200 bg-purple-50 text-purple-700',
  其他: 'border-slate-200 bg-slate-50 text-slate-700',
};

const historyTypeBadgeClass: Record<HousingHistory['type'], string> = {
  业主: 'border-orange-200 bg-orange-50 text-orange-700',
  租客: 'border-blue-200 bg-blue-50 text-blue-700',
  家属: 'border-green-200 bg-green-50 text-green-700',
  其他: 'border-gray-200 bg-gray-50 text-gray-700',
};

const riskBadgeClass: Record<RiskLevel, string> = {
  High: 'border-red-200 bg-red-50 text-red-700',
  Medium: 'border-orange-200 bg-orange-50 text-orange-700',
  Low: 'border-green-200 bg-green-50 text-green-700',
};

function displayValue(value: string | number | undefined | null, fallback = '-') {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return value;
}

function getInitial(name: string | undefined) {
  return name?.trim().slice(0, 1) || '住';
}

function getRelationToOwner(person: Person, house: House, residents: Person[]) {
  if (person.name === house.ownerName) {
    return '户主';
  }

  const ownerResident = residents.find((resident) => resident.name === house.ownerName);
  const directRelation =
    person.familyRelations?.find((relation) => relation.relatedPersonId === ownerResident?.id)?.relationType ??
    ownerResident?.familyRelations?.find((relation) => relation.relatedPersonId === person.id)?.relationType;

  if (directRelation) {
    return directRelation;
  }

  if (house.type === '出租' || house.residenceType === '租住') {
    return '租客';
  }

  return '同住';
}

function PanelState({
  icon: Icon,
  title,
  description,
  action,
  iconClassName,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  iconClassName?: string;
}) {
  return (
    <section className="flex min-h-[420px] items-center justify-center rounded border border-gray-200 bg-white px-6 py-10">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded bg-gray-50 text-gray-400 ring-1 ring-gray-200">
          <Icon className={cn('h-5 w-5', iconClassName)} />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </section>
  );
}

function DetailItem({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded border border-gray-200 bg-gray-50 px-3 py-2', className)}>
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 min-h-5 break-words text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

export function HouseDetailPanel({
  house,
  residents = [],
  history = [],
  loading = false,
  error,
  onEdit,
  onDelete,
  onRefresh,
  isDeleting = false,
  className,
}: HouseDetailPanelProps) {
  if (loading) {
    return (
      <PanelState
        icon={Loader2}
        title="正在加载房屋详情"
        description="系统正在读取该房屋的基础信息、现居住户和居住历史，加载期间不会切断左侧浏览上下文。"
        iconClassName="animate-spin"
      />
    );
  }

  if (error) {
    return (
      <PanelState
        icon={AlertCircle}
        title="房屋详情读取失败"
        description={error}
        action={
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-3.5 w-3.5" />
            重新加载
          </Button>
        }
      />
    );
  }

  if (!house) {
    return (
      <PanelState
        icon={Home}
        title="请选择房屋"
        description="从左侧区域层级或中间楼栋、单元、楼层列表中选择一套房屋后，这里会显示房屋详情、现居住户和居住历史。"
        action={
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-3.5 w-3.5" />
            刷新台账
          </Button>
        }
      />
    );
  }

  const owner = residents.find((resident) => resident.name === house.ownerName);

  return (
    <section className={cn('flex min-h-[520px] flex-col rounded border border-gray-200 bg-white', className)}>
      <header className="border-b border-gray-200 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn('border', houseTypeBadgeClass[house.type])}>
                {house.type}
              </Badge>
              {house.residenceType ? (
                <Badge variant="outline" className="border-gray-200 bg-white text-gray-600">
                  {house.residenceType}
                </Badge>
              ) : null}
              {house.occupancyStatus ? (
                <Badge variant="outline" className="border-gray-200 bg-white text-gray-600">
                  {house.occupancyStatus}
                </Badge>
              ) : null}
            </div>
            <h2 className="truncate text-base font-semibold text-gray-950">
              {house.communityName} {house.building} {house.unit} {house.room}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{house.address}</span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-3.5 w-3.5" />
              刷新
            </Button>
            {onEdit ? (
              <Button variant="outline" size="sm" onClick={() => onEdit(house)}>
                <Edit className="h-3.5 w-3.5" />
                编辑
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                disabled={isDeleting}
                onClick={() => onDelete(house)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? '删除中' : '删除'}
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-5">
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Home className="h-4 w-4 text-[#2761CB]" />
                基础信息
              </h3>
              <span className="text-xs text-gray-500">更新于 {displayValue(house.updatedAt)}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <DetailItem label="产权人" value={displayValue(house.ownerName)} icon={<UserRound className="h-3.5 w-3.5" />} />
              <DetailItem label="产权人电话" value={displayValue(house.ownerPhone)} icon={<Phone className="h-3.5 w-3.5" />} />
              <DetailItem label="建筑面积" value={displayValue(house.area)} />
              <DetailItem label="房屋类型" value={displayValue(house.houseType ?? house.type)} />
              <DetailItem label="居住人数" value={`${house.memberCount ?? residents.length} 人`} />
              <DetailItem label="网格 ID" value={displayValue(house.gridId)} />
              <DetailItem className="sm:col-span-2 xl:col-span-3" label="产权人居住地址" value={displayValue(house.ownerAddress)} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Tag className="h-4 w-4 text-[#2761CB]" />
              房屋标签
            </h3>
            {house.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 rounded border border-gray-200 bg-gray-50 p-3">
                {house.tags.map((tag) => (
                  <Badge key={`${house.id}-${tag}`} variant="outline" className="border-gray-200 bg-white text-gray-700">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="rounded border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
                该房屋当前没有单独标签，可先通过现居住户标签和居住历史判断治理关注点。
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Users className="h-4 w-4 text-blue-600" />
                现居住户
              </h3>
              <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600">
                {residents.length} 人
              </Badge>
            </div>

            {residents.length > 0 ? (
              <div className="divide-y divide-gray-100 rounded border border-gray-200">
                {residents.map((person) => (
                  <div key={person.id} className="grid gap-3 px-3 py-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto]">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-blue-50 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
                        {getInitial(person.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-gray-900">{person.name}</span>
                          {person.id === owner?.id || person.name === house.ownerName ? (
                            <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">
                              户主
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {person.gender} · {person.age} 岁 · {person.type} · {displayValue(person.phone)}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0 text-xs text-gray-500">
                      <div className="mb-1 text-gray-700">与户主关系：{getRelationToOwner(person, house, residents)}</div>
                      <div className="truncate">证件：{displayValue(person.idCard)}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                      <Badge variant="outline" className={cn('border', riskBadgeClass[person.risk])}>
                        {person.risk === 'High' ? '高风险' : person.risk === 'Medium' ? '中风险' : '低风险'}
                      </Badge>
                      {person.tags.slice(0, 2).map((tag) => (
                        <Badge key={`${person.id}-${tag}`} variant="outline" className="border-gray-200 bg-white text-gray-600">
                          {tag}
                        </Badge>
                      ))}
                      {person.tags.length > 2 ? (
                        <Badge variant="outline" className="border-gray-200 bg-white text-gray-600">
                          +{person.tags.length - 2}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded border border-dashed border-gray-200 bg-gray-50 px-3 py-6 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-800">暂无现居住户</p>
                <p className="mt-1 text-xs text-gray-500">这套房屋当前没有关联到现居人员，可结合居住历史继续核对。</p>
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <History className="h-4 w-4 text-purple-600" />
                居住历史
              </h3>
              <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600">
                {history.length} 条
              </Badge>
            </div>

            {history.length > 0 ? (
              <div className="relative space-y-3 rounded border border-gray-200 bg-gray-50 p-3 before:absolute before:bottom-5 before:left-[1.65rem] before:top-5 before:w-px before:bg-gray-200">
                {history.map((item) => (
                  <div key={item.id} className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                    <div className="z-10 mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-400 ring-1 ring-gray-200">
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <div className="rounded border border-gray-200 bg-white px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{item.personName}</span>
                        <Badge variant="outline" className={cn('border', historyTypeBadgeClass[item.type])}>
                          {item.type}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{item.period}</p>
                      {item.moveOutReason ? (
                        <p className="mt-2 text-xs leading-5 text-gray-500">
                          <span className="text-gray-700">迁出原因：</span>
                          {item.moveOutReason}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded border border-dashed border-gray-200 bg-gray-50 px-3 py-6 text-center">
                <History className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm font-medium text-gray-800">暂无居住历史</p>
                <p className="mt-1 text-xs text-gray-500">历史记录为空不代表房屋不可用，需以现居人员和房屋状态继续判断。</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
