from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
import random

from app.demo_data import DemoSeedBundle
from app.models.conflict import ConflictRecord
from app.models.house import House, HousingHistory
from app.models.person import Person
from app.models.visit import VisitRecord

TODAY = date(2026, 4, 15)
VISITORS = {"g1": "李明辉", "g2": "王海燕"}
PROPERTY_ORG = {"type": "organization", "id": "PROPERTY_MGMT", "name": "海源物业"}
SURNAMES = list("赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田樊胡凌霍虞万支柯管卢莫经房裘缪干解应宗丁宣贲邓郁单杭洪包诸左石崔吉钮龚程嵇邢滑裴陆荣翁荀羊於惠甄曲家封芮羿储靳汲邴糜松井段富巫乌焦巴弓牧隗山谷车侯宓蓬全郗班仰秋仲伊宫宁仇栾暴甘厉戎祖武符刘景詹束龙叶幸司韶郜黎蓟薄印宿白怀蒲台从鄂索咸籍赖卓蔺屠蒙池乔阴郁胥能苍双闻莘党翟谭贡劳逄姬申扶堵冉宰郦雍郤璩桑桂濮牛寿通边扈燕冀浦尚农温别庄晏柴瞿阎充慕连茹习宦艾鱼容向古易慎戈廖庾终暨居衡步都耿满弘匡国文寇广禄阙东欧殳沃利蔚越夔隆师巩厍聂晁勾敖融冷訾辛阚那简饶空曾毋沙乜养鞠须丰巢关蒯相查后荆红游竺权逯盖益桓公")
GIVEN_NAMES = [
    "秀兰", "建国", "晓梅", "海涛", "雨桐", "晨曦", "嘉豪", "梓涵", "静雯", "子墨", "思源", "可欣",
    "俊杰", "梦瑶", "浩然", "依婷", "子涵", "欣怡", "俊峰", "雅雯", "宇轩", "佳宁", "天宇", "诗雨",
    "志远", "晨露", "博文", "欣悦", "泽民", "安琪", "子恒", "若彤", "文博", "嘉琪", "昊天", "语嫣",
]
COMMUNITIES = {
    "g1": {"community": "海源一品", "buildings": ["8号楼", "11号楼", "13号楼"]},
    "g2": {"community": "海源二期", "buildings": ["1号楼", "4号楼", "5号楼"]},
}


@dataclass
class SeedState:
    rng: random.Random
    person_seq: int = 1
    visit_seq: int = 1
    conflict_seq: int = 1
    history_seq: int = 1
    used_person_ids: set[str] | None = None
    used_house_ids: set[str] | None = None

    def __post_init__(self) -> None:
        if self.used_person_ids is None:
            self.used_person_ids = set()
        if self.used_house_ids is None:
            self.used_house_ids = set()

    def next_person_id(self) -> str:
        while True:
            candidate = f"p_bg_{self.person_seq:03d}"
            self.person_seq += 1
            if candidate not in self.used_person_ids:
                self.used_person_ids.add(candidate)
                return candidate

    def next_visit_id(self) -> str:
        candidate = f"v_bg_{self.visit_seq:04d}"
        self.visit_seq += 1
        return candidate

    def next_conflict_id(self) -> str:
        candidate = f"c_bg_{self.conflict_seq:03d}"
        self.conflict_seq += 1
        return candidate

    def next_history_id(self) -> str:
        candidate = f"hh_bg_{self.history_seq:03d}"
        self.history_seq += 1
        return candidate


