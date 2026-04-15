import { useEffect, useState } from 'react';
import { ArrowLeft, User, Phone, MapPin, Tag, Users, Clock, Network, History, AlertCircle, Home, Heart, Activity, FileText, Shield, Sparkles, Loader2 } from 'lucide-react';
import { MobileStatusBar } from './MobileStatusBar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Person, VisitRecord } from '../../types/core';
import { personRepository } from '../../services/repositories/personRepository';
import { visitRepository } from '../../services/repositories/visitRepository';
import { houseRepository } from '../../services/repositories/houseRepository';
import { toast } from 'sonner';

interface MobilePersonDetailProps {
  id: string;
  onBack: () => void;
  onRouteChange?: (route: string) => void;
}

export function MobilePersonDetail({ id, onBack, onRouteChange }: MobilePersonDetailProps) {
  const [person, setPerson] = useState<Person | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [relatedPeople, setRelatedPeople] = useState<Person[]>([]);
  const [cohabitants, setCohabitants] = useState<Person[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const loadPerson = async () => {
      setIsLoading(true);

      try {
        const personData = await personRepository.getPerson(id);
        if (!alive) {
          return;
        }

        if (!personData) {
          setPerson(null);
          setRelatedPeople([]);
          setCohabitants([]);
          setVisits([]);
          return;
        }

        const [related, houseMates, visitRecords] = await Promise.all([
          personData.familyRelations && personData.familyRelations.length > 0
            ? Promise.all(
                personData.familyRelations.map(async (relation) => {
                  const nextPerson = await personRepository.getPerson(relation.relatedPersonId);
                  return nextPerson ?? null;
                }),
              ).then((items) => items.filter((item): item is Person => item !== null))
            : Promise.resolve([] as Person[]),
          personData.houseId
            ? houseRepository
                .getHouseResidents(personData.houseId)
                .then((items) => items.filter((item) => item.id !== personData.id))
            : Promise.resolve([] as Person[]),
          visitRepository
            .getVisits({ targetId: personData.id, targetType: 'person', limit: 100 })
            .then((items) => [...items].sort((left, right) => right.date.localeCompare(left.date))),
        ]);

        if (!alive) {
          return;
        }

        setPerson(personData);
        setRelatedPeople(related);
        setCohabitants(houseMates);
        setVisits(visitRecords);
      } catch (error) {
        console.error('Failed to load mobile person detail', error);
        if (!alive) {
          return;
        }
        setPerson(null);
        setRelatedPeople([]);
        setCohabitants([]);
        setVisits([]);
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    };

    void loadPerson();
    const handleRefresh = () => {
      void loadPerson();
    };
    window.addEventListener('db-change', handleRefresh);
    return () => {
      alive = false;
      window.removeEventListener('db-change', handleRefresh);
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">正在加载人员档案...</p>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">未找到该人员信息</p>
          <Button onClick={onBack} className="mt-4">返回</Button>
        </div>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    if (risk === 'High') return 'text-red-600 bg-red-50 border-red-200';
    if (risk === 'Medium') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getRiskLabel = (risk: string) => {
    if (risk === 'High') return '高风险';
    if (risk === 'Medium') return '中风险';
    return '低风险';
  };

  const visitPrep = [
    person.age >= 60 ? '重点确认近期健康状况、慢病用药和居家安全情况。' : null,
    person.tags.length > 0 ? `本次走访优先核验标签信息：${person.tags.slice(0, 3).join('、')}。` : null,
    cohabitants.length > 0 ? `同住人员 ${cohabitants.length} 人，建议同步了解家庭关系与照护分工。` : null,
    visits[0] ? `最近一次走访在 ${visits[0].date}，建议先跟进上次承诺事项。` : '暂无历史走访，优先补齐基础档案和联系方式。',
  ].filter((item): item is string => Boolean(item));

  const todoSuggestions = [
    person.risk === 'High' ? '建议生成高风险回访待办，并同步给网格长复核。' : null,
    person.careLabels?.length ? `建议核验关爱对象政策落实情况：${person.careLabels.slice(0, 2).join('、')}。` : null,
    !person.phone ? '建议补齐联系电话，避免后续回访失联。' : null,
    visits.length < 2 ? '建议在本周内完成二次回访，补齐连续走访记录。' : '建议根据本次记录更新下次回访计划和提醒时间。',
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
        <MobileStatusBar variant="dark" />
        <div className="h-11 flex items-center justify-between px-4">
          <button 
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center -ml-2 text-gray-700 active:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-gray-900 font-semibold text-lg">人员详情</div>
          <div className="w-8 flex justify-end">
            <button 
              onClick={() => onRouteChange?.(`person-edit/${id}`)}
              className="text-blue-600 font-medium text-sm active:opacity-70"
            >
               编辑
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
            <TabsList className="w-full grid grid-cols-3 h-12 bg-transparent rounded-none border-b-0">
              <TabsTrigger 
                value="basic" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                基础信息
              </TabsTrigger>
              <TabsTrigger 
                value="relation" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                关系图谱
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                历史记录
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 基础信息 Tab */}
          <TabsContent value="basic" className="mt-0 p-4 space-y-4">
            {/* Basic Info Card */}
            <Card className="border-none shadow-sm overflow-hidden">
              <div className="bg-white border-b border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200 text-2xl font-bold text-primary">
                      {person.name[0]}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                        {person.name}
                      </h2>
                      <div className="text-gray-600 text-sm mt-1 flex items-center gap-2">
                        <span>{person.gender}</span>
                        <span className="w-px h-3 bg-gray-300"></span>
                        <span>{person.age}岁</span>
                        {person.nation && (
                          <>
                            <span className="w-px h-3 bg-gray-300"></span>
                            <span>{person.nation}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {person.tags.map((tag, i) => (
                    <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200 text-gray-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-white space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 border-b border-gray-50 pb-3">
                    <div className="text-xs text-gray-500 mb-0.5">身份证号</div>
                    <div className="text-sm font-medium text-gray-900 font-mono tracking-wide">
                      {person.idCard.substring(0, 6)}****{person.idCard.substring(14)}
                    </div>
                  </div>
                </div>

                {person.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0 text-green-600">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="flex-1 border-b border-gray-50 pb-3">
                      <div className="text-xs text-gray-500 mb-0.5">联系电话</div>
                      <div className="text-sm font-medium text-gray-900 flex items-center justify-between">
                        {person.phone}
                        <a href={`tel:${person.phone}`}>
                          <Button size="sm" variant="outline" className="h-6 text-xs border-green-200 text-green-700 bg-green-50 hover:bg-green-100">
                            拨打
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-orange-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1 border-b border-gray-50 pb-3">
                    <div className="text-xs text-gray-500 mb-0.5">居住地址</div>
                    <div className="text-sm font-medium text-gray-900 leading-normal">{person.address}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0 text-purple-600">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div className="flex-1 border-b border-gray-50 pb-3">
                    <div className="text-xs text-gray-500 mb-0.5">人口类型</div>
                    <Badge variant="secondary" className="text-xs font-normal mt-1">
                      {person.type}
                    </Badge>
                  </div>
                </div>

                {person.education && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 border-b border-gray-50 pb-3">
                      <div className="text-xs text-gray-500 mb-0.5">学历</div>
                      <div className="text-sm font-medium text-gray-900">{person.education}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-0.5">风险等级</div>
                    <Badge className={`text-xs font-normal mt-1 ${getRiskColor(person.risk)}`}>
                      {getRiskLabel(person.risk)}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-none shadow-sm">
              <div className="bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    走访前准备
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">
                    社工助手
                  </Badge>
                </div>
                <div className="space-y-2">
                  {visitPrep.map((item) => (
                    <div key={item} className="flex gap-2 text-sm text-gray-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="border-none shadow-sm">
              <div className="bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    待办建议
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">
                    AI 推荐
                  </Badge>
                </div>
                <div className="space-y-2">
                  {todoSuggestions.map((item) => (
                    <div key={item} className="flex gap-2 text-sm text-gray-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* 详细信息卡片 */}
            {(person.birthDate || person.birthplace || person.maritalStatus || person.politicalStatus ||
              person.militaryService !== undefined || person.graduationInfo || person.workplace ||
              person.communityVolunteer !== undefined || person.skills || person.pets) && (
              <Card className="border-none shadow-sm">
                <div className="bg-white p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    详细信息
                  </h3>
                  <div className="space-y-3">
                    {person.birthDate && (
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 w-20 shrink-0">出生年月</div>
                        <div className="text-sm text-gray-900 flex-1">{person.birthDate}</div>
                      </div>
                    )}
                    {person.birthplace && (
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 w-20 shrink-0">籍贯</div>
                        <div className="text-sm text-gray-900 flex-1">{person.birthplace}</div>
                      </div>
                    )}
                    {person.maritalStatus && (
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 w-20 shrink-0">婚姻状况</div>
                        <div className="text-sm text-gray-900 flex-1">{person.maritalStatus}</div>
                      </div>
                    )}
                    {person.religion && (
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 w-20 shrink-0">宗教信仰</div>
                        <div className="text-sm text-gray-900 flex-1">{person.religion}</div>
                      </div>
                    )}
                    {person.politicalStatus && (
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 w-20 shrink-0">政治面貌</div>
                        <div className="text-sm text-gray-900 flex-1">{person.politicalStatus}</div>
                      </div>
                    )}
                    {person.militaryService !== undefined && (
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 w-20 shrink-0">兵役情况</div>
                        <div className="text-sm text-gray-900 flex-1">{person.militaryService ? '是' : '否'}</div>
                      </div>
                    )}
                    {person.graduationInfo && (
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 w-20 shrink-0">毕业院校</div>
                        <div className="text-sm text-gray-900 flex-1">{person.graduationInfo}</div>
                      </div>
                    )}
                    {person.workplace && (
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 w-20 shrink-0">工作单位</div>
                        <div className="text-sm text-gray-900 flex-1">{person.workplace}</div>
                      </div>
                    )}
                    {person.communityVolunteer !== undefined && (
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 w-20 shrink-0">社区志愿</div>
                        <div className="text-sm text-gray-900 flex-1">{person.communityVolunteer ? '是' : '否'}</div>
                      </div>
                    )}
                    {person.skills && (
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 w-20 shrink-0">特长爱好</div>
                        <div className="text-sm text-gray-900 flex-1">{person.skills}</div>
                      </div>
                    )}
                    {person.pets && (
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 w-20 shrink-0">宠物饲养</div>
                        <div className="text-sm text-gray-900 flex-1">{person.pets}</div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* 重点关爱标签 */}
            {person.careLabels && person.careLabels.length > 0 && (
              <Card className="border-none shadow-sm">
                <div className="bg-white p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    重点关爱
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {person.careLabels.map((label, i) => (
                      <span key={i} className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-full border border-red-200">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* 人员类别标签 */}
            {person.categoryLabels && (
              <Card className="border-none shadow-sm">
                <div className="bg-white p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    人员类别
                  </h3>
                  <div className="space-y-2">
                    {person.categoryLabels.isFloorLeader && (
                      <Badge variant="secondary" className="text-xs">楼长</Badge>
                    )}
                    {person.categoryLabels.isUnitLeader && (
                      <Badge variant="secondary" className="text-xs ml-2">单元长</Badge>
                    )}
                    {person.categoryLabels.isAssistant && (
                      <Badge variant="secondary" className="text-xs ml-2">协管员</Badge>
                    )}
                    {person.categoryLabels.focusType && person.categoryLabels.focusType.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-2">重点关注类型：</div>
                        <div className="flex flex-wrap gap-2">
                          {person.categoryLabels.focusType.map((type, i) => (
                            <span key={i} className="text-xs bg-orange-50 text-orange-700 px-3 py-1 rounded-full border border-orange-200">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* 个人经历 */}
            {person.biography && (
              <Card className="border-none shadow-sm">
                <div className="bg-white p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    个人经历
                  </h3>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {person.biography}
                  </div>
                </div>
              </Card>
            )}

            {/* 活动参与 */}
            {person.activityParticipation && (person.activityParticipation.activities || person.activityParticipation.needs) && (
              <Card className="border-none shadow-sm">
                <div className="bg-white p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-500" />
                    活动参与
                  </h3>
                  <div className="space-y-3">
                    {person.activityParticipation.activities && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">参加活动情况</div>
                        <div className="text-sm text-gray-700 leading-relaxed">
                          {person.activityParticipation.activities}
                        </div>
                      </div>
                    )}
                    {person.activityParticipation.needs && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">服务需求</div>
                        <div className="text-sm text-gray-700 leading-relaxed">
                          {person.activityParticipation.needs}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* 健康档案 */}
            {person.healthRecord && (
              <Card className="border-none shadow-sm">
                <div className="bg-white p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    健康档案
                  </h3>
                  <div className="space-y-3">
                    {person.healthRecord.hasChronic !== undefined && (
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 w-24 shrink-0">基础疾病</div>
                        <div className="text-sm text-gray-900 flex-1">
                          {person.healthRecord.hasChronic ? '是' : '否'}
                          {person.healthRecord.chronicDetails && (
                            <span className="ml-2 text-gray-600">({person.healthRecord.chronicDetails})</span>
                          )}
                        </div>
                      </div>
                    )}
                    {person.healthRecord.needsRegularMedicine !== undefined && (
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 w-24 shrink-0">定期购药</div>
                        <div className="text-sm text-gray-900 flex-1">
                          {person.healthRecord.needsRegularMedicine ? '是' : '否'}
                          {person.healthRecord.medicineFrequency && (
                            <span className="ml-2 text-gray-600">({person.healthRecord.medicineFrequency})</span>
                          )}
                        </div>
                      </div>
                    )}
                    {person.healthRecord.medicalVisitFrequency && (
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 w-24 shrink-0">就医频率</div>
                        <div className="text-sm text-gray-900 flex-1">{person.healthRecord.medicalVisitFrequency}</div>
                      </div>
                    )}
                    {person.healthRecord.isSeverePatient !== undefined && (
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 w-24 shrink-0">重症患者</div>
                        <div className="text-sm text-gray-900 flex-1">{person.healthRecord.isSeverePatient ? '是' : '否'}</div>
                      </div>
                    )}
                    {person.healthRecord.isPregnant !== undefined && (
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 w-24 shrink-0">孕产妇</div>
                        <div className="text-sm text-gray-900 flex-1">{person.healthRecord.isPregnant ? '是' : '否'}</div>
                      </div>
                    )}
                    {person.healthRecord.specialNotes && (
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-gray-500 w-24 shrink-0">特殊说明</div>
                        <div className="text-sm text-gray-700 flex-1 leading-relaxed">{person.healthRecord.specialNotes}</div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* 重要事件记录 */}
            {person.importantEvents && (
              <Card className="border-none shadow-sm">
                <div className="bg-white p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    重要事件记录
                  </h3>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {person.importantEvents}
                  </div>
                </div>
              </Card>
            )}

            {/* 更新时间 */}
            <Card className="border-none shadow-sm">
              <div className="p-4">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  最近更新：{person.updatedAt}
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* 关系图谱 Tab */}
          <TabsContent value="relation" className="mt-0 p-4 space-y-4">
            {/* 关系网络可视化 */}
            <Card className="border-none shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Network className="w-4 h-4 text-purple-600" />
                  关系网络
                </h3>
              </div>
              <div className="p-4">
                <div className="relative w-full h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                  {/* 中心节点 */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg px-1" style={{ fontSize: person.name.length > 3 ? '10px' : '16px' }}>
                      {person.name}
                    </div>
                    <p className="text-center mt-1 text-[10px] font-medium">{person.name}</p>
                  </div>

                  {(() => {
                    // 合并关系数据，确保每个人只出现一次
                    const relationMap = new Map();
                    
                    // 添加血缘关系
                    if (person.familyRelations) {
                      person.familyRelations.forEach((relation) => {
                        const relatedPerson = relatedPeople.find(p => p.id === relation.relatedPersonId);
                        if (relatedPerson) {
                          const personId = relatedPerson.id;
                          if (!relationMap.has(personId)) {
                            relationMap.set(personId, {
                              person: relatedPerson,
                              relations: []
                            });
                          }
                          relationMap.get(personId).relations.push({
                            type: 'family',
                            label: relation.relationType
                          });
                        }
                      });
                    }
                    
                    // 添加同住关系
                    cohabitants.forEach((cohabitant) => {
                      const personId = cohabitant.id;
                      if (!relationMap.has(personId)) {
                        relationMap.set(personId, {
                          person: cohabitant,
                          relations: []
                        });
                      }
                      relationMap.get(personId).relations.push({
                        type: 'housemate',
                        label: '同住'
                      });
                    });

                    const allRelations = Array.from(relationMap.values());
                    const totalNodes = Math.min(allRelations.length, 6); // 最多显示6个节点

                    return allRelations.slice(0, totalNodes).map((item: any, idx: number) => {
                      const angle = (idx * 360 / totalNodes) * (Math.PI / 180);
                      const radius = 80;
                      const x = Math.cos(angle) * radius;
                      const y = Math.sin(angle) * radius;
                      
                      // 确定关系类型
                      const hasFamily = item.relations.some((r: any) => r.type === 'family');
                      const hasHousemate = item.relations.some((r: any) => r.type === 'housemate');
                      const isBoth = hasFamily && hasHousemate;
                      
                      // 确定节点颜色和连线样式
                      let nodeColor = '';
                      let strokeColor = '';
                      let strokeDasharray = '';
                      
                      if (isBoth) {
                        // 既有血缘又有同住：紫色
                        nodeColor = 'bg-purple-500';
                        strokeColor = '#a855f7';
                        strokeDasharray = '';
                      } else if (hasFamily) {
                        // 只血缘：红色线
                        nodeColor = 'bg-red-500';
                        strokeColor = '#ef4444';
                        strokeDasharray = '4 4';
                      } else {
                        // 只有同住：蓝色实线
                        nodeColor = 'bg-blue-500';
                        strokeColor = '#3b82f6';
                        strokeDasharray = '';
                      }
                      
                      // 标签文本
                      const familyLabel = item.relations.find((r: any) => r.type === 'family')?.label;
                      const labelText = isBoth 
                        ? familyLabel  // 如果既有血缘又同住，优先显示血缘关系
                        : (familyLabel || '同住');
                      
                      // 根据名字长度动态调整字体大小
                      const nameFontSize = item.person.name.length > 3 ? '8px' : '12px';
                      
                      return (
                        <div key={item.person.id}>
                          {/* 连线 */}
                          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
                            <line 
                              x1="50%" 
                              y1="50%" 
                              x2={`calc(50% + ${x}px)`} 
                              y2={`calc(50% + ${y}px)`} 
                              stroke={strokeColor} 
                              strokeWidth="2" 
                              strokeDasharray={strokeDasharray}
                            />
                          </svg>
                          {/* 节点 */}
                          <div 
                            className="absolute z-20"
                            style={{
                              left: `calc(50% + ${x}px)`,
                              top: `calc(50% + ${y}px)`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <div className={`w-10 h-10 rounded-full ${nodeColor} flex items-center justify-center text-white font-medium shadow px-0.5`} style={{ fontSize: nameFontSize }}>
                              {item.person.name}
                            </div>
                            <p className="text-center mt-1 text-[9px]">{labelText}</p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="mt-3 flex items-center justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <span className="text-gray-600">血缘</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600">同住</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                    <span className="text-gray-600">血缘+同住</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* 血缘关系 */}
            <Card className="border-none shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-600" />
                  血缘关系
                </h3>
                <span className="text-xs text-gray-400">
                  {person.familyRelations?.length || 0}人
                </span>
              </div>
              <div>
                {person.familyRelations && person.familyRelations.length > 0 ? (
                  <div>

                    {/* 关系列表 */}
                    <div>
                      {person.familyRelations.map((relation, idx) => {
                        const relatedPerson = relatedPeople.find(p => p.id === relation.relatedPersonId);
                        if (!relatedPerson) return null;
                        
                        return (
                          <div key={idx} className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-bold">
                                {relatedPerson.name[0]}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{relatedPerson.name}</div>
                                <div className="text-xs text-gray-500">{relation.relationType} · {relatedPerson.age}岁</div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-blue-600"
                              onClick={() => onRouteChange?.(`person-detail/${relatedPerson.id}`)}
                            >
                              查看
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Network className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">暂无血缘关系记录</p>
                  </div>
                )}
              </div>
            </Card>

            {/* 同住关系 */}
            <Card className="border-none shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-600" />
                  同住人员
                </h3>
                <span className="text-xs text-gray-400">{cohabitants.length}人</span>
              </div>
              <div>
                {cohabitants.length > 0 ? (
                  cohabitants.map((cohabitant, i) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between active:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-bold">
                          {cohabitant.name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{cohabitant.name}</div>
                          <div className="text-xs text-gray-500">{cohabitant.gender} · {cohabitant.age}岁</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-blue-600"
                        onClick={() => onRouteChange?.(`person-detail/${cohabitant.id}`)}
                      >
                        查看
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">暂无同住人员</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* 历史记录 Tab */}
          <TabsContent value="history" className="mt-0 p-4 space-y-4">
            <Card className="border-none shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-600" />
                  访问记录
                </h3>
                {visits.length > 0 && (
                  <span className="text-xs text-gray-400">{visits.length}条</span>
                )}
              </div>
              <div className="p-4">
                {visits.length > 0 ? (
                  <div className="space-y-0">
                    {visits.map((visit, index) => (
                      <div key={visit.id} className={`relative pl-4 border-l-2 border-gray-100 pb-6 ${index === visits.length - 1 ? 'border-transparent pb-0' : ''}`}>
                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white"></div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-bold text-gray-900">{visit.visitorName}</span>
                          <span className="text-xs text-gray-400 font-mono">{visit.date}</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2 leading-relaxed bg-gray-50 p-3 rounded-lg">
                          {visit.content}
                        </div>
                        {visit.tags && visit.tags.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {visit.tags.map((tag, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded border border-blue-100">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History className="w-16 h-16 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">暂无访问记录</p>
                    <p className="text-xs text-gray-300 mt-1">入户走访后会在此显示</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="border-none shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  变更记录
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="w-px h-full bg-gray-200 mt-1"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="text-xs text-gray-400">{person.updatedAt}</div>
                      <div className="text-sm text-gray-900 mt-1">信息最近更新</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Action */}
      <div className="bg-white border-t border-gray-100 p-4 safe-area-bottom sticky bottom-0 flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1 h-11 text-gray-700"
          onClick={() => onRouteChange?.(`visit-form/${id}`)}
        >
          添加走访记录
        </Button>
        <Button
          className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
          onClick={() => toast.info('请通过人员编辑或专项采集页发起信息变更')}
        >
          信息采集变更
        </Button>
      </div>
    </div>
  );
}
