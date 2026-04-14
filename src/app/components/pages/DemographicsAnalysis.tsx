import React, { useEffect, useState } from 'react';
import { db, Person } from '../../services/db';
import { ChartCard } from '../statistics/ChartCard';
import { RegionFilter } from '../statistics/RegionFilter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, Sector, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Loader2 } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

// Custom Tooltip for dark mode
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1f2937] border border-gray-700 p-2 rounded shadow-lg text-xs text-white">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color || entry.fill }}>
            {entry.name}: {entry.value} ({entry.payload.percent ? `${(entry.payload.percent * 100).toFixed(1)}%` : ''})
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function DemographicsAnalysis() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Force a small delay to ensure container size is calculated
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);

    const loadData = () => {
      const data = db.getPeople();
      setPeople(data);
      setLoading(false);
    };

    // Initial load
    loadData();
    
    // Listen for updates
    window.addEventListener('db-change', loadData);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('db-change', loadData);
    };
  }, []);

  // 1. 性别分布
  const genderData = React.useMemo(() => {
    const counts = { '男': 0, '女': 0 };
    people.forEach(p => {
      const g = p.gender === '男' || p.gender === '女' ? p.gender : '未知';
      if (g !== '未知') counts[g] = (counts[g] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [people]);

  // 2. 年龄结构 (分段)
  const ageData = React.useMemo(() => {
    const groups = {
      '0-14岁': 0,
      '15-59岁': 0,
      '60-79岁': 0,
      '80岁以上': 0
    };
    
    people.forEach(p => {
      if (p.age === undefined) return;
      if (p.age <= 14) groups['0-14岁']++;
      else if (p.age <= 59) groups['15-59岁']++;
      else if (p.age <= 79) groups['60-79岁']++;
      else groups['80岁以上']++;
    });

    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [people]);

  // 3. 民族分布 (Top 5)
  const ethnicityData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    people.forEach(p => {
      const e = p.nation || '未记录';
      counts[e] = (counts[e] || 0) + 1;
    });
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top5 = sorted.slice(0, 5).map(([name, value]) => ({ name, value }));
    const others = sorted.slice(5).reduce((acc, curr) => acc + curr[1], 0);
    
    if (others > 0) {
      top5.push({ name: '其他', value: others });
    }
    
    return top5;
  }, [people]);

  // 4. 教育程度
  const educationData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    people.forEach(p => {
      const e = p.education || '未记录';
      counts[e] = (counts[e] || 0) + 1;
    });
    
    const educationOrder = ['研究生', '本科', '大专', '高中', '初中', '小学', '其他', '未记录'];
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        const indexA = educationOrder.indexOf(a.name);
        const indexB = educationOrder.indexOf(b.name);
        const orderA = indexA === -1 ? educationOrder.length : indexA;
        const orderB = indexB === -1 ? educationOrder.length : indexB;
        return orderA - orderB;
      });
  }, [people]);

  // 5. 年龄深度分析 - 细分年龄段
  const ageDetailData = React.useMemo(() => {
    const groups: Record<string, number> = {};
    for (let i = 0; i <= 100; i += 5) {
      const label = `${i}-${i + 4}岁`;
      groups[label] = 0;
    }
    
    people.forEach(p => {
      if (p.age === undefined) return;
      const groupIndex = Math.floor(p.age / 5) * 5;
      const label = `${groupIndex}-${groupIndex + 4}岁`;
      if (groups[label] !== undefined) {
        groups[label]++;
      }
    });
    
    return Object.entries(groups)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [people]);

  // 6. 人口金字塔数据
  const pyramidData = React.useMemo(() => {
    const ageGroups = ['0-14', '15-24', '25-34', '35-44', '45-54', '55-64', '65-74', '75+'];
    return ageGroups.map(group => {
      const [min, max] = group.split('-').map(s => s === '+' ? 999 : parseInt(s));
      
      const males = people.filter(p => {
        if (!p.age || p.gender !== '男') return false;
        if (max === 999) return p.age >= min;
        return p.age >= min && p.age <= max;
      }).length;
      
      const females = people.filter(p => {
        if (!p.age || p.gender !== '女') return false;
        if (max === 999) return p.age >= min;
        return p.age >= min && p.age <= max;
      }).length;
      
      return {
        ageGroup: group,
        男: -males,
        女: females,
        maleRaw: males,
        femaleRaw: females
      };
    });
  }, [people]);

  // 7. 老龄化指标
  const agingMetrics = React.useMemo(() => {
    const total = people.length;
    const elderly = people.filter(p => p.age && p.age >= 60).length;
    const children = people.filter(p => p.age && p.age < 14).length;
    const workingAge = people.filter(p => p.age && p.age >= 15 && p.age < 60).length;
    
    return {
      agingRate: total > 0 ? ((elderly / total) * 100).toFixed(1) : '0',
      dependencyRatio: workingAge > 0 ? (((elderly + children) / workingAge) * 100).toFixed(1) : '0',
      elderlyDependency: workingAge > 0 ? ((elderly / workingAge) * 100).toFixed(1) : '0',
      childDependency: workingAge > 0 ? ((children / workingAge) * 100).toFixed(1) : '0',
      elderly,
      children,
      workingAge
    };
  }, [people]);

  // 8. 教育与就业
  const educationEmploymentData = React.useMemo(() => {
    const educationLevels = ['研究生', '本科', '大专', '高中', '初中', '小学'];
    return educationLevels.map(edu => {
      const eduPeople = people.filter(p => p.education === edu);
      const total = eduPeople.length;
      const employed = eduPeople.filter(p => {
        if (!p.age) return false;
        if (p.age < 18 || p.age >= 60) return false;
        if (p.tags?.includes('失业人员')) return false;
        return true;
      }).length;
      const unemployed = eduPeople.filter(p => p.tags?.includes('失业人员')).length;
      const student = eduPeople.filter(p => p.tags?.includes('学龄儿童') || (p.age && p.age >= 6 && p.age <= 22)).length;
      const retired = eduPeople.filter(p => p.age && p.age >= 60).length;
      
      return {
        education: edu,
        总人数: total,
        就业: employed,
        失业: unemployed,
        在读: student,
        退休: retired,
        就业率: total > 0 ? ((employed / total) * 100).toFixed(1) : '0'
      };
    }).filter(item => item.总人数 > 0);
  }, [people]);

  // 9. 雷达图
  const educationRadarData = React.useMemo(() => {
    const levels = ['小学', '初中', '高中', '大专', '本科', '研究生'];
    return levels.map(level => {
      const found = educationData.find(d => d.name === level);
      return {
        level,
        人数: found ? found.value : 0,
        fullMark: people.length > 0 ? people.length * 0.5 : 100 // Scale adjustment
      };
    });
  }, [educationData, people]);

  // 10. 年龄-教育交叉
  const ageEducationCrossData = React.useMemo(() => {
    const ageGroups = ['18-25', '26-35', '36-45', '46-55', '56-65'];
    const educationLevels = ['本科及以上', '大专', '高中', '初中及以下'];
    
    return ageGroups.map(group => {
      const [min, max] = group.split('-').map(n => parseInt(n));
      const groupPeople = people.filter(p => p.age && p.age >= min && p.age <= max);
      const result: any = { ageGroup: group };
      educationLevels.forEach(level => {
        let count = 0;
        groupPeople.forEach(p => {
          if (level === '本科及以上' && (p.education === '本科' || p.education === '研究生')) count++;
          else if (level === '大专' && p.education === '大专') count++;
          else if (level === '高中' && p.education === '高中') count++;
          else if (level === '初中及以下' && (p.education === '初中' || p.education === '小学')) count++;
        });
        result[level] = count;
      });
      return result;
    });
  }, [people]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">人口特征分析</h2>
          <p className="text-muted-foreground">当前辖区共 {people.length} 人。多维度分析人口基础属性结构。</p>
        </div>
        <RegionFilter onChange={() => {}} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="age">年龄深度分析</TabsTrigger>
          <TabsTrigger value="education">教育与就业</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="性别比例" info="辖区总人口的性别构成">
              <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
                {mounted && people.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#ec4899'} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-gray-500">暂无数据</div>}
              </div>
            </ChartCard>

            <ChartCard title="年龄结构" info="按标准人口统计学分段">
              <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
                {mounted && people.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                    <BarChart data={ageData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={70} tick={{fill: '#9CA3AF', fontSize: 12}} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={24}>
                         {ageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-gray-500">暂无数据</div>}
              </div>
            </ChartCard>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
             <ChartCard title="民族构成">
              <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
                {mounted && people.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                    <BarChart data={ethnicityData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                      <XAxis dataKey="name" tick={{fill: '#9CA3AF'}} />
                      <YAxis tick={{fill: '#9CA3AF'}} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-gray-500">暂无数据</div>}
              </div>
            </ChartCard>
             <ChartCard title="教育程度">
              <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
                {mounted && people.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                    <BarChart data={educationData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                       <XAxis dataKey="name" tick={{fill: '#9CA3AF', fontSize: 11}} interval={0} />
                       <YAxis tick={{fill: '#9CA3AF'}} />
                       <Tooltip content={<CustomTooltip />} />
                       <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-gray-500">暂无数据</div>}
              </div>
            </ChartCard>
          </div>
        </TabsContent>
        
        <TabsContent value="age" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
             <Card><CardHeader className="pb-3"><CardDescription>老龄化率</CardDescription><CardTitle className="text-3xl">{agingMetrics.agingRate}%</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">60岁及以上占比</p></CardContent></Card>
             <Card><CardHeader className="pb-3"><CardDescription>总抚养比</CardDescription><CardTitle className="text-3xl">{agingMetrics.dependencyRatio}%</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">非劳动力/劳动力</p></CardContent></Card>
             <Card><CardHeader className="pb-3"><CardDescription>老年抚养比</CardDescription><CardTitle className="text-3xl">{agingMetrics.elderlyDependency}%</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">老年/劳动力</p></CardContent></Card>
             <Card><CardHeader className="pb-3"><CardDescription>少儿抚养比</CardDescription><CardTitle className="text-3xl">{agingMetrics.childDependency}%</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">少儿/劳动力</p></CardContent></Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="人口金字塔" info="按性别和年龄段分布">
              <div className="h-[400px] w-full" style={{ minHeight: '400px' }}>
                {mounted && people.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                    <BarChart data={pyramidData} layout="vertical" stackOffset="sign" margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                      <XAxis type="number" tick={{fill: '#9CA3AF'}} />
                      <YAxis dataKey="ageGroup" type="category" width={50} tick={{fill: '#9CA3AF'}} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar name="男" dataKey="男" fill="#3b82f6" stackId="stack" barSize={20} radius={[4, 0, 0, 4]} />
                      <Bar name="女" dataKey="女" fill="#ec4899" stackId="stack" barSize={20} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-gray-500">暂无数据</div>}
              </div>
            </ChartCard>

            <ChartCard title="细分年龄分布" info="按5岁年龄段统计">
              <div className="h-[400px] w-full" style={{ minHeight: '400px' }}>
                {mounted && people.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                    <AreaChart data={ageDetailData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 10, fill: '#9CA3AF' }} interval={0} />
                      <YAxis tick={{fill: '#9CA3AF'}} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="人数" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-gray-500">暂无数据</div>}
              </div>
            </ChartCard>
          </div>
        </TabsContent>
        
        <TabsContent value="education" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="教育程度雷达图" info="各学历层次人口分布">
              <div className="h-[350px] w-full" style={{ minHeight: '350px' }}>
                {mounted && people.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={educationRadarData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="level" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#9CA3AF' }} />
                      <Radar name="人数" dataKey="人数" stroke="#8884d8" fill="#8884d8" fillOpacity={0.5} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-gray-500">暂无数据</div>}
              </div>
            </ChartCard>

            <ChartCard title="年龄-教育交叉分析" info="不同年龄段的学历分布">
               <div className="h-[350px] w-full" style={{ minHeight: '350px' }}>
                {mounted && people.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                    <BarChart data={ageEducationCrossData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                      <XAxis dataKey="ageGroup" tick={{fill: '#9CA3AF'}} />
                      <YAxis tick={{fill: '#9CA3AF'}} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="本科及以上" stackId="a" fill="#8b5cf6" />
                      <Bar dataKey="大专" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="高中" stackId="a" fill="#10b981" />
                      <Bar dataKey="初中及以下" stackId="a" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-gray-500">暂无数据</div>}
              </div>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
