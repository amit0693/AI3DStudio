export type Vertex = readonly [number, number, number];
export type Triangle = readonly [Vertex, Vertex, Vertex];

/**
 * Closed axis-aligned box mesh starting at the origin, wound counter-clockwise
 * when viewed from outside so the signed volume is positive.
 */
export function boxTriangles(
  sizeX: number,
  sizeY = sizeX,
  sizeZ = sizeX,
): Triangle[] {
  const [x, y, z] = [sizeX, sizeY, sizeZ];
  const corners: Vertex[] = [
    [0, 0, 0],
    [x, 0, 0],
    [x, y, 0],
    [0, y, 0],
    [0, 0, z],
    [x, 0, z],
    [x, y, z],
    [0, y, z],
  ];
  const quads: readonly [number, number, number, number][] = [
    [0, 3, 2, 1],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [3, 0, 4, 7],
  ];

  return quads.flatMap(([a, b, c, d]): Triangle[] => [
    [corners[a], corners[b], corners[c]],
    [corners[a], corners[c], corners[d]],
  ]);
}

export function asciiStl(triangles: readonly Triangle[], name = "mesh"): string {
  const facets = triangles.map(
    (triangle) => `  facet normal 0 0 0
    outer loop
${triangle.map(([x, y, z]) => `      vertex ${x} ${y} ${z}`).join("\n")}
    endloop
  endfacet`,
  );
  return `solid ${name}\n${facets.join("\n")}\nendsolid ${name}\n`;
}

export function asciiStlBuffer(
  triangles: readonly Triangle[],
  name?: string,
): ArrayBuffer {
  return toArrayBuffer(new TextEncoder().encode(asciiStl(triangles, name)));
}

export function binaryStlBuffer(
  triangles: readonly Triangle[],
  options: { declaredTriangleCount?: number } = {},
): ArrayBuffer {
  const declaredCount = options.declaredTriangleCount ?? triangles.length;
  const buffer = new ArrayBuffer(84 + triangles.length * 50);
  const view = new DataView(buffer);
  view.setUint32(80, declaredCount, true);

  triangles.forEach((triangle, index) => {
    let offset = 84 + index * 50 + 12;
    for (const [x, y, z] of triangle) {
      view.setFloat32(offset, x, true);
      view.setFloat32(offset + 4, y, true);
      view.setFloat32(offset + 8, z, true);
      offset += 12;
    }
  });

  return buffer;
}

export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}
