import { useEffect, useState } from 'react';
import {
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
import { MobileDetailHeader } from './MobileDetailHeader';
import { taskRepository, type MobileTaskDetail as MobileTaskDetailData } from '../../services/repositories/taskRepository';

interface MobileTaskDetailProps {
  taskId: string;
  onBack: () => void;
  onRouteChange?: (route: string) => void;
}

function getTaskBadgeClass(type: string) {
  const colors: Record<string, string> = {
    重点走访: 'bg-[var(--color-brand-primary-hover)]/15 text-[var(--color-brand-primary-hover)]',
    走访反馈: 'bg-[var(--color-status-success)]/15 text-[var(--color-status-success)]',
    矛盾调解: 'bg-[var(--color-status-warning)]/15 text-[var(--color-status-warning)]',
  };
  return colors[type] || 'bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)]';
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
      <div className="min-h-screen bg-[var(--color-neutral-01)] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-brand-primary-hover)] mr-2" />
        <span className="text-[var(--color-neutral-08)]">正在同步任务详情...</span>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-[var(--color-neutral-01)] flex flex-col items-center justify-center gap-4">
        <p className="text-[var(--color-neutral-08)]">未找到任务详情</p>
        <Button onClick={onBack}>返回</Button>
      </div>
    );
  }

  const isCompleted = detail.status === 'completed';
  const canSubmit = feedback.trim().length > 0 && !isSubmitting;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[var(--color-neutral-01)]">
      <MobileDetailHeader
        title="任务详情"
        onBack={onBack}
        action={
          <Badge
            variant={isCompleted ? 'outline' : 'default'}
            className={isCompleted ? 'text-[var(--color-status-success-text)] border-[var(--color-status-success)]/40 bg-[var(--color-status-success-soft)]' : 'bg-[var(--color-brand-primary)]'}
          >
            {isCompleted ? '已完成' : '待处理'}
          </Badge>
        }
      />

      <div className="flex-1 overflow-y-auto pb-36">
        <div className="bg-[var(--color-neutral-01)] p-4 mb-3 shadow-sm">
          <div className="flex items-start justify-between mb-3 gap-3">
            <h2 className="text-lg font-bold text-[var(--color-neutral-11)] leading-snug">{detail.title}</h2>
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
            <Badge variant="outline" className="text-xs border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]">
              {detail.statusLabel}
            </Badge>
          </div>

          <div className="space-y-2 text-sm text-[var(--color-neutral-10)] bg-[var(--color-neutral-02)] p-3 rounded-lg border border-[var(--color-neutral-03)]">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--color-neutral-08)]" />
              <span>下发来源：{detail.assignedBy}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--color-neutral-08)]" />
              <span className={!isCompleted && detail.urgent ? 'text-[var(--color-status-error-text)] font-medium' : ''}>
                {isCompleted ? '完成时间' : '截止时间'}：{getDeadlineTone(detail)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--color-neutral-08)]" />
              <span>{detail.subjectName}</span>
            </div>
          </div>
        </div>

        <div className="px-4 mb-3">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2 font-semibold text-[var(--color-neutral-11)]">
                <FileText className="w-4 h-4 text-[var(--color-brand-primary-hover)]" />
                任务摘要
              </div>
              <p className="text-sm text-[var(--color-neutral-10)] leading-relaxed">{detail.description}</p>
            </CardContent>
          </Card>
        </div>

        <div className="px-4 mb-3">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-[var(--color-neutral-11)]">关联对象</div>
                  <div className="text-xs text-[var(--color-neutral-08)] mt-1">从真实人物、房屋、走访、矛盾上下文投影</div>
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
                    className="px-3 py-1.5 rounded-full bg-[var(--color-neutral-01)] text-xs text-[var(--color-neutral-10)] disabled:cursor-default"
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
                    className="px-3 py-1.5 rounded-full bg-[var(--color-brand-primary)]/10 text-xs text-[var(--color-brand-primary-hover)] disabled:cursor-default"
                  >
                    房屋 · {detail.context.house.address}
                  </button>
                )}
              </div>

              {detail.context.followUpStatus && (
                <div className="rounded-lg bg-[var(--color-status-warning-soft)] border border-[var(--color-status-warning)]/30 p-3">
                  <div className="text-sm font-medium text-[var(--color-status-warning-text)]">{detail.context.followUpStatus.label}</div>
                  <div className="text-xs text-[var(--color-status-warning-text)] mt-1">{detail.context.followUpStatus.detail}</div>
                </div>
              )}

              <div>
                <div className="text-xs text-[var(--color-neutral-08)] mb-2">建议动作</div>
                <div className="space-y-2">
                  {detail.context.suggestedActions.map((item, index) => (
                    <div key={`${detail.id}-action-${index}`} className="flex gap-2 text-sm text-[var(--color-neutral-10)]">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-brand-primary)] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-[var(--color-neutral-08)] mb-2">最近记录</div>
                {detail.context.visits.length === 0 ? (
                  <div className="text-sm text-[var(--color-neutral-08)]">暂无关联走访记录</div>
                ) : (
                  <div className="space-y-2">
                    {detail.context.visits.map((visit) => (
                      <div key={visit.id} className="rounded-lg bg-[var(--color-neutral-01)] border border-[var(--color-neutral-03)] p-3">
                        <div className="flex items-center gap-2 text-xs text-[var(--color-neutral-08)] mb-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {visit.date}
                        </div>
                        <div className="text-sm text-[var(--color-neutral-10)] leading-relaxed">{visit.content}</div>
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
              <div className="flex items-center gap-2 mb-3 font-semibold text-[var(--color-neutral-11)]">
                <CheckCircle className="w-4 h-4 text-[var(--color-status-success-text)]" />
                {isCompleted ? '处理结果' : '回填反馈'}
              </div>

              <div className="mb-4">
                <Label className="text-xs text-[var(--color-neutral-08)] mb-1.5 block">情况说明</Label>
                {isCompleted ? (
                  <div className="p-3 bg-[var(--color-neutral-01)] rounded text-sm text-[var(--color-neutral-11)] whitespace-pre-wrap">
                    {feedback || '暂无回填说明'}
                  </div>
                ) : (
                  <Textarea
                    placeholder="请输入本次处理结果、发现的问题或后续安排..."
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    className="min-h-[120px] resize-none bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)] focus:bg-[var(--color-neutral-02)] transition-colors"
                  />
                )}
              </div>

              {!isCompleted && (
                <div className="text-xs text-[var(--color-neutral-08)] flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--color-status-success-text)]" />
                  提交后会写回真实走访记录或纠纷处置时间线。
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {!isCompleted && (
        <div className="absolute bottom-0 left-0 right-0 z-20 space-y-3 border-t border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-4 safe-area-bottom">
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
            className="w-full bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] h-11 text-base disabled:bg-[var(--color-brand-primary)]/45 disabled:text-white/70"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? '提交中...' : detail.primaryActionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
