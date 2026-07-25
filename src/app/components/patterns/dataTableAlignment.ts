/**
 * 桌面数据表唯一的列起点合同：标题、文本、数字、状态与操作均从列左侧开始。
 * 选择器挂在 table 上，以覆盖旧页面的局部 text-right/text-center 与 flex 对齐，
 * 同时不接触 Table 外层的 overflow-auto（窄屏表内滚动仍由 ui/table 保证）。
 */
export const DATA_TABLE_ALIGNMENT_CLASS = '[&_th]:text-left [&_td]:text-left [&_th>*]:mx-0 [&_th>button]:justify-start [&_th>button]:px-0 [&_td>div]:justify-start';
