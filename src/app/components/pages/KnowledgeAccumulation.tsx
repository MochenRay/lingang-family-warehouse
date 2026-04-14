import { useState } from 'react';
import { 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Mic, 
  Newspaper,
  Plus,
  Download,
  MoreVertical,
  Eye,
  Trash2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

// Mock Data
const repositoryData = [
  {
    id: 1,
    title: "2025年第四季度社区民情分析报告.pdf",
    type: "document",
    category: "工作总结",
    size: "2.4 MB",
    uploadDate: "2025-12-20",
    author: "张书记",
    tags: ["季度报告", "民情分析"]
  },
  {
    id: 2,
    title: "关于加强社区老年人关爱服务的会议记录",
    type: "meeting",
    category: "会议记录",
    size: "15 KB",
    uploadDate: "2025-12-18",
    author: "王干事",
    tags: ["养老服务", "会议纪要"]
  },
  {
    id: 3,
    title: "3号楼1单元电梯故障现场照片.jpg",
    type: "image",
    category: "图片",
    size: "3.5 MB",
    uploadDate: "2025-12-15",
    author: "李网格",
    tags: ["物业报修", "现场取证"]
  },
  {
    id: 4,
    title: "公众号文章：如何预防电信诈骗（转自平安威海）",
    type: "article",
    category: "公众号文章",
    size: "-",
    uploadDate: "2025-12-12",
    author: "系统采集",
    tags: ["反诈宣传", "安全教育"]
  },
  {
    id: 5,
    title: "独居老人李大爷走访记录.docx",
    type: "document",
    category: "文档",
    size: "450 KB",
    uploadDate: "2025-12-10",
    author: "赵敏",
    tags: ["走访记录", "重点人员"]
  }
];

export function KnowledgeAccumulation() {
  const getIconByType = (type: string) => {
    switch(type) {
      case 'document': return <FileText className="w-5 h-5 text-[#4E86DF]" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-[#8B3BCC]" />;
      case 'meeting': return <Mic className="w-5 h-5 text-[#D6730D]" />;
      case 'article': return <Newspaper className="w-5 h-5 text-[#19B172]" />;
      default: return <FileText className="w-5 h-5 text-[var(--color-neutral-08)]" />;
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-neutral-11)]">知识沉淀</h1>
          <p className="text-sm text-[var(--color-neutral-08)] mt-1">
            非结构化数据沉淀与管理中心
          </p>
        </div>
        <Button size="sm" className="gap-2 h-8 bg-[#2761CB] hover:bg-[#4E86DF] text-white border-0 rounded-sm">
            <Plus className="w-4 h-4" /> 上传资料
        </Button>
      </div>

      <div className="flex flex-col h-full gap-4 flex-1 overflow-hidden">
        {/* 筛选栏 */}
        <div className="flex items-center gap-3 bg-[var(--color-neutral-02)] p-4 rounded-md border border-[var(--color-neutral-03)] shadow-sm">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-neutral-08)]" />
            <Input 
              placeholder="搜索文件名、内容或标签..." 
              className="pl-9 bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)] text-[var(--color-neutral-10)] placeholder:text-[var(--color-neutral-08)]" 
            />
          </div>
          <Separator orientation="vertical" className="h-6 bg-[var(--color-neutral-03)]" />
          <div className="flex gap-2">
              {['全部', '文档', '图片', '会议记录', '公众号文章'].map(cat => (
                <Badge 
                  key={cat} 
                  variant="secondary" 
                  className="cursor-pointer bg-[var(--color-neutral-03)] hover:bg-[rgba(78,134,223,0.15)] hover:text-[#4E86DF] text-[var(--color-neutral-10)] border-0 font-normal transition-colors"
                >
                    {cat}
                </Badge>
              ))}
          </div>
        </div>

        {/* 文件列表 */}
        <ScrollArea className="flex-1 bg-[var(--color-neutral-02)] rounded-md border border-[var(--color-neutral-03)] shadow-sm">
          <div className="p-4 grid gap-3">
            {repositoryData.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center gap-4 p-4 rounded-md border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] hover:bg-[rgba(78,134,223,0.05)] hover:border-[rgba(78,134,223,0.3)] transition-all group"
              >
                <div className="p-2 bg-[var(--color-neutral-03)] rounded-md shrink-0">
                    {getIconByType(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-[var(--color-neutral-11)] truncate" title={item.title}>
                            {item.title}
                        </h4>
                        <Badge variant="outline" className="text-xs h-5 border-[var(--color-neutral-03)] text-[var(--color-neutral-08)]">{item.category}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--color-neutral-08)]">
                        <span>{item.size}</span>
                        <span>上传于 {item.uploadDate}</span>
                        <span>上传人: {item.author}</span>
                        <div className="flex gap-1">
                            {item.tags.map(tag => (
                                <span key={tag} className="bg-[var(--color-neutral-03)] px-1.5 py-0.5 rounded text-[var(--color-neutral-10)]">#{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" title="预览" className="hover:bg-[var(--color-neutral-03)] hover:text-[#4E86DF]">
                        <Eye className="w-4 h-4 text-[var(--color-neutral-08)]" />
                    </Button>
                    <Button variant="ghost" size="icon" title="下载" className="hover:bg-[var(--color-neutral-03)] hover:text-[#4E86DF]">
                        <Download className="w-4 h-4 text-[var(--color-neutral-08)]" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-[var(--color-neutral-03)]">
                                <MoreVertical className="w-4 h-4 text-[var(--color-neutral-08)]" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
                            <DropdownMenuItem className="text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]">编辑属性</DropdownMenuItem>
                            <DropdownMenuItem className="text-[#D52132] hover:bg-[rgba(213,33,50,0.1)] hover:text-[#E7484F]">删除文件</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}