def build_background_bundle(hero_bundle: DemoSeedBundle, seed: int = 20260415) -> DemoSeedBundle:
    state = SeedState(
        rng=random.Random(seed),
        used_person_ids={person.id for person in hero_bundle.people},
        used_house_ids={house.id for house in hero_bundle.houses},
    )
    bundle = DemoSeedBundle()
    generated_houses: list[House] = []
    house_people: dict[str, list[Person]] = {}

    for grid_id, layout in COMMUNITIES.items():
        for building in layout["buildings"]:
            for unit in range(1, 3):
                for floor in range(1, 6):
                    for room in range(1, 4):
                        house = _make_house(
                            state=state,
                            grid_id=grid_id,
                            community=layout["community"],
                            building=building,
                            unit=f"{unit}单元",
                            room=f"{floor}{room:02d}",
                        )
                        generated_houses.append(house)
                        bundle.houses.append(house)
                        people, histories = _build_household(state, house)
                        house.memberCount = len(people)
                        bundle.people.extend(people)
                        bundle.housing_histories.extend(histories)
                        house_people[house.id] = people

    bundle.visits.extend(_build_visits(state, generated_houses, house_people))
    bundle.conflicts.extend(_build_conflicts(state, generated_houses, house_people))
    return bundle


def _make_house(
    *,
    state: SeedState,
    grid_id: str,
    community: str,
    building: str,
    unit: str,
    room: str,
) -> House:
    house_id = f"h_bg_{grid_id}_{building.rstrip('号楼')}_{unit.rstrip('单元')}_{room}"
    state.used_house_ids.add(house_id)
    house_type = _choose_house_type(state.rng, room.endswith("01"))
    owner_name = _random_name(state.rng)
    tags: list[str] = []
    occupancy_status = "人在户在"
    residence_type = "自住"
    owner_address = f"{community}{building}{unit}{room}"

    if house_type == "空置":
        tags.append("长期空置")
        occupancy_status = "人不在户不在"
        residence_type = "闲置"
    elif house_type == "出租":
        tags.append("出租房")
        occupancy_status = "户在人不在"
        residence_type = "租住"
        owner_address = "威海市环翠区随机产权人地址"
    elif house_type == "经营":
        tags.append("沿街商铺")
        occupancy_status = "其他"
        residence_type = "自住"

    return House(
        id=house_id,
        gridId=grid_id,
        address=f"{community}{building}{unit}{room}",
        communityName=community,
        building=building,
        unit=unit,
        room=room,
        ownerName=owner_name,
        area=f"{state.rng.randint(72, 132)}㎡",
        type=house_type,
        memberCount=0,
        tags=tags,
        updatedAt=_date_str(state.rng.randint(0, 12)),
        houseType="门市" if house_type == "经营" else "普通住宅",
        ownerPhone=_phone(state.rng.randint(30000000, 39999999)),
        ownerAddress=owner_address,
        occupancyStatus=occupancy_status,
        residenceType=residence_type,
    )


def _build_household(state: SeedState, house: House) -> tuple[list[Person], list[HousingHistory]]:
    if house.type == "空置":
        return [], _build_histories_for_empty_house(state, house)

    if house.type == "经营":
        return _build_business_household(state, house)

    if house.type == "出租":
        return _build_rental_household(state, house)

    return _build_owner_household(state, house)


