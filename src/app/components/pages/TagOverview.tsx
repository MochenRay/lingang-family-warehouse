import { useState } from 'react';
import {
  Search, Plus, Filter, Eye, Edit, Trash2, Power, Users, Tag, TrendingUp,
  Save, AlertCircle, Sparkles, Sliders, History, MapPin, Calendar, Download,
  CheckCircle2, FileText
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { db } from '../../services/db';
import type { Person as DBPerson } from '../../types/core';

// --- 类型定义 ---

interface TagItem {
  id: string;
  name: string;
  type: '规则标签' | '智能标签';
  judgmentCriteria?: string;
  category: string;
  coverageCount: number;
  status: '启用' | '禁用';
  createTime: string;
  updateTime: string;
  creator: string;
  description: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  rules?: string[];
}

interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface VersionHistory {
  version: number;
  updateTime: string;
  operator: string;
  changes: string[];
  coverageCount: number;
}

interface CoveredPerson {
  id: string;
  name: string;
  idCard: string;
  gender: '男' | '女';
  age: number;
  phone: string;
  address: string;
  matchReason: string[];
}

// 种子人员接口（用于智能标签）
interface SeedPerson {
  id: string;
  name: string;
  idCard: string;
  gender: '男' | '女';
  age: number;
  phone: string;
  address: string;
  district: string;
  street: string;
  community: string;
  livingType: string; // 居住类型
  healthStatus: string; // 健康状况
  employmentStatus: string; // 就业状况
  education: string; // 教育程度
  householdSize: number; // 同住人数
}

// 智能分析特征结果
interface AnalyzedFeature {
  field: string;
  label: string;
  value: string;
  similarity: number; // 相似度 0-100
  selected: boolean;
}

// --- Mock Data ---

const mockTags: TagItem[] = [
  // High Risk
  {
    id: '101',
    name: '吸毒人员',
    type: '规则标签',
    category: '重点关注',
    coverageCount: 12,
    status: '启用',
    createTime: '2025-12-20 10:00:00',
    updateTime: '2025-12-25 14:30:00',
    creator: '张管理员',
    description: '在册吸毒人员',
    riskLevel: 'High',
    rules: []
  },
  {
    id: '102',
    name: '刑满释放',
    type: '规则标签',
    category: '重点关注',
    coverageCount: 8,
    status: '启用',
    createTime: '2025-12-22 09:30:00',
    updateTime: '2025-12-28 11:20:00',
    creator: '李管理员',
    description: '刑满释放不满5年人员',
    riskLevel: 'High',
    rules: []
  },
  {
    id: '103',
    name: '严重精神障碍',
    type: '规则标签',
    category: '健康状况',
    coverageCount: 15,
    status: '启用',
    createTime: '2025-12-18 15:45:00',
    updateTime: '2026-01-05 09:15:00',
    creator: '王管理员',
    description: '确诊严重精神障碍患者',
    riskLevel: 'High',
    rules: []
  },
  {
    id: '104',
    name: '重点上访',
    type: '规则标签',
    category: '重点关注',
    coverageCount: 5,
    status: '启用',
    createTime: '2025-12-15 11:20:00',
    updateTime: '2026-01-02 16:40:00',
    creator: '张管理员',
    description: '频繁上访人员',
    riskLevel: 'High',
    rules: []
  },
  {
    id: '105',
    name: '社区矫正',
    type: '规则标签',
    category: '重点关注',
    coverageCount: 3,
    status: '启用',
    createTime: '2025-12-25 13:00:00',
    updateTime: '2026-01-08 10:25:00',
    creator: '李管理员',
    description: '正在接受社区矫正人员',
    riskLevel: 'High',
    rules: []
  },

  // Medium Risk
  {
    id: '201',
    name: '空巢老人',
    type: '规则标签',
    category: '居住情况',
    coverageCount: 45,
    status: '启用',
    createTime: '2025-12-20 10:00:00',
    updateTime: '2025-12-25 14:30:00',
    creator: '张管理员',
    description: '子女不在身边的老年人',
    riskLevel: 'Medium',
    rules: ['年龄 >= 60', '同住人数 <= 2']
  },
  {
    id: '202',
    name: '独居老人',
    type: '规则标签',
    category: '居住情况',
    coverageCount: 32,
    status: '启用',
    createTime: '2025-12-22 09:30:00',
    updateTime: '2025-12-28 11:20:00',
    creator: '李管理员',
    description: '独自居住的老年人',
    riskLevel: 'Medium',
    rules: ['年龄 >= 60', '同住人数 = 1']
  },
  {
    id: '203',
    name: '残疾人',
    type: '规则标签',
    category: '健康状况',
    coverageCount: 28,
    status: '启用',
    createTime: '2025-12-18 15:45:00',
    updateTime: '2026-01-05 09:15:00',
    creator: '王管理员',
    description: '持有残疾证人员',
    riskLevel: 'Medium',
    rules: ['残疾证 = 是']
  },
  {
    id: '204',
    name: '低保户',
    type: '规则标签',
    category: '社会保障',
    coverageCount: 19,
    status: '启用',
    createTime: '2025-12-15 11:20:00',
    updateTime: '2026-01-02 16:40:00',
    creator: '张管理员',
    description: '享受低保待遇家庭',
    riskLevel: 'Medium',
    rules: []
  },
  {
    id: '205',
    name: '失业人员',
    type: '规则标签',
    category: '就业状况',
    coverageCount: 56,
    status: '启用',
    createTime: '2025-12-25 13:00:00',
    updateTime: '2026-01-08 10:25:00',
    creator: '李管理员',
    description: '登记失业人员',
    riskLevel: 'Medium',
    rules: ['就业状态 = 失业']
  },
  {
    id: '206',
    name: '群租人员',
    type: '规则标签',
    category: '居住情况',
    coverageCount: 88,
    status: '启用',
    createTime: '2025-12-25 13:00:00',
    updateTime: '2026-01-08 10:25:00',
    creator: '李管理员',
    description: '居住在群租房内的人员',
    riskLevel: 'Medium',
    rules: []
  },

  // Low Risk / Normal
  {
    id: '301',
    name: '党员',
    type: '规则标签',
    category: '政治面貌',
    coverageCount: 120,
    status: '启用',
    createTime: '2025-12-20 10:00:00',
    updateTime: '2025-12-25 14:30:00',
    creator: '张管理员',
    description: '中国共产党党员',
    riskLevel: 'Low',
    rules: []
  },
  {
    id: '302',
    name: '退役军人',
    type: '规则标签',
    category: '政治面貌',
    coverageCount: 45,
    status: '启用',
    createTime: '2025-12-22 09:30:00',
    updateTime: '2025-12-28 11:20:00',
    creator: '李管理员',
    description: '退出现役的军人',
    riskLevel: 'Low',
    rules: []
  },
  {
    id: '303',
    name: '志愿者',
    type: '规则标签',
    category: '社会活动',
    coverageCount: 60,
    status: '启用',
    createTime: '2025-12-18 15:45:00',
    updateTime: '2026-01-05 09:15:00',
    creator: '王管理员',
    description: '注册社区志愿者',
    riskLevel: 'Low',
    rules: []
  },
  {
    id: '304',
    name: '学龄儿童',
    type: '规则标签',
    category: '年龄段',
    coverageCount: 85,
    status: '启用',
    createTime: '2025-12-15 11:20:00',
    updateTime: '2026-01-02 16:40:00',
    creator: '张管理员',
    description: '6-14岁儿童',
    riskLevel: 'Low',
    rules: ['年龄 >= 6', '年龄 <= 14']
  },
  {
    id: '305',
    name: '育龄妇女',
    type: '规则标签',
    category: '性别',
    coverageCount: 110,
    status: '启用',
    createTime: '2025-12-25 13:00:00',
    updateTime: '2026-01-08 10:25:00',
    creator: '李管理员',
    description: '15-49岁女性',
    riskLevel: 'Low',
    rules: ['性别 = 女', '年龄 >= 15', '年龄 <= 49']
  },
  {
    id: '306',
    name: '老年人',
    type: '规则标签',
    category: '年龄段',
    coverageCount: 150,
    status: '启用',
    createTime: '2025-12-25 13:00:00',
    updateTime: '2026-01-08 10:25:00',
    creator: '李管理员',
    description: '60岁以上人员',
    riskLevel: 'Low',
    rules: ['年龄 >= 60']
  },
  {
    id: '307',
    name: '流动人口',
    type: '规则标签',
    category: '居住类型',
    coverageCount: 200,
    status: '启用',
    createTime: '2025-12-25 13:00:00',
    updateTime: '2026-01-08 10:25:00',
    creator: '李管理员',
    description: '非本地户籍常住人口',
    riskLevel: 'Low',
    rules: ['居住类型 = 流动']
  },

  // === 智能标签 ===
  // --- 性格特点 ---
  { id: '401', name: '暴躁易怒', type: '智能标签', category: '性格特点', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '情绪容易激动，与他人发生冲突的倾向较高', riskLevel: 'Medium', judgmentCriteria: '走访或纠纷记录中出现争吵、吵架、动手、打人、摔东西、情绪激动、发脾气、骂人等描述' },
  { id: '402', name: '热心助人', type: '智能标签', category: '性格特点', coverageCount: 8, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '乐于助人，积极参与社区公共事务', riskLevel: 'Low', judgmentCriteria: '记录中提及主动帮助邻居、帮忙照看、热心肠、积极参与、志愿服务、义务劳动等' },
  { id: '407', name: '内向孤僻', type: '智能标签', category: '性格特点', coverageCount: 4, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '性格内向，不善社交，与外界接触少', riskLevel: 'Low', judgmentCriteria: '记录中提及不出门、不社交、不参加活动、独来独往、话少、封闭等描述' },
  { id: '409', name: '爱占小便宜', type: '智能标签', category: '性格特点', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '喜欢争抢公共资源或占便宜', riskLevel: 'Low', judgmentCriteria: '记录中提及占公共资源、多拿多占、贪小便宜、争抢、计较得失等描述' },
  { id: '410', name: '固执己见', type: '智能标签', category: '性格特点', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '调解中坚持己见，不易妥协', riskLevel: 'Low', judgmentCriteria: '调解记录中出现拒绝妥协、坚持己见、不接受建议、态度强硬、不让步等描述' },
  { id: '411', name: '乐观开朗', type: '智能标签', category: '性格特点', coverageCount: 5, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '性格积极乐观，感染力强', riskLevel: 'Low', judgmentCriteria: '走访中态度积极、爱说笑、精神状态好、感染力强、开朗健谈等描述' },
  { id: '412', name: '多疑敏感', type: '智能标签', category: '性格特点', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '对周围环境警惕，容易产生怀疑', riskLevel: 'Low', judgmentCriteria: '记录中提及频繁投诉、怀疑邻居、对周围警惕、疑心重、反复确认等描述' },
  { id: '413', name: '好面子', type: '智能标签', category: '性格特点', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '在意外人看法，不愿公开暴露问题', riskLevel: 'Low', judgmentCriteria: '调解中在意面子、不愿公开问题、怕丢人、要求保密、顾及形象等描述' },
  { id: '414', name: '爱抱怨', type: '智能标签', category: '性格特点', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '走访中频繁表达不满', riskLevel: 'Low', judgmentCriteria: '走访中频繁抱怨、表达不满、牢骚多、负面情绪、诉苦等描述' },
  { id: '415', name: '脾气温和', type: '智能标签', category: '性格特点', coverageCount: 6, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '即使有矛盾也态度平和', riskLevel: 'Low', judgmentCriteria: '走访或调解中态度平和、愿意沟通、好说话、通情达理、不计较等描述' },
  // --- 生活习惯 ---
  { id: '403', name: '喜欢遛狗', type: '智能标签', category: '生活习惯', coverageCount: 5, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '日常有遛狗习惯', riskLevel: 'Low', judgmentCriteria: '记录中提及遛狗、养狗、养犬、犬只、宠物狗、牵狗等内容' },
  { id: '405', name: '喜欢抽烟', type: '智能标签', category: '生活习惯', coverageCount: 6, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '有日常吸烟习惯', riskLevel: 'Low', judgmentCriteria: '记录中提及抽烟、吸烟、烟味、烟蒂、烟头等内容' },
  { id: '406', name: '早起锻炼', type: '智能标签', category: '生活习惯', coverageCount: 12, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '有早起锻炼身体的习惯', riskLevel: 'Low', judgmentCriteria: '记录中提及早起、晨练、跑步、太极拳、健身等内容' },
  { id: '416', name: '广场舞爱好者', type: '智能标签', category: '生活习惯', coverageCount: 8, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '经常参与广场舞活动', riskLevel: 'Low', judgmentCriteria: '记录中提及跳广场舞、跳舞、音响、舞蹈队、排练等内容' },
  { id: '417', name: '喜欢种菜种花', type: '智能标签', category: '生活习惯', coverageCount: 4, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '有种植花草蔬菜的爱好', riskLevel: 'Low', judgmentCriteria: '记录中提及种菜、种花、花盆、阳台种植、绿化带种植等内容' },
  { id: '418', name: '喜欢打牌下棋', type: '智能标签', category: '生活习惯', coverageCount: 7, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '日常有棋牌娱乐习惯', riskLevel: 'Low', judgmentCriteria: '记录中提及打牌、下棋、麻将、扑克、象棋、围棋、棋牌室等内容' },
  { id: '419', name: '夜间活动多', type: '智能标签', category: '生活习惯', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '深夜活动频繁，作息不规律', riskLevel: 'Low', judgmentCriteria: '记录中提及深夜活动、晚归、夜间噪音、半夜、凌晨等内容' },
  { id: '420', name: '酗酒', type: '智能标签', category: '生活习惯', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '有过度饮酒行为', riskLevel: 'Medium', judgmentCriteria: '记录中提及醉酒、喝多了、饮酒过量、酒后闹事、酗酒等内容' },
  { id: '421', name: '囤积杂物', type: '智能标签', category: '生活习惯', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '家中或楼道堆放大量杂物', riskLevel: 'Low', judgmentCriteria: '走访中发现屋内堆满杂物、楼道堆物、收废品、囤积、凌乱不堪等描述' },
  { id: '422', name: '爱养宠物', type: '智能标签', category: '生活习惯', coverageCount: 4, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '饲养宠物（猫、鸟等）', riskLevel: 'Low', judgmentCriteria: '记录中提及养猫、养鸟、宠物、猫粮、鸟笼等内容' },
  { id: '423', name: '作息规律', type: '智能标签', category: '生活习惯', coverageCount: 5, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '生活自律，早睡早起', riskLevel: 'Low', judgmentCriteria: '走访中体现早睡早起、作息规律、生活自律、按时吃饭等描述' },
  // --- 社交特征 ---
  { id: '404', name: '邻里关系差', type: '智能标签', category: '社交特征', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '与邻居关系紧张，频繁产生矛盾', riskLevel: 'Medium', judgmentCriteria: '多次出现与邻居产生矛盾、投诉邻居、被邻居投诉、邻里纠纷、不和睦等描述' },
  { id: '424', name: '邻里关系好', type: '智能标签', category: '社交特征', coverageCount: 6, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '与邻居关系融洽', riskLevel: 'Low', judgmentCriteria: '记录中提及互帮互助、邻居关系好、关系融洽、邻里和睦等描述' },
  { id: '425', name: '社区活跃分子', type: '智能标签', category: '社交特征', coverageCount: 5, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '积极参与社区活动和公共事务', riskLevel: 'Low', judgmentCriteria: '记录中提及积极参与社区活动、业委会、议事会、组织活动、带头参加等描述' },
  { id: '426', name: '不合群', type: '智能标签', category: '社交特征', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '不愿参与集体活动', riskLevel: 'Low', judgmentCriteria: '记录中提及拒绝参与活动、不合群、与周围人缺乏往来、不参加等描述' },
  { id: '427', name: '爱管闲事', type: '智能标签', category: '社交特征', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '喜欢参与他人事务', riskLevel: 'Low', judgmentCriteria: '记录中提及频繁反映他人问题、主动干预别人家事、爱管闲事、多管闲事等描述' },
  { id: '428', name: '影响力大', type: '智能标签', category: '社交特征', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '在邻里中有号召力', riskLevel: 'Low', judgmentCriteria: '记录中提及有号召力、说话有分量、大家都听他的、带头作用、意见领袖等描述' },
  { id: '429', name: '爱串门', type: '智能标签', category: '社交特征', coverageCount: 4, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '社交频繁，经常走访邻居', riskLevel: 'Low', judgmentCriteria: '走访中经常在邻居家、串门、社交频繁、到处聊天等描述' },
  { id: '430', name: '经常与人起冲突', type: '智能标签', category: '社交特征', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '多次出现在纠纷记录中', riskLevel: 'Medium', judgmentCriteria: '多次出现在纠纷记录中作为当事方、频繁发生冲突、与多人产生矛盾等描述' },
  { id: '431', name: '喜欢拉帮结派', type: '智能标签', category: '社交特征', coverageCount: 1, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '在矛盾中组织人员施压', riskLevel: 'Medium', judgmentCriteria: '矛盾中组织其他居民施压、拉帮结派、串联、联名投诉等描述' },
  // --- 家庭状况 ---
  { id: '408', name: '亲子关系紧张', type: '智能标签', category: '家庭状况', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '与子女关系不和，存在家庭矛盾', riskLevel: 'Medium', judgmentCriteria: '记录中提及子女不探望、不赡养、亲子矛盾、和孩子吵、子女不管等描述' },
  { id: '432', name: '夫妻关系紧张', type: '智能标签', category: '家庭状况', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '夫妻之间存在矛盾', riskLevel: 'Medium', judgmentCriteria: '记录中提及夫妻争吵、冷战、分居、闹离婚、家庭不和等描述' },
  { id: '433', name: '婆媳关系差', type: '智能标签', category: '家庭状况', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '婆媳之间关系紧张', riskLevel: 'Medium', judgmentCriteria: '记录中提及婆媳矛盾、婆媳不和、婆婆和媳妇吵架、家庭纠纷涉及婆媳等描述' },
  { id: '434', name: '家庭和睦', type: '智能标签', category: '家庭状况', coverageCount: 8, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '家庭关系和谐融洽', riskLevel: 'Low', judgmentCriteria: '走访中家庭氛围好、关系融洽、一家人和和气气、家庭幸福等描述' },
  { id: '435', name: '子女不在身边', type: '智能标签', category: '家庭状况', coverageCount: 5, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '子女在外地工作或定居', riskLevel: 'Low', judgmentCriteria: '记录中提及子女外地工作、子女不在身边、缺少照料、孩子不在家等描述' },
  { id: '436', name: '家庭经济困难', type: '智能标签', category: '家庭状况', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '家庭经济压力较大', riskLevel: 'Medium', judgmentCriteria: '走访中反映经济压力大、需要救助、生活困难、缺钱看病等描述' },
  { id: '437', name: '家有病患', type: '智能标签', category: '家庭状况', coverageCount: 4, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '家中有需要长期照护的病患', riskLevel: 'Medium', judgmentCriteria: '记录中提及家人卧床、长期照护、陪护病人、家有病患等描述' },
  { id: '438', name: '单亲家庭', type: '智能标签', category: '家庭状况', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '独自抚养子女', riskLevel: 'Low', judgmentCriteria: '记录中提及单亲、独自带孩子、离异带娃、一个人养孩子等描述' },
  { id: '439', name: '隔代抚养', type: '智能标签', category: '家庭状况', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-15 14:30:00', creator: '系统', description: '老人带孙辈，父母不在身边', riskLevel: 'Low', judgmentCriteria: '记录中提及老人带孙子、隔代抚养、爷爷奶奶带、父母外出打工等描述' }
];

const mockCoveredPersons: CoveredPerson[] = [
  {
    id: '1',
    name: '孙七',
    idCard: '370000196505052222',
    gender: '男',
    age: 60,
    phone: '13500135000',
    address: '威海市环翠区竹岛街道A区1号楼2单元203',
    matchReason: ['年龄 = 60岁', '状态 = 正常']
  },
  {
    id: '2',
    name: '李奶奶',
    idCard: '370000195808123456',
    gender: '女',
    age: 67,
    phone: '13600136000',
    address: '威海市环翠区竹岛街道B区3号楼1单元101',
    matchReason: ['年龄 = 67岁', '状态 = 正常']
  },
];

const mockVersionHistory: VersionHistory[] = [
  {
    version: 3,
    updateTime: '2025-12-25 14:30:00',
    operator: '张管理员',
    changes: ['修改规则：年龄 >= 60 岁'],
    coverageCount: 2340
  },
  {
    version: 2,
    updateTime: '2025-12-22 09:20:00',
    operator: '李管理员',
    changes: ['修改描述信息', '调整分类为：年龄段'],
    coverageCount: 2285
  },
];

// 种子人员库（用于智能标签选择）
const mockSeedPersons: SeedPerson[] = [
  {
    id: 'P001',
    name: '张大爷',
    idCard: '370000195603121234',
    gender: '男',
    age: 68,
    phone: '13800138001',
    address: '威海市环翠区竹岛街道A区1号楼2单元203',
    district: '环翠区',
    street: '竹岛街道',
    community: 'A社区',
    livingType: '独居',
    healthStatus: '慢性病-糖尿病',
    employmentStatus: '退休',
    education: '初中',
    householdSize: 1
  },
  {
    id: 'P002',
    name: '李奶奶',
    idCard: '370000195408201234',
    gender: '女',
    age: 70,
    phone: '13800138002',
    address: '威海市环翠区竹岛街道B区3号楼1单元101',
    district: '环翠区',
    street: '竹岛街道',
    community: 'B社区',
    livingType: '独居',
    healthStatus: '慢性病-高血压',
    employmentStatus: '退休',
    education: '小学',
    householdSize: 1
  },
  {
    id: 'P003',
    name: '王大爷',
    idCard: '370000195609151234',
    gender: '男',
    age: 68,
    phone: '13800138003',
    address: '威海市环翠区竹岛街道A区5号楼3单元502',
    district: '环翠区',
    street: '竹岛街道',
    community: 'A社区',
    livingType: '独居',
    healthStatus: '慢性病-冠心病',
    employmentStatus: '退休',
    education: '高中',
    householdSize: 1
  },
  {
    id: 'P004',
    name: '赵奶奶',
    idCard: '370000195205101234',
    gender: '女',
    age: 72,
    phone: '13800138004',
    address: '威海市环翠区竹岛街道C区2号楼4单元301',
    district: '环翠区',
    street: '竹岛街道',
    community: 'C社区',
    livingType: '独居',
    healthStatus: '慢性病-高血压',
    employmentStatus: '退休',
    education: '小学',
    householdSize: 1
  },
  {
    id: 'P005',
    name: '钱女士',
    idCard: '370000198505201234',
    gender: '女',
    age: 39,
    phone: '13800138005',
    address: '威海市环翠区竹岛街道D区8号楼2单元601',
    district: '环翠区',
    street: '竹岛街道',
    community: 'D社区',
    livingType: '家庭',
    healthStatus: '正常',
    employmentStatus: '在职',
    education: '大学',
    householdSize: 3
  },
  {
    id: 'P006',
    name: '孙先生',
    idCard: '370000198203151234',
    gender: '男',
    age: 42,
    phone: '13800138006',
    address: '威海市环翠区竹岛街道E区10号楼1单元401',
    district: '环翠区',
    street: '竹岛街道',
    community: 'E社区',
    livingType: '家庭',
    healthStatus: '正常',
    employmentStatus: '在职',
    education: '大学',
    householdSize: 4
  },
  {
    id: 'P007',
    name: '周大爷',
    idCard: '370000195801121234',
    gender: '男',
    age: 66,
    phone: '13800138007',
    address: '威海市环翠区竹岛街道F区6号楼3单元201',
    district: '环翠区',
    street: '竹岛街道',
    community: 'F社区',
    livingType: '空巢',
    healthStatus: '慢性病-糖尿病',
    employmentStatus: '退休',
    education: '初中',
    householdSize: 2
  },
  {
    id: 'P008',
    name: '吴奶奶',
    idCard: '370000195606081234',
    gender: '女',
    age: 68,
    phone: '13800138008',
    address: '威海市环翠区竹岛街道G区12号楼2单元503',
    district: '环翠区',
    street: '竹岛街道',
    community: 'G社区',
    livingType: '独居',
    healthStatus: '慢性病-关节炎',
    employmentStatus: '退休',
    education: '初中',
    householdSize: 1
  }
];

const CATEGORIES = [
  '年龄段', '职业', '收入水平', '教育程度', '健康状况', 
  '社会保障', '就业状况', '居住类型', '重点关注', '其他'
];

const FIELDS = [
  { value: 'name', label: '姓名' },
  { value: 'gender', label: '性别' },
  { value: 'age', label: '年龄' },
  { value: 'idCard', label: '身份证号' },
  { value: 'nation', label: '民族' },
  { value: 'education', label: '教育程度' },
  { value: 'phone', label: '电话' },
  { value: 'address', label: '详细地址' },
  { value: 'type', label: '居住类型' },
  { value: 'status', label: '状态' },
  { value: 'district', label: '区县' },
  { value: 'street', label: '街道' },
  { value: 'community', label: '社区' },
  { value: 'risk', label: '风险等级' },
  { value: 'tags', label: '标签' }
];

const OPERATORS = [
  { value: '=', label: '等于' },
  { value: '!=', label: '不等于' },
  { value: '>', label: '大于' },
  { value: '>=', label: '大于等于' },
  { value: '<', label: '小于' },
  { value: '<=', label: '小于等于' },
  { value: 'contains', label: '包含' },
  { value: 'startsWith', label: '开头是' }
];

export function TagOverview() {
  // --- Main List State ---
  const [tags, setTags] = useState<TagItem[]>(mockTags);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);

  // --- Dialog States ---
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // --- Form States (Create/Edit) ---
  const [formTagType, setFormTagType] = useState<'规则标签' | '智能标签'>('规则标签');
  const [formTagName, setFormTagName] = useState('');
  const [formTagCategory, setFormTagCategory] = useState('');
  const [formRiskLevel, setFormRiskLevel] = useState<'High' | 'Medium' | 'Low'>('Low');
  const [formTagDescription, setFormTagDescription] = useState('');
  const [formTagStatus, setFormTagStatus] = useState<'启用' | '禁用'>('启用');
  const [formJudgmentCriteria, setFormJudgmentCriteria] = useState('');
  const [formRules, setFormRules] = useState<RuleCondition[]>([{ id: '1', field: '', operator: '', value: '' }]);
  const [estimatedCoverage, setEstimatedCoverage] = useState<number | null>(null);
  const [matchedPeople, setMatchedPeople] = useState<DBPerson[]>([]);
  const [showMatchedList, setShowMatchedList] = useState(false);

  // --- 规则标签创建模式 ---
  const [ruleCreateMode, setRuleCreateMode] = useState<'struct' | 'text' | 'person'>('struct');

  // --- 智能标签相关状态 ---
  const [smartTagMode, setSmartTagMode] = useState<'text' | 'person'>('text'); // 分析模式：text=文本分析，person=居民选择分析
  const [textInput, setTextInput] = useState(''); // 文本分析输入
  const [textAnalysisResult, setTextAnalysisResult] = useState<Array<{field: string; label: string; operator: string; value: string; confidence: number; reason: string; selected: boolean}>>([]);  // 文本分析结果（条件集）
  const [selectedSeedPersons, setSelectedSeedPersons] = useState<string[]>([]); // 选中的种子人员ID
  const [analyzedFeatures, setAnalyzedFeatures] = useState<AnalyzedFeature[]>([]); // 分析结果
  const [isAnalyzing, setIsAnalyzing] = useState(false); // 分析中
  const [seedPersonSearch, setSeedPersonSearch] = useState(''); // 种子人员搜索
  const [dbPeople, setDbPeople] = useState<DBPerson[]>([]);
  const [isGeneratingCriteria, setIsGeneratingCriteria] = useState(false);

  // --- Filtering Logic ---
  const filteredTags = tags.filter(tag => {
    const matchSearch = 
      tag.name.includes(searchKeyword) || 
      tag.description.includes(searchKeyword) ||
      tag.category.includes(searchKeyword);
    const matchType = typeFilter === 'all' || tag.type === typeFilter;
    const matchCategory = categoryFilter === 'all' || tag.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || tag.status === statusFilter;
    return matchSearch && matchType && matchCategory && matchStatus;
  });

  const tagsByType = {
    '规则标签': filteredTags.filter(t => t.type === '规则标签'),
    '智能标签': filteredTags.filter(t => t.type === '智能标签')
  };

  const categories = Array.from(new Set(tags.map(tag => tag.category)));

  // --- Stats ---
  const stats = {
    total: tags.length,
    enabled: tags.filter(t => t.status === '启用').length,
    totalCoverage: tags.filter(t => t.status === '启用').reduce((sum, t) => sum + t.coverageCount, 0),
    avgCoverage: Math.round(tags.filter(t => t.status === '启用').reduce((sum, t) => sum + t.coverageCount, 0) / (tags.filter(t => t.status === '启用').length || 1))
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case '规则标签': return 'bg-blue-100 text-blue-800';
      case '智能标签': return 'bg-purple-100 text-purple-800';
      default: return '';
    }
  };

  const getRiskBadgeColor = (level?: string) => {
    switch (level) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getRiskLabel = (level?: string) => {
    switch (level) {
      case 'High': return '高危';
      case 'Medium': return '关注';
      default: return '正常';
    }
  };

  // 根据标签生成对应的覆盖人员列表
  const getCoveredPersonsByTag = (tag: TagItem): CoveredPerson[] => {
    const tagId = tag.id;
    
    // 规则标签（含原自定义标签）- 手动关联或规则匹配
    if (tag.type === '规则标签') {
      const customPersonsMap: Record<string, CoveredPerson[]> = {
        '101': [ // 吸毒人员
          { id: 'CP101-1', name: '赵某某', idCard: '370000198501012345', gender: '男', age: 40, phone: '13900139001', address: '威海市环翠区竹岛街道C区2号楼1单元301', matchReason: ['手动关联'] },
          { id: 'CP101-2', name: '钱某某', idCard: '370000199203053456', gender: '男', age: 33, phone: '13900139002', address: '威海市环翠区竹岛街道D区5号楼2单元102', matchReason: ['手动关联'] },
          { id: 'CP101-3', name: '孙某某', idCard: '370000198708154567', gender: '女', age: 38, phone: '13900139003', address: '威海市环翠区竹岛街道A区8号楼3单元501', matchReason: ['手动关联'] }
        ],
        '102': [ // 刑满释放
          { id: 'CP102-1', name: '李某某', idCard: '370000198305202345', gender: '男', age: 42, phone: '13900139011', address: '威海市环翠区竹岛街道B区6号楼1单元201', matchReason: ['手动关联'] },
          { id: 'CP102-2', name: '周某某', idCard: '370000199008083456', gender: '男', age: 35, phone: '13900139012', address: '威海市环翠区竹岛街道E区3号楼2单元402', matchReason: ['手动关联'] }
        ],
        '103': [ // 严重精神障碍
          { id: 'CP103-1', name: '吴某某', idCard: '370000197802152345', gender: '女', age: 47, phone: '13900139021', address: '威海市环翠区竹岛街道A区4号楼1单元103', matchReason: ['手动关联'] },
          { id: 'CP103-2', name: '郑某某', idCard: '370000198106253456', gender: '男', age: 44, phone: '13900139022', address: '威海市环翠区竹岛街道C区7号楼3单元601', matchReason: ['手动关联'] },
          { id: 'CP103-3', name: '王某某', idCard: '370000199401104567', gender: '女', age: 31, phone: '13900139023', address: '威海市环翠区竹岛街道B区9号楼2单元305', matchReason: ['手动关联'] }
        ],
        '104': [ // 重点上访
          { id: 'CP104-1', name: '冯某某', idCard: '370000196508122345', gender: '男', age: 60, phone: '13900139031', address: '威海市环翠区竹岛街道D区1号楼1单元101', matchReason: ['手动关联'] },
          { id: 'CP104-2', name: '陈某某', idCard: '370000197203183456', gender: '女', age: 53, phone: '13900139032', address: '威海市环翠区竹岛街道A区10号楼4单元702', matchReason: ['手动关联'] }
        ],
        '105': [ // 社区矫正
          { id: 'CP105-1', name: '褚某某', idCard: '370000199505052345', gender: '男', age: 30, phone: '13900139041', address: '威海市环翠区竹岛街道E区8号楼2单元204', matchReason: ['手动关联'] }
        ],
        '204': [ // 低保户
          { id: 'CP204-1', name: '沈大妈', idCard: '370000195812102345', gender: '女', age: 67, phone: '13900139051', address: '威海市环翠区竹岛街道B区2号楼1单元101', matchReason: ['手动关联'] },
          { id: 'CP204-2', name: '韩大爷', idCard: '370000196005153456', gender: '男', age: 65, phone: '13900139052', address: '威海市环翠区竹岛街道C区4号楼2单元302', matchReason: ['手动关联'] },
          { id: 'CP204-3', name: '杨大妈', idCard: '370000196308204567', gender: '女', age: 62, phone: '13900139053', address: '威海市环翠区竹岛街道D区6号楼3单元503', matchReason: ['手动关联'] }
        ],
        '301': [ // 党员
          { id: 'CP301-1', name: '张书记', idCard: '370000196803122345', gender: '男', age: 57, phone: '13900139061', address: '威海市环翠区竹岛街道A区1号楼1单元201', matchReason: ['手动关联'] },
          { id: 'CP301-2', name: '李主任', idCard: '370000197205183456', gender: '女', age: 53, phone: '13900139062', address: '威海市环翠区竹岛街道B区3号楼2单元401', matchReason: ['手动关联'] },
          { id: 'CP301-3', name: '王委员', idCard: '370000198008254567', gender: '男', age: 45, phone: '13900139063', address: '威海市环翠区竹岛街道C区5号楼3单元601', matchReason: ['手动关联'] }
        ],
        '302': [ // 退役军人
          { id: 'CP302-1', name: '刘班长', idCard: '370000198201052345', gender: '男', age: 43, phone: '13900139071', address: '威海市环翠区竹岛街道D区7号楼1单元301', matchReason: ['手动关联'] },
          { id: 'CP302-2', name: '马连长', idCard: '370000197806123456', gender: '男', age: 47, phone: '13900139072', address: '威海市环翠区竹岛街道E区9号楼2单元502', matchReason: ['手动关联'] }
        ],
        '303': [ // 志愿者
          { id: 'CP303-1', name: '何小姐', idCard: '370000199203152345', gender: '女', age: 33, phone: '13900139081', address: '威海市环翠区竹岛街道A区11号楼3单元701', matchReason: ['手动关联'] },
          { id: 'CP303-2', name: '吕先生', idCard: '370000198805203456', gender: '男', age: 37, phone: '13900139082', address: '威海市环翠区竹岛街道B区12号楼1单元101', matchReason: ['手动关联'] },
          { id: 'CP303-3', name: '施女士', idCard: '370000199510254567', gender: '女', age: 30, phone: '13900139083', address: '威海市环翠区竹岛街道C区13号楼2单元202', matchReason: ['手动关联'] }
        ]
      };
      const rulePersonsMap: Record<string, CoveredPerson[]> = {
        '203': [ // 残疾人
          { id: 'RP203-1', name: '张大爷', idCard: '370000196203122345', gender: '男', age: 63, phone: '13800138101', address: '威海市环翠区竹岛街道A区2号楼1单元103', matchReason: ['残疾证 = 是'] },
          { id: 'RP203-2', name: '李阿姨', idCard: '370000197005183456', gender: '女', age: 55, phone: '13800138102', address: '威海市环翠区竹岛街道B区4号楼2单元204', matchReason: ['残疾证 = 是'] },
          { id: 'RP203-3', name: '王大哥', idCard: '370000198508254567', gender: '男', age: 40, phone: '13800138103', address: '威海市环翠区竹岛街道C区6号楼3单元305', matchReason: ['残疾证 = 是'] }
        ],
        '205': [ // 失业人员
          { id: 'RP205-1', name: '赵小姐', idCard: '370000199203152345', gender: '女', age: 33, phone: '13800138111', address: '威海市环翠区竹岛街道D区8号楼1单元401', matchReason: ['就业状态 = 失业'] },
          { id: 'RP205-2', name: '钱先生', idCard: '370000198805203456', gender: '男', age: 37, phone: '13800138112', address: '威海市环翠区竹岛街道E区10号楼2单元502', matchReason: ['就业状态 = 失业'] },
          { id: 'RP205-3', name: '孙女士', idCard: '370000199010254567', gender: '女', age: 35, phone: '13900138113', address: '威海市环翠区竹岛街道A区12号楼3单元603', matchReason: ['就业状态 = 失业'] }
        ],
        '304': [ // 学龄儿童
          { id: 'RP304-1', name: '小明', idCard: '370000201503122345', gender: '男', age: 10, phone: '13800138121', address: '威海市环翠区竹岛街道B区14号楼1单元101', matchReason: ['年龄 >= 6', '年龄 <= 14'] },
          { id: 'RP304-2', name: '小红', idCard: '370000201605183456', gender: '女', age: 9, phone: '13800138122', address: '威海市环翠区竹岛街道C区16号楼2单元202', matchReason: ['年龄 >= 6', '年龄 <= 14'] },
          { id: 'RP304-3', name: '小华', idCard: '370000201408254567', gender: '男', age: 11, phone: '13800138123', address: '威海市环翠区竹岛街道D区18号楼3单元303', matchReason: ['年龄 >= 6', '年龄 <= 14'] }
        ],
        '305': [ // 育龄妇女
          { id: 'RP305-1', name: '林女士', idCard: '370000199203152345', gender: '女', age: 33, phone: '13800138131', address: '威海市环翠区竹岛街道E区20号楼1单元401', matchReason: ['性别 = 女', '年龄 >= 15', '年龄 <= 49'] },
          { id: 'RP305-2', name: '郭女士', idCard: '370000198805203456', gender: '女', age: 37, phone: '13800138132', address: '威海市环翠区竹岛街道A区22号楼2单元502', matchReason: ['性别 = 女', '年龄 >= 15', '年龄 <= 49'] },
          { id: 'RP305-3', name: '何女士', idCard: '370000199510254567', gender: '女', age: 30, phone: '13800138133', address: '威海市环翠区竹岛街道B区24号楼3单元603', matchReason: ['性别 = 女', '年龄 >= 15', '年龄 <= 49'] }
        ],
        '306': [ // 老年人
          { id: 'RP306-1', name: '孙大爷', idCard: '370000196203122345', gender: '男', age: 63, phone: '13800138141', address: '威海市环翠区竹岛街道C区26号楼1单元101', matchReason: ['年龄 >= 60'] },
          { id: 'RP306-2', name: '李奶奶', idCard: '370000195808183456', gender: '女', age: 67, phone: '13800138142', address: '威海市环翠区竹岛街道D区28号楼2单元202', matchReason: ['年龄 >= 60'] },
          { id: 'RP306-3', name: '王大爷', idCard: '370000196105254567', gender: '男', age: 64, phone: '13800138143', address: '威海市环翠区竹岛街道E区30号楼3单元303', matchReason: ['年龄 >= 60'] },
          { id: 'RP306-4', name: '赵奶奶', idCard: '370000195510104567', gender: '女', age: 70, phone: '13800138144', address: '威海市环翠区竹岛街道A区32号楼1单元401', matchReason: ['年龄 >= 60'] }
        ],
        '307': [ // 流动人口
          { id: 'RP307-1', name: '张工', idCard: '410000199203152345', gender: '男', age: 33, phone: '13800138151', address: '威海市环翠区竹岛街道B区34号楼2单元501', matchReason: ['居住类型 = 流动'] },
          { id: 'RP307-2', name: '刘师傅', idCard: '320000198805203456', gender: '男', age: 37, phone: '13800138152', address: '威海市环翠区竹岛街道C区36号楼3单元602', matchReason: ['居住类型 = 流动'] },
          { id: 'RP307-3', name: '陈女士', idCard: '440000199510254567', gender: '女', age: 30, phone: '13800138153', address: '威海市环翠区竹岛街道D区38号楼1单元701', matchReason: ['居住类型 = 流动'] }
        ],
        '201': [ // 空巢老人
          { id: 'SP201-1', name: '周大爷', idCard: '370000196003122345', gender: '男', age: 65, phone: '13700137101', address: '威海市环翠区竹岛街道A区40号楼1单元101', matchReason: ['年龄 >= 60', '同住人数 <= 2'] },
          { id: 'SP201-2', name: '吴奶奶', idCard: '370000195905183456', gender: '女', age: 66, phone: '13700137102', address: '威海市环翠区竹岛街道B区42号楼2单元202', matchReason: ['年龄 >= 60', '同住人数 <= 2'] },
          { id: 'SP201-3', name: '郑大爷', idCard: '370000196208254567', gender: '男', age: 63, phone: '13700137103', address: '威海市环翠区竹岛街道C区44号楼3单元303', matchReason: ['年龄 >= 60', '同住人数 <= 2'] }
        ],
        '202': [ // 独居老人
          { id: 'SP202-1', name: '冯大爷', idCard: '370000195703122345', gender: '男', age: 68, phone: '13700137111', address: '威海市环翠区竹岛街道D区46号楼1单元401', matchReason: ['年龄 >= 60', '同住人数 = 1'] },
          { id: 'SP202-2', name: '陈奶奶', idCard: '370000195605183456', gender: '女', age: 69, phone: '13700137112', address: '威海市环翠区竹岛街道E区48号楼2单元502', matchReason: ['年龄 >= 60', '同住人数 = 1'] },
          { id: 'SP202-3', name: '褚大爷', idCard: '370000195808254567', gender: '男', age: 67, phone: '13700137113', address: '威海市环翠区竹岛街道A区50号楼3单元603', matchReason: ['年龄 >= 60', '同住人数 = 1'] }
        ],
        '206': [ // 群租人员
          { id: 'SP206-1', name: '小王', idCard: '370000199803152345', gender: '男', age: 27, phone: '13700137121', address: '威海市环翠区竹岛街道B区52号楼1单元701', matchReason: ['居住密度异常', '同住人数 >= 6'] },
          { id: 'SP206-2', name: '小李', idCard: '370000199905203456', gender: '女', age: 26, phone: '13700137122', address: '威海市环翠区竹岛街道B区52号楼1单元701', matchReason: ['居住密度异常', '同住人数 >= 6'] },
          { id: 'SP206-3', name: '小张', idCard: '370000200010254567', gender: '男', age: 25, phone: '13700137123', address: '威海市环翠区竹岛街道B区52号楼1单元701', matchReason: ['居住密度异常', '同住人数 >= 6'] }
        ]
      };
      return customPersonsMap[tagId] || rulePersonsMap[tagId] || [];
    }

    // 智能标签 - 通过电子记事AI匹配
    if (tag.type === '智能标签') {
      return [];
    }

    return [];
  };

  // --- Actions ---

  const handleOpenCreate = () => {
    setFormTagType('规则标签');
    setFormTagName('');
    setFormTagCategory('');
    setFormRiskLevel('Low');
    setFormTagDescription('');
    setFormRules([{ id: Date.now().toString(), field: '', operator: '', value: '' }]);
    setEstimatedCoverage(null);
    setMatchedPeople([]);
    setShowMatchedList(false);
    setFormJudgmentCriteria('');
    setRuleCreateMode('struct');
    // 加载人口数据库
    setDbPeople(db.getPeople());
    // 重置智能标签相关状态
    setSmartTagMode('text'); // 默认文本分析模式
    setTextInput('');
    setTextAnalysisResult([]);
    setSelectedSeedPersons([]);
    setAnalyzedFeatures([]);
    setSeedPersonSearch('');
    setIsAnalyzing(false);
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (tag: TagItem) => {
    setSelectedTag(tag);
    setFormTagName(tag.name);
    setFormTagCategory(tag.category);
    setFormRiskLevel(tag.riskLevel || 'Low');
    setFormTagDescription(tag.description);
    setFormTagStatus(tag.status);
    // Mock parsing rules back to form format, assuming simple parsing for demo
    setFormRules([{ id: '1', field: 'age', operator: '>=', value: '60' }]); 
    setIsEditDialogOpen(true);
  };

  const handleOpenView = (tag: TagItem) => {
    setSelectedTag(tag);
    setIsViewDialogOpen(true);
  };

  const handleToggleStatus = (id: string) => {
    setTags(tags.map(tag => 
      tag.id === id 
        ? { ...tag, status: tag.status === '启用' ? '禁用' : '启用' }
        : tag
    ));
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此标签吗？删除后将无法恢复。')) {
      setTags(tags.filter(tag => tag.id !== id));
    }
  };

  // --- Create/Edit Logic ---

  const addRule = () => {
    setFormRules([...formRules, { id: Date.now().toString(), field: '', operator: '', value: '' }]);
  };

  const removeRule = (id: string) => {
    if (formRules.length > 1) {
      setFormRules(formRules.filter(rule => rule.id !== id));
    }
  };

  const updateRule = (id: string, field: keyof RuleCondition, value: string) => {
    setFormRules(formRules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };

  const handleEstimate = () => {
    const people = db.getPeople();
    const validRules = formRules.filter(r => r.field && r.operator && r.value);
    if (validRules.length === 0) {
      setEstimatedCoverage(0);
      setMatchedPeople([]);
      return;
    }
    const matched = people.filter(person => {
      return validRules.every(rule => {
        const personValue = (person as any)[rule.field];
        if (personValue === undefined || personValue === null) return false;
        const pv = String(personValue);
        const rv = rule.value;
        switch (rule.operator) {
          case '=': return pv === rv;
          case '!=': return pv !== rv;
          case '>': return Number(personValue) > Number(rv);
          case '>=': return Number(personValue) >= Number(rv);
          case '<': return Number(personValue) < Number(rv);
          case '<=': return Number(personValue) <= Number(rv);
          case 'contains': return pv.includes(rv);
          case 'startsWith': return pv.startsWith(rv);
          default: return false;
        }
      });
    });
    setMatchedPeople(matched);
    setEstimatedCoverage(matched.length);
    setShowMatchedList(false);
  };

  const handleSaveCreate = () => {
    if (!formTagName || !formTagCategory) {
      alert('请填写标签名称和分类');
      return;
    }
    const newTag: TagItem = {
      id: Date.now().toString(),
      name: formTagName,
      type: formTagType,
      category: formTagCategory,
      description: formTagDescription,
      status: '启用',
      coverageCount: 0,
      createTime: new Date().toLocaleString(),
      updateTime: new Date().toLocaleString(),
      creator: '当前用户',
      riskLevel: formRiskLevel,
      rules: formTagType === '规则标签' ? formRules.map(r => `${r.field} ${r.operator} ${r.value}`) : undefined,
      judgmentCriteria: formTagType === '智能标签' ? formJudgmentCriteria : undefined
    };
    setTags([newTag, ...tags]);
    setIsCreateDialogOpen(false);
  };

  const handleSaveEdit = () => {
    if (!selectedTag) return;
    const updatedTags = tags.map(t => t.id === selectedTag.id ? {
      ...t,
      name: formTagName,
      category: formTagCategory,
      riskLevel: formRiskLevel,
      description: formTagDescription,
      status: formTagStatus,
      updateTime: new Date().toLocaleString()
    } : t);
    setTags(updatedTags);
    setIsEditDialogOpen(false);
  };

  // --- 智能标签相关逻辑 ---
  
  // 切换种子人员选择
  const toggleSeedPerson = (personId: string) => {
    if (selectedSeedPersons.includes(personId)) {
      setSelectedSeedPersons(selectedSeedPersons.filter(id => id !== personId));
    } else {
      setSelectedSeedPersons([...selectedSeedPersons, personId]);
    }
  };

  // 分析相似特征
  const handleAnalyzeFeatures = () => {
    if (selectedSeedPersons.length < 2) {
      alert('请至少选择2个种子人员进行分析');
      return;
    }

    setIsAnalyzing(true);

    // 模拟分析过程
    setTimeout(() => {
      const selectedPersons = mockSeedPersons.filter(p => selectedSeedPersons.includes(p.id));
      
      const features: AnalyzedFeature[] = [];

      // 分析年龄特征
      const ages = selectedPersons.map(p => p.age);
      const minAge = Math.min(...ages);
      const maxAge = Math.max(...ages);
      const avgAge = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
      const ageRange = maxAge - minAge;
      const ageSimilarity = ageRange <= 10 ? 95 : ageRange <= 20 ? 75 : 50;
      
      features.push({
        field: 'age',
        label: '年龄段',
        value: ageRange <= 5 ? `${avgAge}岁左右` : `${minAge}-${maxAge}岁`,
        similarity: ageSimilarity,
        selected: ageSimilarity >= 70
      });

      // 分析性别特征
      const genders = selectedPersons.map(p => p.gender);
      const genderCount = genders.filter(g => g === genders[0]).length;
      const genderSimilarity = (genderCount / genders.length) * 100;
      
      if (genderSimilarity >= 60) {
        features.push({
          field: 'gender',
          label: '性别',
          value: genders[0],
          similarity: genderSimilarity,
          selected: genderSimilarity >= 80
        });
      }

      // 分析居住类型特征
      const livingTypes = selectedPersons.map(p => p.livingType);
      const livingTypeCount = livingTypes.filter(t => t === livingTypes[0]).length;
      const livingTypeSimilarity = (livingTypeCount / livingTypes.length) * 100;
      
      if (livingTypeSimilarity >= 60) {
        features.push({
          field: 'livingType',
          label: '居住类型',
          value: livingTypes[0],
          similarity: livingTypeSimilarity,
          selected: livingTypeSimilarity >= 80
        });
      }

      // 分析健康状况特征
      const healthStatuses = selectedPersons.map(p => p.healthStatus);
      const hasChronicDisease = healthStatuses.filter(h => h.includes('慢性病')).length;
      const healthSimilarity = (hasChronicDisease / healthStatuses.length) * 100;
      
      if (healthSimilarity >= 60) {
        features.push({
          field: 'healthStatus',
          label: '健康状况',
          value: healthSimilarity === 100 ? '慢性病患者' : '包含慢性病',
          similarity: healthSimilarity,
          selected: healthSimilarity >= 80
        });
      }

      // 分析就业状况特征
      const employmentStatuses = selectedPersons.map(p => p.employmentStatus);
      const employmentCount = employmentStatuses.filter(e => e === employmentStatuses[0]).length;
      const employmentSimilarity = (employmentCount / employmentStatuses.length) * 100;
      
      if (employmentSimilarity >= 60) {
        features.push({
          field: 'employmentStatus',
          label: '就业状况',
          value: employmentStatuses[0],
          similarity: employmentSimilarity,
          selected: employmentSimilarity >= 80
        });
      }

      // 分析教育程度特征
      const educations = selectedPersons.map(p => p.education);
      const educationCount = educations.filter(e => e === educations[0]).length;
      const educationSimilarity = (educationCount / educations.length) * 100;
      
      if (educationSimilarity >= 60) {
        features.push({
          field: 'education',
          label: '教育程度',
          value: educations[0],
          similarity: educationSimilarity,
          selected: educationSimilarity >= 70
        });
      }

      // 分析同住人数特征
      const householdSizes = selectedPersons.map(p => p.householdSize);
      const householdCount = householdSizes.filter(h => h === householdSizes[0]).length;
      const householdSimilarity = (householdCount / householdSizes.length) * 100;
      
      if (householdSimilarity >= 60) {
        features.push({
          field: 'householdSize',
          label: '同住人数',
          value: `${householdSizes[0]}人`,
          similarity: householdSimilarity,
          selected: householdSimilarity >= 80
        });
      }

      // 按相似度排序
      features.sort((a, b) => b.similarity - a.similarity);

      setAnalyzedFeatures(features);
      setIsAnalyzing(false);
    }, 1500);
  };

  // 分析数据库中选中居民的共同特征
  const handleAnalyzeDbPeople = () => {
    if (selectedSeedPersons.length < 2) {
      alert('请至少选择2个居民进行分析');
      return;
    }

    setIsAnalyzing(true);

    setTimeout(() => {
      const selectedPersons = dbPeople.filter(p => selectedSeedPersons.includes(p.id));
      const features: AnalyzedFeature[] = [];

      // 年龄分析
      const ages = selectedPersons.map(p => p.age);
      const minAge = Math.min(...ages);
      const maxAge = Math.max(...ages);
      const avgAge = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
      const ageRange = maxAge - minAge;
      const ageSimilarity = ageRange <= 10 ? 95 : ageRange <= 20 ? 75 : 50;
      features.push({
        field: 'age',
        label: '年龄段',
        value: ageRange <= 5 ? `${avgAge}岁左右` : `${minAge}-${maxAge}岁`,
        similarity: ageSimilarity,
        selected: ageSimilarity >= 70
      });

      // 性别分析
      const genders = selectedPersons.map(p => p.gender);
      const genderCount = genders.filter(g => g === genders[0]).length;
      const genderSimilarity = (genderCount / genders.length) * 100;
      if (genderSimilarity >= 60) {
        features.push({ field: 'gender', label: '性别', value: genders[0], similarity: genderSimilarity, selected: genderSimilarity >= 80 });
      }

      // 居住类型分析
      const types = selectedPersons.map(p => p.type);
      const typeCount = types.filter(t => t === types[0]).length;
      const typeSimilarity = (typeCount / types.length) * 100;
      if (typeSimilarity >= 60) {
        features.push({ field: 'type', label: '居住类型', value: types[0], similarity: typeSimilarity, selected: typeSimilarity >= 80 });
      }

      // 风险等级分析
      const risks = selectedPersons.map(p => p.risk);
      const riskCount = risks.filter(r => r === risks[0]).length;
      const riskSimilarity = (riskCount / risks.length) * 100;
      if (riskSimilarity >= 60) {
        features.push({ field: 'risk', label: '风险等级', value: risks[0], similarity: riskSimilarity, selected: riskSimilarity >= 70 });
      }

      // 教育程度分析
      const educations = selectedPersons.map(p => p.education).filter(Boolean);
      if (educations.length >= 2) {
        const eduCount = educations.filter(e => e === educations[0]).length;
        const eduSimilarity = (eduCount / educations.length) * 100;
        if (eduSimilarity >= 60) {
          features.push({ field: 'education', label: '教育程度', value: educations[0]!, similarity: eduSimilarity, selected: eduSimilarity >= 70 });
        }
      }

      features.sort((a, b) => b.similarity - a.similarity);
      setAnalyzedFeatures(features);
      setIsAnalyzing(false);
    }, 1500);
  };

  // 文本智能分析 - 输出条件/条件集
  const handleTextAnalysis = () => {
    if (!textInput.trim()) {
      alert('请输入描述文字');
      return;
    }

    setIsAnalyzing(true);

    // 模拟AI分析：从描述文字中提取结构化条件
    setTimeout(() => {
      const results: Array<{field: string; label: string; operator: string; value: string; confidence: number; reason: string; selected: boolean}> = [];
      const input = textInput;

      // 年龄条件提取
      const ageMatch60 = input.match(/(60|六十)\s*岁?\s*(以上|及以上|上)/);
      const ageMatch80 = input.match(/(80|八十)\s*岁?\s*(以上|及以上|上)/);
      const ageRangeMatch = input.match(/(\d{1,3})\s*[-~到至]\s*(\d{1,3})\s*岁/);
      if (ageMatch80) {
        results.push({ field: 'age', label: '年龄', operator: '>=', value: '80', confidence: 95, reason: '文本中提到"80岁以上"', selected: true });
      } else if (ageMatch60) {
        results.push({ field: 'age', label: '年龄', operator: '>=', value: '60', confidence: 95, reason: '文本中提到"60岁以上"', selected: true });
      } else if (ageRangeMatch) {
        results.push({ field: 'age', label: '年龄', operator: '>=', value: ageRangeMatch[1], confidence: 90, reason: `文本中提到"${ageRangeMatch[1]}-${ageRangeMatch[2]}岁"`, selected: true });
        results.push({ field: 'age', label: '年龄', operator: '<=', value: ageRangeMatch[2], confidence: 90, reason: `文本中提到"${ageRangeMatch[1]}-${ageRangeMatch[2]}岁"`, selected: true });
      } else if (input.includes('老人') || input.includes('老年')) {
        results.push({ field: 'age', label: '年龄', operator: '>=', value: '60', confidence: 80, reason: '文本提及"老人/老年"，推断年龄≥60', selected: true });
      }

      // 性别条件
      if (input.includes('女性') || input.includes('妇女') || input.includes('女人')) {
        results.push({ field: 'gender', label: '性别', operator: '=', value: '女', confidence: 95, reason: '文本中提到女性/妇女', selected: true });
      } else if (input.includes('男性')) {
        results.push({ field: 'gender', label: '性别', operator: '=', value: '男', confidence: 95, reason: '文本中提到男性', selected: true });
      }

      // 居住类型条件
      if (input.includes('独居') || input.includes('一个人住') || input.includes('孤寡')) {
        results.push({ field: 'type', label: '居住类型', operator: '=', value: '独居', confidence: 90, reason: '文本中提到独居/孤寡', selected: true });
      } else if (input.includes('空巢')) {
        results.push({ field: 'type', label: '居住类型', operator: '=', value: '空巢', confidence: 90, reason: '文本中提到空巢', selected: true });
      } else if (input.includes('流动') || input.includes('外来')) {
        results.push({ field: 'type', label: '居住类型', operator: '=', value: '流动', confidence: 85, reason: '文本中提到流动/外来', selected: true });
      }

      // 就业状况
      if (input.includes('失业') || input.includes('下岗') || input.includes('无业') || input.includes('待业')) {
        results.push({ field: 'status', label: '状态', operator: '=', value: '失业', confidence: 90, reason: '文本中提到失业/下岗/无业', selected: true });
      } else if (input.includes('退休')) {
        results.push({ field: 'status', label: '状态', operator: '=', value: '退休', confidence: 85, reason: '文本中提到退休', selected: true });
      }

      // 风险等级
      if (input.includes('高风险') || input.includes('高危') || input.includes('重点关注')) {
        results.push({ field: 'risk', label: '风险等级', operator: '=', value: '高', confidence: 85, reason: '文本中提到高风险/高危', selected: true });
      }

      // 残疾
      if (input.includes('残疾') || input.includes('行动不便') || input.includes('轮椅')) {
        results.push({ field: 'tags', label: '标签', operator: 'contains', value: '残疾', confidence: 90, reason: '文本中提到残疾/行动不便', selected: true });
      }

      // 按置信度排序
      results.sort((a, b) => b.confidence - a.confidence);

      if (results.length === 0) {
        results.push({ field: '', label: '', operator: '', value: '', confidence: 0, reason: '未能从文本中识别出明确的筛选条件，请尝试更具体的描述', selected: false });
      }

      setTextAnalysisResult(results);
      setIsAnalyzing(false);
    }, 1200);
  };

  // 应用文本分析得到的条件集
  const applyTextAnalysisConditions = () => {
    const selectedConditions = textAnalysisResult.filter(r => r.selected && r.field);
    if (selectedConditions.length === 0) {
      alert('请至少选择一个条件');
      return;
    }
    const rules: RuleCondition[] = selectedConditions.map((c, i) => ({
      id: `rule_text_${Date.now()}_${i}`,
      field: c.field,
      operator: c.operator,
      value: c.value
    }));
    setFormRules(rules);
    setTextAnalysisResult([]);
  };

  // 切换特征选择
  const toggleFeatureSelection = (field: string) => {
    setAnalyzedFeatures(analyzedFeatures.map(f => 
      f.field === field ? { ...f, selected: !f.selected } : f
    ));
  };

  // 根据选中的特征生成规则
  const applyAnalyzedFeatures = () => {
    const selectedFeatures = analyzedFeatures.filter(f => f.selected);
    if (selectedFeatures.length === 0) {
      alert('请至少选择一个特征');
      return;
    }

    const rules: RuleCondition[] = selectedFeatures.map((feature, index) => {
      let operator = '=';
      let value = feature.value;
      
      // 根据字段类型调整运算符和值
      if (feature.field === 'age') {
        if (feature.value.includes('-')) {
          // 年龄范围，创建两条规则
          const [min, max] = feature.value.split('-').map(s => s.replace('岁', '').trim());
          return [
            { id: `rule_${Date.now()}_${index}_1`, field: 'age', operator: '>=', value: min },
            { id: `rule_${Date.now()}_${index}_2`, field: 'age', operator: '<=', value: max }
          ];
        } else if (feature.value.includes('左右')) {
          const age = feature.value.replace('岁左右', '').trim();
          operator = '>=';
          value = age;
        }
      } else if (feature.field === 'healthStatus') {
        if (feature.value === '慢性病患者' || feature.value.includes('慢性病')) {
          operator = 'contains';
          value = '慢性病';
        }
      } else if (feature.field === 'householdSize') {
        value = feature.value.replace('人', '');
        operator = '=';
      }

      return { id: `rule_${Date.now()}_${index}`, field: feature.field, operator, value };
    }).flat();

    setFormRules(rules);
    
    // 自动生成标签名称和描述
    const featureDesc = selectedFeatures.map(f => f.value).join('、');
    if (!formTagName) {
      setFormTagName(`智能识别：${featureDesc}`);
    }
    if (!formTagDescription) {
      setFormTagDescription(`基于种子人员分析，自动识别具有相似特征的人群：${featureDesc}`);
    }
  };

  // AI 生成判定描述
  const handleGenerateCriteria = () => {
    if (!formTagName.trim()) return;
    setIsGeneratingCriteria(true);
    setTimeout(() => {
      const criteriaMap: Record<string, string> = {
        '暴躁易怒': '走访或纠纷记录中出现争吵、吵架、动手、打人、摔东西、情绪激动、发脾气、骂人等描述',
        '热心助人': '记录中提及主动帮助邻居、帮忙照看小孩/老人、热心肠、积极参与社区志愿服务等',
        '喜欢遛狗': '记录中提及遛狗、养狗、养犬、犬只、狗叫扰民等相关内容',
        '邻里关系差': '多次出现与邻居产生矛盾、投诉邻居、邻里纠纷、噪音投诉、不和睦等记录',
        '内向孤僻': '走访记录中提及不愿与人交流、很少出门、拒绝社区活动、独来独往等描述',
        '早起锻炼': '记录中提及晨练、早操、太极拳、晨跑、公园锻炼等相关内容',
      };
      const generated = criteriaMap[formTagName] ||
        `记录中出现与"${formTagName}"相关的行为描述、事件记录或特征表现，包括但不限于直接提及、间接体现该特征的内容`;
      setFormJudgmentCriteria(generated);
      setIsGeneratingCriteria(false);
    }, 800);
  };

  // 过滤种子人员列表
  const filteredSeedPersons = mockSeedPersons.filter(person =>
    person.name.includes(seedPersonSearch) ||
    person.idCard.includes(seedPersonSearch) ||
    person.address.includes(seedPersonSearch)
  );

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="mb-2">标签管理</h1>
        <p className="text-gray-500">创建、管理及维护人口标签体系，支持风险等级自动定级</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              标签总数
            </CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Power className="w-4 h-4" />
              启用标签
            </CardDescription>
            <CardTitle className="text-3xl">{stats.enabled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              覆盖总人数
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalCoverage.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              平均覆盖
            </CardDescription>
            <CardTitle className="text-3xl">{stats.avgCoverage}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索标签名称、分类或描述..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="标签类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="规则标签">规则标签</SelectItem>
                <SelectItem value="智能标签">智能标签</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="标签分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="启用">启用</SelectItem>
                <SelectItem value="禁用">禁用</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              创建标签
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 标签列表 */}
      <Card>
        <Tabs defaultValue="all" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="all">全部 ({filteredTags.length})</TabsTrigger>
              <TabsTrigger value="规则标签">规则标签 ({tagsByType['规则标签'].length})</TabsTrigger>
              <TabsTrigger value="智能标签">智能标签 ({tagsByType['智能标签'].length})</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="p-0">
             {/* 全部标签 */}
             <TabsContent value="all" className="m-0">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>标签名称</TableHead>
                     <TableHead>风险等级</TableHead>
                     <TableHead>标签条件</TableHead>
                     <TableHead>分类</TableHead>
                     <TableHead>覆盖人数</TableHead>
                     <TableHead>状态</TableHead>
                     <TableHead>更新时间</TableHead>
                     <TableHead className="text-right">操作</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredTags.map((tag) => (
                     <TableRow key={tag.id}>
                       <TableCell className="font-medium">{tag.name}</TableCell>
                       <TableCell>
                         <Badge className={getRiskBadgeColor(tag.riskLevel)} variant="outline">{getRiskLabel(tag.riskLevel)}</Badge>
                       </TableCell>
                       <TableCell>
                         {tag.type === '智能标签' ? (
                           <span className="text-sm text-purple-600">{tag.judgmentCriteria ? '判定描述' : '未设置判定'}</span>
                         ) : (
                           <div className="text-sm text-gray-600">
                             {tag.rules && tag.rules.length > 0 ? (
                               tag.rules.join(' 且 ')
                             ) : (
                               <span className="text-gray-400">手动关联</span>
                             )}
                           </div>
                         )}
                       </TableCell>
                       <TableCell><Badge variant="outline">{tag.category}</Badge></TableCell>
                       <TableCell><span className="font-medium">{tag.coverageCount.toLocaleString()}</span> 人</TableCell>
                       <TableCell><Badge variant={tag.status === '启用' ? 'default' : 'secondary'}>{tag.status}</Badge></TableCell>
                       <TableCell className="text-sm text-gray-500">{tag.updateTime.split(' ')[0]}</TableCell>
                       <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="sm" onClick={() => handleOpenView(tag)}><Eye className="w-4 h-4" /></Button>
                           <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(tag)}><Edit className="w-4 h-4" /></Button>
                           <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(tag.id)}>
                             <Power className={`w-4 h-4 ${tag.status === '启用' ? 'text-green-600' : 'text-gray-400'}`} />
                           </Button>
                           <Button variant="ghost" size="sm" onClick={() => handleDelete(tag.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                   {filteredTags.length === 0 && (
                     <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">暂无标签数据</TableCell></TableRow>
                   )}
                 </TableBody>
               </Table>
             </TabsContent>

             {/* 规则标签 */}
             <TabsContent value="规则标签" className="m-0">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>标签名称</TableHead>
                     <TableHead>风险等级</TableHead>
                     <TableHead>标签条件</TableHead>
                     <TableHead>分类</TableHead>
                     <TableHead>覆盖人数</TableHead>
                     <TableHead>状态</TableHead>
                     <TableHead>更新时间</TableHead>
                     <TableHead className="text-right">操作</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {tagsByType['规则标签'].map((tag) => (
                     <TableRow key={tag.id}>
                       <TableCell className="font-medium">{tag.name}</TableCell>
                       <TableCell>
                         <Badge className={getRiskBadgeColor(tag.riskLevel)} variant="outline">{getRiskLabel(tag.riskLevel)}</Badge>
                       </TableCell>
                       <TableCell>
                         <div className="text-sm text-gray-600">
                           {tag.rules && tag.rules.length > 0 ? (
                             tag.rules.join(' 且 ')
                           ) : (
                             <span className="text-gray-400">手动关联</span>
                           )}
                         </div>
                       </TableCell>
                       <TableCell><Badge variant="outline">{tag.category}</Badge></TableCell>
                       <TableCell><span className="font-medium">{tag.coverageCount.toLocaleString()}</span> 人</TableCell>
                       <TableCell><Badge variant={tag.status === '启用' ? 'default' : 'secondary'}>{tag.status}</Badge></TableCell>
                       <TableCell className="text-sm text-gray-500">{tag.updateTime.split(' ')[0]}</TableCell>
                       <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="sm" onClick={() => handleOpenView(tag)}><Eye className="w-4 h-4" /></Button>
                           <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(tag)}><Edit className="w-4 h-4" /></Button>
                           <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(tag.id)}>
                             <Power className={`w-4 h-4 ${tag.status === '启用' ? 'text-green-600' : 'text-gray-400'}`} />
                           </Button>
                           <Button variant="ghost" size="sm" onClick={() => handleDelete(tag.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                   {tagsByType['规则标签'].length === 0 && (
                     <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">暂无规则标签</TableCell></TableRow>
                   )}
                 </TableBody>
               </Table>
             </TabsContent>

             {/* 智能标签 */}
             <TabsContent value="智能标签" className="m-0">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>标签名称</TableHead>
                     <TableHead>风险等级</TableHead>
                     <TableHead>判定描述</TableHead>
                     <TableHead>分类</TableHead>
                     <TableHead>覆盖人数</TableHead>
                     <TableHead>状态</TableHead>
                     <TableHead>更新时间</TableHead>
                     <TableHead className="text-right">操作</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {tagsByType['智能标签'].map((tag) => (
                     <TableRow key={tag.id}>
                       <TableCell className="font-medium">{tag.name}</TableCell>
                       <TableCell>
                         <Badge className={getRiskBadgeColor(tag.riskLevel)} variant="outline">{getRiskLabel(tag.riskLevel)}</Badge>
                       </TableCell>
                       <TableCell>
                         <div className="text-sm text-purple-600 max-w-xs truncate">
                           {tag.judgmentCriteria || <span className="text-gray-400">未设置判定描述</span>}
                         </div>
                       </TableCell>
                       <TableCell><Badge variant="outline">{tag.category}</Badge></TableCell>
                       <TableCell><span className="font-medium">{tag.coverageCount.toLocaleString()}</span> 人</TableCell>
                       <TableCell><Badge variant={tag.status === '启用' ? 'default' : 'secondary'}>{tag.status}</Badge></TableCell>
                       <TableCell className="text-sm text-gray-500">{tag.updateTime.split(' ')[0]}</TableCell>
                       <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="sm" onClick={() => handleOpenView(tag)}><Eye className="w-4 h-4" /></Button>
                           <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(tag)}><Edit className="w-4 h-4" /></Button>
                           <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(tag.id)}>
                             <Power className={`w-4 h-4 ${tag.status === '启用' ? 'text-green-600' : 'text-gray-400'}`} />
                           </Button>
                           <Button variant="ghost" size="sm" onClick={() => handleDelete(tag.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                   {tagsByType['智能标签'].length === 0 && (
                     <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">暂无智能标签</TableCell></TableRow>
                   )}
                 </TableBody>
               </Table>
             </TabsContent>

           </CardContent>
        </Tabs>
      </Card>

      {/* --- Dialogs --- */}

      {/* 1. 创建标签 Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>创建标签</DialogTitle>
            <DialogDescription>创建规则标签或智能标签</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto pr-3 -mr-3">
             <div className="p-1 pb-2">
                <Tabs value={formTagType} onValueChange={(v) => setFormTagType(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="规则标签"><Sliders className="w-4 h-4 mr-2" />规则标签</TabsTrigger>
                    <TabsTrigger value="智能标签"><Sparkles className="w-4 h-4 mr-2" />智能标签</TabsTrigger>
                    </TabsList>

                    <Alert className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>说明</AlertTitle>
                        <AlertDescription>
                            {formTagType === '规则标签' && "通过结构化条件、文本分析或选人分析来创建规则，自动圈选符合条件的人群。"}
                            {formTagType === '智能标签' && "定义性格、习惯、社交等特征标签，通过电子记事内容自动识别并给居民打标签。"}
                        </AlertDescription>
                    </Alert>

                    {/* 基本信息（公共，放在创建方式上方） */}
                    <Card className="mb-6">
                        <CardHeader><CardTitle className="text-lg">基本信息</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>标签名称 *</Label>
                                    <Input value={formTagName} onChange={(e) => setFormTagName(e.target.value)} placeholder="例如：60岁及以上老年人" />
                                </div>
                                <div>
                                    <Label>标签分类 *</Label>
                                    <Select value={formTagCategory} onValueChange={setFormTagCategory}>
                                        <SelectTrigger><SelectValue placeholder="请选择分类" /></SelectTrigger>
                                        <SelectContent>
                                            {(formTagType === '智能标签'
                                              ? ['性格特点', '生活习惯', '社交特征', '家庭状况']
                                              : CATEGORIES
                                            ).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>风险等级 *</Label>
                                    <Select value={formRiskLevel} onValueChange={(v) => setFormRiskLevel(v as any)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="风险等级">
                                                {formRiskLevel === 'Low' && <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span>正常</span>}
                                                {formRiskLevel === 'Medium' && <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>关注</span>}
                                                {formRiskLevel === 'High' && <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span>高危</span>}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Low"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span>正常</span></SelectItem>
                                            <SelectItem value="Medium"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>关注</span></SelectItem>
                                            <SelectItem value="High"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span>高危</span></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 规则配置 (仅规则标签) */}
                    {formTagType === '规则标签' && (
                        <>
                            {/* 模式选择 */}
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle className="text-lg">选择创建方式</CardTitle>
                                    <CardDescription>选择如何定义规则标签的筛选条件</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div
                                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                ruleCreateMode === 'struct' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => { setRuleCreateMode('struct'); setTextAnalysisResult([]); setAnalyzedFeatures([]); }}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <Sliders className="w-4 h-4 text-blue-600" />
                                                <span className="font-semibold text-sm">结构化条件</span>
                                            </div>
                                            <p className="text-xs text-gray-500">手动设定字段、运算符和值</p>
                                        </div>
                                        <div
                                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                ruleCreateMode === 'text' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => { setRuleCreateMode('text'); setAnalyzedFeatures([]); setSelectedSeedPersons([]); }}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <FileText className="w-4 h-4 text-indigo-600" />
                                                <span className="font-semibold text-sm">文本分析</span>
                                            </div>
                                            <p className="text-xs text-gray-500">输入描述文字，AI提取条件</p>
                                        </div>
                                        <div
                                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                ruleCreateMode === 'person' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => { setRuleCreateMode('person'); setTextInput(''); setTextAnalysisResult([]); }}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <Users className="w-4 h-4 text-purple-600" />
                                                <span className="font-semibold text-sm">选人分析</span>
                                            </div>
                                            <p className="text-xs text-gray-500">选择居民，提取共同特征</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 模式一：结构化条件 */}
                            {ruleCreateMode === 'struct' && (
                                <Card className="mb-6">
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-lg">规则条件</CardTitle>
                                            <Button variant="outline" size="sm" onClick={addRule}><Plus className="w-4 h-4 mr-2" />添加条件</Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {formRules.map((rule) => (
                                            <div key={rule.id} className="flex items-end gap-3 p-4 border rounded-lg bg-gray-50">
                                                <div className="flex-1 grid grid-cols-3 gap-3">
                                                    <div>
                                                        <Label className="text-sm">字段</Label>
                                                        <Select value={rule.field} onValueChange={(v) => updateRule(rule.id, 'field', v)}>
                                                            <SelectTrigger><SelectValue placeholder="选择字段" /></SelectTrigger>
                                                            <SelectContent>
                                                                {FIELDS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm">运算符</Label>
                                                        <Select value={rule.operator} onValueChange={(v) => updateRule(rule.id, 'operator', v)}>
                                                            <SelectTrigger><SelectValue placeholder="选择运算符" /></SelectTrigger>
                                                            <SelectContent>
                                                                {OPERATORS.map(op => <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm">值</Label>
                                                        <Input value={rule.value} onChange={(e) => updateRule(rule.id, 'value', e.target.value)} placeholder="输入值" />
                                                    </div>
                                                </div>
                                                {formRules.length > 1 && (
                                                    <Button variant="ghost" size="sm" onClick={() => removeRule(rule.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                                )}
                                            </div>
                                        ))}
                                        <p className="text-xs text-gray-400 mt-2">若不配置任何条件，该标签将不会自动关联人员，仅支持在人员详情中手动关联。</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* 模式二：文本分析 */}
                            {ruleCreateMode === 'text' && textAnalysisResult.length === 0 && (
                                <Card className="mb-6">
                                    <CardHeader>
                                        <CardTitle className="text-lg">输入描述文字</CardTitle>
                                        <CardDescription>输入目标人群特征描述，系统智能提取筛选条件</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Textarea
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                            placeholder="例如：居住在本社区的60岁以上独居老人，无子女陪伴..."
                                            rows={5}
                                            className="resize-none"
                                        />
                                        <div className="flex justify-end">
                                            <Button onClick={handleTextAnalysis} disabled={!textInput.trim() || isAnalyzing} className="gap-2">
                                                {isAnalyzing ? (
                                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>分析中...</>
                                                ) : (
                                                    <><Sparkles className="w-4 h-4" />智能分析</>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* 文本分析结果 - 条件集 */}
                            {ruleCreateMode === 'text' && textAnalysisResult.length > 0 && (
                                <Card className="mb-6">
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-lg">识别出的筛选条件</CardTitle>
                                            <Button variant="ghost" size="sm" onClick={() => { setTextAnalysisResult([]); setTextInput(''); }}>重新输入</Button>
                                        </div>
                                        <CardDescription>勾选需要的条件，点击"应用条件"生成规则</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {textAnalysisResult.map((result, index) => (
                                            <div
                                                key={index}
                                                className={`p-4 border-2 rounded-lg transition-all ${
                                                    result.confidence === 0 ? 'border-gray-200 bg-gray-50' :
                                                    result.selected ? 'border-blue-500 bg-blue-50 cursor-pointer' : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                                                }`}
                                                onClick={() => result.confidence > 0 && setTextAnalysisResult(textAnalysisResult.map((r, i) => i === index ? { ...r, selected: !r.selected } : r))}
                                            >
                                                {result.confidence > 0 ? (
                                                    <div className="flex items-center gap-3">
                                                        <input type="checkbox" checked={result.selected} onChange={() => {}} className="w-4 h-4" />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Badge variant="outline" className="bg-white">{result.label}</Badge>
                                                                <span className="text-gray-600 text-sm">{OPERATORS.find(o => o.value === result.operator)?.label || result.operator}</span>
                                                                <Badge className="bg-blue-500 text-white">{result.value}</Badge>
                                                                <Badge variant="outline" className={
                                                                    result.confidence >= 90 ? 'bg-green-50 text-green-700 border-green-200' :
                                                                    result.confidence >= 80 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                                }>置信度 {result.confidence}%</Badge>
                                                            </div>
                                                            <p className="text-xs text-gray-500">{result.reason}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500">{result.reason}</p>
                                                )}
                                            </div>
                                        ))}
                                        {textAnalysisResult.some(r => r.confidence > 0) && (
                                            <div className="flex justify-end pt-2">
                                                <Button onClick={applyTextAnalysisConditions} disabled={textAnalysisResult.filter(r => r.selected && r.field).length === 0} className="gap-2">
                                                    <Save className="w-4 h-4" />应用条件
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* 模式三：选人分析 - 选择居民 */}
                            {ruleCreateMode === 'person' && analyzedFeatures.length === 0 && (
                                <Card className="mb-6">
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle className="text-lg">选择居民</CardTitle>
                                                <CardDescription className="mt-1">从人口数据库中选择具有相似特征的居民（至少2人）</CardDescription>
                                            </div>
                                            <Badge variant="outline">已选 {selectedSeedPersons.length} 人</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                placeholder="搜索姓名或地址..."
                                                value={seedPersonSearch}
                                                onChange={(e) => setSeedPersonSearch(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                        <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-gray-50">
                                                        <TableHead className="w-12"></TableHead>
                                                        <TableHead>姓名</TableHead>
                                                        <TableHead>性别</TableHead>
                                                        <TableHead>年龄</TableHead>
                                                        <TableHead>居住类型</TableHead>
                                                        <TableHead>地址</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {dbPeople
                                                        .filter(p => p.name.includes(seedPersonSearch) || p.address.includes(seedPersonSearch) || !seedPersonSearch)
                                                        .slice(0, 20)
                                                        .map((person) => (
                                                        <TableRow
                                                            key={person.id}
                                                            className={`cursor-pointer hover:bg-blue-50 ${selectedSeedPersons.includes(person.id) ? 'bg-blue-50' : ''}`}
                                                            onClick={() => toggleSeedPerson(person.id)}
                                                        >
                                                            <TableCell>
                                                                <input type="checkbox" checked={selectedSeedPersons.includes(person.id)} onChange={() => toggleSeedPerson(person.id)} className="w-4 h-4 cursor-pointer" />
                                                            </TableCell>
                                                            <TableCell className="font-medium">{person.name}</TableCell>
                                                            <TableCell>{person.gender}</TableCell>
                                                            <TableCell>{person.age}岁</TableCell>
                                                            <TableCell><Badge variant="outline">{person.type}</Badge></TableCell>
                                                            <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">{person.address}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {dbPeople.length === 0 && (
                                                        <TableRow><TableCell colSpan={6} className="text-center py-4 text-gray-400">暂无人员数据</TableCell></TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button onClick={handleAnalyzeDbPeople} disabled={selectedSeedPersons.length < 2 || isAnalyzing} className="gap-2">
                                                {isAnalyzing ? (
                                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>分析中...</>
                                                ) : (
                                                    <><Sparkles className="w-4 h-4" />分析共同特征</>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* 选人分析 - 特征结果 */}
                            {ruleCreateMode === 'person' && analyzedFeatures.length > 0 && (
                                <Card className="mb-6">
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle className="text-lg">分析出的共同特征</CardTitle>
                                                <CardDescription className="mt-1">选择要应用为规则条件的特征</CardDescription>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => { setAnalyzedFeatures([]); setSelectedSeedPersons([]); }}>重新选择</Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {analyzedFeatures.map((feature) => (
                                            <div
                                                key={feature.field}
                                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                    feature.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() => toggleFeatureSelection(feature.field)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox" checked={feature.selected} onChange={() => toggleFeatureSelection(feature.field)} className="w-4 h-4" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium">{feature.label}</span>
                                                            <Badge variant="outline" className="text-xs">{feature.value}</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                <div className={`h-full ${feature.similarity >= 90 ? 'bg-green-500' : feature.similarity >= 70 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${feature.similarity}%` }} />
                                                            </div>
                                                            <span className="text-sm text-gray-600 min-w-[40px]">{feature.similarity.toFixed(0)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex justify-end pt-2">
                                            <Button onClick={applyAnalyzedFeatures} disabled={analyzedFeatures.filter(f => f.selected).length === 0} className="gap-2">
                                                <Save className="w-4 h-4" />应用选中特征
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* 生成的规则预览（来自选人分析或文本分析） */}
                            {(ruleCreateMode === 'text' || ruleCreateMode === 'person') && formRules.length > 0 && formRules[0].field !== '' && (
                                <Card className="mb-6">
                                    <CardHeader><CardTitle className="text-lg">生成的规则</CardTitle></CardHeader>
                                    <CardContent className="space-y-3">
                                        {formRules.map((rule) => (
                                            <div key={rule.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Badge variant="outline" className="bg-white">{FIELDS.find(f => f.value === rule.field)?.label || rule.field}</Badge>
                                                    <span className="text-gray-600">{OPERATORS.find(o => o.value === rule.operator)?.label || rule.operator}</span>
                                                    <Badge className="bg-blue-500 text-white">{rule.value}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}

                    {/* 智能标签配置 */}
                    {formTagType === '智能标签' && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="text-lg">智能标签配置</CardTitle>
                                <CardDescription>定义标签的判定依据，系统将根据电子记事内容自动匹配</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label>判定描述 *</Label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleGenerateCriteria}
                                            disabled={!formTagName.trim() || isGeneratingCriteria}
                                            className="gap-1.5"
                                        >
                                            {isGeneratingCriteria ? (
                                                <><div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>生成中...</>
                                            ) : (
                                                <><Sparkles className="w-3.5 h-3.5" />根据标签名称生成</>
                                            )}
                                        </Button>
                                    </div>
                                    <Textarea
                                        value={formJudgmentCriteria}
                                        onChange={(e) => setFormJudgmentCriteria(e.target.value)}
                                        placeholder="描述什么情况下应该给居民打上这个标签。例如：走访或纠纷记录中出现争吵、动手、情绪激动等描述"
                                        rows={4}
                                        className="resize-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        {!formTagName.trim() ? '请先填写标签名称，即可使用AI自动生成判定描述' : '网格员在电子记事中录入内容时，系统会根据此描述自动判断是否建议给相关居民打上此标签'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 预估覆盖 */}
                    {formTagType === '规则标签' && (
                        <Card>
                            <CardHeader><CardTitle className="text-lg">预估覆盖</CardTitle></CardHeader>
                            <CardContent>
                                <Button variant="outline" onClick={handleEstimate} className="mb-4 gap-2">
                                    <Users className="w-4 h-4" />基于当前条件匹配人员
                                </Button>
                                {estimatedCoverage !== null && (
                                    <div className="space-y-3">
                                        <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">符合条件的人员</p>
                                                <p className="text-3xl font-semibold text-blue-600 mt-1">{estimatedCoverage.toLocaleString()} 人</p>
                                            </div>
                                            {matchedPeople.length > 0 && (
                                                <Button variant="outline" size="sm" onClick={() => setShowMatchedList(!showMatchedList)}>
                                                    <Eye className="w-4 h-4 mr-1" />{showMatchedList ? '收起名单' : '查看名单'}
                                                </Button>
                                            )}
                                        </div>
                                        {showMatchedList && matchedPeople.length > 0 && (
                                            <div className="border rounded-lg overflow-hidden max-h-[250px] overflow-y-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-gray-50">
                                                            <TableHead>姓名</TableHead>
                                                            <TableHead>性别</TableHead>
                                                            <TableHead>年龄</TableHead>
                                                            <TableHead>居住类型</TableHead>
                                                            <TableHead>地址</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {matchedPeople.slice(0, 50).map(p => (
                                                            <TableRow key={p.id}>
                                                                <TableCell className="font-medium">{p.name}</TableCell>
                                                                <TableCell>{p.gender}</TableCell>
                                                                <TableCell>{p.age}岁</TableCell>
                                                                <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                                                                <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">{p.address}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                                {matchedPeople.length > 50 && (
                                                    <div className="text-center py-2 text-sm text-gray-500 bg-gray-50">
                                                        仅展示前 50 条，共 {matchedPeople.length} 条
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {estimatedCoverage === 0 && (
                                            <p className="text-sm text-gray-500">当前条件未匹配到任何人员，请检查规则设置</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </Tabs>
             </div>
          </div>
          <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveCreate}><Save className="w-4 h-4 mr-2" />创建标签</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. 编辑标签 Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
                <DialogTitle>编辑标签</DialogTitle>
                <DialogDescription>修改标签信息、规则或状态</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-4 max-h-[calc(90vh-180px)]">
                <div className="pb-4">
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="basic">基本信息</TabsTrigger>
                        <TabsTrigger value="rules" disabled={selectedTag?.type !== '规则标签'}>规则配置</TabsTrigger>
                        <TabsTrigger value="history"><History className="w-4 h-4 mr-2" />版本历史</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-6">
                         <Card>
                            <CardHeader><CardTitle>基本信息</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label>标签名称</Label><Input value={formTagName} onChange={(e) => setFormTagName(e.target.value)} /></div>
                                    <div>
                                        <Label>分类</Label>
                                        <Select value={formTagCategory} onValueChange={setFormTagCategory}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div><Label>描述</Label><Textarea value={formTagDescription} onChange={(e) => setFormTagDescription(e.target.value)} rows={3} /></div>
                                <div>
                                    <Label>状态</Label>
                                    <Select value={formTagStatus} onValueChange={(v) => setFormTagStatus(v as any)}>
                                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="启用"><span className="flex items-center gap-2"><Power className="w-4 h-4 text-green-600"/>启用</span></SelectItem>
                                            <SelectItem value="禁用"><span className="flex items-center gap-2"><Power className="w-4 h-4 text-gray-400"/>禁用</span></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                         </Card>
                    </TabsContent>
                    
                    <TabsContent value="rules" className="space-y-6">
                         {/* 复用规则编辑逻辑 */}
                         <Card>
                            <CardHeader><div className="flex justify-between"><CardTitle>规则条件</CardTitle><Button size="sm" variant="outline" onClick={addRule}>添加条件</Button></div></CardHeader>
                            <CardContent className="space-y-4">
                                {formRules.map((rule) => (
                                    <div key={rule.id} className="flex items-end gap-3 p-4 border rounded-lg bg-gray-50">
                                        <div className="flex-1 grid grid-cols-3 gap-3">
                                            <div><Label className="text-sm">字段</Label><Select value={rule.field} onValueChange={(v) => updateRule(rule.id, 'field', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FIELDS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select></div>
                                            <div><Label className="text-sm">运算符</Label><Select value={rule.operator} onValueChange={(v) => updateRule(rule.id, 'operator', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{OPERATORS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                                            <div><Label className="text-sm">值</Label><Input value={rule.value} onChange={(e) => updateRule(rule.id, 'value', e.target.value)} /></div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => removeRule(rule.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                    </div>
                                ))}
                            </CardContent>
                         </Card>
                    </TabsContent>

                    <TabsContent value="history">
                         <Table>
                             <TableHeader><TableRow><TableHead>版本</TableHead><TableHead>时间</TableHead><TableHead>修改内容</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
                             <TableBody>
                                 {mockVersionHistory.map(v => (
                                     <TableRow key={v.version}>
                                         <TableCell>v{v.version}</TableCell>
                                         <TableCell>{v.updateTime}</TableCell>
                                         <TableCell>{v.changes.join(', ')}</TableCell>
                                         <TableCell className="text-right"><Button variant="ghost" size="sm" disabled={v.version === 3}>恢复</Button></TableCell>
                                     </TableRow>
                                 ))}
                             </TableBody>
                         </Table>
                    </TabsContent>
                </Tabs>
                </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>取消</Button>
                <Button onClick={handleSaveEdit}><Save className="w-4 h-4 mr-2" />保存修改</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. 查看标签 Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-[1400px] sm:max-w-[1400px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
                <DialogTitle>标签详情</DialogTitle>
                <DialogDescription>
                  查看标签的详细信息、覆盖人员列表和统计数据
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-4">
                {selectedTag && (
                    <div className="space-y-4">
                        {/* 头部信息卡片 - 渐变色设计 */}
                        <Card className="border-none shadow-sm overflow-hidden">
                          <div className={`p-6 text-white ${
                            selectedTag.riskLevel === 'High' ? 'bg-gradient-to-r from-red-600 to-red-500' :
                            selectedTag.riskLevel === 'Medium' ? 'bg-gradient-to-r from-orange-600 to-orange-500' :
                            'bg-gradient-to-r from-blue-600 to-blue-500'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Tag className="w-6 h-6" />
                                  <h2 className="text-2xl font-bold">{selectedTag.name}</h2>
                                </div>
                                <p className="text-white/90 text-sm mb-4">{selectedTag.description}</p>
                                <div className="flex flex-wrap gap-2">
                                  <Badge className="bg-white/20 hover:bg-white/30 border-white/30 text-white">
                                    {selectedTag.type}
                                  </Badge>
                                  <Badge className="bg-white/20 hover:bg-white/30 border-white/30 text-white">
                                    {selectedTag.category}
                                  </Badge>
                                  <Badge className={`${selectedTag.status === '启用' ? 'bg-green-500/30 border-green-400/50' : 'bg-gray-500/30 border-gray-400/50'} text-white`}>
                                    {selectedTag.status}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-white/70 mb-1">风险等级</div>
                                <div className="text-lg font-bold">{getRiskLabel(selectedTag.riskLevel)}</div>
                              </div>
                            </div>
                          </div>

                          {/* 统计数据 */}
                          <div className="grid grid-cols-4 divide-x divide-gray-100 bg-white">
                            <div className="p-4 text-center">
                              <div className="text-2xl font-bold text-gray-900">{selectedTag.coverageCount.toLocaleString()}</div>
                              <div className="text-xs text-gray-500 mt-1">覆盖人数</div>
                            </div>
                            <div className="p-4 text-center">
                              <div className="text-2xl font-bold text-green-600">{((selectedTag.coverageCount/5000)*100).toFixed(1)}%</div>
                              <div className="text-xs text-gray-500 mt-1">占总人口</div>
                            </div>
                            <div className="p-4 text-center">
                              <div className="text-lg font-bold text-blue-600">{selectedTag.updateTime.split(' ')[0]}</div>
                              <div className="text-xs text-gray-500 mt-1">最后更新</div>
                            </div>
                            <div className="p-4 text-center">
                              <div className="text-lg font-bold text-purple-600">{selectedTag.creator}</div>
                              <div className="text-xs text-gray-500 mt-1">创建人</div>
                            </div>
                          </div>
                        </Card>

                        {/* 标签条件 */}
                        {selectedTag.type === '规则标签' && selectedTag.rules && selectedTag.rules.length > 0 && (
                          <Card className="border-none shadow-sm">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-blue-600" />
                                标签条件
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap gap-2">
                                {selectedTag.rules.map((rule, idx) => (
                                  <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {rule}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {selectedTag.type === '智能标签' && selectedTag.judgmentCriteria && (
                          <Card className="border-none shadow-sm">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                判定描述
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-700">{selectedTag.judgmentCriteria}</p>
                            </CardContent>
                          </Card>
                        )}

                        {/* 覆盖人员列表 */}
                        <Card className="border-none shadow-sm">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Users className="w-4 h-4 text-purple-600" />
                                覆盖人员列表
                                <Badge variant="secondary" className="ml-1">{getCoveredPersonsByTag(selectedTag).length}</Badge>
                              </CardTitle>
                              <div className="flex gap-2">
                                <Input placeholder="搜索人员..." className="h-8 w-48 text-sm" />
                                <Button variant="outline" size="sm" className="h-8">
                                  <Download className="w-3 h-3 mr-1" />
                                  导出
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="border rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gray-50">
                                    <TableHead className="font-semibold">姓名</TableHead>
                                    <TableHead className="font-semibold">性别</TableHead>
                                    <TableHead className="font-semibold">年龄</TableHead>
                                    <TableHead className="font-semibold">联系电话</TableHead>
                                    <TableHead className="font-semibold">地址</TableHead>
                                    <TableHead className="font-semibold">匹配原因</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {getCoveredPersonsByTag(selectedTag).map(p => (
                                    <TableRow key={p.id} className="hover:bg-gray-50">
                                      <TableCell className="font-medium">{p.name}</TableCell>
                                      <TableCell>{p.gender}</TableCell>
                                      <TableCell>{p.age}岁</TableCell>
                                      <TableCell className="text-sm text-gray-600">{p.phone}</TableCell>
                                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">{p.address}</TableCell>
                                      <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                          {p.matchReason.map((r, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                              {r}
                                            </Badge>
                                          ))}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>

                        {/* 基本信息 */}
                        <Card className="border-none shadow-sm">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <History className="w-4 h-4 text-gray-600" />
                              基本信息
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                  <Calendar className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-xs text-gray-500 mb-1">创建时间</div>
                                  <div className="text-sm font-medium text-gray-900">{selectedTag.createTime}</div>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                  <Calendar className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-xs text-gray-500 mb-1">更新时间</div>
                                  <div className="text-sm font-medium text-gray-900">{selectedTag.updateTime}</div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                    </div>
                )}
            </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}