import { DEFAULT_PRICING_CONFIG } from "./config";
import type {
  GeometryReport,
  MaterialKey,
  QualityKey,
  QuoteSelection,
} from "./types";

export class QuoteValidationError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "QuoteValidationError";
  }
}

export function parseQuoteSelection(
  materialValue: FormDataEntryValue | null,
  qualityValue: FormDataEntryValue | null,
  quantityValue: FormDataEntryValue | null,
): QuoteSelection {
  const fieldErrors: Record<string, string> = {};
  const material = typeof materialValue === "string" ? materialValue : "";
  const quality = typeof qualityValue === "string" ? qualityValue : "";
  const quantityText =
    typeof quantityValue === "string" ? quantityValue.trim() : "";
  const quantity = Number(quantityText);

  if (!(material in DEFAULT_PRICING_CONFIG.materials)) {
    fieldErrors.material = "Choose a supported material.";
  }

  if (!(quality in DEFAULT_PRICING_CONFIG.qualities)) {
    fieldErrors.quality = "Choose a supported print quality.";
  }

  if (
    quantityText === "" ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > DEFAULT_PRICING_CONFIG.maxQuantity
  ) {
    fieldErrors.quantity = `Quantity must be a whole number from 1 to ${DEFAULT_PRICING_CONFIG.maxQuantity}.`;
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new QuoteValidationError(
      "Please correct the highlighted quote options.",
      fieldErrors,
    );
  }

  return {
    material: material as MaterialKey,
    quality: quality as QualityKey,
    quantity,
  };
}

export function validateGeometryReport(report: GeometryReport): void {
  const values = [
    report.dimensionsMm.x,
    report.dimensionsMm.y,
    report.dimensionsMm.z,
    report.volumeCm3,
    report.surfaceAreaCm2,
  ];

  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new QuoteValidationError("The STL contains invalid geometry values.");
  }

  if (
    report.triangleCount < 1 ||
    report.triangleCount > DEFAULT_PRICING_CONFIG.maxTriangleCount
  ) {
    throw new QuoteValidationError(
      `The STL must contain between 1 and ${DEFAULT_PRICING_CONFIG.maxTriangleCount.toLocaleString()} triangles.`,
    );
  }

  if (report.volumeCm3 <= 0.000_001) {
    throw new QuoteValidationError(
      "The STL has no measurable enclosed volume. Repair the mesh and try again.",
    );
  }

  if (report.dimensionsMm.x === 0 || report.dimensionsMm.y === 0 || report.dimensionsMm.z === 0) {
    throw new QuoteValidationError(
      "The STL appears flat or incomplete. Upload a closed three-dimensional mesh.",
    );
  }
}