def _build_owner_household(state: SeedState, house: House) -> tuple[list[Person], list[HousingHistory]]:
    profile = state.rng.choices(
        ["elder_single", "single_young", "couple", "nuclear_family", "multi_generational"],
        weights=[10, 12, 16, 38, 24],
        k=1,
    )[0]
    people: list[Person] = []
    histories: list[HousingHistory] = []

    if profile == "elder_single":
        person = _make_person(
            state,
            grid_id=house.gridId,
            house_id=house.id,
            address=house.address,
            gender=state.rng.choice(["男", "女"]),
            age=state.rng.randint(68, 86),
            person_type="户籍",
            tags=["独居老人"],
            risk="Medium" if state.rng.random() < 0.7 else "High",
            care_labels=["独居老人"],
            health_record={
                "hasChronic": True,
                "needsRegularMedicine": True,
                "medicalVisitFrequency": "每季度一次",
                "isSeverePatient": False,
                "isPregnant": False,
            },
        )
        people.append(person)
        house.tags = _merge_tags(house.tags, ["独居老人"])
        histories.append(
            HousingHistory(
                id=state.next_history_id(),
                houseId=house.id,
                personName=_random_name(state.rng),
                type="家属",
                period=f"{TODAY.year - state.rng.randint(15, 30)}-01 ~ {TODAY.year - state.rng.randint(1, 8)}-06",
                moveOutReason="子女外迁，老人持续独居。",
            )
        )
    elif profile == "single_young":
        people.append(
            _make_person(
                state,
                grid_id=house.gridId,
                house_id=house.id,
                address=house.address,
                gender=state.rng.choice(["男", "女"]),
                age=state.rng.randint(23, 35),
                person_type="户籍",
                tags=["青年住户"],
                risk="Low",
            )
        )
    elif profile == "couple":
        first = _make_person(
            state,
            grid_id=house.gridId,
            house_id=house.id,
            address=house.address,
            gender="男",
            age=state.rng.randint(30, 58),
            person_type="户籍",
            tags=["夫妻家庭"],
            risk="Low",
        )
        second = _make_person(
            state,
            grid_id=house.gridId,
            house_id=house.id,
            address=house.address,
            gender="女",
            age=max(24, first.age - state.rng.randint(-2, 5)),
            person_type="户籍",
            tags=["夫妻家庭"],
            risk="Low",
        )
        first.familyRelations = [{"relatedPersonId": second.id, "relationType": "配偶"}]
        second.familyRelations = [{"relatedPersonId": first.id, "relationType": "配偶"}]
        people.extend([first, second])
    elif profile == "nuclear_family":
        father = _make_person(
            state,
            grid_id=house.gridId,
            house_id=house.id,
            address=house.address,
            gender="男",
            age=state.rng.randint(30, 46),
            person_type="户籍",
            tags=["学龄儿童家庭"],
            risk="Low",
        )
        mother = _make_person(
            state,
            grid_id=house.gridId,
            house_id=house.id,
            address=house.address,
            gender="女",
            age=max(24, father.age - state.rng.randint(-1, 4)),
            person_type="户籍",
            tags=["学龄儿童家庭"],
            risk="Low",
        )
        child = _make_person(
            state,
            grid_id=house.gridId,
            house_id=house.id,
            address=house.address,
            gender=state.rng.choice(["男", "女"]),
            age=state.rng.randint(6, 16),
            person_type="户籍",
            tags=["学龄儿童"],
            risk="Low",
            education="小学" if state.rng.random() < 0.6 else "初中",
        )
        father.familyRelations = [
            {"relatedPersonId": mother.id, "relationType": "配偶"},
            {"relatedPersonId": child.id, "relationType": "子女"},
        ]
        mother.familyRelations = [
            {"relatedPersonId": father.id, "relationType": "配偶"},
            {"relatedPersonId": child.id, "relationType": "子女"},
        ]
        child.familyRelations = [
            {"relatedPersonId": father.id, "relationType": "父亲"},
            {"relatedPersonId": mother.id, "relationType": "母亲"},
        ]
        house.tags = _merge_tags(house.tags, ["学龄儿童家庭"])
        people.extend([father, mother, child])
    else:
        grandparent = _make_person(
            state,
            grid_id=house.gridId,
            house_id=house.id,
            address=house.address,
            gender=state.rng.choice(["男", "女"]),
            age=state.rng.randint(64, 78),
            person_type="户籍",
            tags=["三代同堂"],
            risk="Medium" if state.rng.random() < 0.35 else "Low",
        )
        parent = _make_person(
            state,
            grid_id=house.gridId,
            house_id=house.id,
            address=house.address,
            gender="女",
            age=state.rng.randint(33, 48),
            person_type="户籍",
            tags=["三代同堂"],
            risk="Low",
        )
        partner = _make_person(
            state,
            grid_id=house.gridId,
            house_id=house.id,
            address=house.address,
            gender="男",
            age=max(28, parent.age - state.rng.randint(-2, 6)),
            person_type="户籍",
            tags=["三代同堂"],
            risk="Low",
        )
        child = _make_person(
            state,
            grid_id=house.gridId,
            house_id=house.id,
            address=house.address,
            gender=state.rng.choice(["男", "女"]),
            age=state.rng.randint(4, 15),
            person_type="户籍",
            tags=["学龄儿童"],
            risk="Low",
            education="小学",
        )
        parent.familyRelations = [
            {"relatedPersonId": partner.id, "relationType": "配偶"},
            {"relatedPersonId": child.id, "relationType": "子女"},
            {"relatedPersonId": grandparent.id, "relationType": "母亲" if grandparent.gender == "女" else "父亲"},
        ]
        partner.familyRelations = [
            {"relatedPersonId": parent.id, "relationType": "配偶"},
            {"relatedPersonId": child.id, "relationType": "子女"},
        ]
        child.familyRelations = [
            {"relatedPersonId": parent.id, "relationType": "母亲"},
            {"relatedPersonId": partner.id, "relationType": "父亲"},
            {"relatedPersonId": grandparent.id, "relationType": "祖父母"},
        ]
        people.extend([grandparent, parent, partner, child])
        house.tags = _merge_tags(house.tags, ["三代同堂"])

    if state.rng.random() < 0.2:
        histories.append(
            HousingHistory(
                id=state.next_history_id(),
                houseId=house.id,
                personName=_random_name(state.rng),
                type=state.rng.choice(["租客", "家属", "其他"]),
                period=f"{TODAY.year - state.rng.randint(4, 12)}-03 ~ {TODAY.year - state.rng.randint(1, 3)}-09",
                moveOutReason=state.rng.choice(["工作调动", "子女入学搬迁", "租约到期"]),
            )
        )

    return people, histories


