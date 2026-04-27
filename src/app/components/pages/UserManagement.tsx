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

const DARK_CARD_CLASS = 'rounded-lg border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none';
const DARK_DIALOG_CLASS = 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] shadow-2xl';
const DARK_INPUT_CLASS = 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] placeholder:text-[var(--color-neutral-08)]';
const DARK_SELECT_TRIGGER_CLASS = 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]';
const ACTION_BUTTON_CLASS = 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]';
const MUTED_TEXT_CLASS = 'text-[var(--color-neutral-08)]';
const TABLE_HEADER_CELL_CLASS = 'px-4 py-3 text-left text-xs font-medium uppercase whitespace-nowrap text-[var(--color-neutral-08)]';
const TABLE_CELL_CLASS = 'px-4 py-3 text-sm text-[var(--color-neutral-10)]';

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
      <Badge className="border border-[#19B172]/35 bg-[#19B172]/15 text-[#7DE2B7]">
        <Unlock className="w-3 h-3 mr-1" />
        启用
      </Badge>
    ) : (
      <Badge className="border border-[#D52132]/35 bg-[#D52132]/15 text-[#FFB4B4]">
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
    <div className="space-y-5 text-[var(--color-neutral-10)] animate-in fade-in duration-500">
      {/* 页面标题 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-neutral-11)]">用户管理</h1>
          <p className={`mt-1 text-sm ${MUTED_TEXT_CLASS}`}>用户权限管理，支持设置用户的管辖范围（区县/街道/社区）</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className={ACTION_BUTTON_CLASS}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button variant="outline" className={ACTION_BUTTON_CLASS}>
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
            <DialogContent className={`max-w-2xl ${DARK_DIALOG_CLASS}`} aria-describedby="new-user-desc">
              <DialogHeader>
                <DialogTitle className="text-[var(--color-neutral-11)]">新建用户</DialogTitle>
                <DialogDescription id="new-user-desc" className={MUTED_TEXT_CLASS}>填写用户信息并配置管辖范围</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label className={MUTED_TEXT_CLASS}>用户名 *</Label>
                  <Input className={DARK_INPUT_CLASS} placeholder="请输入用户名" value={newUserForm.username} onChange={e => setNewUserForm({...newUserForm, username: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className={MUTED_TEXT_CLASS}>真实姓名 *</Label>
                  <Input className={DARK_INPUT_CLASS} placeholder="请输入真实姓名" value={newUserForm.realName} onChange={e => setNewUserForm({...newUserForm, realName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className={MUTED_TEXT_CLASS}>邮箱 *</Label>
                  <Input className={DARK_INPUT_CLASS} type="email" placeholder="请输入邮箱" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className={MUTED_TEXT_CLASS}>手机号 *</Label>
                  <Input className={DARK_INPUT_CLASS} placeholder="请输入手机号" value={newUserForm.phone} onChange={e => setNewUserForm({...newUserForm, phone: e.target.value})} />
                </div>
                
                <div className="col-span-2 my-2 border-t border-[var(--color-neutral-03)]"></div>
                
                <div className="space-y-2">
                  <Label className={MUTED_TEXT_CLASS}>角色 *</Label>
                  <Select onValueChange={v => setNewUserForm({...newUserForm, role: v})}>
                    <SelectTrigger className={DARK_SELECT_TRIGGER_CLASS}>
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
                  <Label className={MUTED_TEXT_CLASS}>所属部门</Label>
                  <Input className={DARK_INPUT_CLASS} placeholder="请输入所属部门" value={newUserForm.department} onChange={e => setNewUserForm({...newUserForm, department: e.target.value})} />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label className={MUTED_TEXT_CLASS}>管辖范围配置</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Select onValueChange={v => setNewUserForm({...newUserForm, district: v, street: '', community: ''})}>
                      <SelectTrigger className={DARK_SELECT_TRIGGER_CLASS}>
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
                      <SelectTrigger className={DARK_SELECT_TRIGGER_CLASS}>
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
                      <SelectTrigger className={DARK_SELECT_TRIGGER_CLASS}>
                        <SelectValue placeholder="社区/村" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCommunities(newUserForm.district, newUserForm.street).map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className={`mt-1 text-xs ${MUTED_TEXT_CLASS}`}>
                    注：如果不选择下级区域，则默认为管辖上级区域下的所有范围。例如只选"蓬莱区"，则拥有全区权限。
                  </p>
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
              <UserCog className="w-4 h-4" />
              用户总数
            </CardDescription>
            <CardTitle className="text-3xl text-[var(--color-neutral-11)]">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT_CLASS}>启用账号</CardDescription>
            <CardTitle className="text-3xl text-[#19B172]">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT_CLASS}>禁用账号</CardDescription>
            <CardTitle className="text-3xl text-[#D52132]">{stats.disabled}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={DARK_CARD_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT_CLASS}>在线用户</CardDescription>
            <CardTitle className="text-3xl text-[#4E86DF]">{stats.online}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 角色分布 */}
        <Card className={DARK_CARD_CLASS}>
          <CardHeader>
            <CardTitle className="text-base text-[var(--color-neutral-11)]">角色分布</CardTitle>
            <CardDescription className={MUTED_TEXT_CLASS}>用户角色统计</CardDescription>
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
                      <span className="text-sm text-[var(--color-neutral-10)]">{item.role}</span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-neutral-11)]">{item.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--color-neutral-03)]">
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
        <Card className={`lg:col-span-3 ${DARK_CARD_CLASS} overflow-hidden`}>
          <CardHeader className="border-b border-[var(--color-neutral-03)]">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle className="text-base text-[var(--color-neutral-11)]">用户列表</CardTitle>
                <CardDescription className={MUTED_TEXT_CLASS}>
                  共 {filteredUsers.length} 个用户
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className={`w-[140px] ${DARK_SELECT_TRIGGER_CLASS}`}>
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
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${MUTED_TEXT_CLASS}`} />
                  <Input
                    className={`w-[200px] pl-9 ${DARK_INPUT_CLASS}`}
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
              <table className="w-full min-w-[920px] border-collapse">
                <thead className="border-b border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)]">
                  <tr>
                    <th className={`${TABLE_HEADER_CELL_CLASS} min-w-[132px]`}>用户</th>
                    <th className={`${TABLE_HEADER_CELL_CLASS} min-w-[116px]`}>角色</th>
                    <th className={`${TABLE_HEADER_CELL_CLASS} min-w-[156px]`}>部门</th>
                    <th className={`${TABLE_HEADER_CELL_CLASS} min-w-[170px]`}>管辖范围</th>
                    <th className={`${TABLE_HEADER_CELL_CLASS} min-w-[172px]`}>关联账户</th>
                    <th className={`${TABLE_HEADER_CELL_CLASS} text-center min-w-[92px]`}>状态</th>
                    <th className={`${TABLE_HEADER_CELL_CLASS} text-center min-w-[92px]`}>操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-neutral-03)]">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-[var(--color-neutral-03)]/70">
                      <td className={TABLE_CELL_CLASS}>
                        <div>
                          <p className="font-medium text-[var(--color-neutral-11)]">{user.realName}</p>
                          <p className={`text-sm ${MUTED_TEXT_CLASS}`}>{user.username}</p>
                        </div>
                      </td>
                      <td className={TABLE_CELL_CLASS}>
                        <Badge variant="outline" className="border-[var(--color-neutral-04)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]">{user.role}</Badge>
                      </td>
                      <td className={`${TABLE_CELL_CLASS} max-w-[180px] truncate`} title={user.department}>{user.department}</td>
                      <td className={`${TABLE_CELL_CLASS} max-w-[200px] truncate`} title={user.scope}>
                        {user.scope}
                      </td>
                      <td className={TABLE_CELL_CLASS}>
                        <div className="flex flex-col gap-1">
                          <div className={`flex items-center gap-1 text-xs ${MUTED_TEXT_CLASS}`} title="城市大脑账号">
                             <div className="flex h-4 w-4 items-center justify-center rounded border border-[#4E86DF]/35 bg-[#4E86DF]/15 text-[10px] font-bold text-[#9EC3FF]">城</div>
                             <span className="truncate max-w-[100px]">{user.cityBrainAccount || '-'}</span>
                          </div>
                          <div className={`flex items-center gap-1 text-xs ${MUTED_TEXT_CLASS}`} title="山东通ID">
                             <div className="flex h-4 w-4 items-center justify-center rounded border border-[#D6730D]/35 bg-[#D6730D]/15 text-[10px] font-bold text-[#F6C27A]">鲁</div>
                             <span className="truncate max-w-[100px]">{user.shandongPassId || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td className={`${TABLE_CELL_CLASS} text-center`}>
                        {getStatusBadge(user.status)}
                      </td>
                      <td className={TABLE_CELL_CLASS}>
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" variant="ghost" className="text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-[#FF8A8A] hover:bg-[#D52132]/15 hover:text-[#FFB4B4]">
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
