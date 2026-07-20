import { useEffect, useState } from 'react';
import { Home, MapPin, Users, History, Calendar, ChevronRight, Tag, AlertCircle, Loader2 } from 'lucide-react';
import { MobileDetailHeader } from './MobileDetailHeader';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { houseRepository } from '../../services/repositories/houseRepository';
import type { House, HousingHistory, Person } from '../../types/core';

interface MobileHouseDetailProps {
  id: string;
  onBack: () => void;
  onRouteChange?: (route: string) => void;
}

export function MobileHouseDetail({ id, onBack, onRouteChange }: MobileHouseDetailProps) {
  const [house, setHouse] = useState<House | null>(null);
  const [residents, setResidents] = useState<Person[]>([]);
  const [housingHistory, setHousingHistory] = useState<HousingHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadHouse = async () => {
      setLoading(true);
      try {
        const [houseData, residentItems, historyItems] = await Promise.all([
          houseRepository.getHouse(id),
          houseRepository.getHouseResidents(id),
          houseRepository.getHousingHistory(id),
        ]);

        if (!active) {
          return;
        }

        setHouse(houseData ?? null);
        setResidents(residentItems);
        setHousingHistory(historyItems);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadHouse();

    const handleDbChange = () => {
      void loadHouse();
    };

    window.addEventListener('db-change', handleDbChange);
    return () => {
      active = false;
      window.removeEventListener('db-change', handleDbChange);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="h-full bg-[var(--color-neutral-01)] flex items-center justify-center">
        <div className="text-center text-[var(--color-neutral-08)]">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" />
          <p>正在加载房屋详情...</p>
        </div>
      </div>
    );
  }

  if (!house) {
    return (
      <div className="h-full bg-[var(--color-neutral-01)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[var(--color-neutral-08)] mx-auto mb-2" />
          <p className="text-[var(--color-neutral-08)]">未找到该房屋信息</p>
          <Button onClick={onBack} className="mt-4">返回</Button>
        </div>
      </div>
    );
  }

  const owner = residents.find((resident) => resident.name === house.ownerName);

  const getTypeColor = (type: string) => {
    if (type === '自住') return 'bg-[var(--color-status-success-soft)] text-[var(--color-status-success-text)] border-[var(--color-status-success)]/35';
    if (type === '出租') return 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary-hover)] border-[var(--color-brand-primary)]';
    if (type === '空置') return 'bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] border-[var(--color-neutral-03)]';
    if (type === '经营') return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] border-[var(--color-neutral-03)]';
  };

  return (
    <div className="h-full bg-[var(--color-bg-primary)] flex flex-col overflow-hidden">
      <MobileDetailHeader
        title="房屋详情"
        onBack={onBack}
        action={(
          <button
            onClick={() => onRouteChange?.(`house-edit/${id}`)}
            className="text-[var(--color-brand-primary)] font-medium text-sm active:opacity-70"
          >
            编辑
          </button>
        )}
      />

      <div className="flex-1 overflow-y-auto pb-20 p-4 space-y-4">
        <Card className="border-none shadow-sm overflow-hidden bg-[var(--color-bg-secondary)]">
          <div className="bg-[var(--color-brand-primary)] p-5 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[var(--color-neutral-11)]/10 rounded-lg flex items-center justify-center shrink-0">
                <Home className="w-6 h-6 text-[var(--color-neutral-10)]" />
              </div>
              <div>
                <h2 className="text-lg font-bold leading-snug mb-1">
                  {house.communityName} {house.building} {house.unit} {house.room}
                </h2>
                <div className="flex items-center gap-2 text-[var(--color-neutral-10)] text-xs">
                  <MapPin className="w-3 h-3" />
                  {house.address}
                </div>
              </div>
            </div>
            {house.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {house.tags.map((tag) => (
                  <span key={`${house.id}-${tag}`} className="text-xs bg-[var(--color-neutral-11)]/10 px-2 py-1 rounded backdrop-blur-md border border-[var(--color-neutral-11)]/10 text-[var(--color-neutral-11)]/90">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="p-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">房屋状态</div>
              <div className="font-medium text-[var(--color-text-primary)]">
                <Badge variant="secondary" className={getTypeColor(house.type)}>
                  {house.type}
                </Badge>
              </div>
            </div>
            <div className="text-center border-l border-[var(--color-border-primary)]">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">建筑面积</div>
              <div className="font-medium text-[var(--color-text-primary)]">{house.area}</div>
            </div>
            <div className="text-center border-l border-[var(--color-border-primary)]">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">居住人数</div>
              <div className="font-medium text-[var(--color-text-primary)]">{house.memberCount}人</div>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm bg-[var(--color-bg-secondary)]">
          <div className="p-4 border-b border-[var(--color-border-primary)]">
            <h3 className="font-bold text-[var(--color-text-title)] flex items-center gap-2">
              <Home className="w-4 h-4 text-[var(--color-status-warning-text)]" />
              业主信息
            </h3>
          </div>
          <div className="p-4">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => owner ? onRouteChange?.(`person-detail/${owner.id}`) : undefined}
              disabled={!owner}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-status-warning-soft)] flex items-center justify-center text-[var(--color-status-warning-text)] text-sm font-bold">
                  {house.ownerName[0]}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-[var(--color-text-primary)]">{house.ownerName}</div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">业主</div>
                </div>
              </div>
              {owner ? <ChevronRight className="w-4 h-4 text-[var(--color-text-quaternary)]" /> : null}
            </button>
          </div>
        </Card>

        <Card className="border-none shadow-sm bg-[var(--color-bg-secondary)]">
          <div className="p-4 border-b border-[var(--color-border-primary)] flex items-center justify-between">
            <h3 className="font-bold text-[var(--color-text-title)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--color-brand-primary-hover)]" />
              居住人员
            </h3>
            <span className="text-xs text-[var(--color-text-tertiary)]">{residents.length}人</span>
          </div>
          {residents.length > 0 ? (
            <>
              <div className="divide-y divide-[var(--color-border-secondary)]">
                {residents.map((resident) => (
                  <button
                    key={resident.id}
                    className="w-full p-4 flex items-center justify-between active:bg-[var(--color-bg-tertiary)] transition-colors text-left"
                    onClick={() => onRouteChange?.(`person-detail/${resident.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-brand-primary)]/10 flex items-center justify-center text-[var(--color-brand-primary-hover)] text-sm font-bold">
                        {resident.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">{resident.name}</span>
                          {resident.name === house.ownerName ? (
                            <span className="text-[10px] bg-[var(--color-status-warning-soft)] text-[var(--color-status-warning-text)] px-1.5 py-0.5 rounded border border-[var(--color-status-warning)]/35">户主</span>
                          ) : null}
                        </div>
                        <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                          {resident.gender} · {resident.age}岁 · {resident.type}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-text-quaternary)]" />
                  </button>
                ))}
              </div>
              <div className="p-3 border-t border-[var(--color-border-primary)]">
                <Button variant="ghost" className="w-full text-[var(--color-brand-primary-hover)] h-9 text-sm hover:text-[var(--color-brand-primary-hover)] hover:bg-[var(--color-brand-primary)]/10">
                  + 添加居住人员
                </Button>
              </div>
            </>
          ) : (
            <div className="p-4">
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-[var(--color-text-quaternary)] mx-auto mb-2" />
                <p className="text-sm text-[var(--color-text-tertiary)]">暂无居住人员</p>
              </div>
            </div>
          )}
        </Card>

        <Card className="border-none shadow-sm bg-[var(--color-bg-secondary)]">
          <div className="p-4 border-b border-[var(--color-border-primary)]">
            <h3 className="font-bold text-[var(--color-text-title)] flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" />
              居住历史
            </h3>
          </div>
          <div className="p-4">
            {housingHistory.length > 0 ? (
              <div className="relative pl-4 space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--color-border-secondary)]">
                {housingHistory.map((item) => (
                  <div key={item.id} className="relative">
                    <div
                      className={`absolute -left-[1.35rem] w-3 h-3 rounded-full border-2 border-[var(--color-bg-secondary)] ring-1 ring-[var(--color-border-secondary)] ${
                        item.type === '业主'
                          ? 'bg-[var(--color-status-warning)]'
                          : item.type === '租客'
                            ? 'bg-[var(--color-brand-primary)]'
                            : item.type === '家属'
                              ? 'bg-[var(--color-status-success)]'
                              : 'bg-[var(--color-neutral-06)]'
                      }`}
                    />
                    <div className="text-xs text-[var(--color-text-tertiary)] mb-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.period}
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)] font-medium">
                      {item.personName} ({item.type})
                    </div>
                    {item.moveOutReason ? (
                      <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                        迁出原因：{item.moveOutReason}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-[var(--color-text-quaternary)] mx-auto mb-3" />
                <p className="text-sm text-[var(--color-text-tertiary)]">暂无居住历史记录</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="border-none shadow-sm bg-[var(--color-bg-secondary)]">
          <div className="p-4">
            <p className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1">
              <Tag className="w-3 h-3" />
              最近更新：{house.updatedAt}
            </p>
          </div>
        </Card>
      </div>

      <div className="bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-primary)] p-4 safe-area-bottom sticky bottom-0">
        <Button
          className="w-full h-11 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-base shadow-lg"
          onClick={() => onRouteChange?.(`house-edit/${id}`)}
        >
          信息采集变更
        </Button>
      </div>
    </div>
  );
}
