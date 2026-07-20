/**
 * 弹窗标准底色（P2 冻结）：替代各页自定义的 DARK_DIALOG_CLASS。
 * 页面 DialogContent 统一 className={DIALOG_CLASS}（可再叠 max-w-* 等布局类）。
 */
export const DIALOG_CLASS =
  'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]';

/** 卡片标准面板：替代各页重复的 PANEL_CLASS / DARK_CARD_CLASS / SURFACE_CLASS */
export const PANEL_CLASS =
  'rounded-[4px] border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)]';
