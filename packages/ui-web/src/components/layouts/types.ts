import type { ItemGroup, Template } from '../../model';

/** Every layout renderer receives the same contract: pre-sorted, pre-grouped
 * views + the active template. Layouts arrange the groups visually (single
 * column, dense rows, a time spine, columns) but render each row with
 * <ItemLine> and never mutate data — that's the open/closed boundary. */
export type LayoutProps = {
  groups: ItemGroup[];
  template: Template;
};
