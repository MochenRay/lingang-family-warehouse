import { useEffect, useState } from 'react';
import { Shield, Lock, Eye, Edit2, Database, Settings, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { StatCard } from '../patterns/StatCard';
import { PANEL_CLASS } from '../patterns/surfaces';
import { PageHeader } from './PageHeader';

const MUTED_TEXT_CLASS = 'text-[var(--color-neutral-08)]';
const INFO_BADGE_CLASS = 'border-[var(--color-neutral-04)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]';
const TABLE_HEAD_CLASS = 'text-xs uppercase whitespace-nowrap';
const NOTE_PANEL_CLASS = 'rounded-lg border border-[var(--color-brand-primary-hover)]/35 bg-[var(--color-brand-primary-hover)]/10 p-4 text-sm font-medium text-[var(--color-brand-text)]';
const CURRENT_USER_ROLE_KEY = 'homedata.permission-management.current-user-role';
const PERMISSIONS_STORAGE_KEY = 'homedata.permission-management.permissions';

export function PermissionManagement() {
  const [selectedRole, setSelectedRole] = useState('district_admin');

  // 功能权限矩阵（种子数据，各角色独立拷贝，见 permsByRole）
  const functionPermissionsSeed = [
    {
      module: '数据管理',
      icon: Database,
      permissions: [
        { name: '人口信息管理', view: true, create: true, edit: true, delete: true, export: true },
        { name: '房屋信息管理', view: true, create: true, edit: true, delete: true, export: true },
        { name: '家庭关系管理', view: true, create: true, edit: true, delete: false, export: true },
        { name: '数据批量导入', view: true, create: true, edit: false, delete: false, export: false }
      ]
    },
    {
      module: '标签管理',
      icon: Edit2,
      permissions: [
        { name: '标签总览', view: true, create: false, edit: false, delete: false, export: true },
        { name: '标签创建', view: true, create: true, edit: false, delete: false, export: false },
        { name: '标签编辑', view: true, create: false, edit: true, delete: false, export: false },
        { name: '标签删除', view: true, create: false, edit: false, delete: true, export: false }
      ]
    },
    {
      module: '统计分析',
      icon: Eye,
      permissions: [
        { name: '统计总览', view: true, create: false, edit: false, delete: false, export: true },
        { name: '数据对比分析', view: true, create: false, edit: false, delete: false, export: true },
        { name: '自定义报表', view: true, create: true, edit: true, delete: true, export: true },
        { name: '全域人口热力图', view: true, create: false, edit: false, delete: false, export: true }
      ]
    },
    {
      module: '归因分析',
      icon: Shield,
      permissions: [
        { name: '异常结果分析', view: true, create: false, edit: false, delete: false, export: true },
        { name: '时序分析', view: true, create: false, edit: false, delete: false, export: true },
        { name: '影响因子识别', view: true, create: false, edit: false, delete: false, export: true },
        { name: '贡献程度排名', view: true, create: false, edit: false, delete: false, export: true }
      ]
    },
    {
      module: '数据可视化',
      icon: Eye,
      permissions: [
        { name: '辖区总览（仪表盘）', view: true, create: false, edit: false, delete: false, export: true },
        { name: '数据下钻', view: true, create: false, edit: false, delete: false, export: true },
        { name: '预警热区', view: true, create: false, edit: false, delete: false, export: true }
      ]
    },
    {
      module: '系统配置',
      icon: Settings,
      permissions: [
        { name: '用户管理', view: false, create: false, edit: false, delete: false, export: false },
        { name: '角色管理', view: false, create: false, edit: false, delete: false, export: false },
        { name: '权限管理', view: false, create: false, edit: false, delete: false, export: false },
        { name: '日志管理', view: true, create: false, edit: false, delete: false, export: true }
      ]
    }
  ];

  // 数据权限配置（种子数据，各角色独立拷贝）
  const dataPermissionsSeed = [
    {
      area: '全辖区',
      level: 'city',
      canView: true,
      canEdit: false,
      description: '可查看全市数据，不可编辑'
    },
    {
      area: 'A区',
      level: 'district',
      canView: true,
      canEdit: true,
      description: '完全权限，可查看和编辑'
    },
    {
      area: 'B区',
      level: 'district',
      canView: true,
      canEdit: false,
      description: '只读权限，仅可查看'
    },
    {
      area: 'C区',
      level: 'district',
      canView: false,
      canEdit: false,
      description: '无权限'
    },
    {
      area: 'D区',
      level: 'district',
      canView: false,
      canEdit: false,
      description: '无权限'
    }
  ];

  type FunctionPermField = 'view' | 'create' | 'edit' | 'delete' | 'export';

  // 角色列表
  const roles = [
    { code: 'admin', name: '系统管理员', color: 'var(--color-status-error)' },
    { code: 'district_admin', name: '区域管理员', color: 'var(--color-status-warning)' },
    { code: 'analyst', name: '数据分析员', color: 'var(--color-brand-primary-hover)' },
    { code: 'operator', name: '数据录入员', color: 'var(--color-status-success)' },
    { code: 'viewer', name: '访客', color: 'var(--color-neutral-06)' }
  ];

  const [currentUserRole] = useState(() => {
    const storedRole = typeof window === 'undefined' ? null : window.localStorage.getItem(CURRENT_USER_ROLE_KEY);
    return roles.some((role) => role.code === storedRole) ? storedRole! : 'admin';
  });
  const canManagePermissions = currentUserRole === 'admin';

  // 各角色独立的权限矩阵（修改互不影响——此前全局单一状态会跨角色串联）。
  // 注意：手工深拷贝纯数据并保留 icon 引用——structuredClone 会因
  // Lucide forwardRef 对象含 Symbol(react.forward_ref) 抛 DataCloneError（整页白屏的教训）。
  const clonePerms = () => ({
    function: functionPermissionsSeed.map((mod) => ({
      ...mod,
      permissions: mod.permissions.map((perm) => ({ ...perm })),
    })),
    data: dataPermissionsSeed.map((area) => ({ ...area })),
  });

  type RolePermissions = ReturnType<typeof clonePerms>;
  type PermissionsByRole = Record<string, RolePermissions>;

  const cloneRolePermissions = (permissions: RolePermissions): RolePermissions => ({
    function: permissions.function.map((mod) => ({
      ...mod,
      permissions: mod.permissions.map((permission) => ({ ...permission })),
    })),
    data: permissions.data.map((area) => ({ ...area })),
  });

  const buildSeededPermissions = (): PermissionsByRole =>
    Object.fromEntries(roles.map((role) => [role.code, clonePerms()]));

  const loadPermissions = (): PermissionsByRole => {
    const seeded = buildSeededPermissions();
    if (typeof window === 'undefined') return seeded;

    const stored = window.localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (!stored) return seeded;

    try {
      const parsed = JSON.parse(stored) as Record<string, {
        function?: Array<{ permissions?: Array<Partial<Record<FunctionPermField, boolean>>> }>;
        data?: Array<Partial<Record<'canView' | 'canEdit', boolean>>>;
      }>;

      return Object.fromEntries(roles.map((role) => {
        const storedRole = parsed[role.code];
        const roleSeed = seeded[role.code];
        const hydrated: RolePermissions = {
          function: roleSeed.function.map((mod, moduleIndex) => ({
            ...mod,
            permissions: mod.permissions.map((permission, permissionIndex) => {
              const storedPermission = storedRole?.function?.[moduleIndex]?.permissions?.[permissionIndex];
              return {
                ...permission,
                view: typeof storedPermission?.view === 'boolean' ? storedPermission.view : permission.view,
                create: typeof storedPermission?.create === 'boolean' ? storedPermission.create : permission.create,
                edit: typeof storedPermission?.edit === 'boolean' ? storedPermission.edit : permission.edit,
                delete: typeof storedPermission?.delete === 'boolean' ? storedPermission.delete : permission.delete,
                export: typeof storedPermission?.export === 'boolean' ? storedPermission.export : permission.export,
              };
            }),
          })),
          data: roleSeed.data.map((area, areaIndex) => {
            const storedArea = storedRole?.data?.[areaIndex];
            return {
              ...area,
              canView: typeof storedArea?.canView === 'boolean' ? storedArea.canView : area.canView,
              canEdit: typeof storedArea?.canEdit === 'boolean' ? storedArea.canEdit : area.canEdit,
            };
          }),
        };
        return [role.code, hydrated];
      }));
    } catch {
      return seeded;
    }
  };

  const [permsByRole, setPermsByRole] = useState<PermissionsByRole>(loadPermissions);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState<RolePermissions | null>(null);

  const currentPerms = permsByRole[selectedRole];

  const restoreSnapshot = () => {
    if (editSnapshot) {
      setPermsByRole((previous) => ({
        ...previous,
        [selectedRole]: cloneRolePermissions(editSnapshot),
      }));
    }
    setIsEditing(false);
    setIsDirty(false);
    setEditSnapshot(null);
  };

  const startEditing = () => {
    if (!canManagePermissions || selectedRole === 'admin') return;
    setEditSnapshot(cloneRolePermissions(currentPerms));
    setIsEditing(true);
    setIsDirty(false);
  };

  const savePermissions = () => {
    if (!canManagePermissions || !isEditing) return;
    const storable = Object.fromEntries(Object.entries(permsByRole).map(([roleCode, permissions]) => [
      roleCode,
      {
        function: permissions.function.map((mod) => ({
          permissions: mod.permissions.map(({ view, create, edit, delete: canDelete, export: canExport }) => ({
            view,
            create,
            edit,
            delete: canDelete,
            export: canExport,
          })),
        })),
        data: permissions.data.map(({ canView, canEdit }) => ({ canView, canEdit })),
      },
    ]));
    window.localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(storable));
    setIsEditing(false);
    setIsDirty(false);
    setEditSnapshot(null);
  };

  const selectRole = (nextRole: string) => {
    if (nextRole === selectedRole) return;

    if (isEditing && isDirty && !window.confirm('当前权限修改尚未保存，是否放弃修改并切换角色？')) {
      return;
    }
    if (isEditing && editSnapshot) {
      setPermsByRole((previous) => ({
        ...previous,
        [selectedRole]: cloneRolePermissions(editSnapshot),
      }));
    }
    setIsEditing(false);
    setIsDirty(false);
    setEditSnapshot(null);
    setSelectedRole(nextRole);
  };

  useEffect(() => {
    if (!isEditing) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      restoreSnapshot();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [editSnapshot, isEditing, selectedRole]);

  useEffect(() => {
    if (!isEditing || !isDirty) return undefined;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const handleRouteClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-route-id]') : null;
      if (!target || target.dataset.routeId === 'permission-management') return;
      if (!window.confirm('当前权限修改尚未保存，是否放弃修改并离开本页？')) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      setIsEditing(false);
      setIsDirty(false);
      setEditSnapshot(null);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleRouteClick, true);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleRouteClick, true);
    };
  }, [isDirty, isEditing]);

  // 权限矩阵勾选（演示数据，本地状态按角色可操作；admin 角色保持只读）
  const toggleFunctionPermission = (moduleIndex: number, permIndex: number, field: FunctionPermField, checked: boolean) => {
    if (!isEditing || !canManagePermissions || selectedRole === 'admin') return;
    setPermsByRole((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        function: prev[selectedRole].function.map((mod, mi) =>
          mi === moduleIndex
            ? { ...mod, permissions: mod.permissions.map((perm, pi) => (pi === permIndex ? { ...perm, [field]: checked } : perm)) }
            : mod,
        ),
      },
    }));
    setIsDirty(true);
  };

  const toggleDataPermission = (areaIndex: number, field: 'canView' | 'canEdit', checked: boolean) => {
    if (!isEditing || !canManagePermissions || selectedRole === 'admin') return;
    setPermsByRole((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        data: prev[selectedRole].data.map((area, i) => (i === areaIndex ? { ...area, [field]: checked } : area)),
      },
    }));
    setIsDirty(true);
  };

  // 权限操作统计（按当前角色视图）
  const permissionStats = {
    totalModules: currentPerms.function.length,
    totalFunctions: currentPerms.function.reduce((sum, m) => sum + m.permissions.length, 0),
    enabledFunctions: currentPerms.function.reduce(
      (sum, m) => sum + m.permissions.filter(p => p.view).length,
      0
    ),
    dataAreas: currentPerms.data.filter(d => d.canView).length
  };

  const selectedRoleName = roles.find(r => r.code === selectedRole)?.name ?? selectedRole;
  const currentUserRoleName = roles.find(r => r.code === currentUserRole)?.name ?? currentUserRole;

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)] page-enter">
      <PageHeader
        eyebrow="PERMISSION MATRIX"
        title="权限管理"
        description="梳理功能权限和数据范围，明确不同岗位可见可操作边界。"
      />

      {/* 角色选择 */}
      <Card className={PANEL_CLASS}>
        <CardHeader>
          <CardTitle className="text-base text-[var(--color-neutral-11)]">选择角色</CardTitle>
          <CardDescription className={MUTED_TEXT_CLASS}>
            选择要查看的权限角色 · 当前登录角色：{currentUserRoleName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {roles.map((role) => (
              <button
                key={role.code}
                type="button"
                onClick={() => selectRole(role.code)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedRole === role.code
                    ? 'border-[var(--color-brand-primary-hover)] bg-[var(--color-brand-primary-hover)]/10 text-[var(--color-neutral-11)]'
                    : 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] hover:border-[var(--color-brand-primary-hover)]/55 hover:bg-[var(--color-neutral-03)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: role.color }} />
                  <span className="font-medium">{role.name}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 权限统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="功能模块" value={permissionStats.totalModules} hint="系统功能模块" tone="brand" />
        <StatCard label="功能点总数" value={permissionStats.totalFunctions} hint="可配置功能点" tone="brand" />
        <StatCard
          label="已授权功能"
          value={permissionStats.enabledFunctions}
          hint={`占比 ${((permissionStats.enabledFunctions / permissionStats.totalFunctions) * 100).toFixed(0)}%`}
          tone="success"
        />
        <StatCard label="数据权限范围" value={permissionStats.dataAreas} hint="可访问区域" tone="brand" />
      </div>

      {/* 权限配置 */}
      <Card className={PANEL_CLASS}>
        <CardHeader className="border-b border-[var(--color-neutral-03)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base text-[var(--color-neutral-11)]">权限配置</CardTitle>
              <CardDescription className={MUTED_TEXT_CLASS}>
                当前角色：{selectedRoleName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!canManagePermissions && (
                <Badge variant="outline" className={INFO_BADGE_CLASS}>只读</Badge>
              )}
              {canManagePermissions && selectedRole === 'admin' && (
                <Badge variant="outline" className={INFO_BADGE_CLASS}>受保护角色</Badge>
              )}
              {canManagePermissions && selectedRole !== 'admin' && !isEditing && (
                <Button type="button" size="sm" onClick={startEditing}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  编辑权限
                </Button>
              )}
              {canManagePermissions && isEditing && (
                <>
                  <Button type="button" size="sm" variant="outline" onClick={restoreSnapshot}>
                    <X className="mr-2 h-4 w-4" />
                    取消
                  </Button>
                  <Button type="button" size="sm" onClick={savePermissions} disabled={!isDirty}>
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </Button>
                </>
              )}
            </div>
          </div>
          <div role="status" aria-live="polite" className={`text-sm ${MUTED_TEXT_CLASS}`}>
            {isEditing
              ? isDirty
                ? '编辑中：修改尚未保存，切换角色或离开页面时将先请求确认。'
                : '编辑中：可调整当前角色权限；保存后生效，取消可恢复进入编辑前的配置。'
              : '当前为只读视图；只有具备权限管理能力的当前用户可进入编辑。'}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="function">
            <TabsList className="mb-4 bg-[var(--color-neutral-01)]">
              <TabsTrigger value="function">功能权限</TabsTrigger>
              <TabsTrigger value="data">数据权限</TabsTrigger>
            </TabsList>

            {/* 功能权限 */}
            <TabsContent value="function" className="space-y-4">
              {currentPerms.function.map((module, moduleIndex) => {
                const ModuleIcon = module.icon;
                return (
                  <Card key={module.module} className={PANEL_CLASS}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <ModuleIcon className="w-5 h-5 text-[var(--color-brand-text)]" />
                        <CardTitle className="text-lg text-[var(--color-neutral-11)]">{module.module}</CardTitle>
                        <Badge variant="outline" className={INFO_BADGE_CLASS}>
                          {module.permissions.length} 个功能
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table className="min-w-[760px]">
                        <TableHeader>
                          <TableRow className="border-b border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-02)]">
                            <TableHead className={`${TABLE_HEAD_CLASS} min-w-[180px]`}>
                              功能名称
                            </TableHead>
                            <TableHead className={`${TABLE_HEAD_CLASS} text-center`}>
                              <Eye className="w-4 h-4 mx-auto" />
                              查看
                            </TableHead>
                            <TableHead className={`${TABLE_HEAD_CLASS} text-center`}>
                              <Edit2 className="w-4 h-4 mx-auto" />
                              新建
                            </TableHead>
                            <TableHead className={`${TABLE_HEAD_CLASS} text-center`}>
                              <Edit2 className="w-4 h-4 mx-auto" />
                              编辑
                            </TableHead>
                            <TableHead className={`${TABLE_HEAD_CLASS} text-center`}>
                              <Lock className="w-4 h-4 mx-auto" />
                              删除
                            </TableHead>
                            <TableHead className={`${TABLE_HEAD_CLASS} text-center`}>
                              <Database className="w-4 h-4 mx-auto" />
                              导出
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {module.permissions.map((perm, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium text-[var(--color-neutral-11)]">{perm.name}</TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={perm.view}
                                  onCheckedChange={(checked) => toggleFunctionPermission(moduleIndex, index, 'view', checked === true)}
                                  disabled={!isEditing || selectedRole === 'admin'}
                                  aria-label={`${selectedRoleName}-${perm.name}-查看`}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={perm.create}
                                  onCheckedChange={(checked) => toggleFunctionPermission(moduleIndex, index, 'create', checked === true)}
                                  disabled={!isEditing || selectedRole === 'admin' || !perm.view}
                                  aria-label={`${selectedRoleName}-${perm.name}-新建`}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={perm.edit}
                                  onCheckedChange={(checked) => toggleFunctionPermission(moduleIndex, index, 'edit', checked === true)}
                                  disabled={!isEditing || selectedRole === 'admin' || !perm.view}
                                  aria-label={`${selectedRoleName}-${perm.name}-编辑`}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={perm.delete}
                                  onCheckedChange={(checked) => toggleFunctionPermission(moduleIndex, index, 'delete', checked === true)}
                                  disabled={!isEditing || selectedRole === 'admin' || !perm.view}
                                  aria-label={`${selectedRoleName}-${perm.name}-删除`}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={perm.export}
                                  onCheckedChange={(checked) => toggleFunctionPermission(moduleIndex, index, 'export', checked === true)}
                                  disabled={!isEditing || selectedRole === 'admin' || !perm.view}
                                  aria-label={`${selectedRoleName}-${perm.name}-导出`}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })}

              {selectedRole === 'admin' && (
                <div className={NOTE_PANEL_CLASS}>
                  系统管理员拥有所有功能权限，不可修改
                </div>
              )}
            </TabsContent>

            {/* 数据权限 */}
            <TabsContent value="data" className="space-y-4">
              <Card className={PANEL_CLASS}>
                <CardHeader>
                  <CardTitle className="text-base text-[var(--color-neutral-11)]">区域数据权限</CardTitle>
                  <CardDescription className={MUTED_TEXT_CLASS}>配置角色可访问的数据范围</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table className="min-w-[680px]">
                    <TableHeader>
                      <TableRow className="border-b border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-02)]">
                        <TableHead className={`${TABLE_HEAD_CLASS} min-w-[140px]`}>
                          区域名称
                        </TableHead>
                        <TableHead className={`${TABLE_HEAD_CLASS} min-w-[90px]`}>
                          层级
                        </TableHead>
                        <TableHead className={`${TABLE_HEAD_CLASS} text-center`}>
                          可查看
                        </TableHead>
                        <TableHead className={`${TABLE_HEAD_CLASS} text-center`}>
                          可编辑
                        </TableHead>
                        <TableHead className={`${TABLE_HEAD_CLASS} min-w-[220px]`}>
                          说明
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPerms.data.map((area, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-[var(--color-neutral-11)]">{area.area}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={INFO_BADGE_CLASS}>
                              {area.level === 'city' ? '市级' : '区级'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={area.canView}
                              onCheckedChange={(checked) => toggleDataPermission(index, 'canView', checked === true)}
                              disabled={!isEditing || selectedRole === 'admin'}
                              aria-label={`${selectedRoleName}-${area.area}-可查看`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={area.canEdit}
                              onCheckedChange={(checked) => toggleDataPermission(index, 'canEdit', checked === true)}
                              disabled={!isEditing || selectedRole === 'admin' || !area.canView}
                              aria-label={`${selectedRoleName}-${area.area}-可编辑`}
                            />
                          </TableCell>
                          <TableCell className={MUTED_TEXT_CLASS}>
                            {area.description}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* 数据范围说明 */}
              <Card className={PANEL_CLASS}>
                <CardHeader>
                  <CardTitle className="text-base text-[var(--color-neutral-11)]">数据权限说明</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-2 h-2 w-2 rounded-full bg-[var(--color-brand-primary-hover)]" />
                      <div>
                        <p className="font-medium text-[var(--color-neutral-11)]">查看权限</p>
                        <p className={`text-sm ${MUTED_TEXT_CLASS}`}>
                          可以查看该区域的所有数据，包括人口、房屋、标签等信息
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-2 h-2 w-2 rounded-full bg-[var(--color-status-success)]" />
                      <div>
                        <p className="font-medium text-[var(--color-neutral-11)]">编辑权限</p>
                        <p className={`text-sm ${MUTED_TEXT_CLASS}`}>
                          可以对该区域的数据进行增删改操作，需同时拥有查看权限
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-2 h-2 w-2 rounded-full bg-[var(--color-status-warning)]" />
                      <div>
                        <p className="font-medium text-[var(--color-neutral-11)]">数据隔离</p>
                        <p className={`text-sm ${MUTED_TEXT_CLASS}`}>
                          用户只能访问被授权的区域数据，无法查看或操作其他区域
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedRole === 'admin' && (
                <div className={NOTE_PANEL_CLASS}>
                  系统管理员拥有全辖区所有数据权限，不可修改
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 数据更新时间 */}
      <div className={`text-center text-sm ${MUTED_TEXT_CLASS}`}>
        数据更新时间：2026-01-20 16:00:00
      </div>
    </div>
  );
}
