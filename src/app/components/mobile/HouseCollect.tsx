import { useState } from 'react';
import { 
  ArrowLeft, 
  Camera, 
  MapPin, 
  QrCode, 
  Save,
  Home as HomeIcon,
  ChevronLeft
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { MobileStatusBar } from './MobileStatusBar';

interface HouseCollectProps {
  onBack: () => void;
}

export function HouseCollect({ onBack }: HouseCollectProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [locationObtained, setLocationObtained] = useState(false);
  
  const [formData, setFormData] = useState({
    houseNumber: '',
    district: '环翠区',
    street: '竹岛街道',
    community: '',
    building: '',
    unit: '',
    floor: '',
    room: '',
    structure: '',
    floors: '',
    area: '',
    usage: '',
    buildYear: '',
    remark: ''
  });

  const handlePhotoCapture = () => {
    // Mock添加照片
    const mockPhoto = `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400`;
    setPhotos([...photos, mockPhoto]);
  };

  const handleGetLocation = () => {
    // Mock获取定位
    setLocationObtained(true);
    setTimeout(() => {
      alert('定位成功\n经度: 122.1215\n纬度: 37.5132\n地址: 威海市环翠区竹岛街道');
    }, 500);
  };

  const handleScanQR = () => {
    // Mock扫码
    const mockNumber = 'HC-ZD-001-1-101';
    setFormData({ ...formData, houseNumber: mockNumber });
  };

  const handleSubmit = () => {
    if (!formData.houseNumber || !formData.community || !formData.building) {
      alert('请填写必填项！');
      return;
    }
    alert('房屋信息提交成功！\n审核通过后将同步到系统');
    onBack();
  };

  return (
    <div className="h-full bg-background pb-20 overflow-y-auto">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <MobileStatusBar variant="light" />
        <div className="px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">房屋信息采集</h1>
            <p className="text-xs text-muted-foreground">请如实填写房屋基本信息</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 房屋编号 */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-sm font-semibold mb-3 block">
              房屋编号 <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="请输入或扫码获取"
                value={formData.houseNumber}
                onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleScanQR}
              >
                <QrCode className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">示例：HC-ZD-001-1-101</p>
          </CardContent>
        </Card>

        {/* 位置信息 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">
                位置信息 <span className="text-red-500">*</span>
              </Label>
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

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">区/县</Label>
                  <Select value={formData.district} onValueChange={(v) => setFormData({ ...formData, district: v })}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="环翠区">环翠区</SelectItem>
                      <SelectItem value="文登区">文登区</SelectItem>
                      <SelectItem value="临港区">临港区</SelectItem>
                      <SelectItem value="高新区">高新区</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">街道/乡镇</Label>
                  <Select value={formData.street} onValueChange={(v) => setFormData({ ...formData, street: v })}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="竹岛街道">竹岛街道</SelectItem>
                      <SelectItem value="鲸园街道">鲸园街道</SelectItem>
                      <SelectItem value="凤林街道">凤林街道</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-600 mb-1 block">社区 <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="请输入社区名称"
                  value={formData.community}
                  onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">楼栋 <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="1号楼"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">单元</Label>
                  <Input
                    placeholder="1单元"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">楼层</Label>
                  <Input
                    placeholder="3层"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">房号</Label>
                  <Input
                    placeholder="301"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 房屋属性 */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-sm font-semibold mb-3 block">房屋属性</Label>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">房屋结构</Label>
                  <Select value={formData.structure} onValueChange={(v) => setFormData({ ...formData, structure: v })}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="选择结构" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="钢混结构">钢混结构</SelectItem>
                      <SelectItem value="砖混结构">砖混结构</SelectItem>
                      <SelectItem value="框架结构">框架结构</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">总楼层</Label>
                  <Input
                    type="number"
                    placeholder="如：6"
                    value={formData.floors}
                    onChange={(e) => setFormData({ ...formData, floors: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">建筑面积(㎡)</Label>
                  <Input
                    type="number"
                    placeholder="如：90"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">建成年份</Label>
                  <Input
                    type="number"
                    placeholder="如：2010"
                    value={formData.buildYear}
                    onChange={(e) => setFormData({ ...formData, buildYear: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-600 mb-1 block">房屋用途</Label>
                <Select value={formData.usage} onValueChange={(v) => setFormData({ ...formData, usage: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="选择用途" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="住宅">住宅</SelectItem>
                    <SelectItem value="商业">商业</SelectItem>
                    <SelectItem value="办公">办公</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              {photos.length < 9 && (
                <button
                  onClick={handlePhotoCapture}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors"
                >
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-xs">拍照</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">建议拍摄：门牌号、外观、内部</p>
          </CardContent>
        </Card>

        {/* 备注 */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-sm font-semibold mb-2 block">备注说明</Label>
            <Textarea
              placeholder="选填，可补充其他信息..."
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              className="min-h-[80px] resize-none"
            />
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={onBack}
          >
            取消
          </Button>
          <Button
            className="flex-1 h-12 bg-primary hover:bg-[var(--color-brand-primary-hover)]"
            onClick={handleSubmit}
          >
            <Save className="w-5 h-5 mr-2" />
            提交审核
          </Button>
        </div>
      </div>
    </div>
  );
}