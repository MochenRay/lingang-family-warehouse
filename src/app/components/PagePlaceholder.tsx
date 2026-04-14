import { Card } from './ui/card';
import { Construction } from 'lucide-react';

interface PagePlaceholderProps {
  title: string;
  description?: string;
  module?: string;
}

export function PagePlaceholder({ title, description, module }: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
        {module && (
          <p className="text-xs text-gray-400 mt-1">所属模块: {module}</p>
        )}
      </div>

      {/* 占位内容 */}
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
            <Construction className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">功能开发中</h3>
            <p className="text-sm text-gray-500 max-w-md">
              该页面正在开发中，敬请期待。如需优先开发此功能，请联系开发团队。
            </p>
          </div>
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500">页面ID:</span>
              <code className="text-xs font-mono text-gray-700">{title}</code>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
