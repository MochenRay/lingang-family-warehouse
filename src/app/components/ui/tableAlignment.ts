/**
 * 桌面数据表唯一的列起点合同。
 * 仅收敛普通数据单元及其直接布局容器；跨列 loading/empty 单元保留自身对齐语义。
 */
export const DATA_TABLE_ALIGNMENT_CLASS = '[&_th]:text-left [&_td:not([colspan])]:text-left [&_th>*]:mx-0 [&_th>button]:justify-start [&_th>button]:px-0 [&_td:not([colspan])>div]:justify-start';
