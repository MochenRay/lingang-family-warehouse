import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapPin,
  Users,
  X,
  Plus,
  Loader2,
  Search,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { ScrollArea } from '../../ui/scroll-area';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '../../ui/drawer';
import { Badge } from '../../ui/badge';
import { MobileDetailHeader } from '../MobileDetailHeader';
import { MobileGridSelect } from './MobileGridSelect';
import { conflictFacade } from '../../../services/mobileSandbox/conflictFacade';
import {
  canSubmitConflictGridParty,
  createConflictGridOptionsLoadingState,
  createConflictResidentsIdleState,
  createConflictResidentsLoadingState,
  loadConflictGridOptions,
  loadConflictResidents,
  selectConflictGrid,
  validateConflictGridParty,
  type ConflictGridOptionsState,
  type ConflictGridPartySubmissionState,
  type ConflictResidentsState,
} from '../../../services/mobileSandbox/conflictGridParty';
import type { MobileConflictCreatePayload, MobileConflictParty } from '../../../services/mobileSandbox/conflictPayloads';
import { mobileContextRepository } from '../../../services/repositories/mobileContextRepository';
import type { MobileNavigateOptions } from '../mobileNavigation';
import type { ConflictRecord } from '../../../types/core';
import { toast } from 'sonner';
import { useMobileSandbox } from '../MobileSandboxProvider';

interface MobileConflictFormProps {
  onBack: () => void;
  onRouteChange?: (route: string, options?: MobileNavigateOptions) => void;
}

const COMMON_ORGS: MobileConflictParty[] = [
  { id: 'org_wy', name: '物业公司', type: 'organization' },
  { id: 'org_jwh', name: '居委会', type: 'organization' },
  { id: 'org_mj', name: '社区民警', type: 'organization' },
];

const CONFLICT_TYPES: ConflictRecord['type'][] = ['邻里纠纷', '家庭纠纷', '物业纠纷', '其他'];

function buildAutoTitle(description: string) {
  const normalized = description.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }
  return normalized.length > 18 ? `${normalized.slice(0, 18)}...` : normalized;
}

// 与种子数据一致的本地业务时间格式（YYYY-MM-DD HH:mm:ss），可被 facade 的 parseBusinessTime 解析
function formatNow() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function partyIdentity(party: MobileConflictParty) {
  return `${party.type}:${party.id}`;
}

