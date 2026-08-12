import { DEFAULT_PRICING_CONFIG } from "./config";
import type { DimensionsMm, GeometryReport, StlFormat } from "./types";
import { QuoteValidationError, validateGeometryReport } from "./validation";

interface Point3 {
  x: number;
  y: number;
  z: number;
}

interface GeometryAccumulator {
  minimum: Point3;
  maximum: Point3;
  signedVolumeMm3: number;
  surfaceAreaMm2: number;
  triangleCount: number;
}

const MAX_COORDINATE_MM = 100_000;

function createAccumulator(): GeometryAccumulator {
  return {
    minimum: { x: Infinity, y: Infinity, z: Infinity },
    maximum: { x: -Infinity, y: -Infinity, z: -Infinity },
    signedVolumeMm3: 0,
    surfaceAreaMm2: 0,
    triangleCount: 0,
  };
}

function assertPoint(point: Point3): void {
  const coordinates = [point.x, point.y, point.z];
  if (
    coordinates.some(
      (value) => !Number.isFinite(value) || Math.abs(value) > MAX_COORDINATE_MM,
    )
  ) {
    throw new QuoteValidationError(
      "The STL contains invalid coordinates or unsupported model units.",
    );
  }
}

function addTriangle(
  accumulator: GeometryAccumulator,
  a: Point3,
  b: Point3,
  c: Point3,
): void {
  assertPoint(a);
  assertPoint(b);
  assertPoint(c);

  for (const point of [a, b, c]) {
    accumulator.minimum.x = Math.min(accumulator.minimum.x, point.x);
    accumulator.minimum.y = Math.min(accumulator.minimum.y, point.y);
    accumulator.minimum.z = Math.min(accumulator.minimum.z, point.z);
    accumulator.maximum.x = Math.max(accumulator.maximum.x, point.x);
    accumulator.maximum.y = Math.max(accumulator.maximum.y, point.y);
    accumulator.maximum.z = Math.max(accumulator.maximum.z, point.z);
  }

  const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const ac = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
  const cross = {
    x: ab.y * ac.z - ab.z * ac.y,
    y: ab.z * ac.x - ab.x * ac.z,
    z: ab.x * ac.y - ab.y * ac.x,
  };
  accumulator.surfaceAreaMm2 +=
    0.5 * Math.hypot(cross.x, cross.y, cross.z);

  accumulator.signedVolumeMm3 +=
    (a.x * (b.y * c.z - b.z * c.y) -
      a.y * (b.x * c.z - b.z * c.x) +
      a.z * (b.x * c.y - b.y * c.x)) /
    6;
  accumulator.triangleCount += 1;
}

function isBinaryStl(view: DataView): boolean {
  if (view.byteLength < 84) return false;
  const triangleCount = view.getUint32(80, true);
  const expectedLength = 84 + triangleCount * 50;
  return triangleCount > 0 && expectedLength === view.byteLength;
}

function pointFromView(view: DataView, offset: number): Point3 {
  return {
    x: view.getFloat32(offset, true),
    y: view.getFloat32(offset + 4, true),
    z: view.getFloat32(offset + 8, true),
  };
}

function inspectBinary(view: DataView): GeometryAccumulator {
  const triangleCount = view.getUint32(80, true);
  if (triangleCount > DEFAULT_PRICING_CONFIG.maxTriangleCount) {
    throw new QuoteValidationError(
      `The STL exceeds the ${DEFAULT_PRICING_CONFIG.maxTriangleCount.toLocaleString()} triangle limit.`,
    );
  }

  const accumulator = createAccumulator();
  for (let index = 0; index < triangleCount; index += 1) {
    const vertexOffset = 84 + index * 50 + 12;
    addTriangle(
      accumulator,
      pointFromView(view, vertexOffset),
      pointFromView(view, vertexOffset + 12),
      pointFromView(view, vertexOffset + 24),
    );
  }
  return accumulator;
}

