# Phase 7 v2 Verification

> Date: 2026-04-23
> Scope: front-end experience polish from `observations/2026-04-23-ui-adjustment-digest.md`

## Conclusion

Phase 7 v2 first slice passed local verification.

This slice handles only the low-risk front-end polish items:

- Browser title changed to `家庭数仓 Demo`.
- The dashboard recommendation path is no longer permanent page content; it appears as a dismissible first-entry overlay.
- Web-side mobile copy is tightened to `移动端工作台` instead of `体验移动端主链 / 去移动端执行`.
- Dashboard tooltip and hover states now use higher-contrast light surfaces.
- Population management now renders a paginated list, 20 rows per page.
- Population management default list density now includes family/house, relation, biography/needs, and visit summary columns.
- The `全部状态` filter icon is moved outside the select trigger.

This slice explicitly does not include:

- Housing management Finder-style redesign.
- Location anonymization from 威海 / 临港 to 烟台 / 蓬莱.
- Browser pathname routing.
- Any new backend schema or data migration.

## Verification

Commands:

```bash
npm run typecheck
npm run build -- --outDir /tmp/lingang-phase7-v2-dist
git diff --check
python3 /Users/rayli/.agents/skills/Web测试/scripts/with_server.py --server "npm run dev -- --host 127.0.0.1" --port 5173 --timeout 45 -- node /tmp/phase7-pw/phase7_v2_smoke.mjs
```

Observed Playwright smoke result:

```json
{"ok":true,"title":"家庭数仓 Demo","dataRows":20}
```

The smoke check covered:

- Browser title.
- First-entry overlay rendering and dismissal.
- Removal of permanent `推荐浏览路径` page card.
- Dashboard mobile workbench CTA.
- Population page route.
- Population list columns `家庭/房屋`、`经历/诉求`、`走访记录`.
- Pagination rendering with 20 table rows on page 1.

## Follow-up Boundary

Remaining items from the digest should stay out of this slice:

- Housing page interaction redesign belongs to the next product-interaction slice.
- Location anonymization needs data and administrative-region decisions first.
- Real URL routing needs a routing/deployment decision because it touches the Vercel SPA fallback and Phase 6 rewrite boundary.
