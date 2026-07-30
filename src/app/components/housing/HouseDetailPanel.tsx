import type { ReactNode } from 'react';
import {
  AlertCircle,
  Calendar,
  Eye,
  History,
  Home,
  Loader2,
  MapPin,
  Phone,
  Tag,
  UserRound,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import type { House, HousingHistory, Person, RiskLevel } from '../../types/core';
import { DetailField, DetailFieldGrid, DetailSection } from '../patterns/DetailDialog';
import { getRiskLevelLabel } from '../../utils/riskLevel';

export interface HouseDetailPanelProps {
  house?: House | null;
  residents?: Person[];
  history?: HousingHistory[];
  loading?: boolean;
  error?: string | null;
  /** 仅在详情读取失败时展示的重试入口 */
  onRetry?: () => void;
  onViewPerson?: (person: Person) => void;
  className?: string;
}

const neutralBadgeClass =
  'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-08)]';

const historyTypeBadgeClass: Record<HousingHistory['type'], string> = {
  业主: 'border-[var(--color-status-warning)]/35 bg-[var(--color-status-warning-soft)] text-[var(--color-status-warning-text)]',
  租客: 'border-[var(--color-status-info)]/35 bg-[var(--color-status-info-soft)] text-[var(--color-status-info-text)]',
  家属: 'border-[var(--color-status-success)]/35 bg-[var(--color-status-success-soft)] text-[var(--color-status-success-text)]',
  其他: neutralBadgeClass,
};

const riskBadgeClass: Record<RiskLevel, string> = {
  High: 'border-[var(--color-status-error)]/40 bg-[var(--color-status-error-soft)] text-[var(--color-status-error-text)]',
  Medium: 'border-[var(--color-status-warning)]/40 bg-[var(--color-status-warning-soft)] text-[var(--color-status-warning-text)]',
  Low: 'border-[var(--color-status-success)]/40 bg-[var(--color-status-success-soft)] text-[var(--color-status-success-text)]',
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
    <section className="flex min-h-[320px] items-center justify-center rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] px-6 py-10">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded bg-[var(--color-neutral-01)] text-[var(--color-neutral-08)] ring-1 ring-[var(--color-neutral-03)]">
          <Icon className={cn('h-5 w-5', iconClassName)} />
        </div>
        <h3 className="text-sm font-semibold text-[var(--color-neutral-11)]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-neutral-08)]">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </section>
  );
}

/**
 * 房屋详情正文（R46）：只渲染内容区，弹窗外框、标题与操作区由
 * HousingManagement 的 DetailDialogShell 统一承载，与人口/人房关系详情同语言。
 */
