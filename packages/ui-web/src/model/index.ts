/* The model barrel — ONE place to see every moving part of the app's data and
 * logic. Canonical entities (re-exported from @needle/domain) + the new
 * presentation/logic types + the pure, testable logic functions.
 *
 * Phases add modules here:
 *   today.ts      buildTodayView()               (Phase 1)
 *   countdown.ts  deriveCountdown / alert rotation (Phase 2)
 *   ritual.ts     transition-ritual instances      (Phase 3)
 *   coach.ts      coachEngine()                    (Phase 3)
 *   chat.ts       applyChat()                      (Phase 3)
 *   revision.ts   revertible revision log          (Phase 3) */

export * from './domain';
export * from './ids';
export * from './factory';
export * from './template';
export * from './today';
export * from './time';
export * from './board';
export * from './mutate';
export * from './parse';
export * from './countdown';
export * from './notify';
export * from './ritual';
export * from './coach';
export * from './chat';
export * from './revision';
export * from './transition';
export * from './tags';
export * from './feedback';
