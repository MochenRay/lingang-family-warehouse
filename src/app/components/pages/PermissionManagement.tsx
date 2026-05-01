import { useState } from 'react';
import { Shield, Lock, Eye, Edit2, Database, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { PageHeader } from './PageHeader';

const DARK_CARD_CLASS = 'rounded-lg border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none';
const DARK_PANEL_CLASS = 'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)]';
const MUTED_TEXT_CLASS = 'text-[var(--color-neutral-08)]';
const INFO_BADGE_CLASS = 'border-[var(--color-neutral-04)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]';
const TABLE_HEADER_CELL_CLASS = 'px-4 py-3 text-xs font-medium uppercase whitespace-nowrap text-[var(--color-neutral-08)]';
const TABLE_CELL_CLASS = 'px-4 py-3 text-sm text-[var(--color-neutral-10)]';
const NOTE_PANEL_CLASS = 'rounded-lg border border-[#4E86DF]/35 bg-[#4E86DF]/10 p-4 text-sm font-medium text-[#9EC3FF]';

export function PermissionManagement() {
  const [selectedRole, setSelectedRole] = useState('district_admin');

  // 功能权限矩阵
  const functionPermissions = [
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
        { name: '预警地图', view: true, create: false, edit: false, delete: false, export: true }
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

  // 数据权限配置
  const dataPermissions = [
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

  // 角色列表
  const roles = [
    { code: 'admin', name: '系统管理员', color: '#D52132' },
    { code: 'district_admin', name: '区域管理员', color: '#D6730D' },
    { code: 'analyst', name: '数据分析员', color: '#4E86DF' },
    { code: 'operator', name: '数据录入员', color: '#19B172' },
    { code: 'viewer', name: '访客', color: '#6B7599' }
  ];

  // 权限操作统计
  const permissionStats = {
    totalModules: functionPermissions.length,
    totalFunctions: functionPermissions.reduce((sum, m) => sum + m.permissions.length, 0),
    enabledFunctions: functionPermissions.reduce(
      (sum, m) => sum + m.permissions.filter(p => p.view).length,
      0
    ),
    dataAreas: dataPermissions.filter(d => d.canView).length
  };

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)] animate-in fade-in duration-500">
      <PageHeader
        eyebrow="PERMISSION MATRIX"
        title="权限管理"
        description="梳理功能权限和数据范围，明确不同岗位可见可操作边界。"
      />

      {/* 角色选择 */}
      <Card className={DARK_CARD_CLASS}>
        <CardHeader>
          <CardTitle className="text-base text-[var(--color-neutral-11)]">选择角色</CardTitle>
          <CardDescription className={MUTED_TEXT_CLASS}>选择要配置权限的角色</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {roles.map((role) => (
              <button
                key={role.code}
                onClick={() => setSelectedRole(role.code)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedRole === role.code
                    ? 'border-[#4E86DF] bg-[#4E86DF]/10 text-[var(--color-neutral-11)]'
                    : 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] hover:border-[#4E86DF]/55 hover:bg-[var(--color-neutral-03)]'
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
        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT_CLASS}>功能模块</CardDescription>
            <CardTitle className="text-3xl text-[var(--color-neutral-11)]">{permissionStats.totalModules}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT_CLASS}`}>系统功能模块</p>
          </CardContent>
        </Card>

        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT_CLASS}>功能点总数</CardDescription>
            <CardTitle className="text-3xl text-[var(--color-neutral-11)]">{permissionStats.totalFunctions}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT_CLASS}`}>可配置功能点</p>
          </CardContent>
        </Card>

        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT_CLASS}>已授权功能</CardDescription>
            <CardTitle className="text-3xl text-[#19B172]">
              {permissionStats.enabledFunctions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT_CLASS}`}>
              占比 {((permissionStats.enabledFunctions / permissionStats.totalFunctions) * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT_CLASS}>数据权限范围</CardDescription>
            <CardTitle className="text-3xl text-[#4E86DF]">
              {permissionStats.dataAreas}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT_CLASS}`}>可访问区域</p>
          </CardContent>
        </Card>
      </div>

      {/* 权限配置 */}
      <Card className={DARK_CARD_CLASS}>
        <CardHeader className="border-b border-[var(--color-neutral-03)]">
          <CardTitle className="text-base text-[var(--color-neutral-11)]">权限配置</CardTitle>
          <CardDescription className={MUTED_TEXT_CLASS}>
            当前角色：{roles.find(r => r.code === selectedRole)?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="function">
            <TabsList className="mb-4 bg-[var(--color-neutral-01)]">
              <TabsTrigger value="function">功能权限</TabsTrigger>
              <TabsTrigger value="data">数据权限</TabsTrigger>
            </TabsList>

            {/* 功能权限 */}
            <TabsContent value="function" className="space-y-4">
              {functionPermissions.map((module) => {
                const ModuleIcon = module.icon;
                return (
                  <Card key={module.module} className={DARK_CARD_CLASS}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <ModuleIcon className="w-5 h-5 text-[#4E86DF]" />
                        <CardTitle className="text-lg text-[var(--color-neutral-11)]">{module.module}</CardTitle>
                        <Badge variant="outline" className={INFO_BADGE_CLASS}>
                          {module.permissions.length} 个功能
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] border-collapse">
                          <thead className="border-b border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)]">
                            <tr>
                              <th className={`${TABLE_HEADER_CELL_CLASS} min-w-[180px] text-left`}>
                                功能名称
                              </th>
                              <th className={`${TABLE_HEADER_CELL_CLASS} text-center`}>
                                <Eye className="w-4 h-4 mx-auto" />
                                查看
                              </th>
                              <th className={`${TABLE_HEADER_CELL_CLASS} text-center`}>
                                <Edit2 className="w-4 h-4 mx-auto" />
                                新建
                              </th>
                              <th className={`${TABLE_HEADER_CELL_CLASS} text-center`}>
                                <Edit2 className="w-4 h-4 mx-auto" />
                                编辑
                              </th>
                              <th className={`${TABLE_HEADER_CELL_CLASS} text-center`}>
                                <Lock className="w-4 h-4 mx-auto" />
                                删除
                              </th>
                              <th className={`${TABLE_HEADER_CELL_CLASS} text-center`}>
                                <Database className="w-4 h-4 mx-auto" />
                                导出
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--color-neutral-03)]">
                            {module.permissions.map((perm, index) => (
                              <tr key={index} className="transition-colors hover:bg-[var(--color-neutral-03)]/70">
                                <td className={`${TABLE_CELL_CLASS} font-medium text-[var(--color-neutral-11)]`}>{perm.name}</td>
                                <td className={`${TABLE_CELL_CLASS} text-center`}>
                                  <Checkbox
                                    checked={perm.view}
                                    disabled={selectedRole === 'admin'}
                                  />
                                </td>
                                <td className={`${TABLE_CELL_CLASS} text-center`}>
                                  <Checkbox
                                    checked={perm.create}
                                    disabled={selectedRole === 'admin' || !perm.view}
                                  />
                                </td>
                                <td className={`${TABLE_CELL_CLASS} text-center`}>
                                  <Checkbox
                                    checked={perm.edit}
                                    disabled={selectedRole === 'admin' || !perm.view}
                                  />
                                </td>
                                <td className={`${TABLE_CELL_CLASS} text-center`}>
                                  <Checkbox
                                    checked={perm.delete}
                                    disabled={selectedRole === 'admin' || !perm.view}
                                  />
                                </td>
                                <td className={`${TABLE_CELL_CLASS} text-center`}>
                                  <Checkbox
                                    checked={perm.export}
                                    disabled={selectedRole === 'admin' || !perm.view}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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
              <Card className={DARK_CARD_CLASS}>
                <CardHeader>
                  <CardTitle className="text-base text-[var(--color-neutral-11)]">区域数据权限</CardTitle>
                  <CardDescription className={MUTED_TEXT_CLASS}>配置角色可访问的数据范围</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] border-collapse">
                      <thead className="border-b border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)]">
                        <tr>
                          <th className={`${TABLE_HEADER_CELL_CLASS} min-w-[140px] text-left`}>
                            区域名称
                          </th>
                          <th className={`${TABLE_HEADER_CELL_CLASS} min-w-[90px] text-left`}>
                            层级
                          </th>
                          <th className={`${TABLE_HEADER_CELL_CLASS} text-center`}>
                            可查看
                          </th>
                          <th className={`${TABLE_HEADER_CELL_CLASS} text-center`}>
                            可编辑
                          </th>
                          <th className={`${TABLE_HEADER_CELL_CLASS} min-w-[220px] text-left`}>
                            说明
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-neutral-03)]">
                        {dataPermissions.map((area, index) => (
                          <tr key={index} className="transition-colors hover:bg-[var(--color-neutral-03)]/70">
                            <td className={`${TABLE_CELL_CLASS} font-medium text-[var(--color-neutral-11)]`}>{area.area}</td>
                            <td className={TABLE_CELL_CLASS}>
                              <Badge variant="outline" className={INFO_BADGE_CLASS}>
                                {area.level === 'city' ? '市级' : '区级'}
                              </Badge>
                            </td>
                            <td className={`${TABLE_CELL_CLASS} text-center`}>
                              <Checkbox
                                checked={area.canView}
                                disabled={selectedRole === 'admin'}
                              />
                            </td>
                            <td className={`${TABLE_CELL_CLASS} text-center`}>
                              <Checkbox
                                checked={area.canEdit}
                                disabled={selectedRole === 'admin' || !area.canView}
                              />
                            </td>
                            <td className={`${TABLE_CELL_CLASS} ${MUTED_TEXT_CLASS}`}>
                              {area.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* 数据范围说明 */}
              <Card className={DARK_CARD_CLASS}>
                <CardHeader>
                  <CardTitle className="text-base text-[var(--color-neutral-11)]">数据权限说明</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-2 h-2 w-2 rounded-full bg-[#4E86DF]" />
                      <div>
                        <p className="font-medium text-[var(--color-neutral-11)]">查看权限</p>
                        <p className={`text-sm ${MUTED_TEXT_CLASS}`}>
                          可以查看该区域的所有数据，包括人口、房屋、标签等信息
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-2 h-2 w-2 rounded-full bg-[#19B172]" />
                      <div>
                        <p className="font-medium text-[var(--color-neutral-11)]">编辑权限</p>
                        <p className={`text-sm ${MUTED_TEXT_CLASS}`}>
                          可以对该区域的数据进行增删改操作，需同时拥有查看权限
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-2 h-2 w-2 rounded-full bg-[#D6730D]" />
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
