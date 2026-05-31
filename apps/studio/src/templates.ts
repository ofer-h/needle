import { useCallback, useMemo, useState } from 'react';
import {
  BUILTIN_TEMPLATES,
  DEFAULT_TEMPLATE_ID,
  TemplateRegistry,
  type Template,
  type TemplateId,
} from '@needle/ui-web';

const KEY = 'needle-studio-custom-templates';

function loadCustom(): Template[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Template[]) : [];
  } catch {
    return [];
  }
}

function persist(list: Template[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export type TemplatesApi = {
  all: Template[];
  active: Template;
  activeId: TemplateId;
  setActiveId: (id: TemplateId) => void;
  save: (template: Template) => void;
  remove: (id: TemplateId) => void;
  customCount: number;
};

/** Template registry backed by localStorage. Built-ins are immutable; custom
 * templates (from the builder) persist across reloads. */
export function useTemplates(): TemplatesApi {
  const [custom, setCustom] = useState<Template[]>(loadCustom);
  const [activeId, setActiveId] = useState<TemplateId>(DEFAULT_TEMPLATE_ID);

  const registry = useMemo(() => new TemplateRegistry(custom), [custom]);
  const all = registry.all();
  const active = registry.get(activeId) ?? BUILTIN_TEMPLATES.editorial!;

  const save = useCallback((template: Template) => {
    setCustom((prev) => {
      const next = [...prev.filter((c) => c.id !== template.id), { ...template, custom: true }];
      persist(next);
      return next;
    });
    setActiveId(template.id);
  }, []);

  const remove = useCallback(
    (id: TemplateId) => {
      setCustom((prev) => {
        const next = prev.filter((c) => c.id !== id);
        persist(next);
        return next;
      });
      setActiveId((cur) => (cur === id ? DEFAULT_TEMPLATE_ID : cur));
    },
    [],
  );

  return { all, active, activeId, setActiveId, save, remove, customCount: custom.length };
}
