import React, { useState, useEffect, useMemo } from 'react';
import { db, Person } from '../../services/db';
import { tagStore } from '../../utils/tagStore';
import { ChartCard } from '../statistics/ChartCard';
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Tag, Users, Sparkles, ShieldCheck, Search, MapPin, Calendar, User, X, Brain, Heart, MessageCircle, Home } from 'lucide-react';

const SMART_CATEGORY_META: Record<string, { icon: React.ElementType; color: string; bg: string; barColor: string }> = {
  '性格特点': { icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50', barColor: '#8b5cf6' },
  '生活习惯': { icon: Heart, color: 'text-green-600', bg: 'bg-green-50', barColor: '#10b981' },
  '社交特征': { icon: MessageCircle, color: 'text-blue-600', bg: 'bg-blue-50', barColor: '#3b82f6' },
  '家庭状况': { icon: Home, color: 'text-orange-600', bg: 'bg-orange-50', barColor: '#f97316' },
};

const COLORS_POOL = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#84cc16', '#06b6d4', '#e11d48', '#7c3aed', '#059669', '#d97706'];

export function PopulationTags() {
  const [mounted, setMounted] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [crossAnalysisResult, setCrossAnalysisResult] = useState<Person[] | null>(null);

  const people = useMemo(() => db.getPeople(), []);
  const allTags = useMemo(() => tagStore.getTags(), []);
  const ruleTags = useMemo(() => allTags.filter(t => t.type === '规则标签'), [allTags]);
  const smartTags = useMemo(() => allTags.filter(t => t.type === '智能标签'), [allTags]);

  // 统计每个标签的实际人数
  const tagPeopleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    people.forEach(p => {
      p.tags?.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return counts;
  }, [people]);

  // 顶部指标
  const totalTagCount = people.reduce((sum, p) => sum + (p.tags?.length || 0), 0);
  const avgTags = people.length > 0 ? (totalTagCount / people.length).toFixed(1) : '0';
  const coverageRate = people.length > 0
    ? ((people.filter(p => p.tags && p.tags.length > 0).length / people.length) * 100).toFixed(1)
    : '0';

  // Top 15 标签
  const top15Tags = useMemo(() => {
    return Object.entries(tagPeopleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, value], i) => ({ name, value, fill: COLORS_POOL[i % COLORS_POOL.length] }));
  }, [tagPeopleCounts]);

  // 规则标签 vs 智能标签按人次统计
  const typeDistribution = useMemo(() => {
    const ruleNames = new Set(ruleTags.map(t => t.name));
    const smartNames = new Set(smartTags.map(t => t.name));
    let ruleCount = 0, smartCount = 0, otherCount = 0;
    people.forEach(p => {
      p.tags?.forEach(t => {
        if (ruleNames.has(t)) ruleCount++;
        else if (smartNames.has(t)) smartCount++;
        else otherCount++;
      });
    });
    const result = [
      { name: '规则标签', value: ruleCount, fill: '#3b82f6' },
      { name: '智能标签', value: smartCount, fill: '#8b5cf6' },
    ];
    if (otherCount > 0) result.push({ name: '其他', value: otherCount, fill: '#9ca3af' });
    return result;
  }, [people, ruleTags, smartTags]);

  // 规则标签按 category 分组统计
  const ruleCategoryData = useMemo(() => {
    const catCounts: Record<string, number> = {};
    const ruleNameToCategory: Record<string, string> = {};
    ruleTags.forEach(t => { ruleNameToCategory[t.name] = t.category; });
    people.forEach(p => {
      p.tags?.forEach(t => {
        const cat = ruleNameToCategory[t];
        if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1;
      });
    });
    return Object.entries(catCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [people, ruleTags]);

  // 风险等级
  const riskLevelData = useMemo(() => {
    const levels = { High: 0, Medium: 0, Low: 0 };
    people.forEach(p => {
      if (p.risk === 'High') levels.High++;
      else if (p.risk === 'Medium') levels.Medium++;
      else levels.Low++;
    });
    return [
      { name: '高风险', value: levels.High, fill: '#ef4444' },
      { name: '中风险', value: levels.Medium, fill: '#eab308' },
      { name: '低风险', value: levels.Low, fill: '#22c55e' },
    ];
  }, [people]);

  // 智能标签按4个分类统计
  const smartCategoryStats = useMemo(() => {
    const smartNameToCategory: Record<string, string> = {};
    smartTags.forEach(t => { smartNameToCategory[t.name] = t.category; });

    const categories: Record<string, Record<string, number>> = {};
    smartTags.forEach(t => {
      if (!categories[t.category]) categories[t.category] = {};
      categories[t.category][t.name] = 0;
    });
    people.forEach(p => {
      p.tags?.forEach(t => {
        const cat = smartNameToCategory[t];
        if (cat && categories[cat]) {
          categories[cat][t] = (categories[cat][t] || 0) + 1;
        }
      });
    });

    return Object.entries(categories).map(([category, tagCounts]) => {
      const tags = Object.entries(tagCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
      const totalPeople = new Set(
        people.filter(p => p.tags?.some(t => smartNameToCategory[t] === category)).map(p => p.id)
      ).size;
      return { category, tags, totalPeople, tagCount: tags.length };
    });
  }, [people, smartTags]);

  // 交叉分析标签选择器数据
  const tagSelectorGroups = useMemo(() => {
    const groups: Record<string, { type: string; tags: { id: string; name: string; category: string }[] }> = {};
    allTags.forEach(t => {
      const key = `${t.type} - ${t.category}`;
      if (!groups[key]) groups[key] = { type: t.type, tags: [] };
      groups[key].tags.push({ id: t.id, name: t.name, category: t.category });
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [allTags]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (selectedTags.length === 0) {
      setCrossAnalysisResult(null);
      return;
    }
    const result = people.filter(p => selectedTags.every(tag => p.tags?.includes(tag)));
    setCrossAnalysisResult(result);
  }, [selectedTags, people]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">标签分析画像</h2>
        <p className="text-muted-foreground">基于规则标签与智能标签的多维度人群分析。</p>
      </div>

      {/* 顶部指标 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">规则标签数</p>
              <div className="text-2xl font-bold mt-1">{ruleTags.length}</div>
            </div>
            <div className="p-3 rounded-full bg-blue-50">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">智能标签数</p>
              <div className="text-2xl font-bold mt-1">{smartTags.length}</div>
            </div>
            <div className="p-3 rounded-full bg-purple-50">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">人均标签数</p>
              <div className="text-2xl font-bold mt-1">{avgTags}</div>
            </div>
            <div className="p-3 rounded-full bg-green-50">
              <Tag className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">标签覆盖率</p>
              <div className="text-2xl font-bold mt-1">{coverageRate}%</div>
            </div>
            <div className="p-3 rounded-full bg-amber-50">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 标签多维视图 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">标签总览</TabsTrigger>
          <TabsTrigger value="rule">规则标签分析</TabsTrigger>
          <TabsTrigger value="smart">智能标签分析</TabsTrigger>
        </TabsList>

        {/* Tab 1: 标签总览 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <ChartCard title="标签分布 Top 15" description="按人数排名的前15个标签" className="lg:col-span-4">
              <div className="h-[420px] w-full">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={top15Tags} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [`${value} 人`, '覆盖人数']}
                      />
                      <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                        {top15Tags.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
            <ChartCard title="标签类型占比" description="规则标签 vs 智能标签（按人次）" className="lg:col-span-3">
              <div className="h-[420px] w-full">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={typeDistribution}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {typeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} 人次`, '标签人次']} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        {/* Tab 2: 规则标签分析 */}
        <TabsContent value="rule" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <ChartCard title="规则标签分类统计" description="按标签分类的覆盖人次" className="lg:col-span-4">
              <div className="h-[350px] w-full">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={ruleCategoryData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12 }} />
                      <Tooltip cursor={{ fill: 'transparent' }} formatter={(value: number) => [`${value} 人次`, '覆盖人次']} />
                      <Bar dataKey="value" fill="#3b82f6" barSize={24} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
            <ChartCard title="风险等级分布" className="lg:col-span-3">
              <div className="h-[350px] w-full">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={riskLevelData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {riskLevelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        {/* Tab 3: 智能标签分析 */}
        <TabsContent value="smart" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {smartCategoryStats.map(({ category, tags, totalPeople, tagCount }) => {
              const meta = SMART_CATEGORY_META[category] || { icon: Tag, color: 'text-gray-600', bg: 'bg-gray-50', barColor: '#6b7280' };
              const Icon = meta.icon;
              const maxCount = tags.length > 0 ? Math.max(...tags.map(t => t.count), 1) : 1;
              return (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${meta.bg}`}>
                          <Icon className={`w-4 h-4 ${meta.color}`} />
                        </div>
                        {category}
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground font-normal">
                        <span>{tagCount} 个标签</span>
                        <span>{totalPeople} 人覆盖</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2.5 max-h-[280px] overflow-y-auto">
                      {tags.map((tag) => (
                        <div key={tag.name} className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{tag.name}</span>
                            <span>{tag.count} 人</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${maxCount > 0 ? (tag.count / maxCount) * 100 : 0}%`,
                                backgroundColor: meta.barColor
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* 交叉分析工具 */}
      <ChartCard title="标签交叉分析工具" description="选择多个标签，分析人群重叠情况">
        <div className="flex flex-col lg:flex-row gap-6 p-2">
          <div className="w-full lg:w-1/4 space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">选择标签（支持多选）</label>

              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-[var(--color-neutral-02)] border border-[var(--color-neutral-03)] rounded-lg">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-sm gap-1 bg-blue-500/20 text-blue-400 border-blue-400/30 hover:bg-blue-500/30"
                    >
                      {tag}
                      <button
                        onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                        className="ml-1 hover:bg-blue-400/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {tagSelectorGroups.map(([groupKey, group]) => (
                  <div key={groupKey} className="space-y-2">
                    <div className="text-xs font-medium text-[var(--color-neutral-08)]">{groupKey}</div>
                    <div className="flex flex-wrap gap-2">
                      {group.tags.map((tag) => {
                        const isSelected = selectedTags.includes(tag.name);
                        return (
                          <Badge
                            key={tag.id}
                            variant={isSelected ? "default" : "outline"}
                            className={`text-xs cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-500 hover:bg-blue-600'
                                : 'hover:bg-[var(--color-neutral-03)]'
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedTags(prev => prev.filter(t => t !== tag.name));
                              } else {
                                setSelectedTags(prev => [...prev, tag.name]);
                              }
                            }}
                          >
                            {tag.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-3/4">
            {crossAnalysisResult && crossAnalysisResult.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="bg-[var(--color-neutral-02)] border-blue-400/30">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400">{crossAnalysisResult.length}</div>
                      <p className="text-xs text-[var(--color-neutral-08)] mt-1">匹配人数</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-[var(--color-neutral-02)] border-purple-400/30">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {crossAnalysisResult.filter(p => p.gender === '男').length}
                      </div>
                      <p className="text-xs text-[var(--color-neutral-08)] mt-1">男性</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-[var(--color-neutral-02)] border-pink-400/30">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-pink-400">
                        {crossAnalysisResult.filter(p => p.gender === '女').length}
                      </div>
                      <p className="text-xs text-[var(--color-neutral-08)] mt-1">女性</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-[var(--color-neutral-02)] border-green-400/30">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {crossAnalysisResult.length > 0 ? Math.floor(crossAnalysisResult.reduce((sum, p) => sum + (p.age || 0), 0) / crossAnalysisResult.length) : 0}
                      </div>
                      <p className="text-xs text-[var(--color-neutral-08)] mt-1">平均年龄</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-[var(--color-neutral-11)]">
                        <Users className="w-4 h-4" />
                        人员列表
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {crossAnalysisResult.slice(0, 10).map((person, idx) => {
                          const houses = db.getHouses();
                          const house = person.houseId ? houses.find(h => h.id === person.houseId) : null;
                          const location = house?.communityName || '未登记';
                          return (
                            <div key={idx} className="flex items-center justify-between p-2 bg-[var(--color-neutral-03)] rounded hover:bg-[var(--color-neutral-04)] transition-colors border border-[var(--color-neutral-04)]">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                                  <User className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-[var(--color-neutral-11)]">{person.name}</p>
                                  <p className="text-xs text-[var(--color-neutral-08)]">{person.age}岁 · {person.gender}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant="outline" className="text-xs bg-[var(--color-neutral-02)] border-[var(--color-neutral-04)] text-[var(--color-neutral-10)]">
                                  {location}
                                </Badge>
                                {person.risk && (
                                  <Badge variant={person.risk === 'High' ? 'destructive' : 'secondary'} className="text-xs">
                                    {person.risk === 'High' ? '高风险' : person.risk === 'Medium' ? '中风险' : '低风险'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {crossAnalysisResult.length > 10 && (
                          <div className="text-center py-2">
                            <Button variant="link" size="sm">查看全部 {crossAnalysisResult.length} 人</Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-[var(--color-neutral-11)]">
                        <Calendar className="w-4 h-4" />
                        年龄分布
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[280px] w-full">
                        {mounted && (
                          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart
                              data={(() => {
                                const ageGroups: Record<string, number> = { '0-17岁': 0, '18-44岁': 0, '45-59岁': 0, '60岁以上': 0 };
                                crossAnalysisResult.forEach(p => {
                                  if (p.age < 18) ageGroups['0-17岁']++;
                                  else if (p.age < 45) ageGroups['18-44岁']++;
                                  else if (p.age < 60) ageGroups['45-59岁']++;
                                  else ageGroups['60岁以上']++;
                                });
                                return Object.entries(ageGroups).map(([name, value]) => ({ name, value }));
                              })()}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-04)" />
                              <XAxis dataKey="name" stroke="var(--color-neutral-08)" />
                              <YAxis stroke="var(--color-neutral-08)" />
                              <Tooltip contentStyle={{ backgroundColor: 'var(--color-neutral-02)', border: '1px solid var(--color-neutral-04)', borderRadius: '8px' }} />
                              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-[var(--color-neutral-11)]">
                        <MapPin className="w-4 h-4" />
                        地区分布
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(() => {
                          const houses = db.getHouses();
                          const locationCounts: Record<string, number> = {};
                          crossAnalysisResult.forEach(p => {
                            const house = p.houseId ? houses.find(h => h.id === p.houseId) : null;
                            const location = house?.communityName || '未登记';
                            locationCounts[location] = (locationCounts[location] || 0) + 1;
                          });
                          return Object.entries(locationCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([location, count], idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm text-[var(--color-neutral-10)]">{location}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-32 h-2 bg-[var(--color-neutral-04)] rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${(count / crossAnalysisResult.length) * 100}%` }} />
                                  </div>
                                  <span className="text-sm font-medium w-8 text-right text-blue-400">{count}</span>
                                </div>
                              </div>
                            ));
                        })()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-[var(--color-neutral-11)]">
                        <Tag className="w-4 h-4" />
                        共同标签TOP5
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(() => {
                          const tagCounts: Record<string, number> = {};
                          crossAnalysisResult.forEach(p => {
                            p.tags?.forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
                          });
                          return Object.entries(tagCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([tag, count], idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <Badge variant="secondary" className="text-xs bg-[var(--color-neutral-03)] border-[var(--color-neutral-04)] text-[var(--color-neutral-10)]">{tag}</Badge>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[var(--color-neutral-08)]">
                                    {((count / crossAnalysisResult.length) * 100).toFixed(0)}%
                                  </span>
                                  <span className="text-sm font-medium text-blue-400">{count}人</span>
                                </div>
                              </div>
                            ));
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" size="sm">
                    <Search className="w-4 h-4 mr-1" />
                    查看详细名单
                  </Button>
                  <Button size="sm">导出分析报告</Button>
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center border rounded-lg bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-[var(--color-neutral-06)]">
                    {selectedTags.length === 0 ? '—' : '0 人'}
                  </div>
                  <p className="text-[var(--color-neutral-08)]">
                    {selectedTags.length === 0 ? '请选择标签开始分析' : '暂无符合条件的人员'}
                  </p>
                  <p className="text-sm text-[var(--color-neutral-07)]">从左侧选择一个或多个标签进行交叉筛选</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