export function HouseDetailPanel({
  house,
  residents = [],
  history = [],
  loading = false,
  error,
  onRetry,
  onViewPerson,
  className,
}: HouseDetailPanelProps) {
  if (loading) {
    return (
      <PanelState
        icon={Loader2}
        title="正在加载房屋详情"
        description="正在读取该房屋的基础信息、现居住户和居住历史，请稍候。"
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
          onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              重试
            </Button>
          ) : null
        }
      />
    );
  }

  if (!house) {
    return (
      <PanelState
        icon={Home}
        title="请选择房屋"
        description="从社区、楼栋、单元、楼层列表中选择一套房屋后，这里会显示房屋详情、现居住户和居住历史。"
      />
    );
  }

  const owner = residents.find((resident) => resident.name === house.ownerName);

  return (
    <div className={cn('space-y-4 text-[var(--color-neutral-10)]', className)}>
      <DetailSection
        icon={Home}
        title="基础信息"
        trailing={<span className="text-xs text-[var(--color-neutral-08)]">更新于 {displayValue(house.updatedAt)}</span>}
      >
        <DetailFieldGrid>
          <DetailField label="产权人" value={displayValue(house.ownerName)} icon={<UserRound className="h-3.5 w-3.5" />} />
          <DetailField label="产权人电话" value={displayValue(house.ownerPhone)} icon={<Phone className="h-3.5 w-3.5" />} />
          <DetailField label="建筑面积" value={displayValue(house.area)} />
          <DetailField label="房屋类型" value={displayValue(house.houseType ?? house.type)} />
          <DetailField label="居住人数" value={`${house.memberCount ?? residents.length} 人`} />
          <DetailField label="网格 ID" value={displayValue(house.gridId)} />
          <DetailField className="sm:col-span-2 xl:col-span-3" label="产权人居住地址" value={displayValue(house.ownerAddress)} />
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection icon={Tag} title="房屋标签">
        {house.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {house.tags.map((tag) => (
              <Badge key={`${house.id}-${tag}`} variant="outline" className={neutralBadgeClass}>
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-neutral-08)]">
            该房屋当前没有单独标签，可先通过现居住户标签和居住历史判断治理关注点。
          </p>
        )}
      </DetailSection>

      <DetailSection
        icon={Users}
        title="现居住户"
        trailing={<Badge variant="outline" className={neutralBadgeClass}>{residents.length} 人</Badge>}
      >
        {residents.length > 0 ? (
          <div className="divide-y divide-[var(--color-neutral-03)] rounded border border-[var(--color-neutral-03)]">
            {residents.map((person) => (
              <div key={person.id} className="grid gap-3 px-3 py-3 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.9fr)_minmax(0,0.75fr)_auto] md:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[var(--color-status-info-soft)] text-sm font-semibold text-[var(--color-status-info-text)] ring-1 ring-[var(--color-status-info)]/30">
                    {getInitial(person.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-[var(--color-neutral-11)]">{person.name}</span>
                      {person.id === owner?.id || person.name === house.ownerName ? (
                        <Badge variant="outline" className="border-[var(--color-status-warning)]/35 bg-[var(--color-status-warning-soft)] text-[var(--color-status-warning-text)]">
                          户主
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[var(--color-neutral-08)]">
                      {person.gender} · {person.age} 岁 · {person.type} · {displayValue(person.phone)}
                    </p>
                  </div>
                </div>

                <div className="min-w-0 text-xs text-[var(--color-neutral-08)]">
                  <div className="mb-1 text-[var(--color-neutral-10)]">与户主关系：{getRelationToOwner(person, house, residents)}</div>
                  <div className="truncate">证件：{displayValue(person.idCard)}</div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                  <Badge variant="outline" className={cn('border', riskBadgeClass[person.risk])}>
                    {getRiskLevelLabel(person.risk)}
                  </Badge>
                  {person.tags.slice(0, 2).map((tag) => (
                    <Badge key={`${person.id}-${tag}`} variant="outline" className={neutralBadgeClass}>
                      {tag}
                    </Badge>
                  ))}
                  {person.tags.length > 2 ? (
                    <Badge variant="outline" className={neutralBadgeClass}>
                      +{person.tags.length - 2}
                    </Badge>
                  ) : null}
                </div>

                {onViewPerson ? (
                  <Button variant="outline" size="sm" className="shrink-0" onClick={() => onViewPerson(person)}>
                    <Eye className="h-3.5 w-3.5" />
                    查看人员
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded border border-dashed border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] px-3 py-6 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-[var(--color-neutral-08)]" />
            <p className="text-sm font-medium text-[var(--color-neutral-11)]">暂无现居住户</p>
            <p className="mt-1 text-xs text-[var(--color-neutral-08)]">这套房屋当前没有关联到现居人员，可结合居住历史继续核对。</p>
          </div>
        )}
      </DetailSection>

      <DetailSection
        icon={History}
        title="居住历史"
        trailing={<Badge variant="outline" className={neutralBadgeClass}>{history.length} 条</Badge>}
      >
        {history.length > 0 ? (
          <div className="relative space-y-3 before:absolute before:bottom-5 before:left-[0.9rem] before:top-5 before:w-px before:bg-[var(--color-neutral-03)]">
            {history.map((item) => (
              <div key={item.id} className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                <div className="z-10 mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-neutral-02)] text-[var(--color-neutral-08)] ring-1 ring-[var(--color-neutral-03)]">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <div className="rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-neutral-11)]">{item.personName}</span>
                    <Badge variant="outline" className={cn('border', historyTypeBadgeClass[item.type])}>
                      {item.type}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-neutral-08)]">{item.period}</p>
                  {item.moveOutReason ? (
                    <p className="mt-2 text-xs leading-5 text-[var(--color-neutral-08)]">
                      <span className="text-[var(--color-neutral-10)]">迁出原因：</span>
                      {item.moveOutReason}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded border border-dashed border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] px-3 py-6 text-center">
            <History className="mx-auto mb-2 h-8 w-8 text-[var(--color-neutral-08)]" />
            <p className="text-sm font-medium text-[var(--color-neutral-11)]">暂无居住历史</p>
            <p className="mt-1 text-xs text-[var(--color-neutral-08)]">该房屋当前为空置状态，且未查询到过往入住记录。</p>
          </div>
        )}
      </DetailSection>
    </div>
  );
}
