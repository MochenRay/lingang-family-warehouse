import { useState, useEffect } from 'react';
import { 
  Plus,
  Search,
  ChevronRight,
  ShieldAlert,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { MobileLayout } from '../MobileLayout';
import { db } from '../../../services/db';
import { ConflictRecord } from '../../../types/core';

interface MobileConflictListProps {
  onRouteChange: (route: string) => void;
  onExitMobile?: () => void;
}

export function MobileConflictList({ onRouteChange, onExitMobile }: MobileConflictListProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);

  useEffect(() => {
    // Initial load
    loadConflicts();

    // Listen for DB changes
    const handleDbChange = () => loadConflicts();
    window.addEventListener('db-change', handleDbChange);
    return () => window.removeEventListener('db-change', handleDbChange);
  }, []);

  const loadConflicts = () => {
    // In a real app, filter by current grid context. 
    // Here we just get all for demo purposes or filter by user's grid if available.
    // Assuming "g_002" is the user's grid (as per the seed data context in my head, though MobileHome has hardcoded grid).
    // Let's just fetch all for now.
    setConflicts(db.getConflicts());
  };

  const getFilteredConflicts = () => {
    let filtered = conflicts;

    // Tab filter
    if (activeTab === 'processing') {
      filtered = filtered.filter(c => c.status === '调解中');
    } else if (activeTab === 'resolved') {
      filtered = filtered.filter(c => c.status === '已化解');
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.title.includes(searchQuery) || 
        c.description.includes(searchQuery) ||
        c.location.includes(searchQuery)
      );
    }

    return filtered;
  };

  const displayConflicts = getFilteredConflicts();

  const getStatusColor = (status: string) => {
    return status === '调解中' ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case '邻里纠纷': return 'bg-blue-100 text-blue-700';
      case '家庭纠纷': return 'bg-pink-100 text-pink-700';
      case '物业纠纷': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <MobileLayout currentRoute="conflict" onRouteChange={onRouteChange} onExitMobile={onExitMobile} title="矛盾调解">
      <div className="bg-gray-50 h-full flex flex-col">
        {/* Header with Search */}
        <div className="bg-white px-4 py-3 border-b border-gray-100 sticky top-0 z-10 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="搜索纠纷记录..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-9 text-sm bg-gray-100 border-transparent focus-visible:bg-white focus-visible:border-blue-500 transition-all rounded-xl w-full"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-100">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex h-10 bg-transparent p-0">
              {['all', 'processing', 'resolved'].map((tab) => (
                <TabsTrigger 
                  key={tab}
                  value={tab} 
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 text-gray-500 font-medium text-sm transition-colors"
                >
                  {tab === 'all' ? '全部' : (tab === 'processing' ? '调解中' : '已化解')}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {displayConflicts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <ShieldAlert className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm">暂无相关记录</p>
            </div>
          ) : (
            displayConflicts.map(conflict => (
              <Card 
                key={conflict.id}
                className="border-none shadow-sm active:scale-[0.99] transition-transform cursor-pointer overflow-hidden"
                onClick={() => onRouteChange(`conflict-detail/${conflict.id}`)}
              >
                <CardContent className="p-4 relative">
                  {/* Source Badge (Top Left Corner) */}
                  <div className={`absolute top-0 left-0 px-2 py-0.5 text-[10px] font-medium rounded-br-lg ${
                    conflict.source === '上级下派' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {conflict.source}
                  </div>

                  <div className="flex justify-between items-start mt-3 mb-2">
                    <h3 className="text-[15px] font-bold text-gray-900 line-clamp-1 flex-1 pr-2">
                      {conflict.title}
                    </h3>
                    <Badge className={`shrink-0 text-[10px] border-0 px-1.5 py-0.5 rounded ${getStatusColor(conflict.status)}`}>
                      {conflict.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                    {conflict.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className={`text-[10px] border-0 px-2 py-0.5 ${getTypeColor(conflict.type)}`}>
                      {conflict.type}
                    </Badge>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                      <Users className="w-3 h-3" />
                      <span>{conflict.involvedParties.length}人涉事</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-[10px] text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{conflict.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{conflict.updatedAt.split(' ')[0]}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
