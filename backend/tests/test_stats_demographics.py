from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.database import get_session
from app.main import app
from app.models.grid import Grid
from app.models.person import Person


AGES = [
    ("男", 5),
    ("男", 12),
    ("女", 9),
    ("男", 30),
    ("女", 25),
    ("女", 33),
    ("男", 45),
    ("男", 60),
    ("女", 50),
    ("男", 70),
    ("女", 66),
    ("女", 80),
]
PERSON_TYPES = ["户籍"] * 6 + ["流动"] * 3 + ["留守"] * 2 + ["境外"]
EDUCATION = ["本科"] * 4 + ["研究生"] * 2 + ["博士后", "高中", "高中", "初中", None, None]
NATIONS = ["汉族"] * 8 + ["满族"] * 2 + ["朝鲜族", None]


def _build_client() -> tuple[TestClient, object]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        session.add(Grid(id="grid-1", name="海湾网格", managerName="网格负责人"))
        for index, ((gender, age), person_type, education, nation) in enumerate(
            zip(AGES, PERSON_TYPES, EDUCATION, NATIONS, strict=True),
            start=1,
        ):
            session.add(
                Person(
                    id=f"person-{index}",
                    gridId="grid-1",
                    name=f"测试居民{index}",
                    idCard=f"TEST-{index:04d}",
                    gender=gender,
                    age=age,
                    address="测试地址",
                    type=person_type,
                    tags=[],
                    risk="Low",
                    updatedAt="2026-07-01",
                    education=education,
                    nation=nation,
                )
            )
        session.commit()

    def override_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    return TestClient(app), engine


def test_demographics_stats_returns_full_aggregate_with_boundary_and_normalization() -> None:
    client, _engine = _build_client()

    try:
        response = client.get("/api/stats/demographics")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert set(payload) == {
        "totalPopulation",
        "elderlyCount",
        "elderlyRate",
        "ageGenderData",
        "typeData",
        "educationData",
        "nationData",
    }
    assert payload["totalPopulation"] == 12
    assert payload["elderlyCount"] == 3
    assert payload["elderlyRate"] == 25.0
    assert payload["ageGenderData"] == [
        {"name": "60岁以上", "male": 1, "female": 2},
        {"name": "36-60岁", "male": 2, "female": 1},
        {"name": "19-35岁", "male": 1, "female": 2},
        {"name": "0-18岁", "male": 2, "female": 1},
    ]
    assert payload["typeData"] == [
        {"name": "户籍", "value": 6},
        {"name": "流动", "value": 3},
        {"name": "留守", "value": 2},
        {"name": "境外", "value": 1},
    ]
    assert payload["educationData"] == [
        {"name": "学龄前", "value": 0},
        {"name": "未上学", "value": 0},
        {"name": "小学", "value": 0},
        {"name": "初中", "value": 1},
        {"name": "高中", "value": 2},
        {"name": "中专", "value": 0},
        {"name": "大专", "value": 0},
        {"name": "本科", "value": 4},
        {"name": "硕士", "value": 2},
        {"name": "博士", "value": 1},
        {"name": "其他", "value": 0},
        {"name": "未记录", "value": 2},
    ]
    assert payload["nationData"] == [
        {"name": "汉族", "value": 8},
        {"name": "满族", "value": 2},
        {"name": "朝鲜族", "value": 1},
        {"name": "未记录", "value": 1},
    ]


def test_demographics_stats_are_fresh_immediately_after_person_update() -> None:
    client, _engine = _build_client()

    try:
        before = client.get("/api/stats/demographics")
        update = client.patch("/api/people/person-1", json={"age": 71})
        after = client.get("/api/stats/demographics")
    finally:
        app.dependency_overrides.clear()

    assert before.status_code == 200
    assert update.status_code == 200
    assert after.status_code == 200
    assert before.json()["elderlyCount"] == 3
    assert after.json()["elderlyCount"] == 4
    assert after.json()["ageGenderData"][0] == {
        "name": "60岁以上",
        "male": 2,
        "female": 2,
    }


def test_person_write_contract_rejects_values_the_demographics_chart_cannot_classify() -> None:
    client, _engine = _build_client()
    valid_payload = {
        "gridId": "grid-1",
        "name": "合同测试",
        "idCard": "CONTRACT-001",
        "gender": "男",
        "age": 30,
        "address": "测试地址",
        "type": "户籍",
        "tags": [],
        "risk": "Low",
        "updatedAt": "2026-07-23",
    }

    try:
        invalid_responses = [
            client.post("/api/people", json={**valid_payload, "gender": "未知"}),
            client.post("/api/people", json={**valid_payload, "type": "其他"}),
            client.post("/api/people", json={**valid_payload, "age": 201}),
        ]
    finally:
        app.dependency_overrides.clear()

    assert [response.status_code for response in invalid_responses] == [422, 422, 422]
