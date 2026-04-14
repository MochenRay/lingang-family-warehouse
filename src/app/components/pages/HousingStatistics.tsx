import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Building, Home, Store, Hotel, ClipboardCheck } from "lucide-react";
import { useState, useEffect } from "react";

// Mock Data
const HOUSE_USAGE_DATA = [
  { name: '自住', value: 6500, color: '#3b82f6' },
  { name: '出租', value: 1200, color: '#f59e0b' },
  { name: '空置', value: 350, color: '#94a3b8' },
  { name: '经营', value: 160, color: '#10b981' },
];

const RENTAL_WARNINGS = [
  { name: '群租预警', value: 45, fill: '#ef4444' },
  { name: '频繁换租', value: 28, fill: '#f97316' },
  { name: '人房分离', value: 156, fill: '#8b5cf6' },
];

const GRID_WORKLOAD = [
  { name: '一网格', 走访率: 98, 信息完整度: 95 },
  { name: '二网格', 走访率: 92, 信息完整度: 88 },
  { name: '三网格', 走访率: 100, 信息完整度: 99 },
  { name: '四网格', 走访率: 85, 信息完整度: 90 },
  { name: '五网格', 走访率: 94, 信息完整度: 92 },
  { name: '六网格', 走访率: 96, 信息完整度: 96 },
];

export function HousingStatistics() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">房屋网格画像</h1>
        <p className="text-gray-500">以房管人核心视角，透视房屋利用与网格治理效能</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* House Usage Pie */}
        <Card>
          <CardHeader>
            <CardTitle>房屋用途分布</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
             {mounted && (
             <ResponsiveContainer width="100%" height="100%" minWidth={0}>

                <PieChart>
                  <Pie
                    data={HOUSE_USAGE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {HOUSE_USAGE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
             </ResponsiveContainer>
             )}
             </div>
          </CardContent>
        </Card>

        {/* Rental Warnings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hotel className="w-5 h-5 text-orange-500" />
              出租房治理预警
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
             {mounted && (
             <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={RENTAL_WARNINGS} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} tick={{fontWeight: 'bold'}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                    {RENTAL_WARNINGS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
             )}
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Workload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
            网格员工作效能对比
          </CardTitle>
          <CardDescription>各网格入户走访率与基础信息采集完整度排名</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
          {mounted && (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={GRID_WORKLOAD}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="走访率" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="信息完整度" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { label: '自住房屋', count: 6500, icon: Home, color: 'text-blue-400', bg: 'bg-[var(--color-neutral-02)]', iconBg: 'bg-[var(--color-neutral-03)]' },
           { label: '出租房屋', count: 1200, icon: Hotel, color: 'text-orange-400', bg: 'bg-[var(--color-neutral-02)]', iconBg: 'bg-[var(--color-neutral-03)]' },
           { label: '经营场所', count: 160, icon: Store, color: 'text-green-400', bg: 'bg-[var(--color-neutral-02)]', iconBg: 'bg-[var(--color-neutral-03)]' },
           { label: '空置房屋', count: 350, icon: Building, color: 'text-gray-400', bg: 'bg-[var(--color-neutral-02)]', iconBg: 'bg-[var(--color-neutral-03)]' },
         ].map((item, i) => {
           const Icon = item.icon;
           return (
             <div key={i} className={`p-4 rounded-lg flex items-center gap-4 border border-[var(--color-neutral-03)] ${item.bg}`}>
                <div className={`p-2 rounded-lg ${item.iconBg}`}>
                   <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--color-neutral-11)]">{item.count}</div>
                  <div className="text-sm font-medium text-[var(--color-neutral-08)]">{item.label}</div>
                </div>
             </div>
           )
         })}
      </div>
    </div>
  );
}