def _build_rental_household(state: SeedState, house: House) -> tuple[list[Person], list[HousingHistory]]:
    profile = state.rng.choices(
        ["single_worker", "couple_rent", "shared_rent_3", "shared_rent_4"],
        weights=[20, 16, 38, 26],
        k=1,
    )[0]
    people: list[Person] = []
    member_count = {"single_worker": 1, "couple_rent": 2, "shared_rent_3": 3, "shared_rent_4": 4}[profile]
    if state.rng.random() < 0.08:
        member_count += 1

    for _ in range(member_count):
        people.append(
            _make_person(
                state,
                grid_id=house.gridId,
                house_id=house.id,
                address=house.address,
                gender=state.rng.choice(["男", "女"]),
                age=state.rng.randint(21, 42),
                person_type="流动",
                tags=["流动人口", "租客"],
                risk="Medium",
                education=state.rng.choice(["高中", "中专", "大专", "本科"]),
                workplace=state.rng.choice(
                    ["物流分拣员", "外卖骑手", "便利店店员", "电子厂操作工", "保安"]
                ),
            )
        )

    if member_count >= 4:
        house.tags = _merge_tags(house.tags, ["流动人口聚集", "群租线索"])
    histories = [
        HousingHistory(
            id=state.next_history_id(),
            houseId=house.id,
            personName=_random_name(state.rng),
            type="租客",
            period=f"{TODAY.year - 1}-02 ~ {TODAY.year - 1}-11",
            moveOutReason="租约到期换租。",
        )
    ]
    return people, histories


def _build_business_household(state: SeedState, house: House) -> tuple[list[Person], list[HousingHistory]]:
    owner = _make_person(
        state,
        grid_id=house.gridId,
        house_id=house.id,
        address=house.address,
        gender=state.rng.choice(["男", "女"]),
        age=state.rng.randint(30, 56),
        person_type="户籍",
        tags=["商铺经营户"],
        risk="Low",
        workplace=state.rng.choice(["便利店", "早餐铺", "社区修理店", "小卖部"]) + "经营者",
    )
    people = [owner]
    if state.rng.random() < 0.45:
        helper = _make_person(
            state,
            grid_id=house.gridId,
            house_id=house.id,
            address=house.address,
            gender=state.rng.choice(["男", "女"]),
            age=state.rng.randint(24, 50),
            person_type="户籍",
            tags=["商铺经营户"],
            risk="Low",
            workplace=owner.workplace,
        )
        people.append(helper)
    return people, []