function inspectAscii(bytes: ArrayBuffer): GeometryAccumulator {
  const source = new TextDecoder().decode(bytes);
  if (!/^\s*solid\b/i.test(source)) {
    throw new QuoteValidationError("The uploaded file is not a valid STL.");
  }

  const number = "([-+]?(?:\\d*\\.?\\d+)(?:[eE][-+]?\\d+)?)";
  const vertexPattern = new RegExp(
    `\\bvertex\\s+${number}\\s+${number}\\s+${number}`,
    "gi",
  );
  const vertices: Point3[] = [];
  let match: RegExpExecArray | null;

  while ((match = vertexPattern.exec(source)) !== null) {
    vertices.push({ x: Number(match[1]), y: Number(match[2]), z: Number(match[3]) });
    if (vertices.length / 3 > DEFAULT_PRICING_CONFIG.maxTriangleCount) {
      throw new QuoteValidationError(
        `The STL exceeds the ${DEFAULT_PRICING_CONFIG.maxTriangleCount.toLocaleString()} triangle limit.`,
      );
    }
  }

  if (vertices.length === 0 || vertices.length % 3 !== 0) {
    throw new QuoteValidationError("The ASCII STL has incomplete triangle data.");
  }

  const accumulator = createAccumulator();
  for (let index = 0; index < vertices.length; index += 3) {
    addTriangle(
      accumulator,
      vertices[index],
      vertices[index + 1],
      vertices[index + 2],
    );
  }
  return accumulator;
}

function round(value: number, decimalPlaces: number): number {
  const scale = 10 ** decimalPlaces;
  return Math.round(value * scale) / scale;
}

function buildWarnings(dimensions: DimensionsMm): string[] {
  const warnings = [
    "STL files do not store units; this estimate assumes every coordinate is in millimeters.",
    "Exact print time, support material, orientation, wall thickness, and watertightness require slicer and production review.",
  ];
  const buildVolume = DEFAULT_PRICING_CONFIG.printerBuildVolumeMm;

  if (
    dimensions.x > buildVolume[0] ||
    dimensions.y > buildVolume[1] ||
    dimensions.z > buildVolume[2]
  ) {
    warnings.push(
      `The model exceeds the current ${buildVolume.join(" × ")} mm build volume in its uploaded orientation and may need splitting or rotation.`,
    );
  }

  if (Math.min(dimensions.x, dimensions.y, dimensions.z) < 1) {
    warnings.push(
      "At least one model dimension is under 1 mm; thin details may not print reliably.",
    );
  }

  return warnings;
}

export function inspectStl(
  bytes: ArrayBuffer,
  fileName: string,
): GeometryReport {
  if (!fileName.toLowerCase().endsWith(".stl")) {
    throw new QuoteValidationError("Phase 1 quotes currently accept STL files only.", {
      file: "Choose a file ending in .stl.",
    });
  }
  if (bytes.byteLength === 0) {
    throw new QuoteValidationError("The STL file is empty.", {
      file: "Choose a non-empty STL file.",
    });
  }
  if (bytes.byteLength > DEFAULT_PRICING_CONFIG.maxFileSizeBytes) {
    throw new QuoteValidationError("The STL file is larger than 25 MB.", {
      file: "Reduce the mesh size below 25 MB and try again.",
    });
  }

  const view = new DataView(bytes);
  const format: StlFormat = isBinaryStl(view) ? "binary" : "ascii";
  const accumulator =
    format === "binary" ? inspectBinary(view) : inspectAscii(bytes);
  const dimensions = {
    x: round(accumulator.maximum.x - accumulator.minimum.x, 2),
    y: round(accumulator.maximum.y - accumulator.minimum.y, 2),
    z: round(accumulator.maximum.z - accumulator.minimum.z, 2),
  };
  const report: GeometryReport = {
    fileName,
    fileSizeBytes: bytes.byteLength,
    format,
    triangleCount: accumulator.triangleCount,
    dimensionsMm: dimensions,
    volumeCm3: round(Math.abs(accumulator.signedVolumeMm3) / 1_000, 4),
    surfaceAreaCm2: round(accumulator.surfaceAreaMm2 / 100, 3),
    warnings: buildWarnings(dimensions),
  };

  validateGeometryReport(report);
  return report;
}

