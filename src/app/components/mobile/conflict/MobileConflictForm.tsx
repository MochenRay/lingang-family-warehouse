import { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Users,
  Camera,
  X,
  Plus,
  Loader2,
  Search,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Checkbox } from '../../ui/checkbox';
import { ScrollArea } from '../../ui/scroll-area';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '../../ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Badge } from '../../ui/badge';
import { MobileDetailHeader } from '../MobileDetailHeader';
import { conflictRepository } from '../../../services/repositories/conflictRepository';
import { personRepository } from '../../../services/repositories/personRepository';
import type { ConflictRecord, Person } from '../../../types/core';
import { toast } from 'sonner';

interface MobileConflictFormProps {
  onBack: () => void;
  onRouteChange?: (route: string) => void;
}

type Party = { id: string; name: string; type: 'resident' | 'organization' };

const COMMON_ORGS: Party[] = [
  { id: 'org_wy', name: '物业公司', type: 'organization' },
  { id: 'org_jwh', name: '居委会', type: 'organization' },
  { id: 'org_mj', name: '社区民警', type: 'organization' },
];

function buildAutoTitle(description: string) {
  const normalized = description.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }
  return normalized.length > 18 ? `${normalized.slice(0, 18)}...` : normalized;
}

function deriveGridId(parties: Party[], residents: Person[], candidateResidents: Person[]) {
  const selectedResidentIds = new Set(parties.filter((party) => party.type === 'resident').map((party) => party.id));
  const selectedResident = residents.find((resident) => selectedResidentIds.has(resident.id));
  const candidateResident = candidateResidents[0] ?? residents[0];
  return selectedResident?.gridId ?? candidateResident?.gridId;
}

