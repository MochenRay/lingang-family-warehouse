import { useState } from 'react';
import { Shield, Lock, Eye, Edit2, Database, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';

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
    { code: 'admin', name: '系统管理员', color: 'bg-red-500' },
    { code: 'district_admin', name: '区域管理员', color: 'bg-orange-500' },
    { code: 'analyst', name: '数据分析员', color: 'bg-blue-500' },
    { code: 'operator', name: '数据录入员', color: 'bg-green-500' },
    { code: 'viewer', name: '访客', color: 'bg-gray-500' }
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
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">权限管理</h1>
          <p className="text-gray-500">功能权限与数据权限的精细化配置</p>
        </div>
      </div>

      {/* 角色选择 */}
      <Card>
        <CardHeader>
          <CardTitle>选择角色</CardTitle>
          <CardDescription>选择要配置权限的角色</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {roles.map((role) => (
              <button
                key={role.code}
                onClick={() => setSelectedRole(role.code)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedRole === role.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${role.color}`} />
                  <span className="font-medium">{role.name}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 权限统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>功能模块</CardDescription>
            <CardTitle className="text-3xl">{permissionStats.totalModules}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">系统功能模块</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>功能点总数</CardDescription>
            <CardTitle className="text-3xl">{permissionStats.totalFunctions}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">可配置功能点</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>已授权功能</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {permissionStats.enabledFunctions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              占比 {((permissionStats.enabledFunctions / permissionStats.totalFunctions) * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>数据权限范围</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {permissionStats.dataAreas}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">可访问区域</p>
          </CardContent>
        </Card>
      </div>

      {/* 权限配置 */}
      <Card>
        <CardHeader>
          <CardTitle>权限配置</CardTitle>
          <CardDescription>
            当前角色：{roles.find(r => r.code === selectedRole)?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="function">
            <TabsList className="mb-4">
              <TabsTrigger value="function">功能权限</TabsTrigger>
              <TabsTrigger value="data">数据权限</TabsTrigger>
            </TabsList>

            {/* 功能权限 */}
            <TabsContent value="function" className="space-y-4">
              {functionPermissions.map((module) => {
                const ModuleIcon = module.icon;
                return (
                  <Card key={module.module}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <ModuleIcon className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-lg">{module.module}</CardTitle>
                        <Badge variant="outline">
                          {module.permissions.length} 个功能
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                功能名称
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                <Eye className="w-4 h-4 mx-auto" />
                                查看
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                <Edit2 className="w-4 h-4 mx-auto" />
                                新建
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                <Edit2 className="w-4 h-4 mx-auto" />
                                编辑
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                <Lock className="w-4 h-4 mx-auto" />
                                删除
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                <Database className="w-4 h-4 mx-auto" />
                                导出
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {module.permissions.map((perm, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{perm.name}</td>
                                <td className="px-6 py-4 text-center">
                                  <Checkbox
                                    checked={perm.view}
                                    disabled={selectedRole === 'admin'}
                                  />
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <Checkbox
                                    checked={perm.create}
                                    disabled={selectedRole === 'admin' || !perm.view}
                                  />
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <Checkbox
                                    checked={perm.edit}
                                    disabled={selectedRole === 'admin' || !perm.view}
                                  />
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <Checkbox
                                    checked={perm.delete}
                                    disabled={selectedRole === 'admin' || !perm.view}
                                  />
                                </td>
                                <td className="px-6 py-4 text-center">
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
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    系统管理员拥有所有功能权限，不可修改
                  </p>
                </div>
              )}
            </TabsContent>

            {/* 数据权限 */}
            <TabsContent value="data" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>区域数据权限</CardTitle>
                  <CardDescription>配置角色可访问的数据范围</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            区域名称
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            层级
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            可查看
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            可编辑
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            说明
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {dataPermissions.map((area, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium">{area.area}</td>
                            <td className="px-6 py-4">
                              <Badge variant="outline">
                                {area.level === 'city' ? '市级' : '区��'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Checkbox
                                checked={area.canView}
                                disabled={selectedRole === 'admin'}
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Checkbox
                                checked={area.canEdit}
                                disabled={selectedRole === 'admin' || !area.canView}
                              />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
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
              <Card>
                <CardHeader>
                  <CardTitle>数据权限说明</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                      <div>
                        <p className="font-medium">查看权限</p>
                        <p className="text-sm text-gray-600">
                          可以查看该区域的所有数据，包括人口、房屋、标签等信息
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                      <div>
                        <p className="font-medium">编辑权限</p>
                        <p className="text-sm text-gray-600">
                          可以对该区域的数据进行增删改操作，需同时拥有查看权限
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2" />
                      <div>
                        <p className="font-medium">数据隔离</p>
                        <p className="text-sm text-gray-600">
                          用户只能访问被授权的区域数据，无法查看或操作其他区域
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedRole === 'admin' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    系统管理员拥有全辖区所有数据权限，不可修改
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 数据更新时间 */}
      <div className="text-center text-sm text-gray-500">
        数据更新时间：2026-01-20 16:00:00
      </div>
    </div>
  );
}
