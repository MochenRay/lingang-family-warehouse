import { useRef, useState } from 'react';
import {
  MapPin,
  Camera,
  Mic,
  AlertTriangle,
  Send,
  Clock
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MobileLayout } from './MobileLayout';
import { toast } from 'sonner';
import { conflictRepository } from '../../services/repositories/conflictRepository';
import { mobileContextRepository } from '../../services/repositories/mobileContextRepository';

interface MobilePatrolProps {
  onRouteChange: (route: string) => void;
  onExitMobile?: () => void;
}

function getNowString(): string {
  return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
}

function mapPatrolCategoryToConflictType(category: string): '邻里纠纷' | '家庭纠纷' | '物业纠纷' | '其他' {
  if (['房屋安全', '环境卫生', '消防隐患', '公共设施'].includes(category)) {
    return '物业纠纷';
  }
  return '其他';
}

export function MobilePatrol({ onRouteChange, onExitMobile }: MobilePatrolProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [locationObtained, setLocationObtained] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationSummary, setLocationSummary] = useState('');
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    category: '',
    urgency: '',
    description: '',
    location: ''
  });

  const handlePhotoCapture = () => {
    photoInputRef.current?.click();
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }
    const nextPhotos = files
      .slice(0, Math.max(0, 9 - photos.length))
      .map((file) => URL.createObjectURL(file));
    setPhotos((prev) => [...prev, ...nextPhotos].slice(0, 9));
    event.target.value = '';
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.info('当前环境不支持定位，请手工补充巡查位置');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const summary = `经度 ${position.coords.longitude.toFixed(4)}，纬度 ${position.coords.latitude.toFixed(4)}`;
        setLocationObtained(true);
        setLocationSummary(summary);
        setFormData((prev) => ({
          ...prev,
          location: prev.location || summary,
        }));
        toast.success('已记录当前巡查位置');
      },
      () => {
        toast.info('未获取到定位权限，请手工补充巡查位置');
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      },
    );
  };

  const handleVoiceInput = () => {
    toast.info('当前请直接填写文字描述，语音转写会并入统一记录链后再开放。');
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.description) {
      toast.error('请填写问题分类和描述');
      return;
    }

    const now = getNowString();
    const workerName = mobileContextRepository.getCurrentWorkerName();
    const gridId = mobileContextRepository.getCurrentGridSelection().id || 'g1';

    setIsSubmitting(true);
    try {
      const record = await conflictRepository.addConflict({
        source: '自行发现',
        title: `${formData.category}巡查线索`,
        type: mapPatrolCategoryToConflictType(formData.category),
        description: formData.description,
        involvedParties: [],
        status: '调解中',
        gridId,
        location: formData.location || '待核实',
        timeline: [
          {
            date: now,
            content: `移动巡查上报：${formData.urgency ? `紧急程度${formData.urgency}；` : ''}${formData.description}`,
            operator: workerName,
          },
        ],
        images: [],
        createdAt: now,
        updatedAt: now,
      });
      toast.success('已登记为巡查线索，并同步到问题处置列表');
      onRouteChange(`conflict-detail/${record.id}`);
    } catch (error) {
      console.error('Failed to submit patrol report', error);
      toast.error('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const recentReports = [
    {
      id: 1,
      category: '环境卫生',
      description: 'XX小区垃圾堆放点未及时清理',
      time: '2小时前',
      status: '处理中',
      statusColor: 'text-orange-600 bg-orange-50 border-orange-300'
    },
    {
      id: 2,
      category: '房屋安全',
      description: 'XX楼外墙瓷砖脱落，存在安全隐患',
      time: '昨天 15:30',
      status: '已处理',
      statusColor: 'text-green-600 bg-green-50 border-green-300'
    },
    {
      id: 3,
      category: '违章建筑',
      description: 'XX路发现私自搭建阳光房',
      time: '2026-01-18',
      status: '已处理',
      statusColor: 'text-green-600 bg-green-50 border-green-300'
    }
  ];

  return (
    <MobileLayout currentRoute="patrol" onRouteChange={onRouteChange} onExitMobile={onExitMobile}>
      <div className="bg-gray-50">
        <div className="bg-white p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">巡查上报</h2>
          <p className="text-sm text-gray-500">发现问题及时登记，并同步到问题处置队列</p>
        </div>

        <div className="p-4 space-y-4">
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-semibold mb-3 block">
                问题分类 <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="请选择问题类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="房屋安全">🏠 房屋安全</SelectItem>
                  <SelectItem value="环境卫生">🌿 环境卫生</SelectItem>
                  <SelectItem value="违章建筑">⚠️ 违章建筑</SelectItem>
                  <SelectItem value="消防隐患">🔥 消防隐患</SelectItem>
                  <SelectItem value="公共设施">🔧 公共设施</SelectItem>
                  <SelectItem value="其他">📋 其他</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-semibold mb-3 block">紧急程度</Label>
              <div className="grid grid-cols-3 gap-2">
                {['一般', '较急', '紧急'].map((urgency) => (
                  <button
                    key={urgency}
                    onClick={() => setFormData({ ...formData, urgency })}
                    className={`h-10 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.urgency === urgency
                        ? urgency === '紧急'
                          ? 'bg-red-50 border-red-500 text-red-700'
                          : urgency === '较急'
                            ? 'bg-orange-50 border-orange-500 text-orange-700'
                            : 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {urgency}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">
                  问题描述 <span className="text-red-500">*</span>
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVoiceInput}
                >
                  <Mic className="w-4 h-4 mr-1" />
                  语音提醒
                </Button>
              </div>
              <Textarea
                placeholder="请详细描述发现的问题..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                {formData.description.length}/500
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">现场照片</Label>
                <Badge variant="secondary" className="text-xs">
                  {photos.length}/9
                </Badge>
              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoSelect}
              />

              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center shadow-md"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {photos.length < 9 && (
                  <button
                    onClick={handlePhotoCapture}
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors bg-white"
                  >
                    <Camera className="w-8 h-8 mb-1" />
                    <span className="text-xs">上传照片</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">现场照片会作为巡查线索附件预览，正式归档可在后续处置页补传</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">位置信息</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGetLocation}
                  className={locationObtained ? 'bg-green-50 text-green-700 border-green-300' : ''}
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  {locationObtained ? '已定位' : '获取定位'}
                </Button>
              </div>
              <Textarea
                placeholder="请填写巡查位置或地标"
                value={formData.location}
                onChange={(event) => setFormData({ ...formData, location: event.target.value })}
                className="min-h-[80px] resize-none"
              />
              {locationSummary && (
                <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {locationSummary}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <Send className="w-5 h-5 mr-2" />
            {isSubmitting ? '提交中...' : '提交上报'}
          </Button>

          <div className="pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 px-1">最近上报</h3>
            <div className="space-y-2">
              {recentReports.map((report) => (
                <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-800">{report.category}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${report.statusColor}`}
                          >
                            {report.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {report.description}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {report.time}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
