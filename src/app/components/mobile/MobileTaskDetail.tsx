import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  User,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { MobileStatusBar } from './MobileStatusBar';
import { taskRepository, type MobileTaskDetail as MobileTaskDetailData } from '../../services/repositories/taskRepository';

interface MobileTaskDetailProps {
  taskId: string;
  onBack: () => void;
  onRouteChange?: (route: string) => void;
}

function getTaskBadgeClass(type: string) {
  const colors: Record<string, string> = {
    重点走访: 'bg-[#4E86DF]/15 text-[#4E86DF]',
    走访反馈: 'bg-[#19B172]/15 text-[#19B172]',
    矛盾调解: 'bg-[#FF9F1C]/15 text-[#FF9F1C]',
  };
  return colors[type] || 'bg-gray-100 text-gray-600';
}

function getDeadlineTone(detail: MobileTaskDetailData) {
  const value = detail.completedAt ?? detail.deadline;
  if (!value) {
    return '待安排';
  }
  return value;
}

export function MobileTaskDetail({ taskId, onBack, onRouteChange }: MobileTaskDetailProps) {
  const [detail, setDetail] = useState<MobileTaskDetailData | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const nextDetail = await taskRepository.getTaskDetail(taskId);
        if (!active) {
          return;
        }
        setDetail(nextDetail ?? null);
        setFeedback(nextDetail?.feedback ?? '');
      } catch (error) {
        console.error('Failed to load mobile task detail', error);
        if (active) {
          setDetail(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    const handleRefresh = () => {
      void load();
    };
    window.addEventListener('db-change', handleRefresh);
    return () => {
      active = false;
      window.removeEventListener('db-change', handleRefresh);
    };
  }, [taskId]);

  const handleSubmit = async () => {
    if (!detail || detail.status === 'completed') {
      return;
    }
    if (!feedback.trim()) {
      toast.error('请填写处理情况反馈');
      return;
    }

    setIsSubmitting(true);
    try {
      await taskRepository.completeTask(detail.id, feedback);
      toast.success('任务已完成并回填');
      onBack();
    } catch (error) {
      console.error('Failed to complete mobile task', error);
      toast.error('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSource = (route: string) => {
    if (!onRouteChange) {
      return;
    }
    onRouteChange(route);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-500">正在同步任务详情...</span>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">未找到任务详情</p>
        <Button onClick={onBack}>返回</Button>
      </div>
    );
  }

  const isCompleted = detail.status === 'completed';

  return (
    <div className="h-full bg-gray-50 pb-20 flex flex-col overflow-hidden">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <MobileStatusBar variant="light" />
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-1 -ml-1">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-800 truncate">任务详情</h1>
          </div>
          <Badge
            variant={isCompleted ? 'outline' : 'default'}
            className={isCompleted ? 'text-green-600 border-green-200 bg-green-50' : 'bg-blue-600'}
          >
            {isCompleted ? '已完成' : '待处理'}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white p-4 mb-3 shadow-sm">
          <div className="flex items-start justify-between mb-3 gap-3">
            <h2 className="text-lg font-bold text-gray-900 leading-snug">{detail.title}</h2>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" className={`text-xs ${getTaskBadgeClass(detail.type)}`}>
              {detail.type}
            </Badge>
            {detail.urgent && (
              <Badge variant="destructive" className="text-xs">
                紧急
              </Badge>
            )}
            <Badge variant="outline" className="text-xs border-gray-200 bg-gray-50 text-gray-600">
              {detail.statusLabel}
            </Badge>
          </div>

          <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span>下发来源：{detail.assignedBy}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className={!isCompleted && detail.urgent ? 'text-red-600 font-medium' : ''}>
                {isCompleted ? '完成时间' : '截止时间'}：{getDeadlineTone(detail)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{detail.subjectName}</span>
            </div>
          </div>
        </div>

        <div className="px-4 mb-3">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2 font-semibold text-gray-800">
                <FileText className="w-4 h-4 text-blue-600" />
                任务摘要
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{detail.description}</p>
            </CardContent>
          </Card>
        </div>

        <div className="px-4 mb-3">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-800">关联对象</div>
                  <div className="text-xs text-gray-500 mt-1">从真实人物、房屋、走访、矛盾上下文投影</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => handleOpenSource(detail.secondaryRoute)}
                  disabled={!onRouteChange}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  {detail.secondaryActionLabel}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {detail.context.people.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => handleOpenSource(`person-detail/${person.id}`)}
                    disabled={!onRouteChange}
                    className="px-3 py-1.5 rounded-full bg-gray-100 text-xs text-gray-700 disabled:cursor-default"
                  >
                    {person.name}
                    {person.risk ? ` · ${person.risk}` : ''}
                  </button>
                ))}
                {detail.context.house && (
                  <button
                    type="button"
                    onClick={() => handleOpenSource(`house-detail/${detail.context.house!.id}`)}
                    disabled={!onRouteChange}
                    className="px-3 py-1.5 rounded-full bg-blue-50 text-xs text-blue-700 disabled:cursor-default"
                  >
                    房屋 · {detail.context.house.address}
                  </button>
                )}
              </div>

              {detail.context.followUpStatus && (
                <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                  <div className="text-sm font-medium text-amber-800">{detail.context.followUpStatus.label}</div>
                  <div className="text-xs text-amber-700 mt-1">{detail.context.followUpStatus.detail}</div>
                </div>
              )}

              <div>
                <div className="text-xs text-gray-500 mb-2">建议动作</div>
                <div className="space-y-2">
                  {detail.context.suggestedActions.map((item, index) => (
                    <div key={`${detail.id}-action-${index}`} className="flex gap-2 text-sm text-gray-700">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-2">最近记录</div>
                {detail.context.visits.length === 0 ? (
                  <div className="text-sm text-gray-400">暂无关联走访记录</div>
                ) : (
                  <div className="space-y-2">
                    {detail.context.visits.map((visit) => (
                      <div key={visit.id} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {visit.date}
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed">{visit.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="px-4 mb-6">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3 font-semibold text-gray-800">
                <CheckCircle className="w-4 h-4 text-green-600" />
                {isCompleted ? '处理结果' : '回填反馈'}
              </div>

              <div className="mb-4">
                <Label className="text-xs text-gray-500 mb-1.5 block">情况说明</Label>
                {isCompleted ? (
                  <div className="p-3 bg-gray-50 rounded text-sm text-gray-800 whitespace-pre-wrap">
                    {feedback || '暂无回填说明'}
                  </div>
                ) : (
                  <Textarea
                    placeholder="请输入本次处理结果、发现的问题或后续安排..."
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    className="min-h-[120px] resize-none bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  />
                )}
              </div>

              {!isCompleted && (
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  提交后会写回真实走访记录或纠纷处置时间线。
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {!isCompleted && (
        <div className="p-4 bg-white border-t border-gray-200 mt-auto safe-area-bottom space-y-3">
          <Button
            variant="outline"
            className="w-full h-11 text-base"
            onClick={() => handleOpenSource(detail.route)}
            disabled={!onRouteChange}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            查看来源对象
          </Button>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base shadow-lg shadow-blue-100"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '提交中...' : detail.primaryActionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
