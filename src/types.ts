import { type EasingName } from "./easing.js";

/** An object whose properties can be animated by the tween system. */
export type TweenTarget = {
  alpha?: number;
  y?: number;
};
/** A single target, or an array of targets to animate in parallel. */
export type TweenTargets = TweenTarget | readonly TweenTarget[];

/** A target value: number (tweens from current) or explicit from/to. */
export type TweenPropValue = number | { from: number; to: number };
/** Map of supported property names to target values. */
export type TweenProps = Partial<Record<keyof TweenTarget, TweenPropValue>>;

/** Configuration for a tween animation. */
export interface TweenConfig {
  /** Target or array of targets whose properties will be animated. */
  targets: TweenTargets;
  /** Map of supported property names to target values. */
  props: TweenProps;

  /** Duration of one pass in milliseconds. */
  duration: number;
  /** Delay before starting in milliseconds. Default: 0. */
  delay?: number;

  /** Easing function. Default: 'linear'. */
  ease?: EasingName;
  /** Reverse the animation at the end of each pass. Default: false. */
  yoyo?: boolean;
  /**
   * Additional repeat count after the first play. 0 = play once, -1 = infinite.
   * With yoyo, each forward+backward pair counts as one repeat.
   * Default: 0.
   */
  repeat?: number;

  /** Called once when the tween starts (after any delay). */
  onStart?: () => void;
  /** Called every frame with the eased progress value (0–1). */
  onUpdate?: (progress: number) => void;
  /** Called each time a yoyo reverses direction (forward → backward). */
  onYoyo?: () => void;
  /** Called at the start of each new repeat cycle (backward → forward). */
  onRepeat?: () => void;
  /** Called when the tween fully completes. Not called for infinite repeats. */
  onComplete?: () => void;
}

/** A handle to control a running tween returned by {@link TweenManager.add}.*/
export interface TweenHandle {
  /** Immediately stop and remove the tween. */
  stop(): void;
  /** Pause without removing. */
  pause(): void;
  /** Resume a paused tween. */
  resume(): void;
  /** `true` if the tween is active and not paused. */
  readonly isPlaying: boolean;
}

/** Manages a collection of active tweens, advancing them each frame. */
export interface TweenManager {
  /** Adds and starts a tween from the given config.
   * @returns A {@link TweenHandle} to control the tween.
   */
  add(config: TweenConfig): TweenHandle;

  /** Advances all active tweens by `deltaMs` **ms**. Call once per frame. */
  update(deltaMs: number): void;

  /** Immediately stops and removes all active tweens. */
  stopAll(): void;
}
