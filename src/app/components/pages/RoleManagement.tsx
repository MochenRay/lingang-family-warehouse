import { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Users, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';

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
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">角色管理</h1>
          <p className="text-gray-500">角色的创建、权限配置及辖区范围设置</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新建角色
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新建角色</DialogTitle>
                <DialogDescription>配置角色基本信息和权限范围</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roleName">角色名称 *</Label>
                    <Input id="roleName" placeholder="请输入角色名称" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roleCode">角色编码 *</Label>
                    <Input id="roleCode" placeholder="请输入角色编码（英文）" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">角色描述</Label>
                  <Input id="description" placeholder="请输入角色描述" />
                </div>
                
                <div className="space-y-2">
                  <Label>管辖区域 *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {areaOptions.map((area) => (
                      <div key={area.value} className="flex items-center space-x-2">
                        <Checkbox id={`area-${area.value}`} />
                        <label
                          htmlFor={`area-${area.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {area.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>功能权限 *</Label>
                  <div className="border rounded-lg p-4 space-y-3 max-h-[300px] overflow-y-auto">
                    {permissionTree.map((module) => (
                      <div key={module.code} className="space-y-2">
                        <div className="flex items-center space-x-2 font-medium">
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
                                className="text-sm text-gray-600"
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
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
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
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              角色总数
            </CardDescription>
            <CardTitle className="text-3xl">{roles.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">系统预设角色</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>启用角色</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {roles.filter(r => r.status === 'active').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">可正常使用</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>分配用户</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {roles.reduce((sum, r) => sum + r.userCount, 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">已关联用户</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>权限模块</CardDescription>
            <CardTitle className="text-3xl">{permissionTree.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">可配置模块</p>
          </CardContent>
        </Card>
      </div>

      {/* 角色列表 */}
      <div className="grid grid-cols-1 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle>{role.name}</CardTitle>
                      <Badge variant="outline">{role.code}</Badge>
                      {role.status === 'active' ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          启用
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          禁用
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{role.description}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRole(role)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    编辑
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">关联用户</span>
                  </div>
                  <p className="text-lg font-semibold">{role.userCount} 个</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">权限数量</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {role.permissions.includes('all') ? '全部' : role.permissions.length + ' 项'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-500">管辖区域</span>
                  </div>
                  <p className="text-lg font-semibold">{role.area}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">权限列表：</p>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((perm, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50">
                      {getPermissionName(perm)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                创建时间：{role.createdAt}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 权限模块说明 */}
      <Card>
        <CardHeader>
          <CardTitle>权限模块说明</CardTitle>
          <CardDescription>系统功能模块和权限点说明</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {permissionTree.map((module) => (
              <div key={module.code} className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  {module.module}
                </h3>
                <ul className="space-y-1">
                  {module.children.map((child) => (
                    <li key={child.code} className="text-sm text-gray-600 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-gray-400" />
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
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑角色 - {selectedRole.name}</DialogTitle>
              <DialogDescription>修改角色配置和权限</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editRoleName">角色名称 *</Label>
                  <Input
                    id="editRoleName"
                    defaultValue={selectedRole.name}
                    placeholder="请输入角色名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editRoleCode">角色编码 *</Label>
                  <Input
                    id="editRoleCode"
                    defaultValue={selectedRole.code}
                    placeholder="请输入角色编码（英文）"
                    disabled
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDescription">角色描述</Label>
                <Input
                  id="editDescription"
                  defaultValue={selectedRole.description}
                  placeholder="请输入角色描述"
                />
              </div>
              
              <div className="space-y-2">
                <Label>管辖区域 *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {areaOptions.map((area) => (
                    <div key={area.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-area-${area.value}`}
                        defaultChecked={selectedRole.area === area.label || selectedRole.area === '全辖区'}
                      />
                      <label
                        htmlFor={`edit-area-${area.value}`}
                        className="text-sm font-medium leading-none"
                      >
                        {area.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>功能权限 *</Label>
                <div className="border rounded-lg p-4 space-y-3 max-h-[300px] overflow-y-auto">
                  {permissionTree.map((module) => (
                    <div key={module.code} className="space-y-2">
                      <div className="flex items-center space-x-2 font-medium">
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
                              className="text-sm text-gray-600"
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
              <Button variant="outline" onClick={() => setSelectedRole(null)}>
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
      <div className="text-center text-sm text-gray-500">
        数据更新时间：2026-01-20 16:00:00
      </div>
    </div>
  );
}
