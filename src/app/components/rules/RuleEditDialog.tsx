import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Clock, Filter, Zap, Plus, X } from 'lucide-react';

interface RuleEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (rule: any) => void;
}

export function RuleEditDialog({ open, onOpenChange, onSave }: RuleEditDialogProps) {
  const [triggerType, setTriggerType] = useState<'event' | 'schedule'>('event');

  // 基础信息
  const [ruleName, setRuleName] = useState('');
  const [priority, setPriority] = useState('medium');

  // 事件触发配置
  const [monitorSubject, setMonitorSubject] = useState('person');
  const [triggerActions, setTriggerActions] = useState<string[]>(['create']);
  const [conditions, setConditions] = useState<{field: string, op: string, value: string}[]>([
    { field: 'age', op: 'gt', value: '80' }
  ]);

  // 周期触发配置
  const [frequency, setFrequency] = useState('monthly');
  const [targetScope, setTargetScope] = useState('solitary_elderly');

  // 任务模板
  const [taskTitle, setTaskTitle] = useState('入户走访');
  const [taskDesc, setTaskDesc] = useState('请核实居住人员信息及生活状况');
  const [deadline, setDeadline] = useState('3');

  const subjects = [
    { value: 'person', label: '人口数据' },
    { value: 'house', label: '房屋数据' },
    { value: 'family', label: '家庭户数据' },
    { value: 'device', label: '智能设备报警' }
  ];

  const fieldOptions: Record<string, { value: string; label: string; group?: string }[]> = {
    person: [
      // 基本属性
      { value: 'age', label: '年龄', group: '基本信息' },
      { value: 'gender', label: '性别', group: '基本信息' },
      { value: 'type', label: '人员类型（户籍/流动/留守/境外）', group: '基本信息' },
      { value: 'risk', label: '风险等级', group: '基本信息' },
      { value: 'marital_status', label: '婚姻状况', group: '基本信息' },
      // 关爱标签
      { value: 'care_solitary_elderly', label: '独居老人', group: '关爱标签' },
      { value: 'care_poverty', label: '特困人员', group: '关爱标签' },
      { value: 'care_child', label: '困境儿童', group: '关爱标签' },
      { value: 'care_orphan', label: '孤儿', group: '关爱标签' },
      { value: 'care_left_behind', label: '留守人员', group: '关爱标签' },
      { value: 'care_military', label: '军人', group: '关爱标签' },
      { value: 'care_difficulty', label: '困难', group: '关爱标签' },
      { value: 'care_unemployed', label: '失业', group: '关爱标签' },
      { value: 'care_lost_only_child', label: '失独', group: '关爱标签' },
      { value: 'care_disabled', label: '残疾', group: '关爱标签' },
      { value: 'care_low_income', label: '低保户', group: '关爱标签' },
      { value: 'care_veteran', label: '优抚对象', group: '关爱标签' },
      // 重点人员
      { value: 'focus_community_correction', label: '社区矫正', group: '重点人员' },
      { value: 'focus_resettlement', label: '安置帮教', group: '重点人员' },
      { value: 'focus_petition', label: '信访人员', group: '重点人员' },
      { value: 'focus_legal', label: '涉法涉诉人员', group: '重点人员' },
      { value: 'focus_mental', label: '易肇事精神障碍患者', group: '重点人员' },
      { value: 'focus_drug', label: '吸毒人员', group: '重点人员' },
      { value: 'focus_cult', label: '邪教人员', group: '重点人员' },
      // 身份角色
      { value: 'role_floor_leader', label: '楼长', group: '身份角色' },
      { value: 'role_unit_leader', label: '单元长', group: '身份角色' },
      { value: 'role_assistant', label: '协管员', group: '身份角色' },
      { value: 'role_party_member', label: '党员', group: '身份角色' },
      { value: 'role_volunteer', label: '志愿者', group: '身份角色' },
      // 健康
      { value: 'health_chronic', label: '慢性病患者', group: '健康状态' },
      { value: 'health_severe', label: '重症患者', group: '健康状态' },
      { value: 'health_pregnant', label: '孕产妇', group: '健康状态' },
      { value: 'health_medicine', label: '长期用药', group: '健康状态' },
      // 时间
      { value: 'last_visit', label: '最后走访时间', group: '时间相关' },
      { value: 'updated_at', label: '最后更新时间', group: '时间相关' },
    ],
    house: [
      { value: 'type', label: '房屋类型（自住/出租/空置/经营）' },
      { value: 'member_count', label: '居住人数' },
      { value: 'occupancy_status', label: '入住状态' },
      { value: 'area', label: '面积' },
      { value: 'risk_level', label: '隐患等级' },
    ],
    family: [
      { value: 'member_count', label: '家庭人数' },
      { value: 'is_low_income', label: '是否低保' },
      { value: 'has_elderly', label: '有无老人' },
      { value: 'has_child', label: '有无未成年' },
      { value: 'has_disabled', label: '有无残疾人' },
    ],
    device: [
      { value: 'alarm_type', label: '报警类型' },
      { value: 'device_status', label: '设备状态' },
    ]
  };

  const scopeOptions = [
    { group: '关爱人群', items: [
      { value: 'solitary_elderly', label: '所有"独居老人"' },
      { value: 'low_income', label: '所有"低保户"' },
      { value: 'poverty', label: '所有"特困人员"' },
      { value: 'disabled', label: '所有"残疾"人员' },
      { value: 'left_behind', label: '所有"留守人员"' },
      { value: 'lost_only_child', label: '所有"失独"人员' },
    ]},
    { group: '重点人群', items: [
      { value: 'community_correction', label: '所有"社区矫正"人员' },
      { value: 'drug_users', label: '所有"吸毒人员"' },
      { value: 'petition', label: '所有"信访人员"' },
      { value: 'mental_disorder', label: '所有"精神障碍患者"' },
    ]},
    { group: '健康关注', items: [
      { value: 'severe_patient', label: '所有"重症患者"' },
      { value: 'pregnant', label: '所有"孕产妇"' },
      { value: 'chronic', label: '所有"慢性病患者"' },
    ]},
    { group: '特殊身份', items: [
      { value: 'party_member', label: '所有"党员"' },
      { value: 'veteran', label: '所有"退役军人"' },
      { value: 'volunteer', label: '所有"志愿者"' },
    ]},
    { group: '房屋相关', items: [
      { value: 'rental_house', label: '所有"出租"性质房屋' },
      { value: 'vacant_house', label: '所有"空置"房屋' },
      { value: 'all_small_shops', label: '所有"九小场所"房屋' },
    ]},
    { group: '人员类型', items: [
      { value: 'floating', label: '所有"流动人口"' },
      { value: 'overseas', label: '所有"境外人员"' },
    ]},
  ];

  const handleSave = () => {
    const rule = {
      name: ruleName,
      priority,
      triggerType,
      config: triggerType === 'event' ? {
        subject: monitorSubject,
        actions: triggerActions,
        conditions
      } : {
        frequency,
        scope: targetScope
      },
      action: {
        title: taskTitle,
        desc: taskDesc,
        deadline
      }
    };

    if (onSave) onSave(rule);
    onOpenChange(false);
  };

  // 按 group 分组渲染字段选项
  const currentFields = fieldOptions[monitorSubject] || [];
  const groupedFields: Record<string, typeof currentFields> = {};
  currentFields.forEach(f => {
    const g = f.group || '其他';
    if (!groupedFields[g]) groupedFields[g] = [];
    groupedFields[g].push(f);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)] text-[var(--color-neutral-11)]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-[var(--color-neutral-11)]">新建待办规则</DialogTitle>
              <DialogDescription className="text-[var(--color-neutral-07)]">配置系统自动生成待办任务的规则引擎</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 1. 基础信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-[var(--color-neutral-09)]">规则名称</Label>
              <Input
                placeholder="例如：独居老人季度走访"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="bg-[var(--color-neutral-01)] border-[var(--color-neutral-04)] text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-06)]"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[var(--color-neutral-09)]">默认优先级</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-[var(--color-neutral-01)] border-[var(--color-neutral-04)] text-[var(--color-neutral-11)]">
                  <SelectValue placeholder="选择优先级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">
                    <span className="flex items-center gap-2 text-red-400">
                      <div className="w-2 h-2 rounded-full bg-red-500" /> 极高
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2 text-orange-400">
                      <div className="w-2 h-2 rounded-full bg-orange-500" /> 高
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2 text-blue-400">
                      <div className="w-2 h-2 rounded-full bg-blue-500" /> 中
                    </span>
                  </SelectItem>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2 text-[var(--color-neutral-08)]">
                      <div className="w-2 h-2 rounded-full bg-[var(--color-neutral-06)]" /> 低
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 2. 触发配置 */}
          <div className="border border-[var(--color-neutral-03)] rounded-xl p-4 bg-[var(--color-neutral-01)]">
            <Tabs value={triggerType} onValueChange={(v: any) => setTriggerType(v)} className="w-full">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold text-[var(--color-neutral-11)]">触发条件</Label>
                <TabsList className="grid w-[240px] grid-cols-2">
                  <TabsTrigger value="event">事件触发</TabsTrigger>
                  <TabsTrigger value="schedule">周期触发</TabsTrigger>
                </TabsList>
              </div>

              {/* A. 事件触发 */}
              <TabsContent value="event" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-[var(--color-neutral-07)]">监听数据对象</Label>
                    <Select value={monitorSubject} onValueChange={(v) => {
                      setMonitorSubject(v);
                      setConditions([{ field: '', op: 'eq', value: '' }]);
                    }}>
                      <SelectTrigger className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-04)] text-[var(--color-neutral-11)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-[var(--color-neutral-07)]">触发动作</Label>
                    <div className="flex gap-3 pt-2">
                      {(['create', 'update', 'delete'] as const).map(action => (
                        <div key={action} className="flex items-center space-x-2">
                          <Checkbox
                            id={action}
                            checked={triggerActions.includes(action)}
                            onCheckedChange={(checked) => {
                              if(checked) setTriggerActions([...triggerActions, action]);
                              else setTriggerActions(triggerActions.filter(a => a !== action));
                            }}
                          />
                          <label htmlFor={action} className="text-sm text-[var(--color-neutral-09)] leading-none">
                            {{'create': '新增', 'update': '修改', 'delete': '删除'}[action]}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-[var(--color-neutral-07)] flex items-center gap-1">
                      <Filter className="w-3 h-3" /> 过滤条件（满足以下条件时触发）
                    </Label>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-400 hover:text-blue-300"
                       onClick={() => setConditions([...conditions, { field: '', op: 'eq', value: '' }])}
                    >
                      <Plus className="w-3 h-3 mr-1" /> 添加条件
                    </Button>
                  </div>

                  {conditions.map((cond, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-[var(--color-neutral-02)] p-2 rounded border border-[var(--color-neutral-03)]">
                      <Select value={cond.field} onValueChange={(v) => {
                        const newConds = [...conditions];
                        newConds[idx].field = v;
                        setConditions(newConds);
                      }}>
                        <SelectTrigger className="h-8 text-sm w-[180px] bg-[var(--color-neutral-01)] border-[var(--color-neutral-04)] text-[var(--color-neutral-11)]">
                          <SelectValue placeholder="选择字段" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(groupedFields).map(([group, fields]) => (
                            <div key={group}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-[var(--color-neutral-07)]">{group}</div>
                              {fields.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={cond.op} onValueChange={(v) => {
                        const newConds = [...conditions];
                        newConds[idx].op = v;
                        setConditions(newConds);
                      }}>
                        <SelectTrigger className="h-8 text-sm w-[100px] bg-[var(--color-neutral-01)] border-[var(--color-neutral-04)] text-[var(--color-neutral-11)]">
                          <SelectValue placeholder="操作符" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="eq">等于</SelectItem>
                           <SelectItem value="neq">不等于</SelectItem>
                           <SelectItem value="gt">大于</SelectItem>
                           <SelectItem value="lt">小于</SelectItem>
                           <SelectItem value="contains">包含</SelectItem>
                           <SelectItem value="before">早于</SelectItem>
                           <SelectItem value="is_true">为是</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        className="h-8 text-sm flex-1 bg-[var(--color-neutral-01)] border-[var(--color-neutral-04)] text-[var(--color-neutral-11)] placeholder:text-[var(--color-neutral-06)]"
                        placeholder="值"
                        value={cond.value}
                        onChange={(e) => {
                          const newConds = [...conditions];
                          newConds[idx].value = e.target.value;
                          setConditions(newConds);
                        }}
                      />

                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-neutral-06)] hover:text-red-400"
                        onClick={() => setConditions(conditions.filter((_, i) => i !== idx))}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* B. 周期触发 */}
              <TabsContent value="schedule" className="space-y-4 mt-0">
                 <div className="flex gap-4 p-4 bg-orange-500/5 rounded-lg border border-orange-500/20">
                    <Clock className="w-5 h-5 text-orange-400 flex-shrink-0 mt-1" />
                    <div className="space-y-4 flex-1">
                        <div className="grid gap-2">
                            <Label className="text-xs text-[var(--color-neutral-07)]">执行频率</Label>
                            <Select value={frequency} onValueChange={setFrequency}>
                                <SelectTrigger className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-04)] text-[var(--color-neutral-11)]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">每天 (09:00)</SelectItem>
                                    <SelectItem value="weekly">每周一 (09:00)</SelectItem>
                                    <SelectItem value="biweekly">每两周 (09:00)</SelectItem>
                                    <SelectItem value="monthly">每月1号 (09:00)</SelectItem>
                                    <SelectItem value="quarterly">每季度首日 (09:00)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs text-[var(--color-neutral-07)]">目标数据范围（针对哪些数据生成任务）</Label>
                            <Select value={targetScope} onValueChange={setTargetScope}>
                                <SelectTrigger className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-04)] text-[var(--color-neutral-11)]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {scopeOptions.map(group => (
                                      <div key={group.group}>
                                        <div className="px-2 py-1.5 text-xs font-semibold text-[var(--color-neutral-07)]">{group.group}</div>
                                        {group.items.map(item => (
                                          <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                        ))}
                                      </div>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                 </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 3. 任务生成模板 */}
          <div className="space-y-4 border-t border-[var(--color-neutral-03)] pt-4">
            <Label className="text-base font-semibold text-[var(--color-neutral-11)]">生成任务配置</Label>

            <div className="grid gap-3">
               <div>
                  <Label className="text-xs text-[var(--color-neutral-07)] mb-1.5 block">任务标题模板（支持变量）</Label>
                  <div className="relative">
                    <Input
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="pr-20 bg-[var(--color-neutral-01)] border-[var(--color-neutral-04)] text-[var(--color-neutral-11)]"
                    />
                    <Badge variant="secondary" className="absolute right-2 top-2 text-[10px] pointer-events-none bg-[var(--color-neutral-03)] text-[var(--color-neutral-08)]">
                        {triggerType === 'event' ? '${name}' : '${date}'}
                    </Badge>
                  </div>
               </div>

               <div>
                  <Label className="text-xs text-[var(--color-neutral-07)] mb-1.5 block">任务描述/指导语</Label>
                  <Textarea
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    rows={2}
                    className="resize-none bg-[var(--color-neutral-01)] border-[var(--color-neutral-04)] text-[var(--color-neutral-11)]"
                  />
               </div>

               <div className="flex gap-4">
                  <div className="w-1/2">
                    <Label className="text-xs text-[var(--color-neutral-07)] mb-1.5 block">截止时间</Label>
                    <Select value={deadline} onValueChange={setDeadline}>
                        <SelectTrigger className="bg-[var(--color-neutral-01)] border-[var(--color-neutral-04)] text-[var(--color-neutral-11)]">
                            <SelectValue placeholder="选择时长" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">生成后 24小时 内</SelectItem>
                            <SelectItem value="3">生成后 3天 内</SelectItem>
                            <SelectItem value="7">生成后 1周 内</SelectItem>
                            <SelectItem value="30">生成后 1月 内</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="w-1/2">
                    <Label className="text-xs text-[var(--color-neutral-07)] mb-1.5 block">指派给</Label>
                     <Select defaultValue="current">
                        <SelectTrigger disabled className="bg-[var(--color-neutral-01)] border-[var(--color-neutral-04)] text-[var(--color-neutral-09)]">
                            <SelectValue placeholder="当前网格员" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="current">当前网格员</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[var(--color-neutral-04)] text-[var(--color-neutral-09)] hover:bg-[var(--color-neutral-03)]">取消</Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">保存规则</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
