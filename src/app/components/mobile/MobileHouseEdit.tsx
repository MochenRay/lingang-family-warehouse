import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { MobileDetailHeader } from './MobileDetailHeader';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';
import { House, HouseType } from '../../types/core';
import { houseRepository } from '../../services/repositories/houseRepository';

interface MobileHouseEditProps {
  id: string;
  onBack: () => void;
  onSave?: () => void;
}

export function MobileHouseEdit({ id, onBack, onSave }: MobileHouseEditProps) {
  const [house, setHouse] = useState<House | null>(null);
  const [formData, setFormData] = useState({
    ownerName: '',
    area: '',
    type: '自住' as HouseType,
    address: '',
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      const houseData = await houseRepository.getHouse(id);
      if (!active || !houseData) {
        return;
      }

      setHouse(houseData);
      setFormData({
        ownerName: houseData.ownerName,
        area: houseData.area,
        type: houseData.type,
        address: houseData.address,
      });
    };

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  const handleSave = async () => {
    if (!house) return;

    await houseRepository.updateHouse(id, {
      ownerName: formData.ownerName,
      area: formData.area,
      type: formData.type,
      address: formData.address,
      updatedAt: new Date().toISOString().split('T')[0],
    });

    if (onSave) onSave();
    onBack();
  };

  if (!house) {
    return <div className="h-full flex items-center justify-center">加载中...</div>;
  }

  return (
    <div className="h-full bg-[var(--color-neutral-01)] flex flex-col overflow-hidden">
      {/* Header */}
      <MobileDetailHeader title="编辑房屋信息" onBack={onBack} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">房屋地址</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="请输入房屋地址"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">业主姓名</Label>
              <Input
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="请输入业主姓名"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">建筑面积</Label>
              <Input
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="例如：128㎡"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">房屋状态</Label>
              <Select value={formData.type} onValueChange={(value: HouseType) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="自住">自住</SelectItem>
                  <SelectItem value="出租">出租</SelectItem>
                  <SelectItem value="空置">空置</SelectItem>
                  <SelectItem value="经营">经营</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-[var(--color-brand-primary)]/10 border-[var(--color-brand-primary)]">
          <p className="text-xs text-[var(--color-brand-primary-hover)]">
            <strong>注意：</strong>社区名称、楼栋单元等基础信息不可修改，如需修改请联系管理员。
          </p>
        </Card>
      </div>

      {/* Bottom Action */}
      <div className="bg-[var(--color-neutral-01)] border-t border-[var(--color-neutral-03)] p-4 safe-area-bottom sticky bottom-0">
        <Button 
          className="w-full h-11 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)]"
          onClick={handleSave}
        >
          <Save className="w-4 h-4 mr-2" />
          保存修改
        </Button>
      </div>
    </div>
  );
}
