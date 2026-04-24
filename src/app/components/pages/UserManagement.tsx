import { useState } from 'react';
import { UserCog, Search, Plus, Download, RefreshCw, Edit, Trash2, Lock, Unlock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { getCommunities, getDistricts, getStreets } from '../../config/regions';

export function UserManagement() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // 新增用户表单状态
  const [newUserForm, setNewUserForm] = useState({
    district: '',
    street: '',
    community: '',
    role: '',
    department: '',
    username: '',
    realName: '',
    email: '',
    phone: ''
  });

  // 用户列表数据
  const users = [
    {
      id: 1,
      username: 'admin',
      realName: '张三',
      email: 'zhangsan@yantai.gov.cn',
      phone: '13800138001',
      role: '系统管理员',
      department: '数据管理中心',
      scope: '全辖区',
      status: 'active',
      lastLogin: '2026-01-20 15:30:00',
      cityBrainAccount: 'cb_admin_001',
      shandongPassId: 'sd_pass_8801'
    },
    {
      id: 2,
      username: 'district_hc',
      realName: '李四',
      email: 'lisi@yantai.gov.cn',
      phone: '13800138002',
      role: '区域管理员',
      department: '蓬莱区管理办',
      scope: '蓬莱区',
      status: 'active',
      lastLogin: '2026-01-20 14:15:00',
      cityBrainAccount: 'cb_hc_002',
      shandongPassId: 'sd_pass_8802'
    },
    {
      id: 3,
      username: 'street_zd',
      realName: '王五',
      email: 'wangwu@yantai.gov.cn',
      phone: '13800138003',
      role: '街道干部',
      department: '登州街道办事处',
      scope: '蓬莱区/登州街道',
      status: 'active',
      lastLogin: '2026-01-20 13:45:00',
      cityBrainAccount: 'cb_zd_003',
      shandongPassId: 'sd_pass_8803'
    },
    {
      id: 4,
      username: 'grid_hy',
      realName: '赵六',
      email: 'zhaoliu@yantai.gov.cn',
      phone: '13800138004',
      role: '网格员',
      department: '海梦苑社区居委会',
      scope: '蓬莱区/登州街道/海梦苑社区',
      status: 'active',
      lastLogin: '2026-01-19 16:20:00',
      cityBrainAccount: 'cb_grid_004',
      shandongPassId: 'sd_pass_8804'
    }
  ];

  // 统计数据
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    disabled: users.filter(u => u.status === 'disabled').length,
    online: 3
  };

  // 角色分布
  const roleDistribution = [
    { role: '系统管理员', count: 1, color: '#ef4444' },
    { role: '区域管理员', count: 1, color: '#f59e0b' },
    { role: '街道干部', count: 1, color: '#3b82f6' },
    { role: '网格员', count: 1, color: '#10b981' },
  ];

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800">
        <Unlock className="w-3 h-3 mr-1" />
        启用
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <Lock className="w-3 h-3 mr-1" />
        禁用
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    if (statusFilter !== 'all' && user.status !== statusFilter) return false;
    if (roleFilter !== 'all' && user.role !== roleFilter) return false;
    if (searchQuery && !(
      user.username.includes(searchQuery) ||
      user.realName.includes(searchQuery) ||
      user.email.includes(searchQuery)
    )) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">用户管理</h1>
          <p className="text-gray-500">用户权限管理，支持设置用户的管辖范围（区县/街道/社区）</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新建用户
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" aria-describedby="new-user-desc">
              <DialogHeader>
                <DialogTitle>新建用户</DialogTitle>
                <DialogDescription id="new-user-desc">填写用户信息并配置管辖范围</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>用户名 *</Label>
                  <Input placeholder="请输入用户名" value={newUserForm.username} onChange={e => setNewUserForm({...newUserForm, username: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>真实姓名 *</Label>
                  <Input placeholder="请输入真实姓名" value={newUserForm.realName} onChange={e => setNewUserForm({...newUserForm, realName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>邮箱 *</Label>
                  <Input type="email" placeholder="请输入邮箱" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>手机号 *</Label>
                  <Input placeholder="请输入手机号" value={newUserForm.phone} onChange={e => setNewUserForm({...newUserForm, phone: e.target.value})} />
                </div>
                
                <div className="col-span-2 border-t my-2"></div>
                
                <div className="space-y-2">
                  <Label>角色 *</Label>
                  <Select onValueChange={v => setNewUserForm({...newUserForm, role: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">系统管理员</SelectItem>
                      <SelectItem value="district">区域管理员</SelectItem>
                      <SelectItem value="street">街道干部</SelectItem>
                      <SelectItem value="grid">网格员</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>所属部门</Label>
                  <Input placeholder="请输入所属部门" value={newUserForm.department} onChange={e => setNewUserForm({...newUserForm, department: e.target.value})} />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>管辖范围配置</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Select onValueChange={v => setNewUserForm({...newUserForm, district: v, street: '', community: ''})}>
                      <SelectTrigger>
                        <SelectValue placeholder="区县" />
                      </SelectTrigger>
                      <SelectContent>
                        {getDistricts().map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      disabled={!newUserForm.district}
                      onValueChange={v => setNewUserForm({...newUserForm, street: v, community: ''})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="街道/乡镇" />
                      </SelectTrigger>
                      <SelectContent>
                        {getStreets(newUserForm.district).map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select 
                      disabled={!newUserForm.street}
                      onValueChange={v => setNewUserForm({...newUserForm, community: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="社区/村" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCommunities(newUserForm.district, newUserForm.street).map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    注：如果不选择下级区域，则默认为管辖上级区域下的所有范围。例如只选"蓬莱区"，则拥有全区权限。
                  </p>
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
              <UserCog className="w-4 h-4" />
              用户总数
            </CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>启用账号</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>禁用账号</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.disabled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>在线用户</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.online}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 角色分布 */}
        <Card>
          <CardHeader>
            <CardTitle>角色分布</CardTitle>
            <CardDescription>用户角色统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roleDistribution.map((item) => (
                <div key={item.role} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.role}</span>
                    </div>
                    <span className="text-sm font-semibold">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(item.count / stats.total) * 100}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 用户列表 */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>用户列表</CardTitle>
                <CardDescription>
                  共 {filteredUsers.length} 个用户
                </CardDescription>
              </div>
              <div className="flex gap-3">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部角色</SelectItem>
                    <SelectItem value="系统管理员">系统管理员</SelectItem>
                    <SelectItem value="区域管理员">区域管理员</SelectItem>
                    <SelectItem value="街道干部">街道干部</SelectItem>
                    <SelectItem value="网格员">网格员</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-9 w-[200px]"
                    placeholder="搜索用户..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">部门</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">管辖范围</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">关联账户</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{user.realName}</p>
                          <p className="text-sm text-gray-500">{user.username}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{user.role}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">{user.department}</td>
                      <td className="px-6 py-4 text-sm max-w-[200px] truncate" title={user.scope}>
                        {user.scope}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-xs text-gray-600" title="城市大脑账号">
                             <div className="w-4 h-4 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">城</div>
                             <span className="truncate max-w-[100px]">{user.cityBrainAccount || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600" title="山东通ID">
                             <div className="w-4 h-4 rounded bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold">鲁</div>
                             <span className="truncate max-w-[100px]">{user.shandongPassId || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