def _build_histories_for_empty_house(state: SeedState, house: House) -> list[HousingHistory]:
    if state.rng.random() < 0.35:
        return [
            HousingHistory(
                id=state.next_history_id(),
                houseId=house.id,
                personName=_random_name(state.rng),
                type=state.rng.choice(["业主", "租客"]),
                period=f"{TODAY.year - state.rng.randint(2, 8)}-05 ~ {TODAY.year - 1}-10",
                moveOutReason=state.rng.choice(["长期外出", "房屋待出售", "租约到期后暂未出租"]),
            )
        ]
    return []


def _build_visits(
    state: SeedState,
    houses: list[House],
    house_people: dict[str, list[Person]],
) -> list[VisitRecord]:
    visits: list[VisitRecord] = []
    for house in houses:
        people = house_people.get(house.id, [])
        if house.type != "空置" and (house.type != "自住" or state.rng.random() < 0.35):
            visits.append(
                VisitRecord(
                    id=state.next_visit_id(),
                    targetId=house.id,
                    targetType="house",
                    gridId=house.gridId,
                    visitorName=VISITORS[house.gridId],
                    date=_date_str(state.rng.randint(5, 70)),
                    content=_house_visit_content(house),
                    images=[],
                    tags=_house_visit_tags(house),
                )
            )

        for person in people:
            base_count = 1
            if person.risk == "High":
                base_count = 3
            elif person.risk == "Medium":
                base_count = 2
            elif state.rng.random() < 0.3:
                base_count = 0

            if "独居老人" in (person.tags + (person.careLabels or [])):
                base_count = max(base_count, 2)
            if "流动人口" in person.tags and state.rng.random() < 0.35:
                base_count += 1

            for _ in range(base_count):
                visits.append(
                    VisitRecord(
                        id=state.next_visit_id(),
                        targetId=person.id,
                        targetType="person",
                        gridId=person.gridId,
                        visitorName=VISITORS[person.gridId],
                        date=_date_str(state.rng.randint(1, 110)),
                        content=_person_visit_content(person),
                        images=[],
                        tags=_person_visit_tags(person),
                    )
                )
    return visits


