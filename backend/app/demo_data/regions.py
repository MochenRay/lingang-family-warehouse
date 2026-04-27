from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RegionGrid:
    id: str
    district: str
    street: str
    community: str
    grid_label: str
    manager_name: str
    buildings: tuple[str, ...]

    @property
    def grid_name(self) -> str:
        return f"{self.street}{self.community}{self.grid_label}"

    @property
    def short_community(self) -> str:
        return self.community.removesuffix("社区")


REGION_GRID_CATALOG: tuple[RegionGrid, ...] = (
    RegionGrid("g1", "蓬莱区", "登州街道", "海梦苑社区", "第一网格", "李明辉", ("8号楼", "11号楼", "13号楼")),
    RegionGrid("g2", "蓬莱区", "登州街道", "海梦苑社区", "第二网格", "王海燕", ("1号楼", "4号楼", "5号楼")),
    RegionGrid("g_zf_1", "芝罘区", "毓璜顶街道", "南通社区", "第一网格", "孙晓楠", ("1号楼", "3号楼")),
    RegionGrid("g_fs_1", "福山区", "清洋街道", "银河社区", "第一网格", "赵晨", ("2号楼", "6号楼")),
    RegionGrid("g_mp_1", "牟平区", "文化街道", "沁水社区", "第一网格", "周海宁", ("5号楼", "7号楼")),
    RegionGrid("g_ls_1", "莱山区", "黄海路街道", "埠岚社区", "第一网格", "刘若彤", ("9号楼", "12号楼")),
    RegionGrid("g_lk_1", "龙口市", "东莱街道", "松岚社区", "第一网格", "邹文博", ("4号楼", "10号楼")),
    RegionGrid("g_ly_1", "莱阳市", "城厢街道", "旌旗社区", "第一网格", "姜嘉琪", ("1号楼", "8号楼")),
    RegionGrid("g_lz_1", "莱州市", "文昌路街道", "文苑社区", "第一网格", "梁昊天", ("6号楼", "11号楼")),
    RegionGrid("g_zy_1", "招远市", "泉山街道", "温泉社区", "第一网格", "韩语嫣", ("3号楼", "9号楼")),
    RegionGrid("g_qx_1", "栖霞市", "庄园街道", "霞光社区", "第一网格", "马志远", ("2号楼", "5号楼")),
    RegionGrid("g_hy_1", "海阳市", "方圆街道", "海政社区", "第一网格", "魏晨露", ("7号楼", "13号楼")),
)

REGION_GRID_BY_ID = {item.id: item for item in REGION_GRID_CATALOG}


def get_region_for_grid(grid_id: str, grid_name: str | None = None) -> RegionGrid | None:
    matched = REGION_GRID_BY_ID.get(grid_id)
    if matched:
        return matched
    if not grid_name:
        return None
    return next((item for item in REGION_GRID_CATALOG if item.grid_name == grid_name or item.grid_name in grid_name), None)