export function MobileConflictForm({ onBack, onRouteChange }: MobileConflictFormProps) {
  const { mode, canMutate } = useMobileSandbox();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [gridOptions, setGridOptions] = useState<ConflictGridOptionsState>(createConflictGridOptionsLoadingState);
  const [selectedGridId, setSelectedGridId] = useState<string | undefined>(undefined);
  const [residents, setResidents] = useState<ConflictResidentsState>(createConflictResidentsIdleState);
  const [parties, setParties] = useState<MobileConflictParty[]>([]);
  const [gridReloadToken, setGridReloadToken] = useState(0);

  // R1：selectConflictGrid 的 currentSelectedGridId 永远来自当前组件 state（经 ref 读取），
  // 绝不复用 gridOptions.selectedGridId（那只是初始化预选候选）。
  const selectedGridIdRef = useRef<string | undefined>(undefined);
  const partiesRef = useRef<MobileConflictParty[]>([]);
  // 单调居民请求 generation：同网格 ABA（g1→g2→g1）时，旧 g1 迟到结果不得覆盖第二次 g1 结果
  const residentRequestGenRef = useRef(0);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: '' | ConflictRecord['type'];
    location: string;
  }>({
    title: '',
    description: '',
    type: '',
    location: '',
  });
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; description?: string; type?: string; location?: string; party?: string; grid?: string }>({});

  const [isPartyDrawerOpen, setIsPartyDrawerOpen] = useState(false);
  const [tempSelectedParties, setTempSelectedParties] = useState<MobileConflictParty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  // vaul Drawer 未使用 Trigger 组件时不会自动恢复焦点；关闭后按 a11y 要求还给触发按钮
  const partyAddButtonRef = useRef<HTMLButtonElement | null>(null);

  const loadResidentsFor = async (gridId: string) => {
    // 每次网格切换、初始化预选加载与居民重试都经此启动新 generation
    const generation = ++residentRequestGenRef.current;
    const isStale = () => (
      residentRequestGenRef.current !== generation || selectedGridIdRef.current !== gridId
    );
    try {
      const result = await loadConflictResidents(gridId);
      // 过期响应丢弃：generation 已失效或返回时 gridId 已不是当前选中网格，不得覆盖
      if (isStale()) {
        return;
      }
      setResidents(result);
    } catch (error) {
      if (isStale()) {
        return;
      }
      setResidents({
        status: 'error',
        gridId,
        residents: [],
        retryable: true,
        message: error instanceof Error ? error.message : '居民列表加载失败',
      });
    }
  };

  // mode 改变或组件卸载时，所有在途居民请求的 generation 立即失效
  useEffect(() => {
    residentRequestGenRef.current += 1;
  }, [mode]);
  useEffect(() => () => {
    residentRequestGenRef.current += 1;
  }, []);

  // 初始化预选与用户交互共用同一条切换路径
  const applyGridSelection = (
    readyOptions: Extract<ConflictGridOptionsState, { status: 'ready' }>,
    nextGridId: string,
  ) => {
    const result = selectConflictGrid({
      gridOptions: readyOptions,
      currentSelectedGridId: selectedGridIdRef.current,
      nextGridId,
      parties: partiesRef.current,
    });
    selectedGridIdRef.current = result.selectedGridId;
    setSelectedGridId(result.selectedGridId);
    partiesRef.current = result.parties;
    setParties(result.parties);
    setResidents(result.residents);
    setFieldErrors((prev) => ({ ...prev, grid: undefined, party: undefined }));
    void loadResidentsFor(result.selectedGridId);
  };

  // 加载网格 options；仅当 mobile context 提供精确 grid id 且其真实存在于服务端 options 时才预选。
  // sandbox mode 未就绪前不发请求（保持 loading）；mode resolve 后重跑。
  useEffect(() => {
    if (mode === 'checking') {
      setGridOptions(createConflictGridOptionsLoadingState());
      return;
    }
    let alive = true;
    setGridOptions(createConflictGridOptionsLoadingState());

    const candidateId = mobileContextRepository.getCurrentGridSelection().id;
    void loadConflictGridOptions(candidateId).then((next) => {
      if (!alive) {
        return;
      }
      setGridOptions(next);
      if (next.status === 'ready' && next.selectedGridId && !selectedGridIdRef.current) {
        applyGridSelection(next, next.selectedGridId);
      }
    }).catch((error) => {
      if (!alive) {
        return;
      }
      setGridOptions({
        status: 'error',
        options: [],
        selectedGridId: undefined,
        retryable: true,
        message: error instanceof Error ? error.message : '网格列表加载失败',
      });
    });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridReloadToken, mode]);

  const retryResidents = () => {
    const gridId = selectedGridIdRef.current;
    if (!gridId) {
      return;
    }
    setResidents(createConflictResidentsLoadingState(gridId));
    void loadResidentsFor(gridId);
  };

  const readyResidents = useMemo(
    () => (residents.status === 'ready' && residents.gridId === selectedGridId ? residents.residents : []),
    [residents, selectedGridId],
  );

  const filteredResidents = useMemo(
    () => readyResidents.filter((resident) => resident.name.includes(searchTerm) || resident.address.includes(searchTerm)),
    [readyResidents, searchTerm],
  );

  const handleDescriptionBlur = () => {
    if (formData.description.trim() && !formData.title) {
      const nextTitle = buildAutoTitle(formData.description);
      if (nextTitle) {
        setFormData((prev) => ({ ...prev, title: nextTitle }));
      }
    }
  };

  const gridPartyState: ConflictGridPartySubmissionState = {
    gridOptions,
    residents,
    selectedGridId,
    parties,
    location: formData.location.trim(),
  };
  const gridPartyValidation = validateConflictGridParty(gridPartyState);
  const canSubmit = gridPartyValidation.valid
    && canSubmitConflictGridParty(gridPartyState)
    && canMutate
    && !isSubmitting
    && Boolean(formData.title.trim())
    && Boolean(formData.type)
    && Boolean(formData.description.trim());

  // 提交按钮旁的实时缺口提示（按钮禁用时用户需要知道还差什么）
  const missingRequirements = useMemo(() => {
    const missing: string[] = [];
    if (!formData.description.trim()) missing.push('纠纷描述');
    if (!formData.title.trim()) missing.push('标题');
    if (!formData.type) missing.push('纠纷类型');
    if (!selectedGridId) missing.push('所属网格');
    if (!formData.location.trim()) missing.push('发生地点');
    if (parties.length === 0) missing.push('当事人/单位');
    return missing;
  }, [formData.description, formData.title, formData.type, formData.location, selectedGridId, parties.length]);

  const validateBeforeSubmit = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!formData.description.trim()) errors.description = '请填写纠纷描述';
    if (!formData.title.trim()) errors.title = '请填写标题';
    if (!formData.type) errors.type = '请选择纠纷类型';
    if (!formData.location.trim()) errors.location = '请填写发生地点';
    if (gridPartyValidation.valid === false) {
      if (gridPartyValidation.code === 'grid-required' || gridPartyValidation.code === 'grid-unavailable') {
        errors.grid = '请选择所属网格';
      } else if (gridPartyValidation.code === 'location-required') {
        errors.location = '请填写发生地点';
      } else {
        errors.party = '请至少选择一位当事人/单位';
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateBeforeSubmit()) {
      return;
    }
    if (!canSubmit || !selectedGridId || !formData.type) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const now = formatNow();
      const payload: MobileConflictCreatePayload = {
        source: '自行发现',
        title: formData.title.trim(),
        type: formData.type,
        description: formData.description.trim(),
        involvedParties: parties.map((party) => ({ ...party })),
        status: '调解中',
        gridId: selectedGridId,
        location: formData.location.trim(),
        timeline: [
          {
            date: now,
            content: '网格员上报纠纷',
            operator: mobileContextRepository.getCurrentWorkerName(),
          },
        ],
        images: [],
        createdAt: now,
        updatedAt: now,
      };

      const created = await conflictFacade.createConflict(payload);
      toast.success('上报成功');
      if (onRouteChange) {
        onRouteChange(`conflict-detail/${created.id}`, { replace: true });
      } else {
        onBack();
      }
    } catch (error) {
      console.error('Failed to submit conflict', error);
      setSubmitError(error instanceof Error ? error.message : '上报失败，请稍后重试');
      toast.error('上报失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddParty = () => {
    setTempSelectedParties([...partiesRef.current]);
    setSearchTerm('');
    setIsPartyDrawerOpen(true);
  };

  const toggleParty = (party: MobileConflictParty) => {
    setTempSelectedParties((prev) => {
      const exists = prev.some((item) => item.id === party.id && item.type === party.type);
      return exists
        ? prev.filter((item) => !(item.id === party.id && item.type === party.type))
        : [...prev, { ...party }];
    });
  };

  const handleConfirmSelection = () => {
    // 只保留当前网格 ready 居民中的 resident party 与全部 organization party，杜绝跨网格残留
    const readyResidentIds = new Set(readyResidents.map((resident) => resident.id));
    const nextParties = tempSelectedParties.filter((party) => (
      party.type === 'organization' || readyResidentIds.has(party.id)
    ));
    partiesRef.current = nextParties;
    setParties(nextParties);
    setFieldErrors((prev) => ({ ...prev, party: undefined }));
    setIsPartyDrawerOpen(false);
  };

  const handleRemoveParty = (party: MobileConflictParty) => {
    const nextParties = partiesRef.current.filter(
      (item) => !(item.id === party.id && item.type === party.type),
    );
    partiesRef.current = nextParties;
    setParties(nextParties);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-neutral-01)]" data-testid="conflict-form">
      <MobileDetailHeader title="上报矛盾纠纷" onBack={onBack} />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="conflict-description" className="text-sm font-medium text-[var(--color-neutral-10)]">
            纠纷描述 <span className="text-[var(--color-status-error-text)]">*</span><span className="sr-only">（必填）</span>
          </Label>
          <Textarea
            id="conflict-description"
            data-testid="conflict-description"
            placeholder="请详细描述纠纷发生的时间、地点、起因及经过..."
            className="min-h-[120px] bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)] resize-none focus-visible:ring-[var(--color-brand-primary)]"
            value={formData.description}
            required
            aria-invalid={fieldErrors.description ? true : undefined}
            aria-describedby={fieldErrors.description ? 'conflict-description-error' : undefined}
            onChange={(event) => {
              setFormData((prev) => ({ ...prev, description: event.target.value }));
              setFieldErrors((prev) => ({ ...prev, description: undefined }));
            }}
            onBlur={handleDescriptionBlur}
          />
          {fieldErrors.description && (
            <p id="conflict-description-error" className="text-xs text-[var(--color-status-error-text)]">{fieldErrors.description}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="conflict-title" className="text-sm font-medium text-[var(--color-neutral-10)]">
            标题 <span className="text-[var(--color-status-error-text)]">*</span><span className="sr-only">（必填）</span>
          </Label>
          <div className="relative">
            <Input
              id="conflict-title"
              data-testid="conflict-title"
              placeholder="输入描述后自动生成，也可手动修改"
              className="bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)] pr-8 min-h-[44px]"
              value={formData.title}
              required
              aria-invalid={fieldErrors.title ? true : undefined}
              aria-describedby={fieldErrors.title ? 'conflict-title-error' : undefined}
              onChange={(event) => {
                setFormData((prev) => ({ ...prev, title: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, title: undefined }));
              }}
            />
            {formData.title && (
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, title: '' }))}
                aria-label="清除标题"
                className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[var(--color-neutral-08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {fieldErrors.title && (
            <p id="conflict-title-error" className="text-xs text-[var(--color-status-error-text)]">{fieldErrors.title}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label id="conflict-type-label" className="text-sm font-medium text-[var(--color-neutral-10)]">
            纠纷类型 <span className="text-[var(--color-status-error-text)]">*</span><span className="sr-only">（必填）</span>
          </Label>
          <div
            role="radiogroup"
            aria-labelledby="conflict-type-label"
            aria-invalid={fieldErrors.type ? true : undefined}
            aria-describedby={fieldErrors.type ? 'conflict-type-error' : undefined}
            className="grid grid-cols-2 gap-2"
            data-testid="conflict-type-group"
          >
            {CONFLICT_TYPES.map((type) => {
              const isSelected = formData.type === type;
              return (
                <label
                  key={type}
                  data-testid={`conflict-type-${type}`}
                  className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border text-sm font-medium transition-all has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[var(--color-brand-primary)] ${
                    isSelected
                      ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-text)]'
                      : 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-02)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="conflict-type"
                    value={type}
                    checked={isSelected}
                    onChange={() => {
                      setFormData((prev) => ({ ...prev, type }));
                      setFieldErrors((prev) => ({ ...prev, type: undefined }));
                    }}
                    className="sr-only"
                  />
                  {type}
                </label>
              );
            })}
          </div>
          {fieldErrors.type && (
            <p id="conflict-type-error" className="text-xs text-[var(--color-status-error-text)]">{fieldErrors.type}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="conflict-grid-trigger" className="text-sm font-medium text-[var(--color-neutral-10)]">
            所属网格 <span className="text-[var(--color-status-error-text)]">*</span><span className="sr-only">（必填）</span>
          </Label>
          <MobileGridSelect
            id="conflict-grid-trigger"
            gridOptions={gridOptions}
            selectedGridId={selectedGridId}
            disabled={isSubmitting}
            aria-invalid={fieldErrors.grid ? true : undefined}
            aria-describedby={fieldErrors.grid ? 'conflict-grid-error-text' : undefined}
            onSelect={(nextGridId) => {
              if (gridOptions.status === 'ready') {
                applyGridSelection(gridOptions, nextGridId);
              }
            }}
            onRetry={() => setGridReloadToken((token) => token + 1)}
          />
          {fieldErrors.grid && (
            <p id="conflict-grid-error-text" className="text-xs text-[var(--color-status-error-text)]">{fieldErrors.grid}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="conflict-location" className="text-sm font-medium text-[var(--color-neutral-10)]">
            发生地点 <span className="text-[var(--color-status-error-text)]">*</span><span className="sr-only">（必填）</span>
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-08)]" />
            <Input
              id="conflict-location"
              data-testid="conflict-location"
              placeholder="请输入纠纷发生地点"
              className="pl-9 bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)] min-h-[44px]"
              value={formData.location}
              required
              aria-invalid={fieldErrors.location ? true : undefined}
              aria-describedby={fieldErrors.location ? 'conflict-location-error' : undefined}
              onChange={(event) => {
                setFormData((prev) => ({ ...prev, location: event.target.value }));
                setFieldErrors((prev) => ({ ...prev, location: undefined }));
              }}
            />
          </div>
          {fieldErrors.location && (
            <p id="conflict-location-error" className="text-xs text-[var(--color-status-error-text)]">{fieldErrors.location}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-[var(--color-neutral-10)]">
              当事人/单位 <span className="text-[var(--color-status-error-text)]">*</span><span className="sr-only">（必填）</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              ref={partyAddButtonRef}
              data-testid="conflict-party-add"
              className="min-h-[44px] text-xs border-dashed text-[var(--color-brand-text)] border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10"
              onClick={handleAddParty}
            >
              <Plus className="w-3 h-3 mr-1" /> 添加对象
            </Button>
          </div>

          <div className="flex flex-wrap gap-2" data-testid="conflict-party-chips">
            {parties.map((party) => (
              <Badge
                key={partyIdentity(party)}
                variant="secondary"
                data-testid={`conflict-party-chip-${party.type}-${party.id}`}
                className="pl-2 pr-0 py-0 bg-[var(--color-neutral-01)] border border-[var(--color-neutral-03)] text-[var(--color-neutral-10)] flex items-center gap-1"
              >
                <Users className="w-3 h-3 text-[var(--color-status-success-text)]" />
                {party.name}
                <button
                  type="button"
                  onClick={() => handleRemoveParty(party)}
                  aria-label={`移除当事人${party.name}`}
                  data-testid={`conflict-party-remove-${party.type}-${party.id}`}
                  className="ml-1 flex h-11 w-11 items-center justify-center rounded-full hover:bg-[var(--color-neutral-02)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
                >
                  <X className="w-3 h-3 text-[var(--color-neutral-08)]" />
                </button>
              </Badge>
            ))}
            {parties.length === 0 && (
              <div className="text-xs text-[var(--color-neutral-08)] italic py-2">暂无关联当事人</div>
            )}
          </div>
          {fieldErrors.party && (
            <p className="text-xs text-[var(--color-status-error-text)]" role="alert">{fieldErrors.party}</p>
          )}
        </div>
      </div>

      <div className="p-4 bg-[var(--color-neutral-01)] border-t border-[var(--color-neutral-03)] pb-8 md:pb-4 space-y-2">
        {submitError && (
          <div role="alert" data-testid="conflict-submit-error" className="rounded-lg border border-[var(--color-status-error)]/40 bg-[var(--color-status-error-soft)] px-3 py-2 text-xs text-[var(--color-status-error-text)]">
            上报失败：{submitError}
          </div>
        )}
        {mode === 'blocked' && (
          <div role="alert" data-testid="conflict-submit-blocked" className="rounded-lg border border-[var(--color-status-warning)]/40 bg-[var(--color-status-warning-soft)] px-3 py-2 text-xs text-[var(--color-status-warning-text)]">
            当前环境无法确认写入模式，提交已停用。
          </div>
        )}
        {!canSubmit && missingRequirements.length > 0 && mode !== 'blocked' && (
          <p className="text-xs text-[var(--color-neutral-08)]" data-testid="conflict-submit-hint">
            还需完善：{missingRequirements.join('、')}
          </p>
        )}
        <Button
          className="w-full bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] text-white min-h-[44px] text-base shadow-lg shadow-blue-600/20"
          data-testid="conflict-submit"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 提交中...
            </>
          ) : '提交上报'}
        </Button>
      </div>

      <Drawer open={isPartyDrawerOpen} onOpenChange={setIsPartyDrawerOpen}>
        <DrawerContent
          className="h-[85%] flex flex-col rounded-t-[20px]"
          aria-describedby={undefined}
          data-testid="conflict-party-drawer"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            partyAddButtonRef.current?.focus();
          }}
        >
          <DrawerHeader className="border-b border-[var(--color-neutral-03)] pb-4">
            <DrawerTitle className="text-center text-base font-bold text-[var(--color-neutral-11)]">选择当事人/单位</DrawerTitle>
            <DrawerDescription className="sr-only">从常用机构与当前网格居民中选择纠纷当事人</DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--color-neutral-03)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-08)]" />
                <Input
                  placeholder="搜索居民姓名、房号..."
                  aria-label="搜索居民"
                  data-testid="conflict-party-search"
                  className="pl-9 bg-[var(--color-neutral-02)] border-transparent focus-visible:bg-[var(--color-neutral-01)] focus-visible:border-[var(--color-brand-primary)] transition-all min-h-[44px]"
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
                        <button
                          key={org.id}
                          type="button"
                          data-testid={`conflict-party-org-${org.id}`}
                          aria-pressed={isSelected}
                          onClick={() => toggleParty(org)}
                          className={`flex min-h-[44px] items-center justify-between p-3 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-[var(--color-brand-primary)]/10 border-[var(--color-brand-primary)]/40 shadow-sm'
                              : 'bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)] hover:bg-[var(--color-neutral-02)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-brand-primary)]/10 flex items-center justify-center">
                              <Users className="w-4 h-4 text-[var(--color-brand-text)]" />
                            </div>
                            <span className="font-medium text-[var(--color-neutral-11)]">{org.name}</span>
                          </div>
                          <span
                            aria-hidden
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              isSelected
                                ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white'
                                : 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)]'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[var(--color-neutral-08)] uppercase tracking-wider">该网格居民</h3>
                  <div className="grid grid-cols-1 gap-2" data-testid="conflict-resident-section">
                    {residents.status === 'idle' ? (
                      <div className="text-center py-8 text-[var(--color-neutral-08)] text-sm" data-testid="conflict-residents-idle">
                        请先选择所属网格，再选择居民
                      </div>
                    ) : residents.status === 'loading' ? (
                      <div className="flex items-center justify-center py-8 text-[var(--color-neutral-08)] text-sm" role="status" data-testid="conflict-residents-loading">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        正在加载居民...
                      </div>
                    ) : residents.status === 'error' ? (
                      <div className="py-6 space-y-3 text-center" data-testid="conflict-residents-error">
                        <div role="alert" className="text-sm text-[var(--color-status-error-text)]">
                          居民列表加载失败：{residents.message}
                        </div>
                        <button
                          type="button"
                          data-testid="conflict-residents-retry"
                          onClick={retryResidents}
                          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-[var(--color-neutral-03)] px-4 text-sm text-[var(--color-neutral-10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
                        >
                          <RotateCcw className="w-4 h-4" />
                          重新加载居民
                        </button>
                      </div>
                    ) : residents.status === 'empty' ? (
                      <div className="py-6 space-y-3 text-center" data-testid="conflict-residents-empty">
                        <div className="text-sm text-[var(--color-neutral-08)]">该网格暂无居民，可选择机构作为当事人</div>
                        <button
                          type="button"
                          data-testid="conflict-residents-retry"
                          onClick={retryResidents}
                          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-[var(--color-neutral-03)] px-4 text-sm text-[var(--color-neutral-10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
                        >
                          <RotateCcw className="w-4 h-4" />
                          重新加载居民
                        </button>
                      </div>
                    ) : filteredResidents.length === 0 ? (
                      <div className="text-center py-8 text-[var(--color-neutral-08)] text-sm" data-testid="conflict-residents-no-match">无匹配居民</div>
                    ) : (
                      filteredResidents.map((resident) => {
                        const isSelected = tempSelectedParties.some((party) => party.id === resident.id && party.type === 'resident');
                        return (
                          <button
                            key={resident.id}
                            type="button"
                            data-testid={`conflict-party-resident-${resident.id}`}
                            aria-pressed={isSelected}
                            onClick={() => toggleParty({ id: resident.id, name: resident.name, type: 'resident' })}
                            className={`flex min-h-[44px] items-center justify-between p-3 rounded-xl border transition-all ${
                              isSelected
                                ? 'bg-[var(--color-status-success-soft)] border-[var(--color-status-success)]/40 shadow-sm'
                                : 'bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)] hover:bg-[var(--color-neutral-02)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[var(--color-status-success-soft)] flex items-center justify-center font-bold text-[var(--color-status-success-text)] text-xs">
                                {resident.name[0]}
                              </div>
                              <div className="text-left">
                                <div className="font-medium text-[var(--color-neutral-11)]">{resident.name}</div>
                                <div className="text-xs text-[var(--color-neutral-08)]">{resident.address}</div>
                              </div>
                            </div>
                            <span
                              aria-hidden
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                isSelected
                                  ? 'border-[var(--color-status-success)] bg-[var(--color-status-success)] text-white'
                                  : 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)]'
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </span>
                          </button>
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
              <Button variant="outline" className="flex-1 min-h-[44px] text-base border-[var(--color-neutral-03)]">取消</Button>
            </DrawerClose>
            <Button
              onClick={handleConfirmSelection}
              data-testid="conflict-party-confirm"
              className="flex-1 min-h-[44px] text-base bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] shadow-lg shadow-blue-600/20"
            >
              确认关联 ({tempSelectedParties.length})
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