def _build_conflicts(
    state: SeedState,
    houses: list[House],
    house_people: dict[str, list[Person]],
) -> list[ConflictRecord]:
    conflicts: list[ConflictRecord] = []
    rental_houses = [house for house in houses if "流动人口聚集" in house.tags or house.type == "出租"]
    family_houses = [house for house, people in ((house, house_people.get(house.id, [])) for house in houses) if len(people) >= 3]
    neighbor_pairs = _neighbor_pairs(houses)

    for house in rental_houses[:5]:
        lead_person = (house_people.get(house.id) or [None])[0]
        if lead_person is None:
            continue
        conflicts.append(
            ConflictRecord(
                id=state.next_conflict_id(),
                source="自行发现" if state.rng.random() < 0.4 else "上级下派",
                title=f"{house.communityName}{house.building}{house.unit}{house.room}租住秩序整治",
                type="物业纠纷",
                description="物业反馈出租房夜间人员出入频繁，需核查人员登记与安全隐患。",
                involvedParties=[
                    {"type": "resident", "id": lead_person.id, "name": lead_person.name},
                    PROPERTY_ORG,
                ],
                status="调解中" if state.rng.random() < 0.6 else "已化解",
                gridId=house.gridId,
                location=house.address,
                timeline=_timeline(state, house.gridId, "接到物业线索", "入户核查登记情况"),
                images=[],
                createdAt=_datetime_str(state.rng.randint(6, 35)),
                updatedAt=_datetime_str(state.rng.randint(1, 5)),
            )
        )

    for house in family_houses[:4]:
        people = house_people.get(house.id, [])
        if len(people) < 2:
            continue
        conflicts.append(
            ConflictRecord(
                id=state.next_conflict_id(),
                source="自行发现",
                title=f"{house.communityName}{house.building}{house.unit}{house.room}家庭矛盾排查",
                type="家庭纠纷",
                description="家人因赡养、教育或支出问题发生争执，需上门调解并安排回访。",
                involvedParties=[
                    {"type": "resident", "id": people[0].id, "name": people[0].name},
                    {"type": "resident", "id": people[1].id, "name": people[1].name},
                ],
                status="调解中",
                gridId=house.gridId,
                location=house.address,
                timeline=_timeline(state, house.gridId, "走访中发现矛盾", "约定第二轮调解时间"),
                images=[],
                createdAt=_datetime_str(state.rng.randint(10, 45)),
                updatedAt=_datetime_str(state.rng.randint(2, 8)),
            )
        )

    for left_house, right_house in neighbor_pairs[:5]:
        left_people = house_people.get(left_house.id, [])
        right_people = house_people.get(right_house.id, [])
        if not left_people or not right_people:
            continue
        conflicts.append(
            ConflictRecord(
                id=state.next_conflict_id(),
                source="上级下派",
                title=f"{left_house.building}{left_house.unit}相邻住户矛盾协调",
                type="邻里纠纷",
                description="相邻住户因噪音、楼道杂物或公共空间使用问题产生纠纷，需要协调处理。",
                involvedParties=[
                    {"type": "resident", "id": left_people[0].id, "name": left_people[0].name},
                    {"type": "resident", "id": right_people[0].id, "name": right_people[0].name},
                ],
                status="已化解" if state.rng.random() < 0.45 else "调解中",
                gridId=left_house.gridId,
                location=f"{left_house.communityName}{left_house.building}{left_house.unit}",
                timeline=_timeline(state, left_house.gridId, "接到邻里投诉", "上门协调并明确整改要求"),
                images=[],
                createdAt=_datetime_str(state.rng.randint(12, 60)),
                updatedAt=_datetime_str(state.rng.randint(3, 10)),
            )
        )

    return conflicts[:14]


def _neighbor_pairs(houses: list[House]) -> list[tuple[House, House]]:
    index: dict[tuple[str, str, str, str], House] = {}
    pairs: list[tuple[House, House]] = []
    for house in houses:
        index[(house.gridId, house.building, house.unit, house.room)] = house
        if house.room.endswith("02"):
            left_key = (house.gridId, house.building, house.unit, house.room[:-2] + "01")
            left_house = index.get(left_key)
            if left_house is not None:
                pairs.append((left_house, house))
        if house.room.endswith("03"):
            right_key = (house.gridId, house.building, house.unit, house.room[:-2] + "02")
            right_house = index.get(right_key)
            if right_house is not None:
                pairs.append((right_house, house))
    return pairs


def _make_person(
    state: SeedState,
    *,
    grid_id: str,
    house_id: str,
    address: str,
    gender: str,
    age: int,
    person_type: str,
    tags: list[str],
    risk: str,
    education: str | None = None,
    care_labels: list[str] | None = None,
    health_record: dict[str, object] | None = None,
    workplace: str | None = None,
) -> Person:
    person_id = state.next_person_id()
    birth = _birth_date(age, state.rng)
    return Person(
        id=person_id,
        gridId=grid_id,
        houseId=house_id,
        name=_random_name(state.rng, gender),
        idCard=_id_card(state.rng, birth),
        gender=gender,
        age=age,
        phone=_phone(state.rng.randint(40000000, 49999999)),
        address=address,
        type=person_type,
        tags=tags.copy(),
        risk=risk,
        updatedAt=_date_str(state.rng.randint(0, 14)),
        nation=state.rng.choice(["汉族", "汉族", "汉族", "满族", "朝鲜族"]),
        education=education or state.rng.choice(["初中", "高中", "中专", "大专", "本科"]),
        careLabels=care_labels,
        categoryLabels=None,
        healthRecord=health_record,
        workplace=workplace,
    )


