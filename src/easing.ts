/** Easing function name. */
export type EasingName = 'linear'
                          | 'sine.in'   | 'sine.out'   | 'sine.inOut'
                          | 'quad.in'   | 'quad.out'   | 'quad.inOut'
                          | 'cubic.in'  | 'cubic.out'  | 'cubic.inOut'
                          | 'expo.in'   | 'expo.out'   | 'expo.inOut';

/** A function that maps a linear progress value (0-1) to an eased value (0-1).*/
export type EasingFunction = (t: number) => number;

/** Flips an ease-in function into its ease-out equivalent. */
export const easeOut = (f: EasingFunction): EasingFunction =>
  t => 1 - f(1 - t);

/** Combines an ease-in function with its inverse for a symmetric ease-in-out curve. */
export const easeInOut = (f: EasingFunction): EasingFunction =>
  t => t < 0.5 ? f(2*t) / 2 : 1 - f(-2 * t + 2) / 2;

/** Generates in/out/inOut easing functions for a given exponent. */
export const makePowerEase = (exponent: number) => {
  const i: EasingFunction = t => t ** exponent;
  return { in: i, out: easeOut(i), inOut: easeInOut(i) };
};

/** Sine ease-in base curve. */
const sineIn:    EasingFunction = t => 1 - Math.cos(t * Math.PI / 2);
/** Sine ease-out. */
const sineOut:   EasingFunction = easeOut(sineIn);
/** Sine ease-in-out. */
const sineInOut: EasingFunction = easeInOut(sineIn);

/** Quadratic easing curves. */
const quad = makePowerEase(2);
/** Cubic easing curves.*/
const cubic = makePowerEase(3);

/** Exponential ease-in with edge case guards. */
const expoIn: EasingFunction = t => t === 0 ? 0 : t === 1 ? 1 : 2 ** (10 * t - 10);
/** Exponential ease-out. */
const expoOut:   EasingFunction = easeOut(expoIn);
/** Exponential ease-in-out. */
const expoInOut: EasingFunction = easeInOut(expoIn);

/** Lookup table of easing functions keyed by name. */
export const TWEEN_EASING: Readonly<Record<EasingName, EasingFunction>> = {
  'linear':      t => t,

  // Sine
  'sine.in':     sineIn,
  'sine.out':    sineOut,
  'sine.inOut':  sineInOut,

  // Quad
  'quad.in':     quad.in,
  'quad.out':    quad.out,
  'quad.inOut':  quad.inOut,

  // Cubic
  'cubic.in':    cubic.in,
  'cubic.out':   cubic.out,
  'cubic.inOut': cubic.inOut,

  // Exponential
  'expo.in':     expoIn,
  'expo.out':    expoOut,
  'expo.inOut':  expoInOut,
}
