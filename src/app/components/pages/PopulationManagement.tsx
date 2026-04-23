import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Download,
  Edit,
  Trash2,
  Eye,
  Filter,
  Tag,
  Settings2,
  Users,
  Home,
  Heart,
  Network,
  Briefcase,
  Award,
  Activity,
  FileText,
  Calendar,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { tagStore } from "../../utils/tagStore";
import { houseRepository } from "../../services/repositories/houseRepository";
import { personRepository } from "../../services/repositories/personRepository";
import { visitRepository } from "../../services/repositories/visitRepository";
import { Grid, House, Person, PersonType, VisitRecord } from "../../types/core";

// 复用行政区划数据结构
const REGIONS = {
  '环翠区': {
    '竹岛街道': ['海源社区', '翠竹社区', '青竹社区'],
    '环翠楼街道': ['东北村社区', '东南村社区'],
    '鲸园街道': ['古陌社区', '北门外社区']
  },
  '文登区': {
    '龙山路街道': ['龙山社区', '五龙社区'],
    '天福路街道': ['天福社区', '文山社区']
  },
  '临港区': {
    '草庙子镇': ['草庙子村', '林泉社区'],
    '蔄山镇': ['蔄山村', '汶口社区']
  }
};

// Extend Person for local UI needs if necessary, but try to use core type or map it
interface Population extends Person {
  status: "正常" | "迁出" | "死亡" | "作废";
  district?: string;
  street?: string;
  community?: string;
  createTime?: string;
  // 表单临时字段
  houseCommunity?: string;
  houseBuilding?: string;
  houseUnit?: string;
  houseRoom?: string;
  gridDistrict?: string;
  gridStreet?: string;
  gridCommunity?: string;
}

const HIGH_RISK_KEYWORDS = ["矫正", "信访", "涉诉", "精神障碍", "吸毒", "邪教"];
const MEDIUM_RISK_KEYWORDS = ["独居", "失业", "残疾", "低保", "困境", "留守"];
const PAGE_SIZE = 20;

const extractInfoFromIdCard = (idCard: string) => {
  if (!idCard || idCard.length !== 18) return null;
  
  // Extract birth date
  const birthStr = idCard.substring(6, 14);
  const year = parseInt(birthStr.substring(0, 4));
  const month = parseInt(birthStr.substring(4, 6));
  const day = parseInt(birthStr.substring(6, 8));
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const birthDate = new Date(year, month - 1, day);
  const now = new Date();
  
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  
  // Extract gender (17th digit, odd=Male, even=Female)
  const genderNum = parseInt(idCard.substring(16, 17));
  if (isNaN(genderNum)) return null;

  const gender = genderNum % 2 !== 0 ? "男" : "女";
  
  return { age, gender };
};

const inferPopulationStatus = (person: Person): Population["status"] => {
  const tags = [...(person.tags ?? []), ...((person.careLabels ?? []) as string[])].join("|");
  if (tags.includes("已迁出") || tags.includes("迁出")) {
    return "迁出";
  }
  if (tags.includes("已故") || tags.includes("死亡")) {
    return "死亡";
  }
  return "正常";
};

const inferRiskLevel = (tags: string[] = [], careLabels?: string[]): Population["risk"] => {
  const allLabels = [...tags, ...(careLabels ?? [])];
  if (allLabels.some((label) => HIGH_RISK_KEYWORDS.some((keyword) => label.includes(keyword)))) {
    return "High";
  }
  if (allLabels.some((label) => MEDIUM_RISK_KEYWORDS.some((keyword) => label.includes(keyword)))) {
    return "Medium";
  }
  return "Low";
};

const inferRegionByGrid = (grid?: Grid): Pick<Population, "district" | "street" | "community"> => {
  if (!grid) {
    return {};
  }

  for (const [district, streets] of Object.entries(REGIONS)) {
    for (const [street, communities] of Object.entries(streets)) {
      if (!grid.name.includes(street)) {
        continue;
      }

      const matchedCommunity = communities.find((community) => grid.name.includes(community));
      return {
        district,
        street,
        community: matchedCommunity,
      };
    }
  }

  return {};
};

const mapPersonToPopulation = (person: Person, grid?: Grid): Population => {
  const extracted = extractInfoFromIdCard(person.idCard);

  return {
    ...person,
    age: extracted?.age ?? person.age,
    gender: (extracted?.gender as "男" | "女" | undefined) ?? person.gender,
    status: inferPopulationStatus(person),
    createTime: person.updatedAt,
    ...inferRegionByGrid(grid),
  };
};

const getLastVisitDate = (visits: VisitRecord[]) => visits[0]?.date;

const buildRecommendedActions = (
  person: Population,
  visits: VisitRecord[],
  housemates: Population[],
): string[] => {
  const actions: string[] = [];
  const labels = [...(person.tags ?? []), ...((person.careLabels ?? []) as string[])];
  const lastVisitDate = getLastVisitDate(visits);

  if (!lastVisitDate) {
    actions.push("补一次首访，完善基本信息、关爱标签和诉求记录。");
  }

  if (person.risk === "High") {
    actions.push("安排本周重点回访，并同步生成风险研判摘要。");
  } else if (person.risk === "Medium") {
    actions.push("在下一次网格巡查中优先复核其家庭和居住状态。");
  }

  if (labels.some((label) => label.includes("独居"))) {
    actions.push("核查独居场景下的紧急联系人、用药和日常照护情况。");
  }

  if (housemates.length >= 3) {
    actions.push("结合同住关系复核居住密度和人房一致性。");
  }

  if (actions.length === 0) {
    actions.push("维持常态走访频率，补齐最新联系信息与活动参与记录。");
  }

  return actions.slice(0, 3);
};

const getRiskSummary = (person: Population, visits: VisitRecord[]) => {
  const labels = [...(person.tags ?? []), ...((person.careLabels ?? []) as string[])];
  const lastVisitDate = getLastVisitDate(visits);

  if (person.risk === "High") {
    return "当前属于高风险重点对象，建议联动矛盾调解与走访任务持续跟踪。";
  }
  if (person.risk === "Medium") {
    return "当前存在持续关注信号，建议在近期走访中复核风险变化和家庭诉求。";
  }
  if (labels.length > 0) {
    return `当前以“${labels.slice(0, 2).join(" / ")}”为主标签，暂无高风险信号。`;
  }
  if (lastVisitDate) {
    return `当前风险较低，最近一次走访时间为 ${lastVisitDate}。`;
  }
  return "当前风险较低，但尚缺最近走访记录，建议补一轮基础核验。";
};

