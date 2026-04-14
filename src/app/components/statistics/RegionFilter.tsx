import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface RegionFilterProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function RegionFilter({ value, onChange, className }: RegionFilterProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="选择区域" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全区</SelectItem>
          <SelectItem value="street_a">环翠楼街道</SelectItem>
          <SelectItem value="street_b">鲸园街道</SelectItem>
          <SelectItem value="street_c">竹岛街道</SelectItem>
        </SelectContent>
      </Select>
      
      <Select disabled>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="选择社区" />
        </SelectTrigger>
        <SelectContent>
          {/* 这里的逻辑后续连接真实数据 */}
        </SelectContent>
      </Select>
      
      <Select disabled>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="选择网格" />
        </SelectTrigger>
        <SelectContent>
        </SelectContent>
      </Select>
    </div>
  );
}
