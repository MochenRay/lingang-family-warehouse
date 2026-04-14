import React, { useState } from 'react';
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { FileText, Download, Plus, Clock, Loader2, CheckCircle, FileBarChart, CalendarDays, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { toast } from "sonner";

// 模拟历史报表数据
const INITIAL_REPORTS = [
  { id: 1, name: '2025年12月综治工作月报', date: '2026-01-05', size: '2.4MB', type: 'PDF', status: 'completed' },
  { id: 2, name: '2025Q4流动人口专项分析', date: '2025-12-25', size: '1.1MB', type: 'Excel', status: 'completed' },
  { id: 3, name: '重点关爱人群排查表_1215', date: '2025-12-15', size: '450KB', type: 'CSV', status: 'completed' },
];

export function DataReports() {
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState({
    type: 'monthly',
    time: '2025-12',
    modules: ['population', 'risk']
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    // 模拟生成过程
    setTimeout(() => {
      setIsGenerating(false);
      const newReport = {
        id: Date.now(),
        name: `${config.time} ${config.type === 'monthly' ? '月度报表' : '专项分析'}`,
        date: new Date().toISOString().split('T')[0],
        size: '1.5MB',
        type: 'PDF',
        status: 'completed'
      };
      setReports([newReport, ...reports]);
      toast.success("报表生成成功", { description: "已添加到历史报表列表" });
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">报表中心</h2>
          <p className="text-muted-foreground">一键生成标准化统计报表，支持自定义维度与历史归档。</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：报表生成向导 */}
        <Card className="lg:col-span-1 border-blue-100 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              新建报表任务
            </CardTitle>
            <CardDescription>三步配置生成新的统计文档</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* 1. 报表类型 */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                1. 选择报表类型
              </Label>
              <Select defaultValue="monthly" onValueChange={(v) => setConfig({...config, type: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">月度综治报表</SelectItem>
                  <SelectItem value="quarterly">季度分析报告</SelectItem>
                  <SelectItem value="yearly">年度总结报告</SelectItem>
                  <SelectItem value="special">专项排查清单</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 2. 时间范围 */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-500" />
                2. 统计时间范围
              </Label>
              <Select defaultValue="2025-12" onValueChange={(v) => setConfig({...config, time: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="选择时间" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-12">2025年12月 (本月)</SelectItem>
                  <SelectItem value="2025-11">2025年11月 (上月)</SelectItem>
                  <SelectItem value="2025-Q4">2025年第四季度</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3. 包含模块 */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-500" />
                3. 包含数据模块 (多选)
              </Label>
              <div className="grid grid-cols-1 gap-2 border rounded-md p-3 bg-white">
                <div className="flex items-center space-x-2">
                  <Checkbox id="mod1" defaultChecked />
                  <label htmlFor="mod1" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    人口变动概览
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="mod2" defaultChecked />
                  <label htmlFor="mod2" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    重点人群动态监测
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="mod3" />
                  <label htmlFor="mod3" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    网格事件处置效能
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="mod4" />
                  <label htmlFor="mod4" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    房屋租赁与安全隐患
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <FileBarChart className="mr-2 h-4 w-4" />
                  立即生成报表
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* 右侧：历史报表列表 */}
        <div className="lg:col-span-2 space-y-6">
           {/* 常用快捷入口 */}
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { title: "下载最新月报", desc: "6月综治月报", icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
                { title: "流动人口台账", desc: "实时Excel导出", icon: FileBarChart, color: "text-green-600", bg: "bg-green-50" },
                { title: "重点人员清单", desc: "本周更新", icon: Layers, color: "text-orange-600", bg: "bg-orange-50" },
                { title: "空房排查表", desc: "网格员专用", icon: CalendarDays, color: "text-purple-600", bg: "bg-purple-50" },
              ].map((item, i) => (
                <div key={i} className={`flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all hover:scale-105 hover:shadow-md ${item.bg} border-transparent hover:border-gray-200`}>
                  <item.icon className={`w-8 h-8 mb-2 ${item.color}`} />
                  <span className="text-sm font-bold text-gray-800">{item.title}</span>
                  <span className="text-xs text-gray-500 mt-1">{item.desc}</span>
                </div>
              ))}
           </div>

           {/* 历史列表 */}
           <Card>
             <CardHeader>
               <CardTitle>历史报表归档</CardTitle>
               <CardDescription>近一年生成的各类统计报表记录</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-1">
                 {reports.map((file) => (
                   <div key={file.id} className="group flex items-center justify-between p-4 rounded-lg border border-transparent hover:border-gray-100 hover:bg-slate-50 transition-all">
                     <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm
                         ${file.type === 'PDF' ? 'bg-red-50 text-red-600' : 
                           file.type === 'Excel' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                         {file.type}
                       </div>
                       <div>
                         <div className="font-semibold text-gray-900 mb-1">{file.name}</div>
                         <div className="flex items-center gap-3 text-xs text-gray-500">
                           <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {file.date}</span>
                           <span>•</span>
                           <span>{file.size}</span>
                           <span>•</span>
                           <span className="flex items-center gap-1 text-green-600">
                             <CheckCircle className="w-3 h-3" /> 生成成功
                           </span>
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button variant="outline" size="sm">预览</Button>
                       <Button size="sm">
                         <Download className="w-4 h-4 mr-1" /> 下载
                       </Button>
                     </div>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
