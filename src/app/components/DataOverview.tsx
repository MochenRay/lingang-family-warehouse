import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Users, Home, Link2, TrendingUp, Database } from 'lucide-react';

interface DataOverviewProps {
  className?: string;
}

export function DataOverview({ className = '' }: DataOverviewProps) {
  const stats = [
    {
      title: '总人口数',
      value: '5',
      icon: Users,
      color: 'blue',
      description: '已录入人口',
    },
    {
      title: '楼栋单元',
      value: '2',
      icon: Home,
      color: 'green',
      description: '楼栋数',
    },
    {
      title: '房间数',
      value: '8',
      icon: Database,
      color: 'purple',
      description: '已登记房间',
    },
    {
      title: '人房关系',
      value: '5',
      icon: Link2,
      color: 'orange',
      description: '绑定关系',
    },
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>{stat.title}</CardDescription>
                <div className={`w-8 h-8 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 text-${stat.color}-600`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <CardTitle className="text-3xl">{stat.value}</CardTitle>
                <span className="text-sm text-gray-500">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
