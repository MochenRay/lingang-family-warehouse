import { useState } from 'react';
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

interface MobilePatrolProps {
  onRouteChange: (route: string) => void;
  onExitMobile?: () => void;
}

export function MobilePatrol({ onRouteChange, onExitMobile }: MobilePatrolProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [locationObtained, setLocationObtained] = useState(false);
  const [recording, setRecording] = useState(false);
  
  const [formData, setFormData] = useState({
    category: '',
    urgency: '',
    description: '',
    location: ''
  });

  const handlePhotoCapture = () => {
    const mockPhotos = [
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=400',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400'
    ];
    const randomPhoto = mockPhotos[Math.floor(Math.random() * mockPhotos.length)];
    setPhotos([...photos, randomPhoto]);
  };

  const handleGetLocation = () => {
    setLocationObtained(true);
    setFormData({
      ...formData,
      location: '威海市环翠区竹岛街道XX路XX号'
    });
  };

  const handleVoiceInput = () => {
    setRecording(!recording);
    if (!recording) {
      setTimeout(() => {
        setRecording(false);
        setFormData({
          ...formData,
          description: '发现环翠区竹岛街道XX小区存在违建情况，占用公共绿地约50平方米，影响居民正常生活。'
        });
      }, 2000);
    }
  };

  const handleSubmit = () => {
    if (!formData.category || !formData.description) {
      alert('请填写问题分类和描述！');
      return;
    }
    alert('问题上报成功！\n已推送给相关管理人员');
    onRouteChange('home');
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
        {/* 顶部标题 */}
        <div className="bg-white p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">巡查上报</h2>
          <p className="text-sm text-gray-500">发现问题及时上报，共建美好社区</p>
        </div>

        <div className="p-4 space-y-4">
          {/* 问题分类 */}
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

          {/* 紧急程度 */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-semibold mb-3 block">紧急程度</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setFormData({ ...formData, urgency: '一般' })}
                  className={`h-10 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.urgency === '一般'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  一般
                </button>
                <button
                  onClick={() => setFormData({ ...formData, urgency: '较急' })}
                  className={`h-10 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.urgency === '较急'
                      ? 'bg-orange-50 border-orange-500 text-orange-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  较急
                </button>
                <button
                  onClick={() => setFormData({ ...formData, urgency: '紧急' })}
                  className={`h-10 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.urgency === '紧急'
                      ? 'bg-red-50 border-red-500 text-red-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  紧急
                </button>
              </div>
            </CardContent>
          </Card>

          {/* 问题描述 */}
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
                  className={recording ? 'bg-red-50 text-red-600 border-red-300' : ''}
                >
                  <Mic className={`w-4 h-4 mr-1 ${recording ? 'animate-pulse' : ''}`} />
                  {recording ? '录音中...' : '语音输入'}
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

          {/* 现场照片 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">现场照片</Label>
                <Badge variant="secondary" className="text-xs">
                  {photos.length}/9
                </Badge>
              </div>
              
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
                    <span className="text-xs">拍照</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">建议拍摄多角度照片，便于问题判断</p>
            </CardContent>
          </Card>

          {/* 位置信息 */}
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
              {locationObtained && (
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {formData.location}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 提交按钮 */}
          <Button
            className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
          >
            <Send className="w-5 h-5 mr-2" />
            提交上报
          </Button>

          {/* 最近上报 */}
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