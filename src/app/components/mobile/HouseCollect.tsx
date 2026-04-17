import { useRef, useState } from 'react';
import { Camera, MapPin, QrCode, Save, ChevronLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { MobileStatusBar } from './MobileStatusBar';
import { toast } from 'sonner';
import { houseRepository } from '../../services/repositories/houseRepository';
import { mobileContextRepository } from '../../services/repositories/mobileContextRepository';
import type { HouseType } from '../../types/core';

interface HouseCollectProps {
  onBack: () => void;
}

function mapUsageToHouseType(usage: string): HouseType {
  if (usage === '住宅') {
    return '自住';
  }
  if (usage === '商业' || usage === '办公') {
    return '经营';
  }
  return '其他';
}

export function HouseCollect({ onBack }: HouseCollectProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [locationObtained, setLocationObtained] = useState(false);
  const [locationSummary, setLocationSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    fileInputRef.current?.click();
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
      toast.info('当前环境不支持定位，请继续手工补充地址信息');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationObtained(true);
        setLocationSummary(
          `经度 ${position.coords.longitude.toFixed(4)}，纬度 ${position.coords.latitude.toFixed(4)}`,
        );
        toast.success('已记录当前定位');
      },
      () => {
        toast.info('未获取到定位权限，请继续手工补充地址信息');
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      },
    );
  };

  const handleScanQR = () => {
    const buildingCode = formData.building.replace(/\D/g, '') || '00';
    const unitCode = formData.unit.replace(/\D/g, '') || '00';
    const roomCode = formData.room.replace(/\D/g, '') || '000';
    const suggestedNumber = `HC-${buildingCode.padStart(2, '0')}-${unitCode.padStart(2, '0')}-${roomCode.padStart(3, '0')}`;
    setFormData({ ...formData, houseNumber: suggestedNumber });
    toast.success('已生成建议房屋编号，可根据现场门牌再调整');
  };

  const handleSubmit = async () => {
    if (!formData.houseNumber || !formData.community || !formData.building) {
      toast.error('请填写房屋编号、社区和楼栋');
      return;
    }

    const gridId = mobileContextRepository.getCurrentGridSelection().id || 'g1';
    const address = `${formData.community}${formData.building}${formData.unit || ''}${formData.room || ''}`;

    setIsSubmitting(true);
    try {
      await houseRepository.addHouse({
        gridId,
        address,
        communityName: formData.community,
        building: formData.building,
        unit: formData.unit || '-',
        room: formData.room || formData.houseNumber,
        ownerName: '待核实',
        area: formData.area || '0',
        type: mapUsageToHouseType(formData.usage),
        memberCount: 0,
        tags: locationObtained ? ['移动采集', '已定位'] : ['移动采集'],
        updatedAt: new Date().toISOString(),
        houseType: '普通住宅',
        occupancyStatus: '其他',
        residenceType: '自住',
      });
      toast.success('房屋信息已登记到台账，后续可在房屋管理页继续补充');
      onBack();
    } catch (error) {
      console.error('Failed to submit house collect form', error);
      toast.error('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-background pb-20 overflow-y-auto">
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
        <Card>
          <CardContent className="p-4">
            <Label className="text-sm font-semibold mb-3 block">
              房屋编号 <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="请输入或生成建议编号"
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
            <p className="text-xs text-gray-500 mt-2">建议格式：HC-楼栋-单元-房号，可根据现场二维码或门牌调整</p>
          </CardContent>
        </Card>

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
              {locationSummary && (
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {locationSummary}
                </div>
              )}
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

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">现场照片</Label>
              <Badge variant="secondary" className="text-xs">
                {photos.length}/9
              </Badge>
            </div>

            <input
              ref={fileInputRef}
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
                  <span className="text-xs">上传照片</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">建议补充门牌号、房屋外观与入户口照片</p>
          </CardContent>
        </Card>

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
            disabled={isSubmitting}
          >
            <Save className="w-5 h-5 mr-2" />
            {isSubmitting ? '提交中...' : '提交审核'}
          </Button>
        </div>
      </div>
    </div>
  );
}
