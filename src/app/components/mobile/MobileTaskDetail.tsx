import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  FileText,
  Camera,
  X,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { MobileStatusBar } from './MobileStatusBar';

interface MobileTaskDetailProps {
  taskId: string;
  onBack: () => void;
}

// Mock Data Source (Shared with MobileTasks ideally, but duplicated here for simplicity)
const MOCK_TASKS: Record<string, any> = {
  '1': { 
    id: 1, 
    title: '核查环翠区竹岛街道XX小区3栋住户信息', 
    type: '核查任务',
    status: 'pending',
    assignedBy: '区级管理员',
    deadline: '2026-01-20 18:00',
    createdAt: '2026-01-19 09:00',
    urgent: true,
    location: '环翠区竹岛街道XX小区3栋',
    targetPerson: '全体住户',
    description: '需核实该楼栋所有住户的基本信息是否准确，特别是流动人口情况。重点关注出租房屋的实际居住人数。'
  },
  '2': { 
    id: 2, 
    title: '补录文登区天福街道新增房屋数据', 
    type: '数据补录',
    status: 'pending',
    assignedBy: '街道管理员',
    deadline: '2026-01-21 12:00',
    createdAt: '2026-01-19 14:00',
    urgent: false,
    location: '文登区天福街道新城社区',
    targetPerson: '-',
    description: '对新建成小区进行房屋信息录入，共计28栋。需采集完整的户型图和面积信息。'
  },
  '3': { 
    id: 3, 
    title: '核实临港区草庙子镇流动人口信息', 
    type: '信息更新',
    status: 'pending',
    assignedBy: '区级管理员',
    deadline: '2026-01-22 17:00',
    createdAt: '2026-01-20 10:00',
    urgent: false,
    location: '临港区草庙子镇',
    targetPerson: '流动人口',
    description: '更新辖区内流动人口的就业和居住情况，确保人户一致。'
  },
  '101': { 
    id: 101, 
    title: '核查环翠区竹岛街道XX小区1栋住户信息', 
    type: '核查任务',
    status: 'completed',
    completedAt: '2026-01-19 15:30',
    assignedBy: '区级管理员',
    deadline: '2026-01-19 18:00',
    createdAt: '2026-01-18 09:00',
    urgent: true,
    location: '环翠区竹岛街道XX小区1栋',
    targetPerson: '全体住户',
    description: '需核实该楼栋所有住户的基本信息。',
    feedback: '数据准确，已全部核实无误。',
    attachments: [
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'
    ]
  }
};

export function MobileTaskDetail({ taskId, onBack }: MobileTaskDetailProps) {
  const [task, setTask] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 所有任务都显示同一个mock详情
    const mockTask = {
      id: 1, 
      title: '核查环翠区竹岛街道XX小区3栋住户信息', 
      type: '核查任务',
      status: 'pending',
      assignedBy: '区级管理员',
      deadline: '2026-01-20 18:00',
      createdAt: '2026-01-19 09:00',
      urgent: true,
      location: '环翠区竹岛街道XX小区3栋',
      targetPerson: '全体住户',
      description: '需核实该楼栋所有住户的基本信息是否准确，特别是流动人口情况。重点关注出租房屋的实际居住人数。'
    };
    setTask(mockTask);
  }, [taskId]);

  const handlePhotoCapture = () => {
    // Mock photo capture
    const mockPhotos = [
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400', // House
      'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400', // Meeting
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400', // Handshake
    ];
    const randomPhoto = mockPhotos[Math.floor(Math.random() * mockPhotos.length)];
    setPhotos([...photos, randomPhoto]);
    toast.success('照片添加成功');
  };

  const handleSubmit = () => {
    if (!feedback.trim()) {
      toast.error('请填写处理情况反馈');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('任务已完成并提交');
      onBack();
    }, 1500);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const isCompleted = task.status === 'completed';

  return (
    <div className="h-full bg-gray-50 pb-20 flex flex-col overflow-hidden">
      {/* Navigation Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <MobileStatusBar variant="light" />
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-1 -ml-1">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-800 truncate">任务详情</h1>
          </div>
          <Badge variant={isCompleted ? "outline" : "default"} className={isCompleted ? "text-green-600 border-green-200 bg-green-50" : "bg-blue-600"}>
            {isCompleted ? '已完成' : '进行中'}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Task Header Info */}
        <div className="bg-white p-4 mb-3 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 leading-snug">{task.title}</h2>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
              {task.type}
            </Badge>
            {task.urgent && (
              <Badge variant="destructive" className="text-xs">
                紧急
              </Badge>
            )}
            <span className="text-xs text-gray-400 flex items-center ml-auto">
              发布于 {task.createdAt}
            </span>
          </div>

          <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span>下发人员：{task.assignedBy}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className={task.urgent ? "text-red-600 font-medium" : ""}>
                截止时间：{task.deadline}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{task.location}</span>
            </div>
          </div>
        </div>

        {/* Task Description */}
        <div className="px-4 mb-3">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2 font-semibold text-gray-800">
                <FileText className="w-4 h-4 text-blue-600" />
                任务描述
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {task.description}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Section */}
        <div className="px-4 mb-6">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3 font-semibold text-gray-800">
                <CheckCircle className="w-4 h-4 text-green-600" />
                {isCompleted ? '处理结果' : '任务反馈'}
              </div>

              {/* Text Input */}
              <div className="mb-4">
                <Label className="text-xs text-gray-500 mb-1.5 block">情况说明</Label>
                {isCompleted ? (
                  <div className="p-3 bg-gray-50 rounded text-sm text-gray-800">
                    {feedback}
                  </div>
                ) : (
                  <Textarea
                    placeholder="请输入任务执行情况、发现的问题或处理结果..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-[120px] resize-none bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  />
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <Label className="text-xs text-gray-500 mb-2 block flex justify-between">
                  <span>佐证材料 (图片/视频)</span>
                  <span className="text-gray-400">{photos.length}/9</span>
                </Label>
                
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                      <img src={photo} alt="evidence" className="w-full h-full object-cover" />
                      {!isCompleted && (
                        <button 
                          onClick={() => removePhoto(index)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {!isCompleted && photos.length < 9 && (
                    <button
                      onClick={handlePhotoCapture}
                      className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px]">添加</span>
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Actions */}
      {!isCompleted && (
        <div className="p-4 bg-white border-t border-gray-200 mt-auto safe-area-bottom">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base shadow-lg shadow-blue-100"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '提交中...' : '确认完成任务'}
          </Button>
        </div>
      )}
    </div>
  );
}