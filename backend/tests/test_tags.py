from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.api.tags import router
from app.database import get_session
from app.models.grid import Grid
from app.models.house import House
from app.models.person import Person
from app.services.tags import _identity_card_birth_date, build_tag_snapshot, ensure_system_tags


def build_engine():
    return create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )


def seed_people(session: Session) -> None:
    session.add(Grid(id="g1", name="测试网格", managerName="张三峰"))
    session.add(House(
        id="h1",
        gridId="g1",
        address="测试社区1号楼101",
        communityName="测试社区",
        building="1号楼",
        unit="1单元",
        room="101",
        ownerName="测试老人",
        area="80㎡",
        type="自住",
        memberCount=1,
        tags=[],
        updatedAt="2026-07-30",
        occupancyStatus="人在户在",
        residenceType="自住",
    ))
    session.add(Person(
        id="p1",
        gridId="g1",
        houseId="h1",
        name="测试老人",
        idCard="370602194607310019",
        gender="男",
        age=79,
        address="测试社区1号楼101",
        type="户籍",
        tags=[],
        risk="Low",
        updatedAt="2026-07-30",
        birthDate="1946-07-31",
    ))
    session.commit()


def test_smart_age_and_living_alone_recompute_across_local_midnight() -> None:
    engine = build_engine()
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        seed_people(session)
        ensure_system_tags(session)

        before = build_tag_snapshot(
            session,
            now=datetime(2026, 7, 30, 23, 59, tzinfo=ZoneInfo("Asia/Shanghai")),
        )
        after = build_tag_snapshot(
            session,
            now=datetime(2026, 7, 31, 0, 1, tzinfo=ZoneInfo("Asia/Shanghai")),
        )

    before_names = {match.tagName for match in before.people[0].matchedTags}
    after_names = {match.tagName for match in after.people[0].matchedTags}
    assert "高龄老人" not in before_names
    assert "高龄独居" not in before_names
    assert {"高龄老人", "高龄独居"}.issubset(after_names)


def test_identity_card_birth_date_requires_a_valid_format_and_checksum() -> None:
    assert _identity_card_birth_date("370602194607310011") == "1946-07-31"
    assert _identity_card_birth_date("370602194607310019") is None
    assert _identity_card_birth_date("370602194613310011") is None
    assert _identity_card_birth_date("3706********0011") is None


def test_high_age_living_alone_requires_a_valid_current_house() -> None:
    engine = build_engine()
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(Grid(id="g1", name="测试网格", managerName="张三峰"))
        session.add(Person(
            id="p-missing-house",
            gridId="g1",
            houseId="missing-house",
            name="无有效住房老人",
            idCard="370602194607310011",
            gender="女",
            age=80,
            address="原住址已失效",
            type="户籍",
            tags=[],
            risk="Low",
            updatedAt="2026-07-30",
            birthDate="1946-07-30",
        ))
        session.commit()

        snapshot = build_tag_snapshot(
            session,
            now=datetime(2026, 7, 30, 12, 0, tzinfo=ZoneInfo("Asia/Shanghai")),
        )

    names = {match.tagName for match in snapshot.people[0].matchedTags}
    assert "高龄老人" in names
    assert "高龄独居" not in names


def test_tag_api_creates_unique_tags_and_rejects_manual_smart_assignment() -> None:
    engine = build_engine()
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        seed_people(session)
        ensure_system_tags(session)

    app = FastAPI()
    app.include_router(router, prefix="/api")

    def override_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    client = TestClient(app)

    ordinary_payload = {
        "name": "社区志愿者",
        "type": "ordinary",
        "description": "人工核实后维护的社区志愿服务标签。",
        "category": "社区参与",
        "riskLevel": "Low",
        "conditions": [],
    }
    created = client.post("/api/tags", json=ordinary_payload)
    assert created.status_code == 201
    tag_id = created.json()["id"]
    assert client.post("/api/tags", json={**ordinary_payload, "name": "  社区志愿者  "}).status_code == 409

    assignment = client.put(f"/api/tags/{tag_id}/assignments/p1")
    assert assignment.status_code == 200
    snapshot = client.get("/api/tags/snapshot").json()
    person_matches = snapshot["people"][0]["matchedTags"]
    assert any(match["tagId"] == tag_id and match["source"] == "manual" for match in person_matches)

    removed = client.delete(f"/api/tags/{tag_id}/assignments/p1")
    assert removed.status_code == 204
    snapshot_after_removal = client.get("/api/tags/snapshot").json()
    assert all(
        match["tagId"] != tag_id
        for match in snapshot_after_removal["people"][0]["matchedTags"]
    )

    assert client.put("/api/tags/tag_senior/assignments/p1").status_code == 422
    assert client.delete("/api/tags/tag_senior/assignments/p1").status_code == 422
    invalid_smart = client.post("/api/tags", json={
        **ordinary_payload,
        "name": "无条件智能标签",
        "type": "smart",
    })
    assert invalid_smart.status_code == 422
