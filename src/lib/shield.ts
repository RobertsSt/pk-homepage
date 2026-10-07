/**
 * Geometry of the colour shield every fraternity carries: three colours split
 * by a diagonal stripe. The shape is the same for all of them, so it is
 * computed once here and only the colours and the stripe direction vary.
 */

export type Band = 'rising' | 'falling';

type Point = readonly [x: number, y: number];

export const SHIELD_VIEWBOX = '0 0 100 116';

export const SHIELD_OUTLINE = 'M4 4H96V54C96 84 72 104 50 113C28 104 4 84 4 54Z';

/** Edges of the stripe for a rising band: `y = SLOPE * x + offset`. */
const SLOPE = -0.7667;
const UPPER_EDGE = 53.07;
const LOWER_EDGE = 97.6;

function cubic(p0: Point, p1: Point, p2: Point, p3: Point, steps = 18): Point[] {
  return Array.from({ length: steps - 1 }, (_, i) => {
    const t = (i + 1) / steps;
    const u = 1 - t;
    return [
      u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
      u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
    ] as const;
  });
}

/** The outline as a polygon, fine enough that the stroke on top hides the facets. */
const OUTLINE_POLYGON: Point[] = [
  [4, 4],
  [96, 4],
  [96, 54],
  ...cubic([96, 54], [96, 84], [72, 104], [50, 113]),
  [50, 113],
  ...cubic([50, 113], [28, 104], [4, 84], [4, 54]),
  [4, 54],
];

/** Signed vertical distance from the line `y = SLOPE * x + offset`; negative is above. */
const side = ([x, y]: Point, offset: number) => y - (SLOPE * x + offset);

/** Keeps the part of a polygon on one side of a stripe edge (Sutherland–Hodgman). */
function clip(polygon: Point[], offset: number, keep: 'above' | 'below'): Point[] {
  const inside = (p: Point) => (keep === 'above' ? side(p, offset) <= 0 : side(p, offset) >= 0);
  const result: Point[] = [];
  polygon.forEach((current, i) => {
    const previous = polygon.at(i - 1)!;
    if (inside(current) !== inside(previous)) {
      const a = side(previous, offset);
      const t = a / (a - side(current, offset));
      result.push([
        previous[0] + t * (current[0] - previous[0]),
        previous[1] + t * (current[1] - previous[1]),
      ]);
    }
    if (inside(current)) result.push(current);
  });
  return result;
}

const toPath = (polygon: Point[], mirror: boolean) =>
  `M${polygon.map(([x, y]) => `${+(mirror ? 100 - x : x).toFixed(2)} ${+y.toFixed(2)}`).join('L')}Z`;

function regions(mirror: boolean) {
  return {
    top: toPath(clip(OUTLINE_POLYGON, UPPER_EDGE, 'above'), mirror),
    bottom: toPath(clip(OUTLINE_POLYGON, LOWER_EDGE, 'below'), mirror),
  };
}

/**
 * Paths for the top and bottom colour fields. The middle stripe needs no path
 * of its own: it is the outline filled first, showing through between them.
 */
export const SHIELD_REGIONS: Record<Band, { top: string; bottom: string }> = {
  rising: regions(false),
  falling: regions(true),
};