def _choose_house_type(rng: random.Random, prefer_business: bool) -> str:
    roll = rng.random()
    if prefer_business and roll < 0.08:
        return "经营"
    if roll < 0.12:
        return "空置"
    if roll < 0.4:
        return "出租"
    return "自住"


def _person_visit_content(person: Person) -> str:
    tags = person.tags + (person.careLabels or [])
    if "独居老人" in tags:
        return "入户核对老人身体状况、药品余量和应急联系人，提醒按时复诊。"
    if "流动人口" in tags:
        return "核验租住登记信息，确认近期工作和实际居住人数变化。"
    if "低保家庭" in tags or "困难" in tags:
        return "了解家庭收入、就学和托管需求，补录帮扶事项。"
    if "学龄儿童" in tags:
        return "了解孩子就学和家庭监护情况，提醒注意放学安全。"
    return "例行走访，补录联系方式、居住状态和近期诉求。"


def _person_visit_tags(person: Person) -> list[str]:
    tags = []
    if "独居老人" in (person.tags + (person.careLabels or [])):
        tags.append("重点回访")
    if "流动人口" in person.tags:
        tags.append("流动登记")
    if person.risk != "Low":
        tags.append("风险排查")
    return tags or ["常规走访"]


def _house_visit_content(house: House) -> str:
    if house.type == "出租":
        return "核查出租房居住人数、用电和消防情况，补录产权人与承租人信息。"
    if house.type == "经营":
        return "核查商铺经营和门前三包落实情况，确认周边居民反馈。"
    return "核查房屋基本情况，确认人房关系和近期异常线索。"


def _house_visit_tags(house: House) -> list[str]:
    if house.type == "出租":
        return ["出租房巡查"]
    if house.type == "经营":
        return ["商铺巡查"]
    return ["房屋核验"]


def _timeline(state: SeedState, grid_id: str, first_event: str, second_event: str) -> list[dict[str, str]]:
    return [
        {"date": _datetime_str(state.rng.randint(10, 45)), "content": first_event, "operator": "系统管理员"},
        {"date": _datetime_str(state.rng.randint(1, 9)), "content": second_event, "operator": VISITORS[grid_id]},
    ]


def _merge_tags(existing: list[str], additions: list[str]) -> list[str]:
    merged = list(existing)
    for tag in additions:
        if tag not in merged:
            merged.append(tag)
    return merged


def _random_name(rng: random.Random, gender: str | None = None) -> str:
    given = rng.choice(GIVEN_NAMES)
    if gender == "男":
        given = rng.choice(["建国", "志远", "海涛", "俊杰", "浩然", "宇轩", "泽民", "子恒"])
    elif gender == "女":
        given = rng.choice(["秀兰", "晓梅", "静雯", "佳宁", "诗雨", "梦瑶", "语嫣", "可欣"])
    return rng.choice(SURNAMES) + given


def _birth_date(age: int, rng: random.Random) -> date:
    year = TODAY.year - age
    month = rng.randint(1, 12)
    day = rng.randint(1, 28)
    return date(year, month, day)


def _id_card(rng: random.Random, birth: date) -> str:
    return f"310115{birth:%Y%m%d}{rng.randint(1000, 9999)}"


def _phone(suffix: int) -> str:
    return f"138{suffix:08d}"


def _date_str(days_ago: int) -> str:
    return (TODAY - timedelta(days=days_ago)).isoformat()


def _datetime_str(days_ago: int) -> str:
    return f"{_date_str(days_ago)} 10:00:00"
