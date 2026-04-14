import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { ChartCard } from '../statistics/ChartCard';
import { RegionFilter } from '../statistics/RegionFilter';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

export function MigrationTrends() {
  const [mounted, setMounted] = useState(false);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [stats, setStats] = useState({ in: 0, out: 0, net: 0 });

  useEffect(() => {
    setMounted(true);
    const loadData = () => {
      const history = db.getHousingHistory();
      const people = db.getPeople(); // Use people for 'current' move-ins if needed
      
      // We will focus on 2025 since most seed data is around then
      const targetYear = 2025; 
      const months = Array.from({ length: 12 }, (_, i) => ({
        month: `${i + 1}月`,
        in: 0,
        out: 0
      }));

      // Process Housing History
      history.forEach(h => {
        // Parse "YYYY-MM-DD ~ YYYY-MM-DD"
        const parts = h.period.split('~').map(s => s.trim());
        if (parts.length > 0) {
          const startDate = new Date(parts[0]);
          if (startDate.getFullYear() === targetYear) {
            months[startDate.getMonth()].in++;
          }
        }
        if (parts.length > 1 && parts[1]) {
          const endDate = new Date(parts[1]);
          if (endDate.getFullYear() === targetYear) {
            months[endDate.getMonth()].out++;
          }
        }
      });

      // Also consider current residents 'updatedAt' as 'move in' if broadly interpreted for '2025'
      people.forEach(p => {
        const date = new Date(p.updatedAt);
        if (date.getFullYear() === targetYear) {
           months[date.getMonth()].in++;
        }
      });

      setTrendData(months);

      // Calculate totals for the "Current Month" cards (using Month 1 as proxy for demo or sum)
      // Let's use the sum of the displayed year as "Yearly Total" or just pick Jan/Feb stats
      const totalIn = months.reduce((acc, curr) => acc + curr.in, 0);
      const totalOut = months.reduce((acc, curr) => acc + curr.out, 0);
      
      setStats({
        in: totalIn,
        out: totalOut,
        net: totalIn - totalOut
      });
    };
    loadData();
    window.addEventListener('db-change', loadData);
    return () => window.removeEventListener('db-change', loadData);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">人口流动趋势</h2>
          <p className="text-muted-foreground">辖区人口迁入迁出动态监测与分析 (2025年度数据)。</p>
        </div>
        <RegionFilter onChange={() => {}} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ChartCard title="年度总迁入" className="md:col-span-1">
           <div className="flex flex-col items-center justify-center py-6">
             <span className="text-4xl font-bold text-blue-600">{stats.in}</span>
             <span className="text-sm text-muted-foreground mt-2">人次</span>
           </div>
        </ChartCard>
        <ChartCard title="年度总迁出" className="md:col-span-1">
           <div className="flex flex-col items-center justify-center py-6">
             <span className="text-4xl font-bold text-orange-600">{stats.out}</span>
             <span className="text-sm text-muted-foreground mt-2">人次</span>
           </div>
        </ChartCard>
        <ChartCard title="净流入" className="md:col-span-1">
           <div className="flex flex-col items-center justify-center py-6">
             <span className={`text-4xl font-bold ${stats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
               {stats.net > 0 ? '+' : ''}{stats.net}
             </span>
             <span className="text-sm text-muted-foreground mt-2">年度累计</span>
           </div>
        </ChartCard>
      </div>

      <ChartCard title="年度流动趋势对比" description="2025年1-12月迁入与迁出人数变化">
        <div className="h-[400px] w-full" style={{ minHeight: '400px' }}>
         {mounted && (
         <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="month" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="in" name="迁入人数" stroke="#8884d8" fillOpacity={1} fill="url(#colorIn)" />
            <Area type="monotone" dataKey="out" name="迁出人数" stroke="#82ca9d" fillOpacity={1} fill="url(#colorOut)" />
          </AreaChart>
        </ResponsiveContainer>
        )}
        </div>
      </ChartCard>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="迁入来源地 (Top 5)">
          <div className="space-y-4 px-4">
             {/* Mock list */}
             {[
               { name: '山东省-烟台市', value: 35 },
               { name: '黑龙江省-哈尔滨市', value: 28 },
               { name: '山东省-青岛市', value: 22 },
               { name: '吉林省-长春市', value: 15 },
               { name: '河南省-郑州市', value: 10 },
             ].map((item, i) => (
               <div key={i} className="flex items-center justify-between">
                 <span className="text-sm">{item.name}</span>
                 <div className="flex items-center gap-2">
                    <div className="h-2 bg-blue-200 rounded-full w-32 overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${item.value}%` }}></div>
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{item.value}%</span>
                 </div>
               </div>
             ))}
          </div>
        </ChartCard>
        
        <ChartCard title="迁出目的地 (Top 5)">
          <div className="space-y-4 px-4">
             {/* Mock list */}
             {[
               { name: '山东省-济南市', value: 30 },
               { name: '北京市', value: 25 },
               { name: '上海市', value: 20 },
               { name: '山东省-青岛市', value: 15 },
               { name: '广东省-深圳市', value: 10 },
             ].map((item, i) => (
               <div key={i} className="flex items-center justify-between">
                 <span className="text-sm">{item.name}</span>
                 <div className="flex items-center gap-2">
                    <div className="h-2 bg-orange-200 rounded-full w-32 overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: `${item.value}%` }}></div>
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{item.value}%</span>
                 </div>
               </div>
             ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
