import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { getCommunities, getDistricts, getRegionGrids, getStreets } from "../../config/regions";

interface RegionFilterProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function RegionFilter({ value, onChange, className }: RegionFilterProps) {
  const [district, setDistrict] = useState("all");
  const [street, setStreet] = useState("all");
  const [community, setCommunity] = useState("all");
  const streets = getStreets(district);
  const communities = getCommunities(district, street);
  const grids = getRegionGrids(district, street, community);

  const handleDistrictChange = (nextDistrict: string) => {
    setDistrict(nextDistrict);
    setStreet("all");
    setCommunity("all");
    onChange(nextDistrict === "all" ? "all" : nextDistrict);
  };

  const handleStreetChange = (nextStreet: string) => {
    setStreet(nextStreet);
    setCommunity("all");
    onChange(nextStreet === "all" ? district : nextStreet);
  };

  const handleCommunityChange = (nextCommunity: string) => {
    setCommunity(nextCommunity);
    onChange(nextCommunity === "all" ? street : nextCommunity);
  };

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Select value={district} onValueChange={handleDistrictChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="选择区县" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全区</SelectItem>
          {getDistricts().map((item) => (
            <SelectItem key={item} value={item}>{item}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={street} onValueChange={handleStreetChange} disabled={district === "all"}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="选择街道" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全街道</SelectItem>
          {streets.map((item) => (
            <SelectItem key={item} value={item}>{item}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={community} onValueChange={handleCommunityChange} disabled={street === "all"}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="选择社区" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全社区</SelectItem>
          {communities.map((item) => (
            <SelectItem key={item} value={item}>{item}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value ?? "all"} onValueChange={onChange} disabled={grids.length === 0}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="选择网格" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部网格</SelectItem>
          {grids.map((grid) => (
            <SelectItem key={grid.id} value={grid.id}>{grid.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
