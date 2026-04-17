import { useState } from 'react';
import { Upload, Download, FileSpreadsheet, CircleX, CircleAlert, FileText, History, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';

type ImportStatus = '待校验' | '成功' | '部分失败' | '失败';

// 导入记录类型
interface ImportRecord {
  id: string;
  fileName: string;
  type: '人口数据' | '房屋数据' | '人房关系';
  totalRows: number | null;
  successRows: number | null;
  failedRows: number | null;
  status: ImportStatus;
  importTime: string;
  operator: string;
}

// 错误详情类型
interface ErrorDetail {
  row: number;
  field: string;
  value: string;
  error: string;
}

const initialImportHistory: ImportRecord[] = [
  {
    id: '1',
    fileName: '人口信息导入_2026年1月.xlsx',
    type: '人口数据',
    totalRows: 1000,
    successRows: 980,
    failedRows: 20,
    status: '部分失败',
    importTime: '2026-01-15 10:30:00',
    operator: '张管理员'
  },
  {
    id: '2',
    fileName: '房屋信息导入_A区.xlsx',
    type: '房屋数据',
    totalRows: 500,
    successRows: 500,
    failedRows: 0,
    status: '成功',
    importTime: '2026-01-10 14:20:00',
    operator: '李管理员'
  },
  {
    id: '3',
    fileName: '人房关系导入_2026Q1.xlsx',
    type: '人房关系',
    totalRows: 800,
    successRows: 750,
    failedRows: 50,
    status: '部分失败',
    importTime: '2026-01-05 09:15:00',
    operator: '王管理员'
  },
  {
    id: '4',
    fileName: '人口信息更新_12月.xlsx',
    type: '人口数据',
    totalRows: 600,
    successRows: 600,
    failedRows: 0,
    status: '成功',
    importTime: '2023-12-28 16:45:00',
    operator: '李管理员'
  }
];

// 导入配置数据
const importConfigs = {
  '人口数据': {
    title: '人口数据导入',
    description: '批量导入人员的基本信息、联系方式、居住类型等数据',
    requiredFields: ['姓名', '身份证号', '性别', '年龄', '电话', '详细地址'],
    notes: [
      '支持 .xlsx 和 .xls 格式的Excel文件',
      '单次导入最多支持 10,000 条数据',
      '身份证号需为18位，电话号码需为11位',
      '导入过程中请勿关闭页面',
      '支持覆盖更新已有人员信息'
    ]
  },
  '房屋数据': {
    title: '房屋数据导入',
    description: '批量导入楼栋、单元、房间等房屋信息',
    requiredFields: ['楼栋名称', '单元名称', '房间号', '楼层', '面积'],
    notes: [
      '支持楼栋-单元-房间三层结构数据导入',
      '房屋状态可选：已入住、空置、出租',
      '面积单位为平方米，需为正数',
      '楼层支持负数（地下层）',
      '同一房间重复导入会覆盖原有数据'
    ]
  },
  '人房关系': {
    title: '人房关系导入',
    description: '批量导入人员与房屋的绑定关系',
    requiredFields: ['人员身份证号', '房屋地址', '关系类型', '人房关系', '入住时间'],
    notes: [
      '人员和房屋必须已存在于系统中',
      '关系类型：现居/历史',
      '人房关系：业主/家属/租客/其他',
      '历史关系需填写迁出时间',
      '一人可以关联多个房屋'
    ]
  }
};

const templateSampleRows: Record<'人口数据' | '房屋数据' | '人房关系', string[]> = {
  '人口数据': ['张三,370102199001011234,男,35,13800138000,海源一品1号楼1单元101'],
  '房屋数据': ['海源一品,1号楼,1单元,101,6,89'],
  '人房关系': ['370102199001011234,海源一品1号楼1单元101,现居,业主,2023-01-01'],
};

function formatNow(): string {
  return new Date()
    .toLocaleString('zh-CN', { hour12: false })
    .replace(/\//g, '-');
}

function downloadTextFile(filename: string, content: string, mimeType = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function BatchImport() {
  const [importHistory, setImportHistory] = useState<ImportRecord[]>(initialImportHistory);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'人口数据' | '房屋数据' | '人房关系'>('人口数据');
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedErrorRecord, setSelectedErrorRecord] = useState<string | null>(null);
  const [latestSubmissionId, setLatestSubmissionId] = useState<string | null>(null);
  const [errorDetails] = useState<Record<string, ErrorDetail[]>>({
    '1': [
      { row: 15, field: '身份证号', value: '37000019900101', error: '身份证号格式错误，应为18位' },
      { row: 23, field: '电话', value: '138001380', error: '电话号码格式错误，应为11位' },
      { row: 45, field: '年龄', value: '-5', error: '年龄不能为负数' },
      { row: 67, field: '性别', value: '未知', error: '性别只能为：男、女' },
      { row: 89, field: '详细地址', value: '', error: '详细地址不能为空' }
    ],
    '3': [
      { row: 12, field: '房屋地址', value: '海源一品5号楼', error: '房屋不存在于系统中' },
      { row: 34, field: '人员身份证号', value: '370102198001010000', error: '人员不存在于系统中' },
      { row: 56, field: '入住时间', value: '2024/13/01', error: '日期格式错误' }
    ]
  });

  // 文件选择处理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast.error('请先选择要导入的文件');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('文件超过 10MB，请拆分后重新上传');
      return;
    }

    const nextRecord: ImportRecord = {
      id: `import_${Date.now()}`,
      fileName: selectedFile.name,
      type: importType,
      totalRows: null,
      successRows: null,
      failedRows: null,
      status: '待校验',
      importTime: formatNow(),
      operator: '系统管理员',
    };

    setImportHistory((prev) => [nextRecord, ...prev]);
    setLatestSubmissionId(nextRecord.id);
    setSelectedFile(null);
    toast.success('文件已提交，系统将先执行模板校验，再进入后台导入批处理');
  };

  const handleDownloadTemplate = (type: string) => {
    const config = importConfigs[type as keyof typeof importConfigs];
    const template = [
      config.requiredFields.join(','),
      templateSampleRows[type as keyof typeof templateSampleRows][0],
    ].join('\n');
    downloadTextFile(`${type}_模板.csv`, template);
    toast.success(`${type}模板已下载`);
  };

  const handleDownloadErrorReport = (recordId: string) => {
    const rows = errorDetails[recordId] ?? [];
    if (!rows.length) {
      toast.info('当前记录没有可下载的错误明细');
      return;
    }
    const report = [
      '行号,字段,错误值,错误原因',
      ...rows.map((row) =>
        [`第${row.row}行`, row.field, row.value || '(空值)', row.error]
          .map((item) => `"${item.replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');
    downloadTextFile(`导入错误报告_${recordId}.csv`, report);
    toast.success('错误报告已下载');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '待校验':
        return (
          <Badge className="gap-1 bg-amber-500/20 text-amber-300 border-amber-400/30">
            <CircleAlert className="w-3 h-3" />
            待校验
          </Badge>
        );
      case '成功':
        return (
          <Badge className="gap-1 bg-green-500/20 text-green-400 border-green-400/30">
            <CheckCircle2 className="w-3 h-3" />
            成功
          </Badge>
        );
      case '部分失败':
        return (
          <Badge className="gap-1 bg-orange-500/20 text-orange-400 border-orange-400/30">
            <AlertCircle className="w-3 h-3" />
            部分失败
          </Badge>
        );
      case '失败':
        return (
          <Badge className="gap-1 bg-red-500/20 text-red-400 border-red-400/30">
            <CircleX className="w-3 h-3" />
            失败
          </Badge>
        );
      case '进行中':
        return (
          <Badge className="gap-1 bg-blue-500/20 text-blue-400 border-blue-400/30">
            进行中
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const currentConfig = importConfigs[importType];
  const latestSubmission = latestSubmissionId
    ? importHistory.find((record) => record.id === latestSubmissionId)
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 页面标题和历史入口 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">批量导入</h2>
          <p className="text-[var(--color-neutral-08)] mt-1">
            通过 Excel 模板批量导入人口、房屋、人房关系等数据
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowHistoryDialog(true)}
          className="gap-2"
        >
          <History className="w-4 h-4" />
          导入历史
        </Button>
      </div>

      {/* 导入操作区 */}
      <Tabs 
        defaultValue="人口数据" 
        className="w-full" 
        onValueChange={(v) => {
          setImportType(v as any);
          setSelectedFile(null); // 切换Tab时清空已选文件
        }}
      >
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="人口数据">人口数据</TabsTrigger>
          <TabsTrigger value="房屋数据">房屋数据</TabsTrigger>
          <TabsTrigger value="人房关系">人房关系</TabsTrigger>
        </TabsList>

        {/* 通用导入内容 */}
        {(['人口数据', '房屋数据', '人房关系'] as const).map((type) => (
          <TabsContent key={type} value={type} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* 左侧：导入操作 */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
                  <CardHeader>
                    <CardTitle className="text-[var(--color-neutral-11)]">{currentConfig.title}</CardTitle>
                    <CardDescription className="text-[var(--color-neutral-08)]">
                      {currentConfig.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 步骤1：下载模板 */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-medium text-sm">
                          1
                        </div>
                        <h3 className="font-medium text-[var(--color-neutral-11)]">下载导入模板</h3>
                      </div>
                      <div className="pl-10">
                        <p className="text-sm text-[var(--color-neutral-08)] mb-3">
                          请先下载 Excel 模板，按照模板格式填写数据
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDownloadTemplate(type)}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          下载 {type} 模板
                        </Button>
                      </div>
                    </div>

                    <div className="h-px bg-[var(--color-neutral-04)]" />

                    {/* 步骤2：上传文件 */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-medium text-sm">
                          2
                        </div>
                        <h3 className="font-medium text-[var(--color-neutral-11)]">上传数据文件</h3>
                      </div>
                      <div className="pl-10 space-y-4">
                        <div className="relative border-2 border-dashed border-[var(--color-neutral-04)] rounded-lg p-6 hover:border-blue-400/50 transition-colors bg-[var(--color-neutral-01)]">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                              <Upload className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-[var(--color-neutral-10)]">
                                点击选择文件或拖拽文件到此处
                              </p>
                              <p className="text-xs text-[var(--color-neutral-07)] mt-1">
                                支持 .xlsx、.xls 格式，最大 10MB
                              </p>
                            </div>
                            <input
                              type="file"
                              accept=".xlsx,.xls"
                              onChange={handleFileSelect}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>

                        {selectedFile && (
                          <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--color-neutral-11)] truncate">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-[var(--color-neutral-08)]">
                                {(selectedFile.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFile(null)}
                              className="flex-shrink-0"
                            >
                              移除
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-[var(--color-neutral-04)]" />

                    {/* 步骤3：开始导入 */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-medium text-sm">
                          3
                        </div>
                        <h3 className="font-medium text-[var(--color-neutral-11)]">提交校验</h3>
                      </div>
                      <div className="pl-10 space-y-3">
                        <p className="text-sm text-[var(--color-neutral-08)]">
                          文件会先进入模板校验队列，校验通过后再由后台批处理入库。
                        </p>
                        <Button 
                          onClick={handleImport} 
                          disabled={!selectedFile}
                          className="w-full h-10"
                          size="lg"
                        >
                          提交校验
                        </Button>

                        {latestSubmission && (
                          <Alert className="border-amber-400/30 bg-amber-500/10">
                            <CircleAlert className="h-4 w-4 text-amber-300" />
                            <AlertTitle className="text-amber-200">最新受理记录</AlertTitle>
                            <AlertDescription className="text-amber-100/80">
                              {latestSubmission.fileName} 已登记为导入申请，当前状态为“待校验”。
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 右侧：说明信息 */}
              <div className="space-y-6">
                {/* 必填字段 */}
                <Card className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-[var(--color-neutral-11)] flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                      必填字段
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {currentConfig.requiredFields.map((field, index) => (
                        <Badge 
                          key={index}
                          variant="outline"
                          className="bg-[var(--color-neutral-01)] border-[var(--color-neutral-04)] text-[var(--color-neutral-10)]"
                        >
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 导入说明 */}
                <Card className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-[var(--color-neutral-11)] flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-400" />
                      导入说明
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-[var(--color-neutral-08)]">
                      {currentConfig.notes.map((note, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* 导入历史对话框 */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-5xl bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-neutral-11)] flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              导入历史记录
            </DialogTitle>
            <DialogDescription className="text-[var(--color-neutral-08)]">
              查看最近的批量导入记录、待校验文件和错误明细
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-[var(--color-neutral-04)]">
                  <TableHead className="text-[var(--color-neutral-10)]">文件名</TableHead>
                  <TableHead className="text-[var(--color-neutral-10)]">数据类型</TableHead>
                  <TableHead className="text-[var(--color-neutral-10)]">总行数</TableHead>
                  <TableHead className="text-[var(--color-neutral-10)]">成功</TableHead>
                  <TableHead className="text-[var(--color-neutral-10)]">失败</TableHead>
                  <TableHead className="text-[var(--color-neutral-10)]">状态</TableHead>
                  <TableHead className="text-[var(--color-neutral-10)]">导入时间</TableHead>
                  <TableHead className="text-[var(--color-neutral-10)]">操作人</TableHead>
                  <TableHead className="text-right text-[var(--color-neutral-10)]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importHistory.map((record) => (
                  <TableRow key={record.id} className="border-[var(--color-neutral-04)]">
                    <TableCell className="font-medium text-[var(--color-neutral-11)]">
                      {record.fileName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-[var(--color-neutral-01)] border-[var(--color-neutral-04)] text-[var(--color-neutral-10)]">
                        {record.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[var(--color-neutral-10)]">{record.totalRows ?? '--'}</TableCell>
                    <TableCell className="text-green-400">{record.successRows ?? '--'}</TableCell>
                    <TableCell className="text-red-400">{record.failedRows ?? '--'}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="text-sm text-[var(--color-neutral-08)]">
                      {record.importTime}
                    </TableCell>
                    <TableCell className="text-[var(--color-neutral-10)]">{record.operator}</TableCell>
                    <TableCell className="text-right">
                      {record.failedRows > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedErrorRecord(record.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          查看错误
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 错误详情对话框 */}
      <Dialog open={!!selectedErrorRecord} onOpenChange={() => setSelectedErrorRecord(null)}>
        <DialogContent className="max-w-4xl bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-neutral-11)] flex items-center gap-2">
              <CircleX className="w-5 h-5 text-red-400" />
              导入错误详情
            </DialogTitle>
            <DialogDescription className="text-[var(--color-neutral-08)]">
              以下数据未能成功导入，请修正后重新导入
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="border-[var(--color-neutral-04)]">
                  <TableHead className="text-[var(--color-neutral-10)]">行号</TableHead>
                  <TableHead className="text-[var(--color-neutral-10)]">字段</TableHead>
                  <TableHead className="text-[var(--color-neutral-10)]">错误值</TableHead>
                  <TableHead className="text-[var(--color-neutral-10)]">错误原因</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedErrorRecord && errorDetails[selectedErrorRecord]?.map((error, index) => (
                  <TableRow key={index} className="border-[var(--color-neutral-04)]">
                    <TableCell className="text-[var(--color-neutral-10)]">第 {error.row} 行</TableCell>
                    <TableCell className="text-[var(--color-neutral-10)]">{error.field}</TableCell>
                    <TableCell className="font-mono text-sm text-[var(--color-neutral-08)]">
                      {error.value || '(空值)'}
                    </TableCell>
                    <TableCell className="text-red-400">{error.error}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSelectedErrorRecord(null)}>
              关闭
            </Button>
            <Button 
              onClick={() => selectedErrorRecord && handleDownloadErrorReport(selectedErrorRecord)}
            >
              <Download className="w-4 h-4 mr-2" />
              下载错误报告
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
