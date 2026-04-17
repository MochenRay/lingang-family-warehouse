import { useState } from 'react';
import {
  ArrowLeft,
  Camera,
  CreditCard,
  Save,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { MobileStatusBar } from './MobileStatusBar';
import { Person, PersonType } from '../../types/core';
import { mobileContextRepository } from '../../services/repositories/mobileContextRepository';
import { personRepository } from '../../services/repositories/personRepository';

interface PersonCollectProps {
  onBack: () => void;
}

export function PersonCollect({ onBack }: PersonCollectProps) {
  const [photo, setPhoto] = useState<string>('');
  const [idScanned, setIdScanned] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    detail: false,
    work: false,
    activity: false,
    health: false,
  });

  const [formData, setFormData] = useState({
    // 基本信息
    name: '',
    idNumber: '',
    gender: '',
    birthDate: '',
    nation: '',
    phone: '',
    type: '' as PersonType | '',
    education: '',
    address: '',
    // 详细信息
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

  const handlePhotoCapture = () => {
    const mockPhoto = `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400`;
    setPhoto(mockPhoto);
  };

  const handleScanID = () => {
    setIdScanned(true);
    setFormData({
      ...formData,
      name: '张三',
      idNumber: '370***********1234',
      gender: '男',
      birthDate: '1985-06-15',
      nation: '汉族'
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.idNumber || !formData.phone) {
      alert('请填写必填项！');
      return;
    }

    let age = 0;
    if (formData.birthDate) {
      const birth = new Date(formData.birthDate);
      const now = new Date();
      age = now.getFullYear() - birth.getFullYear();
      if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
        age--;
      }
    }

    const currentGridSelection = mobileContextRepository.getCurrentGridSelection();

    const newPerson: Person = {
      id: `p_${Date.now()}`,
      gridId: currentGridSelection.id || 'g1',
      name: formData.name,
      idCard: formData.idNumber,
      gender: (formData.gender as '男' | '女') || '男',
      age,
      phone: formData.phone,
      address: formData.address,
      type: (formData.type as PersonType) || '户籍',
      tags: [],
      risk: 'Low',
      nation: formData.nation || undefined,
      education: formData.education || undefined,
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
      biography: formData.biography || undefined,
      activityParticipation: (formData.activities || formData.needs) ? {
        activities: formData.activities || undefined,
        needs: formData.needs || undefined,
      } : undefined,
      healthRecord: (formData.hasChronic || formData.needsRegularMedicine || formData.isSeverePatient || formData.isPregnant || formData.medicalVisitFrequency || formData.specialNotes) ? {
        hasChronic: formData.hasChronic,
        chronicDetails: formData.chronicDetails || undefined,
        needsRegularMedicine: formData.needsRegularMedicine,
        medicineFrequency: formData.medicineFrequency || undefined,
        medicalVisitFrequency: formData.medicalVisitFrequency || undefined,
        isSeverePatient: formData.isSeverePatient,
        isPregnant: formData.isPregnant,
        specialNotes: formData.specialNotes || undefined,
      } : undefined,
      importantEvents: formData.importantEvents || undefined,
      updatedAt: new Date().toISOString(),
    };

    await personRepository.addPerson(newPerson);
    alert('人口信息已成功录入系统');
    onBack();
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* 顶部导航栏 */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-200">
        <MobileStatusBar variant="light" />
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={onBack}>
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-gray-800">人口信息采集</h1>
            <p className="text-xs text-gray-500">请如实填写人口基本信息</p>
          </div>
          <Badge variant="outline" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            采集
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* 人员照片 */}
        <Card className="p-4">
          <Label className="text-sm font-semibold mb-3 block">人员照片</Label>
          <div className="flex items-center gap-4">
            {photo ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                <img src={photo} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setPhoto('')}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={handlePhotoCapture}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors"
              >
                <Camera className="w-8 h-8 mb-1" />
                <span className="text-xs">拍照</span>
              </button>
            )}
            <div className="flex-1">
              <p className="text-sm text-gray-700 mb-2">请拍摄正面免冠照片</p>
              <p className="text-xs text-gray-500">• 光线充足，背景简洁</p>
              <p className="text-xs text-gray-500">• 正面拍摄，五官清晰</p>
            </div>
          </div>
        </Card>

        {/* 基本信息（含身份证扫描） */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">基本信息</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleScanID}
              className={idScanned ? 'bg-green-50 text-green-700 border-green-300' : ''}
            >
              <CreditCard className="w-4 h-4 mr-1" />
              {idScanned ? '已扫描' : '扫描身份证'}
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">姓名 <span className="text-red-500">*</span></Label>
              <Input
                placeholder="请输入或扫描身份证获取"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">身份证号 <span className="text-red-500">*</span></Label>
              <Input
                placeholder="请输入或扫描身份证获取"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                maxLength={18}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-2 block">性别</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择性别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="男">男</SelectItem>
                    <SelectItem value="女">女</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">民族</Label>
                <Input
                  placeholder="如：汉族"
                  value={formData.nation}
                  onChange={(e) => setFormData({ ...formData, nation: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">出生日期</Label>
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">联系电话 <span className="text-red-500">*</span></Label>
              <Input
                type="tel"
                placeholder="请输入手机号"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                maxLength={11}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">居住地址</Label>
              <Input
                placeholder="请输入居住地址"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-2 block">人口类型</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as PersonType })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
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
                <Label className="text-sm font-medium mb-2 block">学历</Label>
                <Select value={formData.education} onValueChange={(v) => setFormData({ ...formData, education: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择学历" />
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
          </div>
        </Card>

        {/* 详细信息（可折叠） */}
        <Card className="p-4">
          <button
            type="button"
            onClick={() => toggleSection('detail')}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-3"
          >
            <span>详细信息</span>
            {expandedSections.detail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSections.detail && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">籍贯</Label>
                <Input
                  value={formData.birthplace}
                  onChange={(e) => setFormData({ ...formData, birthplace: e.target.value })}
                  placeholder="请输入籍贯"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">婚姻状况</Label>
                <Select value={formData.maritalStatus} onValueChange={(v: any) => setFormData({ ...formData, maritalStatus: v })}>
                  <SelectTrigger>
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
                <Label className="text-sm font-medium mb-2 block">宗教信仰</Label>
                <Input
                  value={formData.religion}
                  onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                  placeholder="请输入宗教信仰（如无则填无）"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">政治面貌</Label>
                <Input
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
                <Label className="text-sm font-medium mb-2 block">毕业院校及专业</Label>
                <Input
                  value={formData.graduationInfo}
                  onChange={(e) => setFormData({ ...formData, graduationInfo: e.target.value })}
                  placeholder="如：山东大学 计算机科学与技术专业"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">工作单位及职务</Label>
                <Input
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
                <Label className="text-sm font-medium mb-2 block">特长、爱好</Label>
                <Input
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="请输入特长、爱好"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">宠物饲养情况</Label>
                <Input
                  value={formData.pets}
                  onChange={(e) => setFormData({ ...formData, pets: e.target.value })}
                  placeholder="如：无、养猫一只等"
                />
              </div>
            </div>
          )}
        </Card>

        {/* 个人经历（可折叠） */}
        <Card className="p-4">
          <button
            type="button"
            onClick={() => toggleSection('work')}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-3"
          >
            <span>个人经历</span>
            {expandedSections.work ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSections.work && (
            <div>
              <Label className="text-sm font-medium mb-2 block">基本情况</Label>
              <Textarea
                value={formData.biography}
                onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                placeholder="请输入学习经历、工作经历等基本情况"
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                示例：2007-2011年，在山东大学学习计算机科学与技术专业。2011-2015年，在北京某互联网公司从事软件开发工作...
              </p>
            </div>
          )}
        </Card>

        {/* 活动参与（可折叠） */}
        <Card className="p-4">
          <button
            type="button"
            onClick={() => toggleSection('activity')}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-3"
          >
            <span>活动参与</span>
            {expandedSections.activity ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSections.activity && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">参加社区活动情况</Label>
                <Textarea
                  value={formData.activities}
                  onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                  placeholder="请输入参加社区及社会组织活动情况"
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">家庭服务需求及诉求</Label>
                <Textarea
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

        {/* 健康档案（可折叠） */}
        <Card className="p-4">
          <button
            type="button"
            onClick={() => toggleSection('health')}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 mb-3"
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
                  <Label className="text-sm font-medium mb-2 block">疾病类型</Label>
                  <Input
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
                  <Label className="text-sm font-medium mb-2 block">购药频率</Label>
                  <Input
                    value={formData.medicineFrequency}
                    onChange={(e) => setFormData({ ...formData, medicineFrequency: e.target.value })}
                    placeholder="如：每月一次"
                  />
                </div>
              )}

              <div>
                <Label className="text-sm font-medium mb-2 block">就医频率</Label>
                <Input
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
                <Label className="text-sm font-medium mb-2 block">特殊情况说明</Label>
                <Textarea
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

        {/* 重要事件记录（常显） */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">重要事件记录</h3>
          <Textarea
            value={formData.importantEvents}
            onChange={(e) => setFormData({ ...formData, importantEvents: e.target.value })}
            placeholder="请输入重要事件记录及其他"
            rows={3}
            className="resize-none"
          />
        </Card>
      </div>

      {/* 底部按钮 */}
      <div className="bg-white border-t border-gray-100 p-4 safe-area-bottom sticky bottom-0">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={onBack}
          >
            取消
          </Button>
          <Button
            className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
          >
            <Save className="w-5 h-5 mr-2" />
            提交采集
          </Button>
        </div>
      </div>
    </div>
  );
}
