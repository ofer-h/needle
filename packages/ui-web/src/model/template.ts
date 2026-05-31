/* Templates are PURE PRESENTATION CONFIG. Switching or building a template never
 * touches item data — it only registers a config object. This is the open/closed
 * core: add a template = add one entry to the registry; user-authored templates
 * are the exact same shape, persisted to local storage.
 *
 * Promote into @needle/domain once validated. */

export type TemplateId = string;

/** Built-in layout renderers. 'custom' reuses a base layout chosen by the user. */
export type TemplateLayout = 'editorial' | 'compact' | 'timeline' | 'kanban' | 'custom';

export type Density = 'roomy' | 'cozy' | 'compact';

/** Which optional fields a row may surface. The line text is always shown. */
export type ItemField = 'time' | 'duration' | 'commitment' | 'source' | 'tags' | 'progress';

export type SortBy = 'time' | 'priority' | 'manual';

export type Grouping = 'none' | 'timeOfDay' | 'commitment' | 'status';

/** Accent token name (maps to a semantic --<accent> CSS var). */
export type AccentName = 'urgent' | 'upcoming' | 'remember' | 'accent' | 'calendar';

export type Template = {
  id: TemplateId;
  name: string;
  description?: string;
  layout: TemplateLayout;
  /** For layout: 'custom' — which built-in renderer to drive. */
  baseLayout?: Exclude<TemplateLayout, 'custom'>;
  density: Density;
  fieldsShown: ItemField[];
  accent: AccentName;
  sortBy: SortBy;
  grouping: Grouping;
  showProgress: boolean;
  showCountdown: boolean;
  /** How nested subtasks render. Optional for back-compat; default 'inline'. */
  subtaskDisplay?: SubtaskDisplay;
  /** True for user-authored templates (persisted, deletable). */
  custom?: boolean;
};

/** inline = always expanded; collapsed = "▸ 2 of 3", expand on click;
 * hidden = parent row only. */
export type SubtaskDisplay = 'inline' | 'collapsed' | 'hidden';

export const DEFAULT_SUBTASK_DISPLAY: SubtaskDisplay = 'inline';

export function effectiveSubtaskDisplay(t: Template): SubtaskDisplay {
  return t.subtaskDisplay ?? DEFAULT_SUBTASK_DISPLAY;
}

/** Max visible nesting depth (Ofer: 3 now; the model is generic for more). */
export const MAX_SUBTASK_DEPTH = 3;

/** Resolve which renderer a template drives (custom → its baseLayout). */
export function effectiveLayout(t: Template): Exclude<TemplateLayout, 'custom'> {
  if (t.layout === 'custom') return t.baseLayout ?? 'editorial';
  return t.layout;
}

export const BUILTIN_TEMPLATES: Record<TemplateId, Template> = {
  editorial: {
    id: 'editorial',
    name: 'Editorial',
    description: 'Calm, centered single column. The simplest possible read.',
    layout: 'editorial',
    density: 'roomy',
    fieldsShown: ['time', 'commitment', 'progress'],
    accent: 'upcoming',
    sortBy: 'time',
    grouping: 'timeOfDay',
    showProgress: true,
    showCountdown: true,
    subtaskDisplay: 'inline',
  },
  compact: {
    id: 'compact',
    name: 'Compact',
    description: 'Dense list — more on screen, less air.',
    layout: 'compact',
    density: 'compact',
    fieldsShown: ['time', 'duration', 'source', 'tags'],
    accent: 'urgent',
    sortBy: 'priority',
    grouping: 'none',
    showProgress: true,
    showCountdown: true,
  },
  timeline: {
    id: 'timeline',
    name: 'Timeline',
    description: 'A spine of the day — anchors and the gaps between them.',
    layout: 'timeline',
    density: 'cozy',
    fieldsShown: ['time', 'duration', 'commitment'],
    accent: 'calendar',
    sortBy: 'time',
    grouping: 'none',
    showProgress: false,
    showCountdown: true,
    subtaskDisplay: 'collapsed',
  },
  kanban: {
    id: 'kanban',
    name: 'Kanban',
    description: 'Columns by status — open, doing, done.',
    layout: 'kanban',
    density: 'cozy',
    fieldsShown: ['time', 'commitment', 'tags'],
    accent: 'remember',
    sortBy: 'manual',
    grouping: 'status',
    showProgress: true,
    showCountdown: false,
  },
};

/** A registry instance: built-ins are immutable; custom templates are layered on
 * top. Pure (no I/O) — persistence is the caller's concern (see studio). */
export class TemplateRegistry {
  private custom: Record<TemplateId, Template> = {};

  constructor(customTemplates: Template[] = []) {
    for (const t of customTemplates) this.custom[t.id] = { ...t, custom: true };
  }

  all(): Template[] {
    return [...Object.values(BUILTIN_TEMPLATES), ...Object.values(this.custom)];
  }

  get(id: TemplateId): Template | undefined {
    return BUILTIN_TEMPLATES[id] ?? this.custom[id];
  }

  customTemplates(): Template[] {
    return Object.values(this.custom);
  }

  /** Add or replace a custom template. Built-in ids are protected. */
  save(template: Template): void {
    if (BUILTIN_TEMPLATES[template.id]) {
      throw new Error(`Cannot overwrite built-in template "${template.id}"`);
    }
    this.custom[template.id] = { ...template, custom: true };
  }

  remove(id: TemplateId): void {
    delete this.custom[id];
  }
}

export const DEFAULT_TEMPLATE_ID: TemplateId = 'editorial';
