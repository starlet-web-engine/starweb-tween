import { type EasingFunction, TWEEN_EASING                        } from "./easing.js";
import type { TweenConfig, TweenHandle, TweenTarget, TweenManager } from "./types.js";

type ResolvedProp   = {
  readonly from: number;
  readonly to: number
};
type ResolvedTarget = {
  readonly obj: TweenTarget;
  readonly props: Partial<Record<keyof TweenTarget, ResolvedProp>>
  readonly keys: readonly (keyof TweenTarget)[];
};

interface ActiveTween {
  readonly targets:  readonly ResolvedTarget[];
  readonly duration: number;
  readonly delay:    number;
  readonly ease:     EasingFunction;
  readonly yoyo:     boolean;
  readonly repeat:   number;

  elapsed:      number;
  delayElapsed: number;
  direction:    1 | -1;
  repeatsDone:  number;
  started:      boolean;
  paused:       boolean;
  stopped:      boolean;

  readonly onStart:    (() => void)                 | undefined;
  readonly onUpdate:   ((progress: number) => void )| undefined;
  readonly onComplete: (() => void)                 | undefined;
  readonly onYoyo:     (() => void)                 | undefined;
  readonly onRepeat:   (() => void)                 | undefined;
}

/** Creates a tween manager that drives property animations each frame.
 *
 * Call `update` once per frame with the frame delta in **ms**.
 *
 * @returns A {@link TweenManager} with `add`, `update`, and `stopAll`.
 */
export function createTweenManager(): TweenManager {
  const tweens = new Set<ActiveTween>();

  /** Adds and starts a tween from the given config.
   * @returns A {@link TweenHandle} to control the tween.
   */
  function add(config: TweenConfig): TweenHandle {
    const targetArray = Array.isArray(config.targets) ? [...config.targets] : [config.targets];
    const easeFn = TWEEN_EASING[config.ease ?? 'linear'];

    const resolvedTargets: ResolvedTarget[] = targetArray.map(obj => {
      const props: Partial<Record<keyof TweenTarget, ResolvedProp>> = {};
      const keys: (keyof TweenTarget)[] = [];
      for (const [key, val] of Object.entries(config.props) as
             [keyof TweenTarget, typeof config.props[keyof TweenTarget]][]
      ) {
        if (val === undefined) continue;
        props[key] = typeof val === 'number' ? { from: obj[key] ?? 0, to: val } : val;
        keys.push(key);
      }
      return { obj, props, keys };
    });

    const tween: ActiveTween = {
      targets:      resolvedTargets,
      duration:     config.duration,
      ease:         easeFn,
      yoyo:         config.yoyo   ?? false,
      repeat:       config.repeat ?? 0,
      delay:        config.delay  ?? 0,
      elapsed:      0,
      delayElapsed: 0,
      direction:    1,
      repeatsDone:  0,
      started:      false,
      paused:       false,
      stopped:      false,
      onStart:      config.onStart,
      onUpdate:     config.onUpdate,
      onComplete:   config.onComplete,
      onYoyo:       config.onYoyo,
      onRepeat:     config.onRepeat,
    };

    tweens.add(tween);

    return {
      stop:     () => { if (!tween.stopped) { tween.stopped = true; tweens.delete(tween); } },
      pause:    () => { if (!tween.stopped) tween.paused = true;  },
      resume:   () => { if (!tween.stopped) tween.paused = false; },
      get isPlaying() { return !tween.paused && !tween.stopped;   },
    };
  }

  /** Advances all active tweens by `deltaMs` **milliseconds**. Call once per frame. */
  function update(deltaMs: number): void {
    for (const tween of [...tweens]) {
      if (tween.paused || tween.stopped) continue;

      let step = deltaMs;
      if (tween.delayElapsed < tween.delay) {
        const remaining = tween.delay - tween.delayElapsed;
        if (step <= remaining) {
          tween.delayElapsed += step;
          continue;
        }
        tween.delayElapsed = tween.delay;
        step -= remaining;
      }

      if (!tween.started) {
        tween.started = true;
        tween.onStart?.();
      }

      if (tween.duration <= 0) {
        for (const { obj, props, keys } of tween.targets) {
          for (const key of keys) {
            const resolved = props[key];
            if (resolved) obj[key] = resolved.to;
          }
        }

        tween.onUpdate?.(1);
        tween.onComplete?.();
        tweens.delete(tween);
        continue;
      }

      while (step > 0 && !tween.stopped) {
        const next = tween.elapsed + step;
        const overflow = Math.max(0, next - tween.duration);
        tween.elapsed = Math.min(next, tween.duration);

        const raw = tween.elapsed / tween.duration;
        const t   = tween.direction === 1 ? tween.ease(raw) : tween.ease(1 - raw);

        for (const { obj, props, keys } of tween.targets) {
          for (const key of keys) {
            const resolved = props[key];
            if (resolved) obj[key] = resolved.from + (resolved.to - resolved.from) * t;
          }
        }

        tween.onUpdate?.(t);

        if (tween.elapsed >= tween.duration) {
          if (tween.yoyo) {
            if (tween.direction === 1) {
              tween.direction = -1;
              tween.onYoyo?.();
            } else {
              tween.direction = 1;
              if (tween.repeat === -1 || tween.repeatsDone < tween.repeat) {
                tween.repeatsDone++;
                tween.onRepeat?.();
              } else {
                tween.onComplete?.();
                tweens.delete(tween);
                break;
              }
            }
          } else {
            if (tween.repeat === -1 || tween.repeatsDone < tween.repeat) {
              tween.repeatsDone++;
              tween.onRepeat?.();
            } else {
              tween.onComplete?.();
              tweens.delete(tween);
              break;
            }
          }
          tween.elapsed = overflow;
          step = overflow;
        } else {
          step = 0;
        }
      }
    }
  }

  /** Immediately stops and removes all active tweens. */
  function stopAll(): void {
    tweens.clear();
  }

  return { add, update, stopAll };
}
