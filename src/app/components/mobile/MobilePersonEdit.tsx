import { useState, useEffect, useMemo } from 'react';
import { Save, ChevronDown, ChevronUp, X, Plus, Search, Tag, AlertCircle, Loader2 } from 'lucide-react';
import { MobileDetailHeader } from './MobileDetailHeader';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Person, PersonType } from '../../types/core';
import { personVisitFacade } from '../../services/mobileSandbox/personVisitFacade';
import { tagRepository, type ManagedTagSummary } from '../../services/repositories/tagRepository';
import { useMobileSandbox } from './MobileSandboxProvider';

interface MobilePersonEditProps {
  id: string;
  onBack: () => void;
  onSave?: () => void;
  onSaved?: () => void;
}

export function MobilePersonEdit({ id, onBack, onSave, onSaved }: MobilePersonEditProps) {
  const { mode, canMutate } = useMobileSandbox();
  const [person, setPerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [personTags, setPersonTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<ManagedTagSummary[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    detail: false,
    work: false,
    activity: false,
    health: false,
  });
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    type: '户籍' as PersonType,
    nation: '',
    education: '',
    // 详细信息
    birthDate: '',
    birthplace: '',
    maritalStatus: '' as '' | '未婚' | '已婚' | '离异' | '丧偶',
    religion: '',
    politicalStatus: '',
    militaryService: false,
    graduationInfo: '',
    workplace: '',
    communityVolunteer: false,
    skills: '',
    pets: '',
    // 个人经历
    biography: '',
    // 活动参与
    activities: '',
    needs: '',
    // 健康档案
    hasChronic: false,
    chronicDetails: '',
    needsRegularMedicine: false,
    medicineFrequency: '',
    medicalVisitFrequency: '',
    isSeverePatient: false,
    isPregnant: false,
    specialNotes: '',
    // 重要事件
    importantEvents: '',
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    // facade 以当前数据模式为准；模式未确认前不发起任何读取
    if (mode === 'checking') {
      return;
    }
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [personData, tagSnapshot] = await Promise.all([
          personVisitFacade.getPerson(id),
          tagRepository.getSnapshot(),
        ]);

        if (!active) {
          return;
        }

        setAvailableTags(tagSnapshot.tags);

        if (!personData) {
          setPerson(null);
          return;
        }

        setPerson(personData);
        setPersonTags(personData.tags || []);
        setFormData({
          name: personData.name,
          phone: personData.phone || '',
          address: personData.address,
          type: personData.type,
          nation: personData.nation || '',
          education: personData.education || '',
          birthDate: personData.birthDate || '',
          birthplace: personData.birthplace || '',
          maritalStatus: personData.maritalStatus || '',
          religion: personData.religion || '',
          politicalStatus: personData.politicalStatus || '',
          militaryService: personData.militaryService || false,
          graduationInfo: personData.graduationInfo || '',
          workplace: personData.workplace || '',
          communityVolunteer: personData.communityVolunteer || false,
          skills: personData.skills || '',
          pets: personData.pets || '',
          biography: personData.biography || '',
          activities: personData.activityParticipation?.activities || '',
          needs: personData.activityParticipation?.needs || '',
          hasChronic: personData.healthRecord?.hasChronic || false,
          chronicDetails: personData.healthRecord?.chronicDetails || '',
          needsRegularMedicine: personData.healthRecord?.needsRegularMedicine || false,
          medicineFrequency: personData.healthRecord?.medicineFrequency || '',
          medicalVisitFrequency: personData.healthRecord?.medicalVisitFrequency || '',
          isSeverePatient: personData.healthRecord?.isSeverePatient || false,
          isPregnant: personData.healthRecord?.isPregnant || false,
          specialNotes: personData.healthRecord?.specialNotes || '',
          importantEvents: personData.importantEvents || '',
        });
      } catch (error) {
        console.error('Failed to load mobile person edit', error);
        if (active) {
          setPerson(null);
          setLoadError(error instanceof Error ? error.message : '人员信息加载失败');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [id, mode, reloadToken]);

  const handleSave = async () => {
    if (!person || isSubmitting) {
      return;
    }

    if (!formData.name.trim() || !formData.address.trim()) {
      setSaveError('姓名与居住地址为必填项，不能为空。');
      return;
    }

    setIsSubmitting(true);
    setSaveError(null);

    try {
      await personVisitFacade.updatePerson(id, {
        tags: personTags,
        name: formData.name.trim(),
        phone: formData.phone || undefined,
        address: formData.address.trim(),
        type: formData.type,
        nation: formData.nation || undefined,
        education: formData.education || undefined,
        // 详细信息
        birthDate: formData.birthDate || undefined,
        birthplace: formData.birthplace || undefined,
        maritalStatus: formData.maritalStatus || undefined,
        religion: formData.religion || undefined,
        politicalStatus: formData.politicalStatus || undefined,
        militaryService: formData.militaryService,
        graduationInfo: formData.graduationInfo || undefined,
        workplace: formData.workplace || undefined,
        communityVolunteer: formData.communityVolunteer,
        skills: formData.skills || undefined,
        pets: formData.pets || undefined,
        // 个人经历
        biography: formData.biography || undefined,
        // 活动参与
        activityParticipation: (formData.activities || formData.needs) ? {
          activities: formData.activities || undefined,
          needs: formData.needs || undefined,
        } : undefined,
        // 健康档案
        healthRecord: {
          hasChronic: formData.hasChronic,
          chronicDetails: formData.chronicDetails || undefined,
          needsRegularMedicine: formData.needsRegularMedicine,
          medicineFrequency: formData.medicineFrequency || undefined,
          medicalVisitFrequency: formData.medicalVisitFrequency || undefined,
          isSeverePatient: formData.isSeverePatient,
          isPregnant: formData.isPregnant,
          specialNotes: formData.specialNotes || undefined,
        },
        // 重要事件
        importantEvents: formData.importantEvents || undefined,
        updatedAt: new Date().toISOString().split('T')[0],
      });

      if (onSave) onSave();
      onSaved?.();
    } catch (error) {
      console.error('Failed to save mobile person edit', error);
      setSaveError(error instanceof Error ? `保存失败：${error.message}` : '保存失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 按 type + category 分组所有可用标签
  const groupedTags = useMemo(() => {
    const groups: Record<string, Record<string, string[]>> = {};
    for (const tag of availableTags) {
      if (!groups[tag.type]) groups[tag.type] = {};
      if (!groups[tag.type][tag.category]) groups[tag.type][tag.category] = [];
      groups[tag.type][tag.category].push(tag.name);
    }
    return groups;
  }, [availableTags]);

  // 搜索过滤
  const filteredGroupedTags = useMemo(() => {
    if (!tagSearch.trim()) return groupedTags;
    const keyword = tagSearch.trim().toLowerCase();
    const result: Record<string, Record<string, string[]>> = {};
    for (const [type, categories] of Object.entries(groupedTags)) {
      for (const [category, tags] of Object.entries(categories)) {
        const matched = tags.filter(t => t.toLowerCase().includes(keyword));
        if (matched.length > 0) {
          if (!result[type]) result[type] = {};
          result[type][category] = matched;
        }
      }
    }
    return result;
  }, [groupedTags, tagSearch]);

  const handleRemoveTag = (tag: string) => {
    setPersonTags(prev => prev.filter(t => t !== tag));
  };

  const handleAddTag = (tag: string) => {
    if (!personTags.includes(tag)) {
      setPersonTags(prev => [...prev, tag]);
    }
  };

  if (isLoading || mode === 'checking') {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--color-neutral-01)]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[var(--color-brand-text)] animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--color-neutral-08)]">正在加载人员信息...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--color-neutral-01)] px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[var(--color-status-error-text)] mx-auto mb-2" />
          <p className="font-medium text-[var(--color-neutral-10)]">人员信息加载失败</p>
          <p className="text-xs text-[var(--color-neutral-08)] mt-1 break-all">{loadError}</p>
          <div className="flex justify-center gap-3 mt-4">
            <Button variant="outline" className="min-h-[44px]" onClick={() => setReloadToken((token) => token + 1)}>重试</Button>
            <Button variant="outline" className="min-h-[44px]" onClick={onBack}>返回</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--color-neutral-01)]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[var(--color-neutral-08)] mx-auto mb-2" />
          <p className="text-[var(--color-neutral-08)]">未找到该人员信息</p>
          <Button onClick={onBack} className="mt-4">返回</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[var(--color-neutral-01)] flex flex-col overflow-hidden">
      {/* Header */}
      <MobileDetailHeader title="编辑人员信息" onBack={onBack} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* 基本信息 */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-[var(--color-neutral-11)] mb-4">基本信息</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="person-edit-name" className="text-sm font-medium mb-2 block">姓名</Label>
              <Input
                id="person-edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入姓名"
              />
            </div>

            <div>
              <Label htmlFor="person-edit-phone" className="text-sm font-medium mb-2 block">联系电话</Label>
              <Input
                id="person-edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入联系电话"
                type="tel"
              />
            </div>

            <div>
              <Label htmlFor="person-edit-address" className="text-sm font-medium mb-2 block">居住地址</Label>
              <Input
                id="person-edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="请输入居住地址"
              />
            </div>

            <div>
              <Label htmlFor="person-edit-type" className="text-sm font-medium mb-2 block">人口类型</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger id="person-edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="户籍">户籍人口</SelectItem>
                  <SelectItem value="流动">流动人口</SelectItem>
                  <SelectItem value="留守">留守人口</SelectItem>
                  <SelectItem value="境外">境外人口</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="person-edit-nation" className="text-sm font-medium mb-2 block">民族</Label>
              <Input
                id="person-edit-nation"
                value={formData.nation}
                onChange={(e) => setFormData({ ...formData, nation: e.target.value })}
                placeholder="请输入民族"
              />
            </div>

            <div>
              <Label htmlFor="person-edit-education" className="text-sm font-medium mb-2 block">学历</Label>
              <Select value={formData.education || ''} onValueChange={(value) => setFormData({ ...formData, education: value })}>
                <SelectTrigger id="person-edit-education">
                  <SelectValue placeholder="请选择学历" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="小学">小学</SelectItem>
                  <SelectItem value="初中">初中</SelectItem>
                  <SelectItem value="高中">高中</SelectItem>
                  <SelectItem value="大专">大专</SelectItem>
                  <SelectItem value="本科">本科</SelectItem>
                  <SelectItem value="硕士">硕士</SelectItem>
                  <SelectItem value="博士">博士</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* 标签管理 */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--color-neutral-11)] flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[var(--color-brand-text)]" />
              标签管理
            </h3>
            <button
              onClick={() => { setShowTagPicker(true); setTagSearch(''); }}
              className="text-xs text-[var(--color-brand-text)] flex items-center gap-1 active:opacity-70"
            >
              <Plus className="w-3.5 h-3.5" />
              关联标签
            </button>
          </div>

          {personTags.length === 0 ? (
            <p className="text-xs text-[var(--color-neutral-08)] py-2">暂无标签，点击右上角关联标签</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {personTags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="pl-2 pr-1 py-1 text-xs flex items-center gap-1 bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-text)] border border-[var(--color-brand-primary)]"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`移除标签${tag}`}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-[var(--color-brand-primary)]/20 active:scale-90 transition-transform"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </Card>

        {/* 标签选择器 */}
        {showTagPicker && (
          <div className="fixed inset-0 z-50 bg-black/40 flex flex-col justify-end">
            <div className="bg-[var(--color-neutral-01)] rounded-t-[4px] max-h-[75vh] flex flex-col">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h3 className="text-base font-semibold text-[var(--color-neutral-11)]">关联标签</h3>
                <button onClick={() => setShowTagPicker(false)} aria-label="关闭标签选择" className="p-1 rounded-full hover:bg-[var(--color-neutral-03)]">
                  <X className="w-5 h-5 text-[var(--color-neutral-08)]" />
                </button>
              </div>

              <div className="px-4 pb-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-08)]" />
                  <Input
                    id="person-edit-tag-search"
                    aria-label="搜索标签"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="搜索标签..."
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
                {Object.keys(filteredGroupedTags).length === 0 ? (
                  <p className="text-sm text-[var(--color-neutral-08)] text-center py-8">无匹配标签</p>
                ) : (
                  Object.entries(filteredGroupedTags).map(([type, categories]) => (
                    <div key={type}>
                      <div className="text-xs font-semibold text-[var(--color-neutral-08)] mb-2 sticky top-0 bg-[var(--color-neutral-01)] py-1">{type}</div>
                      {Object.entries(categories).map(([category, tags]) => (
                        <div key={category} className="mb-3">
                          <div className="text-xs text-[var(--color-neutral-08)] mb-1.5 ml-1">{category}</div>
                          <div className="flex flex-wrap gap-2">
                            {tags.map(tag => {
                              const isSelected = personTags.includes(tag);
                              return (
                                <button
                                  key={tag}
                                  onClick={() => isSelected ? handleRemoveTag(tag) : handleAddTag(tag)}
                                  className={`text-xs px-2.5 py-1.5 rounded-full border transition-all active:scale-95 ${
                                    isSelected
                                      ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]'
                                      : 'bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] border-[var(--color-neutral-03)] hover:border-[var(--color-brand-primary)]'
                                  }`}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 详细信息 */}
        <Card className="p-4">
          <button
            type="button"
            onClick={() => toggleSection('detail')}
            className="w-full flex items-center justify-between text-sm font-semibold text-[var(--color-neutral-11)] mb-3"
          >
            <span>详细信息</span>
            {expandedSections.detail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSections.detail && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="person-edit-birth-date" className="text-sm font-medium mb-2 block">出生年月</Label>
                <Input
                  id="person-edit-birth-date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  placeholder="如：1989-01"
                />
              </div>

              <div>
                <Label htmlFor="person-edit-birthplace" className="text-sm font-medium mb-2 block">籍贯</Label>
                <Input
                  id="person-edit-birthplace"
                  value={formData.birthplace}
                  onChange={(e) => setFormData({ ...formData, birthplace: e.target.value })}
                  placeholder="请输入籍贯"
                />
              </div>

              <div>
                <Label htmlFor="person-edit-marital" className="text-sm font-medium mb-2 block">婚姻状况</Label>
                <Select value={formData.maritalStatus} onValueChange={(value: any) => setFormData({ ...formData, maritalStatus: value })}>
                  <SelectTrigger id="person-edit-marital">
                    <SelectValue placeholder="请选择婚姻状况" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="未婚">未婚</SelectItem>
                    <SelectItem value="已婚">已婚</SelectItem>
                    <SelectItem value="离异">离异</SelectItem>
                    <SelectItem value="丧偶">丧偶</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="person-edit-religion" className="text-sm font-medium mb-2 block">宗教信仰</Label>
                <Input
                  id="person-edit-religion"
                  value={formData.religion}
                  onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                  placeholder="请输入宗教信仰（如无则填无）"
                />
              </div>

              <div>
                <Label htmlFor="person-edit-political" className="text-sm font-medium mb-2 block">政治面貌</Label>
                <Input
                  id="person-edit-political"
                  value={formData.politicalStatus}
                  onChange={(e) => setFormData({ ...formData, politicalStatus: e.target.value })}
                  placeholder="如：中共党员、群众等"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="militaryService"
                  checked={formData.militaryService}
                  onCheckedChange={(checked) => setFormData({ ...formData, militaryService: !!checked })}
                />
                <Label htmlFor="militaryService" className="text-sm font-medium cursor-pointer">
                  服过兵役
                </Label>
              </div>

              <div>
                <Label htmlFor="person-edit-graduation" className="text-sm font-medium mb-2 block">毕业院校及专业</Label>
                <Input
                  id="person-edit-graduation"
                  value={formData.graduationInfo}
                  onChange={(e) => setFormData({ ...formData, graduationInfo: e.target.value })}
                  placeholder="如：山东大学 计算机科学与技术专业"
                />
              </div>

              <div>
                <Label htmlFor="person-edit-workplace" className="text-sm font-medium mb-2 block">工作单位及职务</Label>
                <Input
                  id="person-edit-workplace"
                  value={formData.workplace}
                  onChange={(e) => setFormData({ ...formData, workplace: e.target.value })}
                  placeholder="请输入工作单位及职务"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="communityVolunteer"
                  checked={formData.communityVolunteer}
                  onCheckedChange={(checked) => setFormData({ ...formData, communityVolunteer: !!checked })}
                />
                <Label htmlFor="communityVolunteer" className="text-sm font-medium cursor-pointer">
                  社区志愿力量
                </Label>
              </div>

              <div>
                <Label htmlFor="person-edit-skills" className="text-sm font-medium mb-2 block">特长、爱好</Label>
                <Input
                  id="person-edit-skills"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="请输入特长、爱好"
                />
              </div>

              <div>
                <Label htmlFor="person-edit-pets" className="text-sm font-medium mb-2 block">宠物饲养情况</Label>
                <Input
                  id="person-edit-pets"
                  value={formData.pets}
                  onChange={(e) => setFormData({ ...formData, pets: e.target.value })}
                  placeholder="如：无、养猫一只等"
                />
              </div>
            </div>
          )}
        </Card>

        {/* 工作经历 */}
        <Card className="p-4">
          <button
            type="button"
            onClick={() => toggleSection('work')}
            className="w-full flex items-center justify-between text-sm font-semibold text-[var(--color-neutral-11)] mb-3"
          >
            <span>个人经历</span>
            {expandedSections.work ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSections.work && (
            <div>
              <Label htmlFor="person-edit-biography" className="text-sm font-medium mb-2 block">基本情况</Label>
              <Textarea
                id="person-edit-biography"
                value={formData.biography}
                onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                placeholder="请输入学习经历、工作经历等基本情况"
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-[var(--color-neutral-08)] mt-1">
                示例：2007-2011年，在山东大学学习计算机科学与技术专业。2011-2015年，在北京某互联网公司从事软件开发工作...
              </p>
            </div>
          )}
        </Card>

        {/* 活动参与 */}
        <Card className="p-4">
          <button
            type="button"
            onClick={() => toggleSection('activity')}
            className="w-full flex items-center justify-between text-sm font-semibold text-[var(--color-neutral-11)] mb-3"
          >
            <span>活动参与</span>
            {expandedSections.activity ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSections.activity && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="person-edit-activities" className="text-sm font-medium mb-2 block">参加社区活动情况</Label>
                <Textarea
                  id="person-edit-activities"
                  value={formData.activities}
                  onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                  placeholder="请输入参加社区及社会组织活动情况"
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div>
                <Label htmlFor="person-edit-needs" className="text-sm font-medium mb-2 block">家庭服务需求及诉求</Label>
                <Textarea
                  id="person-edit-needs"
                  value={formData.needs}
                  onChange={(e) => setFormData({ ...formData, needs: e.target.value })}
                  placeholder="请输入家庭服务需求及诉求"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}
        </Card>

        {/* 健康档案 */}
        <Card className="p-4">
          <button
            type="button"
            onClick={() => toggleSection('health')}
            className="w-full flex items-center justify-between text-sm font-semibold text-[var(--color-neutral-11)] mb-3"
          >
            <span>健康档案</span>
            {expandedSections.health ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSections.health && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasChronic"
                  checked={formData.hasChronic}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasChronic: !!checked })}
                />
                <Label htmlFor="hasChronic" className="text-sm font-medium cursor-pointer">
                  有基础疾病
                </Label>
              </div>

              {formData.hasChronic && (
                <div>
                  <Label htmlFor="person-edit-chronic-details" className="text-sm font-medium mb-2 block">疾病类型</Label>
                  <Input
                    id="person-edit-chronic-details"
                    value={formData.chronicDetails}
                    onChange={(e) => setFormData({ ...formData, chronicDetails: e.target.value })}
                    placeholder="如：高血压、糖尿病等"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Checkbox
                  id="needsRegularMedicine"
                  checked={formData.needsRegularMedicine}
                  onCheckedChange={(checked) => setFormData({ ...formData, needsRegularMedicine: !!checked })}
                />
                <Label htmlFor="needsRegularMedicine" className="text-sm font-medium cursor-pointer">
                  需要定期购药
                </Label>
              </div>

              {formData.needsRegularMedicine && (
                <div>
                  <Label htmlFor="person-edit-medicine-frequency" className="text-sm font-medium mb-2 block">购药频率</Label>
                  <Input
                    id="person-edit-medicine-frequency"
                    value={formData.medicineFrequency}
                    onChange={(e) => setFormData({ ...formData, medicineFrequency: e.target.value })}
                    placeholder="如：每月一次"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="person-edit-medical-visit-frequency" className="text-sm font-medium mb-2 block">就医频率</Label>
                <Input
                  id="person-edit-medical-visit-frequency"
                  value={formData.medicalVisitFrequency}
                  onChange={(e) => setFormData({ ...formData, medicalVisitFrequency: e.target.value })}
                  placeholder="如：每季度一次"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isSeverePatient"
                  checked={formData.isSeverePatient}
                  onCheckedChange={(checked) => setFormData({ ...formData, isSeverePatient: !!checked })}
                />
                <Label htmlFor="isSeverePatient" className="text-sm font-medium cursor-pointer">
                  重症患者
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPregnant"
                  checked={formData.isPregnant}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPregnant: !!checked })}
                />
                <Label htmlFor="isPregnant" className="text-sm font-medium cursor-pointer">
                  孕产妇
                </Label>
              </div>

              <div>
                <Label htmlFor="person-edit-special-notes" className="text-sm font-medium mb-2 block">特殊情况说明</Label>
                <Textarea
                  id="person-edit-special-notes"
                  value={formData.specialNotes}
                  onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                  placeholder="请输入特殊情况说明"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}
        </Card>

        {/* 重要事件记录 */}
        <Card className="p-4">
          <h3 id="person-edit-important-events-title" className="text-sm font-semibold text-[var(--color-neutral-11)] mb-3">重要事件记录</h3>
          <div>
            <Textarea
              id="person-edit-important-events"
              aria-labelledby="person-edit-important-events-title"
              value={formData.importantEvents}
              onChange={(e) => setFormData({ ...formData, importantEvents: e.target.value })}
              placeholder="请输入重要事件记录及其他"
              rows={3}
              className="resize-none"
            />
          </div>
        </Card>

        <Card className="p-4 bg-[var(--color-brand-primary)]/10 border-[var(--color-brand-primary)]">
          <p className="text-xs text-[var(--color-brand-text)]">
            <strong>注意：</strong>身份证号、性别、年龄等基础信息不可修改，如需修改请联系管理员。
          </p>
        </Card>
      </div>

      {/* Bottom Action */}
      <div className="bg-[var(--color-neutral-01)] border-t border-[var(--color-neutral-03)] p-4 safe-area-bottom sticky bottom-0 space-y-3">
        {saveError && (
          <div
            data-testid="person-edit-error"
            role="alert"
            className="flex items-start gap-2 rounded-[4px] border border-[var(--color-status-error)]/35 bg-[var(--color-status-error-soft)] px-3 py-2 text-xs text-[var(--color-status-error-text)]"
          >
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="leading-relaxed">{saveError}</span>
          </div>
        )}
        <Button
          data-testid="person-edit-save"
          className="w-full h-11 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)]"
          onClick={() => void handleSave()}
          disabled={isSubmitting || !canMutate}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isSubmitting ? '保存中...' : '保存修改'}
        </Button>
      </div>
    </div>
  );
}
