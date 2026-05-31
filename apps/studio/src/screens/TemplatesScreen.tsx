import { TemplateBuilder } from '@needle/ui-web';
import type { TemplatesApi } from '../templates';
import './screens.css';

export function TemplatesScreen({ templates }: { templates: TemplatesApi }) {
  return (
    <div className="screen">
      <h1 className="screen__title">Templates</h1>
      <p className="screen__lede">
        Templates are pure presentation config — switching or building one never touches
        your data. Pick one, or build your own; it saves into the same registry and shows
        up everywhere.
      </p>

      <div className="tpl-gallery">
        {templates.all.map((t) => {
          const isActive = t.id === templates.activeId;
          return (
            <div
              key={t.id}
              className={`tpl-card${isActive ? ' tpl-card--active' : ''}`}
              style={{ ['--tpl-accent' as string]: `var(--${t.accent})` }}
            >
              <div className="tpl-card__bar" />
              <div className="tpl-card__head">
                <span className="tpl-card__name">{t.name}</span>
                {t.custom && <span className="tpl-card__tag">custom</span>}
                {isActive && <span className="tpl-card__tag tpl-card__tag--active">active</span>}
              </div>
              {t.description && <p className="tpl-card__desc">{t.description}</p>}
              <div className="tpl-card__meta">
                {t.layout === 'custom' ? `${t.baseLayout} · custom` : t.layout} · {t.density}
              </div>
              <div className="tpl-card__actions">
                <button
                  className="tpl-card__btn"
                  onClick={() => templates.setActiveId(t.id)}
                  disabled={isActive}
                >
                  {isActive ? 'In use' : 'Use'}
                </button>
                {t.custom && (
                  <button
                    className="tpl-card__btn tpl-card__btn--danger"
                    onClick={() => templates.remove(t.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="screen__subtitle">Build your own</h2>
      <TemplateBuilder onSave={templates.save} />
    </div>
  );
}