export function PopulationManagement() {
  const [populations, setPopulations] = useState<Population[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [residenceFilter, setResidenceFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  
  // 区域筛选状态
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterStreet, setFilterStreet] = useState('all');
  const [filterCommunity, setFilterCommunity] = useState('all');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isBatchTagDialogOpen, setIsBatchTagDialogOpen] = useState(false);
  const [isHouseSelectDialogOpen, setIsHouseSelectDialogOpen] = useState(false);
  const [isGridSelectDialogOpen, setIsGridSelectDialogOpen] = useState(false);
  const [selectedPopulation, setSelectedPopulation] = useState<Population | null>(null);
  const [formData, setFormData] = useState<Partial<Population>>({});
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [grids, setGrids] = useState<Grid[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [selectedPopulationVisits, setSelectedPopulationVisits] = useState<VisitRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // 标签管理状态
  const [recommendedTags, setRecommendedTags] = useState<string[]>([]); // 推荐的标签名称
  const [selectedPersonTags, setSelectedPersonTags] = useState<string[]>([]); // 当前选中的所有标签

  // 编辑表单折叠状态
  const [expandedSections, setExpandedSections] = useState({
    detail: false,
    biography: false,
    activity: false,
    health: false,
    events: false,
  });

  // 列显示设置
  const [visibleColumns, setVisibleColumns] = useState({
    gender: true,
    age: true,
    idCard: false,
    nation: false,
    education: false,
    region: true,
    address: true,
    family: true,
    relation: true,
    biography: true,
    visits: true,
    tags: true,
    type: false, // 默认收起
    status: false, // 默认收起
  });

  // 获取所有标签
  const allTags = tagStore.getTags();
  const enabledTags = allTags.filter((t) => t.status === "启用");

  // 智能标签推测函数
  const getRecommendedTagsFromFormData = (data: Partial<Population>): string[] => {
    const recommended: string[] = [];
    
    // 根据年龄推测
    if (data.age !== undefined) {
      if (data.age >= 60) {
        const tag = enabledTags.find(t => t.name === '60岁及以上老年人');
        if (tag) recommended.push(tag.name);
      }
      if (data.age >= 6 && data.age <= 18) {
        const tag = enabledTags.find(t => t.name === '学龄儿童');
        if (tag) recommended.push(tag.name);
      }
    }
    
    // 根据居住类型推测
    if (data.type === '流动') {
      const tag = enabledTags.find(t => t.name === '流动人口');
      if (tag) recommended.push(tag.name);
    }
    
    return recommended;
  };

  // 监听formData变化，自动更新推荐标签
  useEffect(() => {
    if (isAddDialogOpen || isEditDialogOpen) {
      const newRecommended = getRecommendedTagsFromFormData(formData);
      
      setRecommendedTags(prevRecommended => {
        // 找出新增的推荐标签
        const addedRecommended = newRecommended.filter(t => !prevRecommended.includes(t));
        
        // 新推荐的标签自动添加到选中列表
        if (addedRecommended.length > 0) {
          setSelectedPersonTags(prev => [...new Set([...prev, ...addedRecommended])]);
        }
        
        return newRecommended;
      });
    }
  }, [formData.age, formData.type, isAddDialogOpen, isEditDialogOpen]);

  // 房屋级联选择相关函数
  const getAvailableCommunities = () => {
    const communities = new Set<string>();
    houses.forEach(h => communities.add(h.communityName));
    return Array.from(communities).sort();
  };

  const getAvailableBuildings = (community: string) => {
    if (!community) return [];
    const buildings = new Set<string>();
    houses.filter(h => h.communityName === community).forEach(h => buildings.add(h.building));
    return Array.from(buildings).sort();
  };

  const getAvailableUnits = (community: string, building: string) => {
    if (!community || !building) return [];
    const units = new Set<string>();
    houses.filter(h => h.communityName === community && h.building === building).forEach(h => units.add(h.unit));
    return Array.from(units).sort();
  };

  const getAvailableRooms = (community: string, building: string, unit: string) => {
    if (!community || !building || !unit) return [];
    const rooms = new Set<string>();
    houses.filter(h => h.communityName === community && h.building === building && h.unit === unit).forEach(h => rooms.add(h.room));
    return Array.from(rooms).sort();
  };

  // 根据级联选择找到对应的房屋ID
  const findHouseId = (community: string, building: string, unit: string, room: string) => {
    const house = houses.find(h => 
      h.communityName === community && 
      h.building === building && 
      h.unit === unit && 
      h.room === room
    );
    return house?.id;
  };

  // 获取已选房屋的显示文本
  const getSelectedHouseText = () => {
    if (!formData.houseId) return "未关联";
    const house = houses.find(h => h.id === formData.houseId);
    if (!house) return "未关联";
    return `${house.communityName} ${house.building} ${house.unit} ${house.room}`;
  };

  // 打开房屋选择对话框
  const handleOpenHouseSelect = () => {
    setIsHouseSelectDialogOpen(true);
  };

  // 确认房屋选择
  const handleConfirmHouseSelect = () => {
    if (formData.houseCommunity && formData.houseBuilding && formData.houseUnit && formData.houseRoom) {
      const houseId = findHouseId(formData.houseCommunity, formData.houseBuilding, formData.houseUnit, formData.houseRoom);
      setFormData({ ...formData, houseId });
    }
    setIsHouseSelectDialogOpen(false);
  };

  // 清除房屋选择
  const handleClearHouseSelect = () => {
    setFormData({
      ...formData,
      houseCommunity: undefined,
      houseBuilding: undefined,
      houseUnit: undefined,
      houseRoom: undefined,
      houseId: undefined
    });
    setIsHouseSelectDialogOpen(false);
  };

  // 网格级联选择相关函数
  const getAvailableGrids = (district?: string, street?: string, community?: string) => {
    if (!district || !street || !community) return [];
    // 根据区县、街道、社区筛选网格
    // 网格名称格式: "竹岛街道海源社区第一网格"
    const searchPattern = `${street}${community}`;
    return grids.filter(g => g.name.includes(searchPattern));
  };

  // 获取已选网格的显示文本
  const getSelectedGridText = () => {
    if (!formData.gridId) return "未选择";
    const grid = grids.find(g => g.id === formData.gridId);
    return grid ? grid.name : "未选择";
  };

  // 打开网格选择对话框
  const handleOpenGridSelect = () => {
    setIsGridSelectDialogOpen(true);
  };

  // 确认网格选择
  const handleConfirmGridSelect = () => {
    setIsGridSelectDialogOpen(false);
  };

  // 清除网格选择
  const handleClearGridSelect = () => {
    setFormData({
      ...formData,
      gridDistrict: undefined,
      gridStreet: undefined,
      gridCommunity: undefined,
      gridId: undefined
    });
    setIsGridSelectDialogOpen(false);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [people, nextGrids, nextHouses, nextVisits] = await Promise.all([
        personRepository.getPeople(),
        personRepository.getGrids(),
        houseRepository.getHouses(),
        visitRepository.getVisits({ targetType: "person", order: "desc", limit: 500 }),
      ]);
      const gridMap = new Map(nextGrids.map((grid) => [grid.id, grid]));
      const mappedPopulations = people.map((person) => mapPersonToPopulation(person, gridMap.get(person.gridId)));

      setGrids(nextGrids);
      setHouses(nextHouses);
      setVisits(nextVisits);
      setPopulations(mappedPopulations);
      setSelectedPopulation((prev) => {
        if (!prev) {
          return null;
        }
        return mappedPopulations.find((person) => person.id === prev.id) ?? null;
      });
    } catch (error) {
      console.error("Failed to load population management data", error);
      alert("人口数据加载失败，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!isViewDialogOpen || !selectedPopulation) {
      setSelectedPopulationVisits([]);
      return;
    }

    let cancelled = false;

    const loadVisitHistory = async () => {
      setIsDetailLoading(true);
      try {
        const visits = await visitRepository.getVisits({
          targetId: selectedPopulation.id,
          targetType: "person",
          order: "desc",
          limit: 20,
        });
        if (!cancelled) {
          setSelectedPopulationVisits(visits);
        }
      } catch (error) {
        console.error("Failed to load population visit history", error);
        if (!cancelled) {
          setSelectedPopulationVisits([]);
        }
      } finally {
        if (!cancelled) {
          setIsDetailLoading(false);
        }
      }
    };

    void loadVisitHistory();

    return () => {
      cancelled = true;
    };
  }, [isViewDialogOpen, selectedPopulation?.id]);

  // 获取可选的街道列表
  const getStreets = (district: string) => {
    if (!district || district === 'all' || !REGIONS[district as keyof typeof REGIONS]) return [];
    return Object.keys(REGIONS[district as keyof typeof REGIONS]);
  };

  // 获取可选的社区列表
  const getCommunities = (district: string, street: string) => {
    if (!district || !street || district === 'all' || street === 'all') return [];
    const streets = REGIONS[district as keyof typeof REGIONS];
    if (!streets) return [];
    return streets[street as keyof typeof streets] || [];
  };

  // 筛选数据
  const filteredPopulations = populations.filter((pop) => {
    const matchSearch =
      pop.name.includes(searchKeyword) ||
      pop.idCard.includes(searchKeyword) ||
      (pop.phone && pop.phone.includes(searchKeyword)) ||
      pop.address.includes(searchKeyword);

    const matchStatus = statusFilter === "all" || pop.status === statusFilter;
    const matchResidence = residenceFilter === "all" || pop.type === residenceFilter;
    const matchRisk = riskFilter === "all" || pop.risk === riskFilter;
    const matchTag = tagFilter === "all" || (pop.tags && pop.tags.includes(tagFilter));
    
    // 区域筛选
    const matchDistrict = filterDistrict === 'all' || pop.district === filterDistrict;
    const matchStreet = filterStreet === 'all' || pop.street === filterStreet;
    const matchCommunity = filterCommunity === 'all' || pop.community === filterCommunity;

    return (
      matchSearch && matchStatus && matchResidence && matchRisk && matchTag && 
      matchDistrict && matchStreet && matchCommunity
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, statusFilter, residenceFilter, riskFilter, tagFilter, filterDistrict, filterStreet, filterCommunity]);

  const totalPages = Math.max(1, Math.ceil(filteredPopulations.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedPopulations = filteredPopulations.slice(pageStart, pageStart + PAGE_SIZE);
  const pageSelectedIds = paginatedPopulations.map((pop) => pop.id);
  const isCurrentPageFullySelected =
    pageSelectedIds.length > 0 && pageSelectedIds.every((id) => selectedRows.includes(id));
  const houseMap = new Map(houses.map((house) => [house.id, house]));
  const peopleByHouseId = populations.reduce((map, person) => {
    if (!person.houseId) {
      return map;
    }
    const current = map.get(person.houseId) ?? [];
    current.push(person);
    map.set(person.houseId, current);
    return map;
  }, new Map<string, Population[]>());
  const visitsByPersonId = visits.reduce((map, visit) => {
    const current = map.get(visit.targetId) ?? [];
    current.push(visit);
    map.set(visit.targetId, current);
    return map;
  }, new Map<string, VisitRecord[]>());

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "正常": return "default";
      case "迁出": return "secondary";
      case "死亡": return "destructive";
      case "作废": return "outline";
      default: return "default";
    }
  };

  const getResidenceTypeBadge = (type: string) => {
    switch (type) {
      case "常住": return "bg-blue-100 text-blue-800";
      case "流动": return "bg-orange-100 text-orange-800";
      case "户籍": return "bg-green-100 text-green-800";
      default: return "";
    }
  };

  const getPopulationTags = (tagIds?: string[]) => {
    if (!tagIds || tagIds.length === 0) return [];
    // Here tagIds are actually tag names in seed data. 
    // We should probably check if they match IDs or Names in tagStore.
    // For now, let's just return objects with name=tagId
    return tagIds.map(t => ({ id: t, name: t }));
  };

  const getHouseDisplay = (person: Population, houseMap: Map<string, House>) => {
    if (!person.houseId) {
      return "未关联房屋";
    }
    const house = houseMap.get(person.houseId);
    if (!house) {
      return "未关联房屋";
    }
    return `${house.communityName} ${house.building}${house.unit}${house.room}`;
  };

  const getRelationDisplay = (person: Population, peopleByHouseId: Map<string, Population[]>) => {
    const relations = person.familyRelations ?? [];
    if (relations.length > 0) {
      return relations.slice(0, 2).map((relation) => relation.relationType).join(" / ");
    }
    if (!person.houseId) {
      return "待补家庭关系";
    }
    const housemates = peopleByHouseId.get(person.houseId)?.filter((item) => item.id !== person.id) ?? [];
    return housemates.length > 0 ? `同户 ${housemates.length} 人` : "单户登记";
  };

  const getBiographyDisplay = (person: Population) => {
    if (person.biography) {
      return person.biography;
    }
    if (person.workplace) {
      return person.workplace;
    }
    if (person.activityParticipation?.needs) {
      return person.activityParticipation.needs;
    }
    return person.education ? `${person.education}；待补工作/经历` : "待补经历";
  };

  const getVisitDisplay = (person: Population, visitsByPersonId: Map<string, VisitRecord[]>) => {
    const personVisits = visitsByPersonId.get(person.id) ?? [];
    if (personVisits.length === 0) {
      return { title: "暂无走访", detail: "建议补一次基础核验" };
    }
    return {
      title: personVisits[0].date,
      detail: `累计 ${personVisits.length} 次`,
    };
  };

  const handleView = (pop: Population) => {
    setSelectedPopulation(pop);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (pop: Population) => {
    setSelectedPopulation(pop);
    setFormData(pop);
    
    // 编辑时，根据当前信息推测推荐标签
    const currentRecommended = getRecommendedTagsFromFormData(pop);
    setRecommendedTags(currentRecommended);
    
    // 将现有标签设置为选中状态
    setSelectedPersonTags(pop.tags || []);
    
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条人口信息吗？删除后将从当前演示数据中移除。")) {
      return;
    }

    setIsSaving(true);
    try {
      await personRepository.deletePerson(id);
      if (selectedPopulation?.id === id) {
        setIsViewDialogOpen(false);
        setSelectedPopulation(null);
      }
      await loadData();
    } catch (error) {
      console.error("Failed to delete person", error);
      alert("删除人口信息失败，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = () => {
    setFormData({ 
      status: "正常", 
      type: "户籍", 
      tags: [],
      gridId: grids[0]?.id,
      houseCommunity: undefined,
      houseBuilding: undefined,
      houseUnit: undefined,
      houseRoom: undefined
    });
    setRecommendedTags([]);
    setSelectedPersonTags([]);
    setIsAddDialogOpen(true);
  };

  const handleSaveAdd = async () => {
    const risk = inferRiskLevel(selectedPersonTags, formData.careLabels);
    const newPerson = {
      gridId: formData.gridId || grids[0]?.id || 'g1',
      name: formData.name || "",
      idCard: formData.idCard || "",
      gender: formData.gender || "男",
      age: formData.age || 0,
      phone: formData.phone || "",
      address: formData.address || "",
      type: formData.type || "户籍",
      tags: selectedPersonTags,
      risk,
      nation: formData.nation,
      education: formData.education,
      houseId: formData.houseId,
      updatedAt: new Date().toISOString(),
      // 详细信息
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
      careLabels: formData.careLabels || undefined,
      categoryLabels: formData.categoryLabels || undefined,
      biography: formData.biography || undefined,
      activityParticipation: (formData.activityParticipation?.activities || formData.activityParticipation?.needs) ? formData.activityParticipation : undefined,
      healthRecord: formData.healthRecord || undefined,
      importantEvents: formData.importantEvents || undefined,
    };

    setIsSaving(true);
    try {
      await personRepository.addPerson(newPerson);
      await loadData();
      setIsAddDialogOpen(false);
      setFormData({});
      setRecommendedTags([]);
      setSelectedPersonTags([]);
    } catch (error) {
      console.error("Failed to add person", error);
      alert("新增人口失败，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (selectedPopulation) {
      setIsSaving(true);
      try {
        await personRepository.updatePerson(selectedPopulation.id, {
          name: formData.name,
          idCard: formData.idCard,
          phone: formData.phone,
          address: formData.address,
          nation: formData.nation,
          education: formData.education,
          gender: formData.gender,
          age: formData.age,
          type: formData.type,
          gridId: formData.gridId,
          houseId: formData.houseId,
          tags: selectedPersonTags,
          risk: inferRiskLevel(selectedPersonTags, formData.careLabels),
          updatedAt: new Date().toISOString(),
          birthDate: formData.birthDate,
          birthplace: formData.birthplace,
          maritalStatus: formData.maritalStatus,
          religion: formData.religion,
          politicalStatus: formData.politicalStatus,
          militaryService: formData.militaryService,
          graduationInfo: formData.graduationInfo,
          workplace: formData.workplace,
          communityVolunteer: formData.communityVolunteer,
          skills: formData.skills,
          pets: formData.pets,
          careLabels: formData.careLabels,
          categoryLabels: formData.categoryLabels,
          biography: formData.biography,
          activityParticipation: formData.activityParticipation,
          healthRecord: formData.healthRecord,
          importantEvents: formData.importantEvents,
        });
        await loadData();
        setIsEditDialogOpen(false);
        setSelectedPopulation(null);
        setFormData({});
        setRecommendedTags([]);
        setSelectedPersonTags([]);
        setExpandedSections({
          detail: false,
          biography: false,
          activity: false,
          health: false,
          events: false,
        });
      } catch (error) {
        console.error("Failed to update person", error);
        alert("更新人口信息失败，请稍后重试。");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleBatchTag = () => {
    if (selectedRows.length === 0) {
      alert("请先选择要打标签的人员");
      return;
    }
    setSelectedTags([]);
    setIsBatchTagDialogOpen(true);
  };

  const handleSaveBatchTags = () => {
    // In a real app, update tags for all selected IDs
    setIsBatchTagDialogOpen(false);
    setSelectedRows([]);
    setSelectedTags([]);
  };

  const toggleRowSelection = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const toggleAllSelection = () => {
    if (isCurrentPageFullySelected) {
      setSelectedRows(selectedRows.filter((id) => !pageSelectedIds.includes(id)));
    } else {
      setSelectedRows([...new Set([...selectedRows, ...pageSelectedIds])]);
    }
  };

  const selectedHousemates = selectedPopulation?.houseId
    ? populations.filter(
        (person) => person.houseId === selectedPopulation.houseId && person.id !== selectedPopulation.id,
      )
    : [];

  const selectedFamilyMembers = selectedPopulation?.familyRelations
    ? selectedPopulation.familyRelations.reduce<Array<{ person: Population; relationType: string }>>(
        (items, relation) => {
          const person = populations.find((item) => item.id === relation.relatedPersonId);
          if (person) {
            items.push({ person, relationType: relation.relationType });
          }
          return items;
        },
        [],
      )
    : [];

  const selectedRiskSummary = selectedPopulation
    ? getRiskSummary(selectedPopulation, selectedPopulationVisits)
    : "";
  const selectedRecommendedActions = selectedPopulation
    ? buildRecommendedActions(selectedPopulation, selectedPopulationVisits, selectedHousemates)
    : [];

  const stats = {
    total: populations.length,
    normal: populations.filter((p) => p.status === "正常").length,
    resident: populations.filter((p) => p.type === "户籍").length, // Mapping '常住' -> '户籍' approx
    floating: populations.filter((p) => p.type === "流动").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">人口管理</h1>
        <p className="text-gray-500">支持按区县/街道/社区筛选的人口信息全生命周期管理</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>总人口数</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>正常人口</CardDescription>
            <CardTitle className="text-3xl">{stats.normal}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>户籍人口</CardDescription>
            <CardTitle className="text-3xl">{stats.resident}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>流动人口</CardDescription>
            <CardTitle className="text-3xl">{stats.floating}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              {/* 第一行：搜索与区域筛选 */}
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 relative min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="搜索姓名、身份证号..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* 级联筛选器 */}
                <Select value={filterDistrict} onValueChange={(val) => {
                  setFilterDistrict(val);
                  setFilterStreet('all');
                  setFilterCommunity('all');
                }}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="区县" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全区县</SelectItem>
                    {Object.keys(REGIONS).map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={filterStreet} 
                  onValueChange={(val) => {
                    setFilterStreet(val);
                    setFilterCommunity('all');
                  }}
                  disabled={filterDistrict === 'all'}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="街道" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全街道</SelectItem>
                    {getStreets(filterDistrict).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={filterCommunity} 
                  onValueChange={setFilterCommunity}
                  disabled={filterStreet === 'all'}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="社区" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全社区</SelectItem>
                    {getCommunities(filterDistrict, filterStreet).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 第二行：属性筛选与按钮 */}
              <div className="flex gap-3 flex-wrap items-center justify-between">
                <div className="flex gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[132px]">
                        <SelectValue placeholder="状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="正常">正常</SelectItem>
                        <SelectItem value="迁出">迁出</SelectItem>
                        <SelectItem value="死亡">死亡</SelectItem>
                        <SelectItem value="作废">作废</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Select value={residenceFilter} onValueChange={setResidenceFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部类型</SelectItem>
                      <SelectItem value="常住">常住</SelectItem>
                      <SelectItem value="流动">流动</SelectItem>
                      <SelectItem value="户籍">户籍</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={riskFilter} onValueChange={setRiskFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="风险等级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部风险</SelectItem>
                      <SelectItem value="High">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          高危
                        </span>
                      </SelectItem>
                      <SelectItem value="Medium">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500" />
                          关注
                        </span>
                      </SelectItem>
                      <SelectItem value="Low">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          正常
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAdd}>
                    <Plus className="w-4 h-4 mr-2" />
                    新增人口
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    导出
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Settings2 className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[150px]">
                      <DropdownMenuLabel>列展示设置</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.gender}
                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, gender: checked }))}
                      >
                        性别
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.nation}
                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, nation: checked }))}
                      >
                        民族
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.age}
                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, age: checked }))}
                      >
                        年龄
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.education}
                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, education: checked }))}
                      >
                        教育程度
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.idCard}
                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, idCard: checked }))}
                      >
                        身份证号
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.region}
                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, region: checked }))}
                      >
                        所属区域
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.address}
                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, address: checked }))}
                      >
                        详细地址
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.family}
                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, family: checked }))}
                      >
                        家庭房屋
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.relation}
                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, relation: checked }))}
                      >
                        家庭关系
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.biography}
                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, biography: checked }))}
                      >
                        经历诉求
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.visits}
                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, visits: checked }))}
                      >
                        走访记录
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.tags}
                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, tags: checked }))}
                      >
                        标签
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.type}
                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, type: checked }))}
                      >
                        居住类型
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.status}
                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, status: checked }))}
                      >
                        状态
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            
            {/* 批量操作栏 */}
            {selectedRows.length > 0 && (
              <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg">
                <span className="text-sm text-blue-900">
                  已选择 <span className="font-semibold">{selectedRows.length}</span> 条记录
                </span>
                <Button size="sm" variant="outline" onClick={handleBatchTag}>
                  <Tag className="w-4 h-4 mr-2" />
                  批量打标签
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedRows([])}>
                  取消选择
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 数据表格 */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 sticky left-0 z-20 bg-gray-50">
                    <input type="checkbox" checked={isCurrentPageFullySelected} onChange={toggleAllSelection} className="rounded" />
                  </TableHead>
                  <TableHead className="sticky left-12 z-20 bg-gray-50 min-w-[120px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">姓名</TableHead>
                  {visibleColumns.gender && <TableHead>性别</TableHead>}
                  {visibleColumns.nation && <TableHead>民族</TableHead>}
                  {visibleColumns.age && <TableHead>年龄</TableHead>}
                  {visibleColumns.education && <TableHead>教育程度</TableHead>}
                  {visibleColumns.idCard && <TableHead>身份证号</TableHead>}
                  {visibleColumns.region && <TableHead>所属区域</TableHead>}
                  {visibleColumns.address && <TableHead>详细地址</TableHead>}
                  {visibleColumns.family && <TableHead>家庭/房屋</TableHead>}
                  {visibleColumns.relation && <TableHead>关系</TableHead>}
                  {visibleColumns.biography && <TableHead>经历/诉求</TableHead>}
                  {visibleColumns.visits && <TableHead>走访记录</TableHead>}
                  {visibleColumns.tags && <TableHead>标签</TableHead>}
                  {visibleColumns.type && <TableHead>居住类型</TableHead>}
                  {visibleColumns.status && <TableHead>状态</TableHead>}
                  <TableHead className="text-right sticky right-0 z-20 bg-gray-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPopulations.length > 0 ? (
                  paginatedPopulations.map((pop) => {
                    const visitDisplay = getVisitDisplay(pop, visitsByPersonId);
                    return (
                      <TableRow key={pop.id}>
                        <TableCell className="sticky left-0 z-10 bg-white">
                          <input type="checkbox" checked={selectedRows.includes(pop.id)} onChange={() => toggleRowSelection(pop.id)} className="rounded" />
                        </TableCell>
                        <TableCell className="sticky left-12 z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              pop.risk === 'High' ? 'bg-red-500 shadow-sm shadow-red-200' :
                              pop.risk === 'Medium' ? 'bg-yellow-500 shadow-sm shadow-yellow-200' :
                              'bg-green-500 shadow-sm shadow-green-200'
                            }`} title={`风险等级: ${pop.risk}`} />
                            <span className="font-medium text-gray-900">{pop.name}</span>
                          </div>
                        </TableCell>
                        {visibleColumns.gender && <TableCell>{pop.gender}</TableCell>}
                        {visibleColumns.nation && <TableCell>{pop.nation || '-'}</TableCell>}
                        {visibleColumns.age && <TableCell>{pop.age}岁</TableCell>}
                        {visibleColumns.education && <TableCell>{pop.education || '-'}</TableCell>}
                        {visibleColumns.idCard && <TableCell className="font-mono text-sm">{pop.idCard}</TableCell>}
                        {visibleColumns.region && (
                          <TableCell className="text-sm">
                            {pop.district && pop.street ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{pop.community}</span>
                                <span className="text-xs text-gray-500">{pop.district}/{pop.street}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.address && <TableCell className="max-w-[200px] truncate" title={pop.address}>{pop.address}</TableCell>}
                        {visibleColumns.family && (
                          <TableCell className="max-w-[220px] text-sm">
                            <div className="truncate font-medium text-gray-900" title={getHouseDisplay(pop, houseMap)}>
                              {getHouseDisplay(pop, houseMap)}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {pop.houseId ? `房屋 ID：${pop.houseId}` : "待补人房关联"}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.relation && (
                          <TableCell className="max-w-[160px] text-sm">
                            <span className="text-gray-700">{getRelationDisplay(pop, peopleByHouseId)}</span>
                          </TableCell>
                        )}
                        {visibleColumns.biography && (
                          <TableCell className="max-w-[240px] text-sm">
                            <div className="line-clamp-2 text-gray-700" title={getBiographyDisplay(pop)}>
                              {getBiographyDisplay(pop)}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.visits && (
                          <TableCell className="text-sm">
                            <div className="font-medium text-gray-900">{visitDisplay.title}</div>
                            <div className="mt-1 text-xs text-gray-500">{visitDisplay.detail}</div>
                          </TableCell>
                        )}
                        {visibleColumns.tags && (
                          <TableCell>
                            <div className="flex flex-wrap gap-1 items-center max-w-[150px]">
                              {pop.tags && pop.tags.length > 0 ? (
                                <>
                                  {pop.tags.slice(0, 2).map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0 h-5 whitespace-nowrap font-normal">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {pop.tags.length > 2 && (
                                    <TooltipProvider>
                                      <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 cursor-help hover:bg-gray-100">
                                            +{pop.tags.length - 2}
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <div className="flex flex-col gap-1 p-2">
                                            {pop.tags.map((tag, i) => (
                                              <span key={i} className="text-xs block whitespace-nowrap">{tag}</span>
                                            ))}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </>
                              ) : (
                                <span className="text-gray-300 text-xs">-</span>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.type && (
                          <TableCell>
                            <Badge className={getResidenceTypeBadge(pop.type)}>{pop.type}</Badge>
                          </TableCell>
                        )}
                        {visibleColumns.status && (
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(pop.status) as any}>{pop.status}</Badge>
                          </TableCell>
                        )}
                        <TableCell className="text-right sticky right-0 z-10 bg-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleView(pop)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(pop)} disabled={isSaving}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => void handleDelete(pop.id)} disabled={isSaving}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                      {isLoading ? "正在加载人口数据..." : "暂无数据"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              共 {filteredPopulations.length} 条，当前显示 {filteredPopulations.length === 0 ? 0 : pageStart + 1}-
              {Math.min(pageStart + PAGE_SIZE, filteredPopulations.length)} 条
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                上一页
              </Button>
              <div className="min-w-[92px] text-center text-sm text-gray-600">
                第 {safeCurrentPage} / {totalPages} 页
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 查看详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>人口详情</DialogTitle>
            <DialogDescription>
              查看人口详细档案信息，包括基础信息、关系图谱和标签。
            </DialogDescription>
          </DialogHeader>
          {selectedPopulation && (
            <ScrollArea className="flex-1 pr-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
              <div className="pb-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">基础信息</TabsTrigger>
                  <TabsTrigger value="relation">关系图谱</TabsTrigger>
                  <TabsTrigger value="history">历史记录</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  {/* 个人概览卡片 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">个人概览</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div><Label className="text-gray-500">姓名</Label><p className="mt-1 font-medium">{selectedPopulation.name}</p></div>
                        <div><Label className="text-gray-500">性别</Label><p className="mt-1">{selectedPopulation.gender}</p></div>
                        <div><Label className="text-gray-500">年龄</Label><p className="mt-1">{selectedPopulation.age}岁</p></div>
                        <div><Label className="text-gray-500">民族</Label><p className="mt-1">{selectedPopulation.nation || '-'}</p></div>
                        <div><Label className="text-gray-500">教育程度</Label><p className="mt-1">{selectedPopulation.education || '-'}</p></div>
                        <div>
                          <Label className="text-gray-500">居住类型</Label>
                          <p className="mt-1"><Badge className={getResidenceTypeBadge(selectedPopulation.type)}>{selectedPopulation.type}</Badge></p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 联系信息 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">联系信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label className="text-gray-500">身份证号</Label><p className="mt-1 font-mono text-sm">{selectedPopulation.idCard}</p></div>
                        <div><Label className="text-gray-500">电话</Label><p className="mt-1">{selectedPopulation.phone}</p></div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 居住信息 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">居住信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-gray-500">所属区域</Label>
                          <p className="mt-1">{selectedPopulation.district || '-'} / {selectedPopulation.street || '-'} / {selectedPopulation.community || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500">详细地址</Label>
                          <p className="mt-1">{selectedPopulation.address}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 标签信息 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">人员标签</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 flex-wrap">
                        {getPopulationTags(selectedPopulation.tags).length > 0 ? (
                          getPopulationTags(selectedPopulation.tags).map((tag: any) => (
                            <Badge key={tag.id} variant="outline" className="text-sm">{tag.name}</Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">暂无人员标签</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="w-4 h-4 text-amber-600" />
                          风险摘要
                        </CardTitle>
                        <CardDescription>基于当前对象字段、标签和历史走访生成</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              selectedPopulation.risk === "High"
                                ? "bg-red-100 text-red-700"
                                : selectedPopulation.risk === "Medium"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                            }
                          >
                            {selectedPopulation.risk}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            最近走访：{getLastVisitDate(selectedPopulationVisits) ?? "暂无记录"}
                          </span>
                        </div>
                        <p className="text-sm leading-6 text-gray-700">{selectedRiskSummary}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          推荐动作
                        </CardTitle>
                        <CardDescription>为数据画像智能体预留的业务嵌入位</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedRecommendedActions.map((action, index) => (
                            <div key={index} className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                              {action}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 详细信息 */}
                  {(selectedPopulation.birthDate || selectedPopulation.birthplace || selectedPopulation.maritalStatus ||
                    selectedPopulation.religion || selectedPopulation.politicalStatus || selectedPopulation.militaryService !== undefined ||
                    selectedPopulation.graduationInfo || selectedPopulation.workplace || selectedPopulation.communityVolunteer !== undefined ||
                    selectedPopulation.skills || selectedPopulation.pets) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          详细信息
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          {selectedPopulation.birthDate && (
                            <div><Label className="text-gray-500">出生年月</Label><p className="mt-1">{selectedPopulation.birthDate}</p></div>
                          )}
                          {selectedPopulation.birthplace && (
                            <div><Label className="text-gray-500">籍贯</Label><p className="mt-1">{selectedPopulation.birthplace}</p></div>
                          )}
                          {selectedPopulation.maritalStatus && (
                            <div><Label className="text-gray-500">婚姻状况</Label><p className="mt-1">{selectedPopulation.maritalStatus}</p></div>
                          )}
                          {selectedPopulation.religion && (
                            <div><Label className="text-gray-500">宗教信仰</Label><p className="mt-1">{selectedPopulation.religion}</p></div>
                          )}
                          {selectedPopulation.politicalStatus && (
                            <div><Label className="text-gray-500">政治面貌</Label><p className="mt-1">{selectedPopulation.politicalStatus}</p></div>
                          )}
                          {selectedPopulation.militaryService !== undefined && (
                            <div><Label className="text-gray-500">服役情况</Label><p className="mt-1">{selectedPopulation.militaryService ? '是' : '否'}</p></div>
                          )}
                          {selectedPopulation.graduationInfo && (
                            <div className="col-span-2"><Label className="text-gray-500">毕业院校及专业</Label><p className="mt-1">{selectedPopulation.graduationInfo}</p></div>
                          )}
                          {selectedPopulation.workplace && (
                            <div className="col-span-2"><Label className="text-gray-500">工作单位</Label><p className="mt-1">{selectedPopulation.workplace}</p></div>
                          )}
                          {selectedPopulation.communityVolunteer !== undefined && (
                            <div><Label className="text-gray-500">社区志愿者</Label><p className="mt-1">{selectedPopulation.communityVolunteer ? '是' : '否'}</p></div>
                          )}
                          {selectedPopulation.skills && (
                            <div className="col-span-2"><Label className="text-gray-500">技能特长</Label><p className="mt-1">{selectedPopulation.skills}</p></div>
                          )}
                          {selectedPopulation.pets && (
                            <div><Label className="text-gray-500">宠物情况</Label><p className="mt-1">{selectedPopulation.pets}</p></div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 重点关爱标签 */}
                  {selectedPopulation.careLabels && selectedPopulation.careLabels.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          重点关爱标签
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2 flex-wrap">
                          {selectedPopulation.careLabels.map((label, idx) => (
                            <Badge key={idx} variant="secondary" className="text-sm bg-orange-100 text-orange-800">{label}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 人员类别标签 */}
                  {selectedPopulation.categoryLabels && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          人员类别标签
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedPopulation.categoryLabels.isFloorLeader && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-50">楼长</Badge>
                            </div>
                          )}
                          {selectedPopulation.categoryLabels.isUnitLeader && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-50">单元长</Badge>
                            </div>
                          )}
                          {selectedPopulation.categoryLabels.isAssistant && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-50">网格助理</Badge>
                            </div>
                          )}
                          {selectedPopulation.categoryLabels.focusType && selectedPopulation.categoryLabels.focusType.length > 0 && (
                            <div>
                              <Label className="text-gray-500">重点关注类型</Label>
                              <div className="flex gap-2 flex-wrap mt-2">
                                {selectedPopulation.categoryLabels.focusType.map((type, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-sm bg-red-100 text-red-800">{type}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 个人经历 */}
                  {selectedPopulation.biography && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          个人经历
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedPopulation.biography}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* 活动参与 */}
                  {selectedPopulation.activityParticipation && (selectedPopulation.activityParticipation.activities || selectedPopulation.activityParticipation.needs) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          活动参与
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedPopulation.activityParticipation.activities && (
                            <div>
                              <Label className="text-gray-500">参与活动</Label>
                              <p className="mt-1 text-sm text-gray-700">{selectedPopulation.activityParticipation.activities}</p>
                            </div>
                          )}
                          {selectedPopulation.activityParticipation.needs && (
                            <div>
                              <Label className="text-gray-500">需求建议</Label>
                              <p className="mt-1 text-sm text-gray-700">{selectedPopulation.activityParticipation.needs}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 健康档案 */}
                  {selectedPopulation.healthRecord && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          健康档案
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedPopulation.healthRecord.hasChronic !== undefined && (
                            <div>
                              <Label className="text-gray-500">是否患慢性病</Label>
                              <p className="mt-1">{selectedPopulation.healthRecord.hasChronic ? '是' : '否'}</p>
                            </div>
                          )}
                          {selectedPopulation.healthRecord.chronicDetails && (
                            <div className="col-span-2">
                              <Label className="text-gray-500">慢性病详情</Label>
                              <p className="mt-1 text-sm text-gray-700">{selectedPopulation.healthRecord.chronicDetails}</p>
                            </div>
                          )}
                          {selectedPopulation.healthRecord.needsRegularMedicine !== undefined && (
                            <div>
                              <Label className="text-gray-500">是否需定期服药</Label>
                              <p className="mt-1">{selectedPopulation.healthRecord.needsRegularMedicine ? '是' : '否'}</p>
                            </div>
                          )}
                          {selectedPopulation.healthRecord.medicineFrequency && (
                            <div>
                              <Label className="text-gray-500">服药频率</Label>
                              <p className="mt-1">{selectedPopulation.healthRecord.medicineFrequency}</p>
                            </div>
                          )}
                          {selectedPopulation.healthRecord.medicalVisitFrequency && (
                            <div>
                              <Label className="text-gray-500">就医频率</Label>
                              <p className="mt-1">{selectedPopulation.healthRecord.medicalVisitFrequency}</p>
                            </div>
                          )}
                          {selectedPopulation.healthRecord.isSeverePatient !== undefined && (
                            <div>
                              <Label className="text-gray-500">是否重症患者</Label>
                              <p className="mt-1">{selectedPopulation.healthRecord.isSeverePatient ? '是' : '否'}</p>
                            </div>
                          )}
                          {selectedPopulation.healthRecord.isPregnant !== undefined && (
                            <div>
                              <Label className="text-gray-500">是否孕妇</Label>
                              <p className="mt-1">{selectedPopulation.healthRecord.isPregnant ? '是' : '否'}</p>
                            </div>
                          )}
                          {selectedPopulation.healthRecord.specialNotes && (
                            <div className="col-span-2">
                              <Label className="text-gray-500">特殊备注</Label>
                              <p className="mt-1 text-sm text-gray-700">{selectedPopulation.healthRecord.specialNotes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 重要事件记录 */}
                  {selectedPopulation.importantEvents && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          重要事件记录
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedPopulation.importantEvents}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="relation" className="space-y-4">
                  <>
                        {/* 同住关系 */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Home className="w-4 h-4 text-blue-600" />
                              同住关系
                              <Badge variant="secondary" className="ml-1">{selectedHousemates.length}</Badge>
                            </CardTitle>
                            <CardDescription>与{selectedPopulation.name}居住在同一房间的人员</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {selectedHousemates.length > 0 ? (
                              <div className="space-y-3">
                                {selectedHousemates.map((person) => (
                                  <div key={person.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-blue-600" />
                                      </div>
                                      <div>
                                        <p className="font-medium">{person.name}</p>
                                        <p className="text-sm text-gray-500">{person.gender} · {person.age}岁</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">{person.type}</Badge>
                                      {person.tags.slice(0, 2).map((tag: string, idx: number) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm text-center py-4">暂无同住人员</p>
                            )}
                          </CardContent>
                        </Card>

                        {/* 血缘关系 */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Heart className="w-4 h-4 text-red-600" />
                              血缘关系
                              <Badge variant="secondary" className="ml-1">{selectedFamilyMembers.length}</Badge>
                            </CardTitle>
                            <CardDescription>与{selectedPopulation.name}有血缘或婚姻关系的人员</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {selectedFamilyMembers.length > 0 ? (
                              <div className="space-y-3">
                                {selectedFamilyMembers.map((item, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                        <Heart className="w-5 h-5 text-red-600" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium">{item.person.name}</p>
                                          <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-200">
                                            {item.relationType}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-gray-500">{item.person.gender} · {item.person.age}岁 · {item.person.address}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {item.person.tags.slice(0, 2).map((tag: string, idx: number) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm text-center py-4">暂无血缘关系记录</p>
                            )}
                          </CardContent>
                        </Card>

                        {/* 关系网络图 */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Network className="w-4 h-4 text-purple-600" />
                              关系网络
                            </CardTitle>
                            <CardDescription>可视化展示人员关系网络</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="relative w-full h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                              {/* 中心节点 */}
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg px-1" style={{ fontSize: selectedPopulation.name.length > 3 ? '12px' : '18px' }}>
                                  {selectedPopulation.name}
                                </div>
                                <p className="text-center mt-1 text-xs font-medium">{selectedPopulation.name}</p>
                              </div>

                              {(() => {
                                // 合并关系数据，确保每个人只出现一次
                                const relationMap = new Map<string, { person: Population; relations: Array<{ type: 'family' | 'housemate'; label: string }> }>();
                                
                                // 添加血缘关系
                                selectedFamilyMembers.forEach((item) => {
                                  const personId = item.person.id;
                                  if (!relationMap.has(personId)) {
                                    relationMap.set(personId, {
                                      person: item.person,
                                      relations: []
                                    });
                                  }
                                  relationMap.get(personId).relations.push({
                                    type: 'family',
                                    label: item.relationType
                                  });
                                });
                                
                                // 添加同住关系
                                selectedHousemates.forEach((person) => {
                                  const personId = person.id;
                                  if (!relationMap.has(personId)) {
                                    relationMap.set(personId, {
                                      person: person,
                                      relations: []
                                    });
                                  }
                                  relationMap.get(personId).relations.push({
                                    type: 'housemate',
                                    label: '同住'
                                  });
                                });

                                const allRelations = Array.from(relationMap.values());
                                const totalNodes = Math.min(allRelations.length, 6); // 最多显示6个节点

                                return allRelations.slice(0, totalNodes).map((item: any, idx: number) => {
                                  const angle = (idx * 360 / totalNodes) * (Math.PI / 180);
                                  const radius = 90;
                                  const x = Math.cos(angle) * radius;
                                  const y = Math.sin(angle) * radius;
                                  
                                  // 确定关系类型
                                  const hasFamily = item.relations.some((r: any) => r.type === 'family');
                                  const hasHousemate = item.relations.some((r: any) => r.type === 'housemate');
                                  const isBoth = hasFamily && hasHousemate;
                                  
                                  // 确定节点颜色和连线样式
                                  let nodeColor = '';
                                  let strokeColor = '';
                                  let strokeDasharray = '';
                                  
                                  if (isBoth) {
                                    // 既有血缘又有同住：紫色
                                    nodeColor = 'bg-purple-500';
                                    strokeColor = '#a855f7';
                                    strokeDasharray = '';
                                  } else if (hasFamily) {
                                    // 只有血缘：红色虚线
                                    nodeColor = 'bg-red-500';
                                    strokeColor = '#ef4444';
                                    strokeDasharray = '4 4';
                                  } else {
                                    // 只有同住：蓝色实线
                                    nodeColor = 'bg-blue-500';
                                    strokeColor = '#3b82f6';
                                    strokeDasharray = '';
                                  }
                                  
                                  // 标签文本
                                  const familyLabel = item.relations.find((r: any) => r.type === 'family')?.label;
                                  const labelText = isBoth 
                                    ? familyLabel  // 如果既有血缘又同住，优先显示血缘关系
                                    : (familyLabel || '同住');
                                  
                                  // 根据名字长度动态调整字体大小
                                  const nameFontSize = item.person.name.length > 3 ? '10px' : '14px';
                                  
                                  return (
                                    <div key={item.person.id}>
                                      {/* 连线 */}
                                      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
                                        <line 
                                          x1="50%" 
                                          y1="50%" 
                                          x2={`calc(50% + ${x}px)`} 
                                          y2={`calc(50% + ${y}px)`} 
                                          stroke={strokeColor} 
                                          strokeWidth="2" 
                                          strokeDasharray={strokeDasharray}
                                        />
                                      </svg>
                                      {/* 节点 */}
                                      <div 
                                        className="absolute z-20"
                                        style={{
                                          left: `calc(50% + ${x}px)`,
                                          top: `calc(50% + ${y}px)`,
                                          transform: 'translate(-50%, -50%)'
                                        }}
                                      >
                                        <div className={`w-12 h-12 rounded-full ${nodeColor} flex items-center justify-center text-white font-medium shadow px-0.5`} style={{ fontSize: nameFontSize }}>
                                          {item.person.name}
                                        </div>
                                        <p className="text-center mt-1 text-xs">{labelText}</p>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-gray-600">血缘关系</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-gray-600">同住关系</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                <span className="text-gray-600">血缘+同住</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                  </>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">访问记录</CardTitle>
                      <CardDescription>最近的入户访问和服务记录</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isDetailLoading ? (
                        <p className="text-gray-500 text-sm text-center py-8">正在加载历史走访...</p>
                      ) : selectedPopulationVisits.length > 0 ? (
                        <div className="space-y-3">
                          {selectedPopulationVisits.map((visit) => (
                            <div key={visit.id} className="rounded-lg border border-gray-200 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-medium text-gray-900">{visit.visitorName}</p>
                                  <p className="text-xs text-gray-500">{visit.date}</p>
                                </div>
                                {visit.tags && visit.tags.length > 0 && (
                                  <div className="flex flex-wrap justify-end gap-1">
                                    {visit.tags.slice(0, 3).map((tag, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{visit.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-8">暂无历史记录</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
   
      {/* 新增/编辑对话框 */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => { if (!open) { setIsAddDialogOpen(false); setIsEditDialogOpen(false); setFormData({}); setRecommendedTags([]); setSelectedPersonTags([]); setExpandedSections({ detail: false, biography: false, activity: false, health: false, events: false }); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{isAddDialogOpen ? "新增人口" : "编辑人口"}</DialogTitle>
            <DialogDescription>
              {isAddDialogOpen ? "录入新的人口信息。" : "修改现有人口信息。"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          <div className="grid grid-cols-2 gap-4 py-4">
             <div><Label>姓名 *</Label><Input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
             <div>
               <Label>身份证号 *</Label>
               <Input 
                 value={formData.idCard || ""} 
                 onChange={(e) => {
                   const newId = e.target.value;
                   const extracted = extractInfoFromIdCard(newId);
                   if (extracted) {
                     setFormData({ 
                       ...formData, 
                       idCard: newId, 
                       age: extracted.age,
                       gender: extracted.gender as "男" | "女"
                     });
                   } else {
                     setFormData({ ...formData, idCard: newId });
                   }
                 }} 
               />
             </div>
             <div>
               <Label>性别</Label>
               <Select value={formData.gender || "男"} onValueChange={(val) => setFormData({ ...formData, gender: val as "男" | "女" })}>
                 <SelectTrigger><SelectValue placeholder="选择性别" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="男">男</SelectItem>
                   <SelectItem value="女">女</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div><Label>年龄</Label><Input type="number" value={formData.age || ""} onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })} /></div>
             <div>
               <Label>民族</Label>
               <Select value={formData.nation || ""} onValueChange={(val) => setFormData({ ...formData, nation: val })}>
                 <SelectTrigger><SelectValue placeholder="选择民族" /></SelectTrigger>
                 <SelectContent>
                   {['汉族', '满族', '回族', '朝鲜族', '维吾尔族', '壮族', '其他'].map(n => (
                     <SelectItem key={n} value={n}>{n}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div>
               <Label>教育程度</Label>
               <Select value={formData.education || ""} onValueChange={(val) => setFormData({ ...formData, education: val })}>
                 <SelectTrigger><SelectValue placeholder="选择学历" /></SelectTrigger>
                 <SelectContent>
                   {['小学', '初中', '高中', '大专', '本科', '研究生', '其他'].map(e => (
                     <SelectItem key={e} value={e}>{e}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div><Label>电话</Label><Input value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
             <div>
               <Label>居住类型 *</Label>
               <Select value={formData.type || "户籍"} onValueChange={(val) => setFormData({ ...formData, type: val as PersonType })}>
                 <SelectTrigger><SelectValue placeholder="选择类型" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="户籍">户籍</SelectItem>
                   <SelectItem value="流动">流动</SelectItem>
                   <SelectItem value="留守">留守</SelectItem>
                   <SelectItem value="境外">境外</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div>
               <Label>所属网格 *</Label>
               <div className="flex gap-2">
                 <Input 
                   value={getSelectedGridText()} 
                   readOnly 
                   placeholder="点击选择网格"
                   className="flex-1 cursor-pointer"
                   onClick={handleOpenGridSelect}
                 />
                 {formData.gridId && (
                   <Button 
                     type="button" 
                     variant="outline" 
                     size="icon"
                     onClick={() => setFormData({ ...formData, gridId: undefined, gridDistrict: undefined, gridStreet: undefined, gridCommunity: undefined })}
                   >
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 )}
               </div>
             </div>
             <div>
               <Label>关联房屋（可选）</Label>
               <div className="flex gap-2">
                 <Input 
                   value={getSelectedHouseText()} 
                   readOnly 
                   placeholder="点击选择房屋"
                   className="flex-1 cursor-pointer"
                   onClick={handleOpenHouseSelect}
                 />
                 {formData.houseId && (
                   <Button 
                     type="button" 
                     variant="outline" 
                     size="icon"
                     onClick={() => setFormData({ ...formData, houseId: undefined, houseCommunity: undefined, houseBuilding: undefined, houseUnit: undefined, houseRoom: undefined })}
                   >
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 )}
               </div>
             </div>
             <div className="col-span-2"><Label>详细地址</Label><Input value={formData.address || ""} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>

             {/* 详细信息折叠区 */}
             <div className="col-span-2">
               <Button
                 type="button"
                 variant="outline"
                 className="w-full justify-between"
                 onClick={() => setExpandedSections({ ...expandedSections, detail: !expandedSections.detail })}
               >
                 <span>详细信息</span>
                 {expandedSections.detail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
               </Button>
               {expandedSections.detail && (
                 <div className="grid grid-cols-2 gap-4 mt-4 p-4 border rounded-md">
                   <div><Label>出生年月</Label><Input value={formData.birthDate || ""} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} placeholder="例:1989-01" /></div>
                   <div><Label>籍贯</Label><Input value={formData.birthplace || ""} onChange={(e) => setFormData({ ...formData, birthplace: e.target.value })} /></div>
                   <div>
                     <Label>婚姻状况</Label>
                     <Select value={formData.maritalStatus || ""} onValueChange={(val) => setFormData({ ...formData, maritalStatus: val as any })}>
                       <SelectTrigger><SelectValue placeholder="选择婚姻状况" /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="未婚">未婚</SelectItem>
                         <SelectItem value="已婚">已婚</SelectItem>
                         <SelectItem value="离异">离异</SelectItem>
                         <SelectItem value="丧偶">丧偶</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div><Label>宗教信仰</Label><Input value={formData.religion || ""} onChange={(e) => setFormData({ ...formData, religion: e.target.value })} /></div>
                   <div><Label>政治面貌</Label><Input value={formData.politicalStatus || ""} onChange={(e) => setFormData({ ...formData, politicalStatus: e.target.value })} placeholder="例:中共党员" /></div>
                   <div className="flex items-center space-x-2">
                     <Checkbox
                       id="militaryService"
                       checked={formData.militaryService || false}
                       onCheckedChange={(checked) => setFormData({ ...formData, militaryService: checked as boolean })}
                     />
                     <Label htmlFor="militaryService" className="cursor-pointer">曾服役</Label>
                   </div>
                   <div className="col-span-2"><Label>毕业院校及专业</Label><Input value={formData.graduationInfo || ""} onChange={(e) => setFormData({ ...formData, graduationInfo: e.target.value })} /></div>
                   <div className="col-span-2"><Label>工作单位</Label><Input value={formData.workplace || ""} onChange={(e) => setFormData({ ...formData, workplace: e.target.value })} /></div>
                   <div className="flex items-center space-x-2">
                     <Checkbox
                       id="communityVolunteer"
                       checked={formData.communityVolunteer || false}
                       onCheckedChange={(checked) => setFormData({ ...formData, communityVolunteer: checked as boolean })}
                     />
                     <Label htmlFor="communityVolunteer" className="cursor-pointer">社区志愿者</Label>
                   </div>
                   <div><Label>技能特长</Label><Input value={formData.skills || ""} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} /></div>
                   <div><Label>宠物情况</Label><Input value={formData.pets || ""} onChange={(e) => setFormData({ ...formData, pets: e.target.value })} /></div>
                 </div>
               )}
             </div>

             {/* 个人经历折叠区 */}
             <div className="col-span-2">
               <Button
                 type="button"
                 variant="outline"
                 className="w-full justify-between"
                 onClick={() => setExpandedSections({ ...expandedSections, biography: !expandedSections.biography })}
               >
                 <span>个人经历</span>
                 {expandedSections.biography ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
               </Button>
               {expandedSections.biography && (
                 <div className="mt-4 p-4 border rounded-md">
                   <Textarea
                     value={formData.biography || ""}
                     onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                     placeholder="记录个人学习、工作经历等..."
                     rows={6}
                   />
                 </div>
               )}
             </div>

             {/* 活动参与折叠区 */}
             <div className="col-span-2">
               <Button
                 type="button"
                 variant="outline"
                 className="w-full justify-between"
                 onClick={() => setExpandedSections({ ...expandedSections, activity: !expandedSections.activity })}
               >
                 <span>活动参与</span>
                 {expandedSections.activity ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
               </Button>
               {expandedSections.activity && (
                 <div className="mt-4 p-4 border rounded-md space-y-3">
                   <div>
                     <Label>参与活动</Label>
                     <Textarea
                       value={formData.activityParticipation?.activities || ""}
                       onChange={(e) => setFormData({
                         ...formData,
                         activityParticipation: {
                           ...formData.activityParticipation,
                           activities: e.target.value
                         }
                       })}
                       placeholder="参与的社区活动、志愿服务等..."
                       rows={3}
                     />
                   </div>
                   <div>
                     <Label>需求建议</Label>
                     <Textarea
                       value={formData.activityParticipation?.needs || ""}
                       onChange={(e) => setFormData({
                         ...formData,
                         activityParticipation: {
                           ...formData.activityParticipation,
                           needs: e.target.value
                         }
                       })}
                       placeholder="对社区的需求和建议..."
                       rows={3}
                     />
                   </div>
                 </div>
               )}
             </div>

             {/* 健康档案折叠区 */}
             <div className="col-span-2">
               <Button
                 type="button"
                 variant="outline"
                 className="w-full justify-between"
                 onClick={() => setExpandedSections({ ...expandedSections, health: !expandedSections.health })}
               >
                 <span>健康档案</span>
                 {expandedSections.health ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
               </Button>
               {expandedSections.health && (
                 <div className="mt-4 p-4 border rounded-md space-y-3">
                   <div className="flex items-center space-x-2">
                     <Checkbox
                       id="hasChronic"
                       checked={formData.healthRecord?.hasChronic || false}
                       onCheckedChange={(checked) => setFormData({
                         ...formData,
                         healthRecord: {
                           ...formData.healthRecord,
                           hasChronic: checked as boolean
                         }
                       })}
                     />
                     <Label htmlFor="hasChronic" className="cursor-pointer">患有慢性病</Label>
                   </div>
                   {formData.healthRecord?.hasChronic && (
                     <div>
                       <Label>慢性病详情</Label>
                       <Input
                         value={formData.healthRecord?.chronicDetails || ""}
                         onChange={(e) => setFormData({
                           ...formData,
                           healthRecord: {
                             ...formData.healthRecord,
                             chronicDetails: e.target.value
                           }
                         })}
                         placeholder="例:高血压、糖尿病"
                       />
                     </div>
                   )}
                   <div className="flex items-center space-x-2">
                     <Checkbox
                       id="needsRegularMedicine"
                       checked={formData.healthRecord?.needsRegularMedicine || false}
                       onCheckedChange={(checked) => setFormData({
                         ...formData,
                         healthRecord: {
                           ...formData.healthRecord,
                           needsRegularMedicine: checked as boolean
                         }
                       })}
                     />
                     <Label htmlFor="needsRegularMedicine" className="cursor-pointer">需定期服药</Label>
                   </div>
                   <div><Label>服药频率</Label><Input value={formData.healthRecord?.medicineFrequency || ""} onChange={(e) => setFormData({ ...formData, healthRecord: { ...formData.healthRecord, medicineFrequency: e.target.value } })} placeholder="例:每日一次" /></div>
                   <div><Label>就医频率</Label><Input value={formData.healthRecord?.medicalVisitFrequency || ""} onChange={(e) => setFormData({ ...formData, healthRecord: { ...formData.healthRecord, medicalVisitFrequency: e.target.value } })} placeholder="例:每月一次" /></div>
                   <div className="flex items-center space-x-2">
                     <Checkbox
                       id="isSeverePatient"
                       checked={formData.healthRecord?.isSeverePatient || false}
                       onCheckedChange={(checked) => setFormData({
                         ...formData,
                         healthRecord: {
                           ...formData.healthRecord,
                           isSeverePatient: checked as boolean
                         }
                       })}
                     />
                     <Label htmlFor="isSeverePatient" className="cursor-pointer">重症患者</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <Checkbox
                       id="isPregnant"
                       checked={formData.healthRecord?.isPregnant || false}
                       onCheckedChange={(checked) => setFormData({
                         ...formData,
                         healthRecord: {
                           ...formData.healthRecord,
                           isPregnant: checked as boolean
                         }
                       })}
                     />
                     <Label htmlFor="isPregnant" className="cursor-pointer">孕妇</Label>
                   </div>
                   <div>
                     <Label>特殊备注</Label>
                     <Textarea
                       value={formData.healthRecord?.specialNotes || ""}
                       onChange={(e) => setFormData({
                         ...formData,
                         healthRecord: {
                           ...formData.healthRecord,
                           specialNotes: e.target.value
                         }
                       })}
                       placeholder="其他健康相关信息..."
                       rows={2}
                     />
                   </div>
                 </div>
               )}
             </div>

             {/* 重要事件记录折叠区 */}
             <div className="col-span-2">
               <Button
                 type="button"
                 variant="outline"
                 className="w-full justify-between"
                 onClick={() => setExpandedSections({ ...expandedSections, events: !expandedSections.events })}
               >
                 <span>重要事件记录</span>
                 {expandedSections.events ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
               </Button>
               {expandedSections.events && (
                 <div className="mt-4 p-4 border rounded-md">
                   <Textarea
                     value={formData.importantEvents || ""}
                     onChange={(e) => setFormData({ ...formData, importantEvents: e.target.value })}
                     placeholder="记录重要事件、特殊情况等..."
                     rows={4}
                   />
                 </div>
               )}
             </div>

             <div className="col-span-2">
               <Label>人员标签</Label>
               
               {/* 推荐标签区域 - 始终显示 */}
               <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-xs font-medium text-blue-900">推荐标签</span>
                   <span className="text-xs text-blue-600">
                     {recommendedTags.length > 0 ? '点击可取消选中' : '暂无推荐'}
                   </span>
                 </div>
                 <div className="flex flex-wrap gap-2 min-h-[32px]">
                   {recommendedTags.length > 0 ? (
                     recommendedTags.map((tagName, index) => {
                       const isSelected = selectedPersonTags.includes(tagName);
                       return (
                         <Badge
                           key={index}
                           variant={isSelected ? "default" : "outline"}
                           className="cursor-pointer hover:opacity-80 bg-blue-500 hover:bg-blue-600"
                           onClick={() => {
                             if (isSelected) {
                               setSelectedPersonTags(selectedPersonTags.filter(t => t !== tagName));
                             } else {
                               setSelectedPersonTags([...selectedPersonTags, tagName]);
                             }
                           }}
                         >
                           {tagName}
                         </Badge>
                       );
                     })
                   ) : (
                     <span className="text-xs text-gray-400 italic">根据填写内容自动推荐标签</span>
                   )}
                 </div>
               </div>
               
               {/* 手动添加标签区域 - 始终显示 */}
               <div className="mt-2 p-3 border rounded-md">
                 <div className="mb-2">
                   <span className="text-xs font-medium text-gray-700">手动添加</span>
                 </div>
                 <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                   {enabledTags
                     .filter(tag => !recommendedTags.includes(tag.name)) // 不显示已在推荐区的标签
                     .map(tag => {
                       const isSelected = selectedPersonTags.includes(tag.name);
                       
                       return (
                         <Badge
                           key={tag.id}
                           variant={isSelected ? "default" : "outline"}
                           className="cursor-pointer hover:opacity-80"
                           onClick={() => {
                             if (isSelected) {
                               setSelectedPersonTags(selectedPersonTags.filter(t => t !== tag.name));
                             } else {
                               setSelectedPersonTags([...selectedPersonTags, tag.name]);
                             }
                           }}
                         >
                           {tag.name}
                         </Badge>
                       );
                     })}
                 </div>
               </div>
             </div>
          </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }}>取消</Button>
            <Button onClick={() => void (isAddDialogOpen ? handleSaveAdd() : handleSaveEdit())} disabled={isSaving}>
              {isSaving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 标签管理相关对话框 */}
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>管理标签</DialogTitle>
            <DialogDescription>
              选择并管理该人员的标签。
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 py-4">
             <div className="w-full text-center text-gray-500">标签选择功能保持不变</div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isBatchTagDialogOpen} onOpenChange={setIsBatchTagDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>批量打标签</DialogTitle>
             <DialogDescription>
               为选中的人员批量添加标签。
             </DialogDescription>
           </DialogHeader>
           <div className="py-4">请选择标签...</div><DialogFooter><Button onClick={handleSaveBatchTags}>确定</Button></DialogFooter></DialogContent>
      </Dialog>

      {/* 房屋选择对话框 */}
      <Dialog open={isHouseSelectDialogOpen} onOpenChange={setIsHouseSelectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>选择房屋</DialogTitle>
            <DialogDescription>
              选择关联的房屋信息。
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>小区</Label>
              <Select 
                value={formData.houseCommunity || "none"} 
                onValueChange={(val) => {
                  if (val === "none") {
                    setFormData({ 
                      ...formData, 
                      houseCommunity: undefined,
                      houseBuilding: undefined,
                      houseUnit: undefined,
                      houseRoom: undefined,
                      houseId: undefined
                    });
                  } else {
                    setFormData({ 
                      ...formData, 
                      houseCommunity: val,
                      houseBuilding: undefined,
                      houseUnit: undefined,
                      houseRoom: undefined,
                      houseId: undefined
                    });
                  }
                }}
              >
                <SelectTrigger><SelectValue placeholder="选择小区" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无</SelectItem>
                  {getAvailableCommunities().map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.houseCommunity && formData.houseCommunity !== 'none' && (
              <>
                <div>
                  <Label>楼栋</Label>
                  <Select 
                    value={formData.houseBuilding || "placeholder"} 
                    onValueChange={(val) => {
                      setFormData({ 
                        ...formData, 
                        houseBuilding: val,
                        houseUnit: undefined,
                        houseRoom: undefined,
                        houseId: undefined
                      });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="选择楼栋" /></SelectTrigger>
                    <SelectContent>
                      {getAvailableBuildings(formData.houseCommunity).map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.houseBuilding && (
                  <div>
                    <Label>单元</Label>
                    <Select 
                      value={formData.houseUnit || "placeholder"} 
                      onValueChange={(val) => {
                        setFormData({ 
                          ...formData, 
                          houseUnit: val,
                          houseRoom: undefined,
                          houseId: undefined
                        });
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="选择单元" /></SelectTrigger>
                      <SelectContent>
                        {getAvailableUnits(formData.houseCommunity, formData.houseBuilding).map(u => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.houseUnit && (
                  <div>
                    <Label>房号</Label>
                    <Select 
                      value={formData.houseRoom || "placeholder"} 
                      onValueChange={(val) => {
                        const houseId = findHouseId(formData.houseCommunity!, formData.houseBuilding!, formData.houseUnit!, val);
                        setFormData({ 
                          ...formData, 
                          houseRoom: val,
                          houseId
                        });
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="选择房号" /></SelectTrigger>
                      <SelectContent>
                        {getAvailableRooms(formData.houseCommunity || '', formData.houseBuilding || '', formData.houseUnit || '').map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClearHouseSelect}>清除选择</Button>
            <Button onClick={handleConfirmHouseSelect}>确认选择</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 网格选择对话框 */}
      <Dialog open={isGridSelectDialogOpen} onOpenChange={setIsGridSelectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>选择网格</DialogTitle>
            <DialogDescription>
              按行政层级选择所属网格。
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>区县 *</Label>
              <Select 
                value={formData.gridDistrict || "placeholder"} 
                onValueChange={(val) => {
                  setFormData({ 
                    ...formData, 
                    gridDistrict: val,
                    gridStreet: undefined,
                    gridCommunity: undefined,
                    gridId: undefined
                  });
                }}
              >
                <SelectTrigger><SelectValue placeholder="选择区县" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(REGIONS).map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.gridDistrict && (
              <div>
                <Label>乡镇街道 *</Label>
                <Select 
                  value={formData.gridStreet || "placeholder"} 
                  onValueChange={(val) => {
                    setFormData({ 
                      ...formData, 
                      gridStreet: val,
                      gridCommunity: undefined,
                      gridId: undefined
                    });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="选择街道" /></SelectTrigger>
                  <SelectContent>
                    {getStreets(formData.gridDistrict).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {formData.gridStreet && (
              <div>
                <Label>社区 *</Label>
                <Select 
                  value={formData.gridCommunity || "placeholder"} 
                  onValueChange={(val) => {
                    setFormData({ 
                      ...formData, 
                      gridCommunity: val,
                      gridId: undefined
                    });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="选择社区" /></SelectTrigger>
                  <SelectContent>
                    {getCommunities(formData.gridDistrict!, formData.gridStreet).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {formData.gridCommunity && (
              <div>
                <Label>网格 *</Label>
                <Select 
                  value={formData.gridId || "placeholder"} 
                  onValueChange={(val) => {
                    setFormData({ 
                      ...formData, 
                      gridId: val
                    });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="选择网格" /></SelectTrigger>
                  <SelectContent>
                    {getAvailableGrids(formData.gridDistrict, formData.gridStreet, formData.gridCommunity).map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClearGridSelect}>清除选择</Button>
            <Button onClick={handleConfirmGridSelect}>确认选择</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
