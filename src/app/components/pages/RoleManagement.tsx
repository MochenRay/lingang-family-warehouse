import { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Users, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';

const DARK_CARD_CLASS = 'rounded-lg border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none';
const DARK_DIALOG_CLASS = 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] shadow-2xl';
const DARK_INPUT_CLASS = 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] placeholder:text-[var(--color-neutral-08)]';
const DARK_PANEL_CLASS = 'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)]';
const ACTION_BUTTON_CLASS = 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]';
const MUTED_TEXT_CLASS = 'text-[var(--color-neutral-08)]';
const STATUS_ACTIVE_BADGE_CLASS = 'border border-[#19B172]/35 bg-[#19B172]/15 text-[#7DE2B7]';
const STATUS_DISABLED_BADGE_CLASS = 'border border-[#D52132]/35 bg-[#D52132]/15 text-[#FFB4B4]';
const INFO_BADGE_CLASS = 'border-[var(--color-neutral-04)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]';

export function RoleManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  // 角色列表
  const roles = [
    {
      id: 1,
      name: '系统管理员',
      code: 'admin',
      description: '拥有系统所有权限，可管理用户、角色和系统配置',
      userCount: 1,
      area: '全辖区',
      permissions: ['all'],
      createdAt: '2025-12-15',
      status: 'active'
    },
    {
      id: 2,
      name: '区域管理员',
      code: 'district_admin',
      description: '管理指定区域的数据和用户，具有区域内所有权限',
      userCount: 2,
      area: '可配置',
      permissions: ['data_manage', 'tag_manage', 'statistics', 'visualization'],
      createdAt: '2025-12-15',
      status: 'active'
    },
    {
      id: 3,
      name: '数据分析员',
      code: 'analyst',
      description: '负责数据分析和报表生成，具有查看和分析权限',
      userCount: 1,
      area: '可配置',
      permissions: ['statistics', 'analysis', 'visualization', 'export'],
      createdAt: '2025-12-15',
      status: 'active'
    },
    {
      id: 4,
      name: '数据录入员',
      code: 'operator',
      description: '负责数据录入和基础维护，具有数据管理权限',
      userCount: 1,
      area: '可配置',
      permissions: ['data_manage', 'data_view'],
      createdAt: '2025-12-15',
      status: 'active'
    },
    {
      id: 5,
      name: '访客',
      code: 'viewer',
      description: '只读权限，可查看数据和报表，不能进行任何修改操作',
      userCount: 1,
      area: '可配置',
      permissions: ['data_view', 'statistics_view'],
      createdAt: '2025-12-15',
      status: 'active'
    }
  ];

  // 权限树结构
  const permissionTree = [
    {
      module: '数据管理',
      code: 'data_manage',
      children: [
        { name: '人口信息管理', code: 'population_manage' },
        { name: '房屋信息管理', code: 'housing_manage' },
        { name: '家庭关系管理', code: 'relationship_manage' },
        { name: '数据批量导入', code: 'batch_import' }
      ]
    },
    {
      module: '标签管理',
      code: 'tag_manage',
      children: [
        { name: '标签创建', code: 'tag_create' },
        { name: '标签编辑', code: 'tag_edit' },
        { name: '标签删除', code: 'tag_delete' },
        { name: '标签查看', code: 'tag_view' }
      ]
    },
    {
      module: '统计分析',
      code: 'statistics',
      children: [
        { name: '统计总览', code: 'statistics_overview' },
        { name: '数据对比分析', code: 'data_comparison' },
        { name: '自定义报表', code: 'custom_report' },
        { name: '热力图分析', code: 'heatmap' }
      ]
    },
    {
      module: '归因分析',
      code: 'analysis',
      children: [
        { name: '异常分析', code: 'anomaly_analysis' },
        { name: '时序分析', code: 'time_series' },
        { name: '因子识别', code: 'factor_identification' },
        { name: '贡献排名', code: 'contribution_ranking' }
      ]
    },
    {
      module: '数据可视化',
      code: 'visualization',
      children: [
        { name: '仪表盘', code: 'dashboard' },
        { name: '数据下钻', code: 'drilldown' },
        { name: '预警地图', code: 'warning_map' }
      ]
    },
    {
      module: '系统配置',
      code: 'system_config',
      children: [
        { name: '用户管理', code: 'user_manage' },
        { name: '角色管理', code: 'role_manage' },
        { name: '权限管理', code: 'permission_manage' },
        { name: '日志管理', code: 'log_manage' }
      ]
    }
  ];

  // 区域选项
  const areaOptions = [
    { label: '全辖区', value: 'all' },
    { label: 'A区', value: 'A' },
    { label: 'B区', value: 'B' },
    { label: 'C区', value: 'C' },
    { label: 'D区', value: 'D' }
  ];

  const getPermissionName = (code: string) => {
    if (code === 'all') return '全部权限';
    for (const module of permissionTree) {
      if (module.code === code) return module.module;
      const child = module.children.find(c => c.code === code);
      if (child) return child.name;
    }
    return code;
  };

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)] animate-in fade-in duration-500">
      {/* 页面标题 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-neutral-11)]">角色管理</h1>
          <p className={`mt-1 text-sm ${MUTED_TEXT_CLASS}`}>角色的创建、权限配置及辖区范围设置</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新建角色
              </Button>
            </DialogTrigger>
            <DialogContent className={`max-w-3xl max-h-[80vh] overflow-y-auto ${DARK_DIALOG_CLASS}`}>
              <DialogHeader>
                <DialogTitle className="text-[var(--color-neutral-11)]">新建角色</DialogTitle>
                <DialogDescription className={MUTED_TEXT_CLASS}>配置角色基本信息和权限范围</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roleName" className={MUTED_TEXT_CLASS}>角色名称 *</Label>
                    <Input id="roleName" className={DARK_INPUT_CLASS} placeholder="请输入角色名称" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roleCode" className={MUTED_TEXT_CLASS}>角色编码 *</Label>
                    <Input id="roleCode" className={DARK_INPUT_CLASS} placeholder="请输入角色编码（英文）" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className={MUTED_TEXT_CLASS}>角色描述</Label>
                  <Input id="description" className={DARK_INPUT_CLASS} placeholder="请输入角色描述" />
                </div>
                
                <div className="space-y-2">
                  <Label className={MUTED_TEXT_CLASS}>管辖区域 *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {areaOptions.map((area) => (
                      <div key={area.value} className="flex items-center space-x-2">
                        <Checkbox id={`area-${area.value}`} />
                        <label
                          htmlFor={`area-${area.value}`}
                          className="text-sm font-medium leading-none text-[var(--color-neutral-10)] peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {area.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={MUTED_TEXT_CLASS}>功能权限 *</Label>
                  <div className={`${DARK_PANEL_CLASS} max-h-[300px] space-y-3 overflow-y-auto p-4`}>
                    {permissionTree.map((module) => (
                      <div key={module.code} className="space-y-2">
                        <div className="flex items-center space-x-2 font-medium text-[var(--color-neutral-11)]">
                          <Checkbox id={`module-${module.code}`} />
                          <label htmlFor={`module-${module.code}`}>
                            {module.module}
                          </label>
                        </div>
                        <div className="ml-6 grid grid-cols-2 gap-2">
                          {module.children.map((child) => (
                            <div key={child.code} className="flex items-center space-x-2">
                              <Checkbox id={`perm-${child.code}`} />
                              <label
                                htmlFor={`perm-${child.code}`}
                                className={`text-sm ${MUTED_TEXT_CLASS}`}
                              >
                                {child.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" className={ACTION_BUTTON_CLASS} onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>
                  创建
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={`flex items-center gap-2 ${MUTED_TEXT_CLASS}`}>
              <Shield className="w-4 h-4" />
              角色总数
            </CardDescription>
            <CardTitle className="text-3xl text-[var(--color-neutral-11)]">{roles.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT_CLASS}`}>系统预设角色</p>
          </CardContent>
        </Card>

        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT_CLASS}>启用角色</CardDescription>
            <CardTitle className="text-3xl text-[#19B172]">
              {roles.filter(r => r.status === 'active').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT_CLASS}`}>可正常使用</p>
          </CardContent>
        </Card>

        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT_CLASS}>分配用户</CardDescription>
            <CardTitle className="text-3xl text-[#4E86DF]">
              {roles.reduce((sum, r) => sum + r.userCount, 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT_CLASS}`}>已关联用户</p>
          </CardContent>
        </Card>

        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT_CLASS}>权限模块</CardDescription>
            <CardTitle className="text-3xl text-[var(--color-neutral-11)]">{permissionTree.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT_CLASS}`}>可配置模块</p>
          </CardContent>
        </Card>
      </div>

      {/* 角色列表 */}
      <div className="grid grid-cols-1 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className={`${DARK_CARD_CLASS} transition-colors hover:bg-[var(--color-neutral-03)]/70`}>
            <CardHeader>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#4E86DF]/35 bg-[#4E86DF]/10">
                    <Shield className="w-6 h-6 text-[#9EC3FF]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-[var(--color-neutral-11)]">{role.name}</CardTitle>
                      <Badge variant="outline" className={INFO_BADGE_CLASS}>{role.code}</Badge>
                      {role.status === 'active' ? (
                        <Badge className={STATUS_ACTIVE_BADGE_CLASS}>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          启用
                        </Badge>
                      ) : (
                        <Badge className={STATUS_DISABLED_BADGE_CLASS}>
                          <XCircle className="w-3 h-3 mr-1" />
                          禁用
                        </Badge>
                      )}
                    </div>
                    <CardDescription className={MUTED_TEXT_CLASS}>{role.description}</CardDescription>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={ACTION_BUTTON_CLASS}
                    onClick={() => setSelectedRole(role)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    编辑
                  </Button>
                  <Button size="sm" variant="outline" className="border-[#D52132]/35 bg-[#D52132]/10 text-[#FF8A8A] hover:bg-[#D52132]/20 hover:text-[#FFB4B4]">
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className={DARK_PANEL_CLASS + ' p-3'}>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className={`w-4 h-4 ${MUTED_TEXT_CLASS}`} />
                    <span className={`text-sm ${MUTED_TEXT_CLASS}`}>关联用户</span>
                  </div>
                  <p className="text-lg font-semibold text-[var(--color-neutral-11)]">{role.userCount} 个</p>
                </div>
                <div className={DARK_PANEL_CLASS + ' p-3'}>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className={`w-4 h-4 ${MUTED_TEXT_CLASS}`} />
                    <span className={`text-sm ${MUTED_TEXT_CLASS}`}>权限数量</span>
                  </div>
                  <p className="text-lg font-semibold text-[var(--color-neutral-11)]">
                    {role.permissions.includes('all') ? '全部' : role.permissions.length + ' 项'}
                  </p>
                </div>
                <div className={DARK_PANEL_CLASS + ' p-3'}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm ${MUTED_TEXT_CLASS}`}>管辖区域</span>
                  </div>
                  <p className="text-lg font-semibold text-[var(--color-neutral-11)]">{role.area}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className={`text-sm font-medium ${MUTED_TEXT_CLASS}`}>权限列表：</p>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((perm, index) => (
                    <Badge key={index} variant="outline" className="border-[#4E86DF]/35 bg-[#4E86DF]/10 text-[#9EC3FF]">
                      {getPermissionName(perm)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className={`mt-4 border-t border-[var(--color-neutral-03)] pt-4 text-sm ${MUTED_TEXT_CLASS}`}>
                创建时间：{role.createdAt}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 权限模块说明 */}
      <Card className={DARK_CARD_CLASS}>
        <CardHeader>
          <CardTitle className="text-base text-[var(--color-neutral-11)]">权限模块说明</CardTitle>
          <CardDescription className={MUTED_TEXT_CLASS}>系统功能模块和权限点说明</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {permissionTree.map((module) => (
              <div key={module.code} className={`${DARK_PANEL_CLASS} p-4`}>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-[var(--color-neutral-11)]">
                  <Shield className="w-4 h-4 text-[#4E86DF]" />
                  {module.module}
                </h3>
                <ul className="space-y-1">
                  {module.children.map((child) => (
                    <li key={child.code} className={`text-sm flex items-center gap-2 ${MUTED_TEXT_CLASS}`}>
                      <div className="w-1 h-1 rounded-full bg-[var(--color-neutral-06)]" />
                      {child.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 编辑角色对话框 */}
      {selectedRole && (
        <Dialog open={!!selectedRole} onOpenChange={() => setSelectedRole(null)}>
          <DialogContent className={`max-w-3xl max-h-[80vh] overflow-y-auto ${DARK_DIALOG_CLASS}`}>
            <DialogHeader>
              <DialogTitle className="text-[var(--color-neutral-11)]">编辑角色 - {selectedRole.name}</DialogTitle>
              <DialogDescription className={MUTED_TEXT_CLASS}>修改角色配置和权限</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editRoleName" className={MUTED_TEXT_CLASS}>角色名称 *</Label>
                  <Input
                    id="editRoleName"
                    className={DARK_INPUT_CLASS}
                    defaultValue={selectedRole.name}
                    placeholder="请输入角色名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editRoleCode" className={MUTED_TEXT_CLASS}>角色编码 *</Label>
                  <Input
                    id="editRoleCode"
                    className={DARK_INPUT_CLASS}
                    defaultValue={selectedRole.code}
                    placeholder="请输入角色编码（英文）"
                    disabled
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDescription" className={MUTED_TEXT_CLASS}>角色描述</Label>
                <Input
                  id="editDescription"
                  className={DARK_INPUT_CLASS}
                  defaultValue={selectedRole.description}
                  placeholder="请输入角色描述"
                />
              </div>
              
              <div className="space-y-2">
                <Label className={MUTED_TEXT_CLASS}>管辖区域 *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {areaOptions.map((area) => (
                    <div key={area.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-area-${area.value}`}
                        defaultChecked={selectedRole.area === area.label || selectedRole.area === '全辖区'}
                      />
                      <label
                        htmlFor={`edit-area-${area.value}`}
                        className="text-sm font-medium leading-none text-[var(--color-neutral-10)]"
                      >
                        {area.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className={MUTED_TEXT_CLASS}>功能权限 *</Label>
                <div className={`${DARK_PANEL_CLASS} max-h-[300px] space-y-3 overflow-y-auto p-4`}>
                  {permissionTree.map((module) => (
                    <div key={module.code} className="space-y-2">
                      <div className="flex items-center space-x-2 font-medium text-[var(--color-neutral-11)]">
                        <Checkbox
                          id={`edit-module-${module.code}`}
                          defaultChecked={
                            selectedRole.permissions.includes('all') ||
                            selectedRole.permissions.includes(module.code)
                          }
                        />
                        <label htmlFor={`edit-module-${module.code}`}>
                          {module.module}
                        </label>
                      </div>
                      <div className="ml-6 grid grid-cols-2 gap-2">
                        {module.children.map((child) => (
                          <div key={child.code} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-perm-${child.code}`}
                              defaultChecked={
                                selectedRole.permissions.includes('all') ||
                                selectedRole.permissions.includes(child.code)
                              }
                            />
                            <label
                              htmlFor={`edit-perm-${child.code}`}
                              className={`text-sm ${MUTED_TEXT_CLASS}`}
                            >
                              {child.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" className={ACTION_BUTTON_CLASS} onClick={() => setSelectedRole(null)}>
                取消
              </Button>
              <Button onClick={() => setSelectedRole(null)}>
                保存
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 数据更新时间 */}
      <div className={`text-center text-sm ${MUTED_TEXT_CLASS}`}>
        数据更新时间：2026-01-20 16:00:00
      </div>
    </div>
  );
}