export function MobileConflictForm({ onBack, onRouteChange }: MobileConflictFormProps) {
  const [loading, setLoading] = useState(false);
  const [residentLoading, setResidentLoading] = useState(true);
  const [residents, setResidents] = useState<Person[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    location: '',
    involvedParties: [] as Party[],
    images: [] as string[],
  });

  const [isPartyDrawerOpen, setIsPartyDrawerOpen] = useState(false);
  const [tempSelectedParties, setTempSelectedParties] = useState<Party[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let active = true;

    const loadResidents = async () => {
      setResidentLoading(true);
      try {
        const people = await personRepository.getPeople({ limit: 500 });
        if (active) {
          setResidents(people);
        }
      } catch (error) {
        console.error('Failed to load residents', error);
        if (active) {
          setResidents([]);
        }
      } finally {
        if (active) {
          setResidentLoading(false);
        }
      }
    };

    void loadResidents();

    const handleDbChange = () => {
      void loadResidents();
    };

    window.addEventListener('db-change', handleDbChange);
    return () => {
      active = false;
      window.removeEventListener('db-change', handleDbChange);
    };
  }, []);

  const filteredResidents = useMemo(
    () => residents.filter((resident) => resident.name.includes(searchTerm) || resident.address.includes(searchTerm)),
    [residents, searchTerm],
  );

  const handleDescriptionBlur = () => {
    if (formData.description && !formData.title) {
      const nextTitle = buildAutoTitle(formData.description);
      if (nextTitle) {
        setFormData((prev) => ({ ...prev, title: nextTitle }));
        toast.success('已根据描述自动生成标题');
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.type || !formData.description) {
      toast.error('请填写必要信息');
      return;
    }

    const residentParties = formData.involvedParties.filter((party) => party.type === 'resident');
    const derivedResident = residents.find((resident) => residentParties.some((party) => party.id === resident.id))
      ?? filteredResidents[0]
      ?? residents[0];

    if (!derivedResident) {
      toast.error('请先选择至少一位居民，以便自动推导网格');
      return;
    }

    const gridId = deriveGridId(formData.involvedParties, residents, filteredResidents);
    if (!gridId) {
      toast.error('无法推导网格，请重新选择关联居民');
      return;
    }

    setLoading(true);
    try {
      const now = new Date().toLocaleString();
      const location = formData.location.trim() || derivedResident.address;
      const nextParties = residentParties.length > 0
        ? formData.involvedParties
        : [{ id: derivedResident.id, name: derivedResident.name, type: 'resident' as const }, ...formData.involvedParties];

      const newConflict = await conflictRepository.addConflict({
        source: '自行发现',
        title: formData.title.trim(),
        type: formData.type as ConflictRecord['type'],
        description: formData.description.trim(),
        involvedParties: nextParties,
        status: '调解中',
        gridId,
        location,
        timeline: [
          {
            date: now,
            content: '网格员上报纠纷',
            operator: '当前用户',
          },
        ],
        images: formData.images,
        createdAt: now,
        updatedAt: now,
      });

      toast.success('上报成功');
      if (onRouteChange) {
        onRouteChange(`conflict-detail/${newConflict.id}`);
      } else {
        onBack();
      }
    } catch (error) {
      console.error('Failed to submit conflict', error);
      toast.error('上报失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddParty = () => {
    setTempSelectedParties([...formData.involvedParties]);
    setSearchTerm('');
    setIsPartyDrawerOpen(true);
  };

  const toggleParty = (party: Party) => {
    setTempSelectedParties((prev) => {
      const exists = prev.some((item) => item.id === party.id && item.type === party.type);
      return exists
        ? prev.filter((item) => !(item.id === party.id && item.type === party.type))
        : [...prev, party];
    });
  };

  const handleConfirmSelection = () => {
    setFormData((prev) => ({
      ...prev,
      involvedParties: tempSelectedParties,
    }));
    setIsPartyDrawerOpen(false);
  };

  const handleRemoveParty = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      involvedParties: prev.involvedParties.filter((party) => party.id !== id),
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-neutral-01)]">
      <MobileDetailHeader title="上报矛盾纠纷" onBack={onBack} />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[var(--color-neutral-10)]">纠纷描述 <span className="text-[var(--color-status-error-text)]">*</span></Label>
          <Textarea
            placeholder="请详细描述纠纷发生的时间、地点、起因及经过..."
            className="min-h-[120px] bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)] resize-none focus-visible:ring-[var(--color-brand-primary)]"
            value={formData.description}
            onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
            onBlur={handleDescriptionBlur}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-[var(--color-neutral-10)]">标题 <span className="text-[var(--color-status-error-text)]">*</span></Label>
          </div>
          <div className="relative">
            <Input
              placeholder="输入描述后自动生成，也可手动修改"
              className="bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)] pr-8"
              value={formData.title}
              onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
            />
            {formData.title && (
              <button
                onClick={() => setFormData((prev) => ({ ...prev, title: '' }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-08)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[var(--color-neutral-10)]">纠纷类型 <span className="text-[var(--color-status-error-text)]">*</span></Label>
            <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}>
              <SelectTrigger className="bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)]">
                <SelectValue placeholder="请选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="邻里纠纷">邻里纠纷</SelectItem>
                <SelectItem value="家庭纠纷">家庭纠纷</SelectItem>
                <SelectItem value="物业纠纷">物业纠纷</SelectItem>
                <SelectItem value="其他">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-[var(--color-neutral-10)]">发生地点</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-08)]" />
              <Input
                placeholder="选择或输入地点"
                className="pl-9 bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)]"
                value={formData.location}
                onChange={(event) => setFormData((prev) => ({ ...prev, location: event.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-[var(--color-neutral-10)]">当事人/单位</Label>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-dashed text-[var(--color-brand-primary-hover)] border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10"
              onClick={handleAddParty}
            >
              <Plus className="w-3 h-3 mr-1" /> 添加对象
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.involvedParties.map((party) => (
              <Badge
                key={`${party.type}-${party.id}`}
                variant="secondary"
                className="pl-2 pr-1 py-1 bg-[var(--color-neutral-01)] border border-[var(--color-neutral-03)] text-[var(--color-neutral-10)] flex items-center gap-1"
              >
                <Users className="w-3 h-3 text-[var(--color-status-success-text)]" />
                {party.name}
                <button
                  onClick={() => handleRemoveParty(party.id)}
                  className="ml-1 p-0.5 hover:bg-[var(--color-neutral-02)] rounded-full"
                >
                  <X className="w-3 h-3 text-[var(--color-neutral-08)]" />
                </button>
              </Badge>
            ))}
            {formData.involvedParties.length === 0 && (
              <div className="text-xs text-[var(--color-neutral-08)] italic py-2">暂无关联当事人</div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-[var(--color-neutral-10)]">现场照片/视频</Label>
          <div className="grid grid-cols-4 gap-2">
            {formData.images.map((img, index) => (
              <div key={`${img}-${index}`} className="aspect-square bg-[var(--color-neutral-03)] rounded-lg relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="现场" className="w-full h-full object-cover" />
              </div>
            ))}
            <button
              className="aspect-square bg-[var(--color-neutral-01)] border-2 border-dashed border-[var(--color-neutral-03)] rounded-lg flex flex-col items-center justify-center gap-1 text-[var(--color-neutral-08)] active:bg-[var(--color-neutral-02)] transition-colors"
              onClick={() => toast('当前版本暂不支持附件上传')}
            >
              <Camera className="w-6 h-6" />
              <span className="text-[10px]">添加</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-[var(--color-neutral-01)] border-t border-[var(--color-neutral-03)] pb-8 md:pb-4">
        <Button
          className="w-full bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] text-white h-11 text-base shadow-lg shadow-blue-600/20"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 提交中...
            </>
          ) : '提交上报'}
        </Button>
      </div>

      <Drawer open={isPartyDrawerOpen} onOpenChange={setIsPartyDrawerOpen}>
        <DrawerContent className="h-[85vh] flex flex-col rounded-t-[20px]">
          <DrawerHeader className="border-b border-[var(--color-neutral-03)] pb-4">
            <DrawerTitle className="text-center text-base font-bold text-[var(--color-neutral-11)]">选择当事人/单位</DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--color-neutral-03)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-08)]" />
                <Input
                  placeholder="搜索居民姓名、房号..."
                  className="pl-9 bg-[var(--color-neutral-02)] border-transparent focus-visible:bg-[var(--color-neutral-01)] focus-visible:border-[var(--color-brand-primary)] transition-all"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1 px-4">
              <div className="py-2 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[var(--color-neutral-08)] uppercase tracking-wider">常用机构</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {COMMON_ORGS.map((org) => {
                      const isSelected = tempSelectedParties.some((party) => party.id === org.id && party.type === org.type);
                      return (
                        <div
                          key={org.id}
                          onClick={() => toggleParty(org)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--color-brand-primary)]/10 border-[var(--color-brand-primary)]/40 shadow-sm'
                              : 'bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)] hover:bg-[var(--color-neutral-02)]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-brand-primary)]/10 flex items-center justify-center">
                              <Users className="w-4 h-4 text-[var(--color-brand-primary-hover)]" />
                            </div>
                            <span className="font-medium text-[var(--color-neutral-11)]">{org.name}</span>
                          </div>
                          <Checkbox checked={isSelected} className="rounded-full data-[state=checked]:bg-[var(--color-brand-primary)] data-[state=checked]:border-[var(--color-brand-primary)]" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[var(--color-neutral-08)] uppercase tracking-wider">该网格居民</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {residentLoading ? (
                      <div className="flex items-center justify-center py-8 text-[var(--color-neutral-08)] text-sm">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        正在加载居民...
                      </div>
                    ) : filteredResidents.length === 0 ? (
                      <div className="text-center py-8 text-[var(--color-neutral-08)] text-sm">无匹配居民</div>
                    ) : (
                      filteredResidents.map((resident) => {
                        const isSelected = tempSelectedParties.some((party) => party.id === resident.id && party.type === 'resident');
                        return (
                          <div
                            key={resident.id}
                            onClick={() => toggleParty({ id: resident.id, name: resident.name, type: 'resident' })}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--color-status-success-soft)] border-[var(--color-status-success)]/40 shadow-sm'
                                : 'bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)] hover:bg-[var(--color-neutral-02)]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[var(--color-status-success-soft)] flex items-center justify-center font-bold text-[var(--color-status-success-text)] text-xs">
                                {resident.name[0]}
                              </div>
                              <div>
                                <div className="font-medium text-[var(--color-neutral-11)]">{resident.name}</div>
                                <div className="text-xs text-[var(--color-neutral-08)]">{resident.address}</div>
                              </div>
                            </div>
                            <Checkbox checked={isSelected} className="rounded-full data-[state=checked]:bg-[var(--color-status-success)] data-[state=checked]:border-[var(--color-status-success)]" />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          <DrawerFooter className="border-t border-[var(--color-neutral-03)] pt-4 pb-8 md:pb-4 flex-row gap-3 bg-[var(--color-neutral-01)] z-10">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1 h-11 text-base border-[var(--color-neutral-03)]">取消</Button>
            </DrawerClose>
            <Button onClick={handleConfirmSelection} className="flex-1 h-11 text-base bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] shadow-lg shadow-blue-600/20">
              确认关联 ({tempSelectedParties.length})
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
