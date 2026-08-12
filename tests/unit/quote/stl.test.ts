import { describe, expect, test } from "vitest";
import { DEFAULT_PRICING_CONFIG } from "@/lib/quote/config";
import { inspectStl } from "@/lib/quote/stl";
import { QuoteValidationError } from "@/lib/quote/validation";
import type { Triangle } from "../helpers/stl";
import {
  asciiStlBuffer,
  binaryStlBuffer,
  boxTriangles,
  toArrayBuffer,
} from "../helpers/stl";

const cube = boxTriangles(10);

describe("inspectStl", () => {
  test("measures a binary cube", () => {
    const report = inspectStl(binaryStlBuffer(cube), "cube.stl");

    expect(report.format).toBe("binary");
    expect(report.triangleCount).toBe(12);
    expect(report.dimensionsMm).toEqual({ x: 10, y: 10, z: 10 });
    expect(report.volumeCm3).toBeCloseTo(1, 3);
    expect(report.surfaceAreaCm2).toBeCloseTo(6, 3);
    expect(report.fileSizeBytes).toBe(84 + 12 * 50);
  });

  test("measures an ASCII cube identically to the binary encoding", () => {
    const ascii = inspectStl(asciiStlBuffer(cube), "cube.stl");
    const binary = inspectStl(binaryStlBuffer(cube), "cube.stl");

    expect(ascii.format).toBe("ascii");
    expect(ascii.dimensionsMm).toEqual(binary.dimensionsMm);
    expect(ascii.volumeCm3).toBeCloseTo(binary.volumeCm3, 4);
    expect(ascii.surfaceAreaCm2).toBeCloseTo(binary.surfaceAreaCm2, 3);
  });

  test("parses ASCII vertices written in exponent notation", () => {
    const buffer = toArrayBuffer(
      new TextEncoder().encode(exponentNotationStl(cube)),
    );
    const report = inspectStl(buffer, "cube.stl");

    expect(report.dimensionsMm).toEqual({ x: 10, y: 10, z: 10 });
    expect(report.volumeCm3).toBeCloseTo(1, 3);
  });

  test("reports volume for inward-wound (negative signed volume) meshes", () => {
    const flipped = cube.map(([a, b, c]) => [a, c, b] as const);
    const report = inspectStl(binaryStlBuffer(flipped), "cube.stl");

    expect(report.volumeCm3).toBeCloseTo(1, 3);
  });

  test("treats a file whose declared count does not match its length as ASCII", () => {
    const buffer = binaryStlBuffer(cube, { declaredTriangleCount: 99 });

    expect(() => inspectStl(buffer, "cube.stl")).toThrow(
      /not a valid STL|incomplete triangle data/,
    );
  });

  test("rejects non-STL file names", () => {
    expect(() => inspectStl(binaryStlBuffer(cube), "cube.obj")).toThrowError(
      expect.objectContaining({
        name: "QuoteValidationError",
        fieldErrors: { file: "Choose a file ending in .stl." },
      }),
    );
  });

  test("accepts upper-case STL extensions", () => {
    expect(inspectStl(binaryStlBuffer(cube), "CUBE.STL").fileName).toBe(
      "CUBE.STL",
    );
  });

  test("rejects an empty file", () => {
    expect(() => inspectStl(new ArrayBuffer(0), "cube.stl")).toThrow(
      /The STL file is empty/,
    );
  });

  test("rejects files above the configured size limit", () => {
    const oversized = new ArrayBuffer(
      DEFAULT_PRICING_CONFIG.maxFileSizeBytes + 1,
    );

    expect(() => inspectStl(oversized, "cube.stl")).toThrow(/larger than 25 MB/);
  });

  test("rejects ASCII content that is not an STL solid", () => {
    const buffer = toArrayBuffer(new TextEncoder().encode("hello world"));

    expect(() => inspectStl(buffer, "cube.stl")).toThrow(
      /not a valid STL/,
    );
  });

  test("rejects an ASCII solid with an incomplete triangle", () => {
    const source = `solid mesh
  facet normal 0 0 0
    outer loop
      vertex 0 0 0
      vertex 1 0 0
    endloop
  endfacet
endsolid mesh
`;
    const buffer = toArrayBuffer(new TextEncoder().encode(source));

    expect(() => inspectStl(buffer, "cube.stl")).toThrow(
      /incomplete triangle data/,
    );
  });

  test("rejects coordinates outside the supported range", () => {
    const huge = boxTriangles(200_000);

    expect(() => inspectStl(asciiStlBuffer(huge), "cube.stl")).toThrow(
      /invalid coordinates or unsupported model units/,
    );
  });

  test("rejects a mesh with no enclosed volume", () => {
    const flat = boxTriangles(10, 10, 0);

    expect(() => inspectStl(binaryStlBuffer(flat), "flat.stl")).toThrow(
      QuoteValidationError,
    );
  });

  test("always warns about missing STL units and slicer review", () => {
    const report = inspectStl(binaryStlBuffer(cube), "cube.stl");

    expect(report.warnings).toHaveLength(2);
    expect(report.warnings[0]).toMatch(/do not store units/);
    expect(report.warnings[1]).toMatch(/slicer and production review/);
  });

  test("warns when the model exceeds the printer build volume", () => {
    const [buildX] = DEFAULT_PRICING_CONFIG.printerBuildVolumeMm;
    const report = inspectStl(
      binaryStlBuffer(boxTriangles(buildX + 10, 20, 20)),
      "big.stl",
    );

    expect(report.warnings.some((warning) => warning.includes("build volume"))).toBe(
      true,
    );
  });

  test("warns about sub-millimeter dimensions", () => {
    const report = inspectStl(
      binaryStlBuffer(boxTriangles(10, 10, 0.5)),
      "thin.stl",
    );

    expect(
      report.warnings.some((warning) => warning.includes("under 1 mm")),
    ).toBe(true);
  });
});

function exponentNotationStl(triangles: readonly Triangle[]): string {
  const facets = triangles.map(
    (triangle) => `  facet normal 0 0 0
    outer loop
${triangle
  .map(
    ([x, y, z]) =>
      `      vertex ${x.toExponential(4)} ${y.toExponential(4)} ${z.toExponential(4)}`,
  )
  .join("\n")}
    endloop
  endfacet`,
  );
  return `solid mesh\n${facets.join("\n")}\nendsolid mesh\n`;
}
