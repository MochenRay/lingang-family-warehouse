from app.models.knowledge import KnowledgeRecord


def build_knowledge_records() -> list[KnowledgeRecord]:
    return [
        KnowledgeRecord(
            id="knowledge_001",
            title="独居老人入户走访要点清单",
            type="document",
            category="走访手册",
            summary="围绕身体状况、药品储备、联系人、家中安全四个方面形成的走访提纲。",
            content="""适用对象：高龄独居、行动不便、慢病长期服药对象。

一、入户前准备
1. 核实最近一次走访记录、联系人信息、慢病与用药信息。
2. 携带爱心联系卡、燃气/用电安全宣传页。

二、入户重点
1. 询问近期身体情况、就医安排和药品余量。
2. 核查紧急联系人是否畅通。
3. 查看燃气、电路、取暖设备和楼道堆物情况。

三、走访后沉淀
1. 补录走访摘要。
2. 如发现风险，转待办清单继续跟进。
3. 对需要服务的事项形成闭环记录。""",
            size="328 KB",
            uploadDate="2026-01-13 09:20",
            author="王干事",
            tags=["独居老人", "走访提纲", "安全排查"],
            relatedType="person",
            relatedId="person_li_daye",
            source="走访知识库",
        ),
        KnowledgeRecord(
            id="knowledge_002",
            title="群租房风险巡查现场纪要",
            type="meeting",
            category="现场纪要",
            summary="汇总群租线索房屋的消防、用电和人口登记核查要点，便于房屋支持页快速联动。",
            content="""一、巡查范围
- 群租风险标签房屋
- 出租人数明显异常房屋

二、必查项
- 灭火器、烟感、燃气报警器
- 电动车违规停放与飞线充电
- 实际居住人数与台账是否一致

三、处置动作
- 先留痕，再同步房屋详情和待办清单
- 如发现纠纷或投诉，联动矛盾调解链路""",
            size="86 KB",
            uploadDate="2026-01-11 16:40",
            author="李网格",
            tags=["群租风险", "房屋巡查", "现场纪要"],
            relatedType="house",
            relatedId="house_haiyuan_2_2_402",
            source="房屋治理资料",
        ),
        KnowledgeRecord(
            id="knowledge_003",
            title="冬季取暖安全宣传素材（公众号转载）",
            type="article",
            category="宣传资料",
            summary="可直接引用到通知和入户宣传中的安全提示材料，适合作为通知页和知识页的公共内容。",
            content="""冬季取暖期间，请重点关注以下问题：
1. 燃气报警器是否正常工作
2. 电暖器周边是否堆放可燃物
3. 楼道是否有纸箱、旧家具等杂物
4. 老年人是否掌握紧急联系人和报修方式""",
            size="-",
            uploadDate="2026-01-09 10:10",
            author="系统采集",
            tags=["冬季取暖", "安全宣传", "公众号文章"],
            relatedType="notice",
            relatedId="notice_002",
            source="平安烟台公众号",
        ),
        KnowledgeRecord(
            id="knowledge_004",
            title="邻里纠纷回访纪要模板",
            type="document",
            category="处置模板",
            summary="用于矛盾调解后的回访记录模板，包含情绪变化、履约情况和下一步动作。",
            content="""回访纪要建议包含：
1. 回访对象及时间
2. 当前情绪状态与矛盾变化
3. 双方约定是否履行
4. 是否需要再次上门或协调物业/社区
5. 后续责任人和时间点""",
            size="142 KB",
            uploadDate="2026-01-08 14:30",
            author="赵敏",
            tags=["矛盾调解", "回访模板", "纪要"],
            relatedType="conflict",
            relatedId="conflict_001",
            source="矛盾调处知识库",
        ),
        KnowledgeRecord(
            id="knowledge_005",
            title="海梦苑社区第一网格重点对象周研判摘要",
            type="document",
            category="研判摘要",
            summary="整理第一网格重点对象、待回访对象和矛盾风险的周度研判结论，用于搜索和驾驶舱补充阅读。",
            content="""本周重点结论：
1. 高龄独居对象需继续关注药品补给与联系人畅通。
2. 群租风险房屋应补充最新入住人数核验。
3. 两起邻里纠纷进入跟踪回访阶段，建议移动端待办继续闭环。""",
            size="210 KB",
            uploadDate="2026-01-06 18:00",
            author="系统研判",
            tags=["周研判", "重点对象", "待回访"],
            relatedType="grid",
            relatedId="g1",
            source="治理研判输出",
        ),
    ]
