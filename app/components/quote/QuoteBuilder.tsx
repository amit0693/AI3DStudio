"use client";

import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import {
  MATERIAL_OPTIONS,
  QUALITY_OPTIONS,
} from "@/lib/quote/config";
import { inspectStl } from "@/lib/quote/stl";
import type {
  GeometryReport,
  MaterialKey,
  QualityKey,
  QuoteErrorResponse,
  QuoteEstimate,
} from "@/lib/quote/types";
import styles from "./QuoteBuilder.module.css";

export interface QuoteBuilderProps {
  className?: string;
  heading?: string;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCents(value: number): string {
  return usd.format(value / 100);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function QuoteBuilder({
  className = "",
  heading = "Price your custom print",
}: QuoteBuilderProps) {
  const fileInputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [geometry, setGeometry] = useState<GeometryReport | null>(null);
  const [material, setMaterial] = useState<MaterialKey>("pla");
  const [quality, setQuality] = useState<QualityKey>("standard");
  const [quantity, setQuantity] = useState(1);
  const [estimate, setEstimate] = useState<QuoteEstimate | null>(null);
  const [error, setError] = useState("");
  const [isInspecting, setIsInspecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setGeometry(null);
    setEstimate(null);
    setError("");
    if (!nextFile) return;

    setIsInspecting(true);
    try {
      setGeometry(inspectStl(await nextFile.arrayBuffer(), nextFile.name));
    } catch (inspectionError) {
      setError(
        inspectionError instanceof Error
          ? inspectionError.message
          : "This STL could not be inspected.",
      );
    } finally {
      setIsInspecting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setEstimate(null);
    if (!file) {
      setError("Choose an STL file before requesting an estimate.");
      return;
    }

    const form = new FormData();
    form.set("file", file);
    form.set("material", material);
    form.set("quality", quality);
    form.set("quantity", String(quantity));

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        body: form,
      });
      const body = (await response.json()) as QuoteEstimate | QuoteErrorResponse;
      if (!response.ok || "error" in body) {
        throw new Error("error" in body ? body.error : "Quote request failed.");
      }
      setEstimate(body);
      setGeometry(body.geometry);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "We could not calculate this estimate.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={`${styles.builder} ${className}`.trim()}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>Instant geometry estimate</p>
        <h2 className={styles.title}>{heading}</h2>
        <p className={styles.description}>
          Upload an STL, choose how you want it printed, and get a transparent
          planning estimate. No account required.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.dropzone} htmlFor={fileInputId}>
          <strong>{isInspecting ? "Reading your model…" : "Choose an STL file"}</strong>
          <span className={styles.hint}>Binary or ASCII STL · maximum 25 MB</span>
          {file ? (
            <span className={styles.fileName}>
              {file.name} · {formatBytes(file.size)}
            </span>
          ) : null}
          <input
            accept=".stl,model/stl,application/sla"
            className={styles.fileInput}
            id={fileInputId}
            name="file"
            onChange={handleFileChange}
            required
            type="file"
          />
        </label>

        {geometry ? (
          <div className={styles.geometry} aria-label="Model inspection">
            <dl>
              <div>
                <dt>Size, assuming mm</dt>
                <dd>
                  {geometry.dimensionsMm.x} × {geometry.dimensionsMm.y} ×{" "}
                  {geometry.dimensionsMm.z} mm
                </dd>
              </div>
              <div>
                <dt>Mesh volume</dt>
                <dd>{geometry.volumeCm3.toFixed(2)} cm³</dd>
              </div>
              <div>
                <dt>Triangles</dt>
                <dd>{geometry.triangleCount.toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        <div className={styles.fields}>
          <div className={styles.field}>
            <label htmlFor="quote-material">Material</label>
            <select
              id="quote-material"
              name="material"
              onChange={(event) => setMaterial(event.target.value as MaterialKey)}
              value={material}
            >
              {MATERIAL_OPTIONS.map(([key, option]) => (
                <option key={key} value={key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="quote-quality">Quality</label>
            <select
              id="quote-quality"
              name="quality"
              onChange={(event) => setQuality(event.target.value as QualityKey)}
              value={quality}
            >
              {QUALITY_OPTIONS.map(([key, option]) => (
                <option key={key} value={key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="quote-quantity">Quantity</label>
            <input
              id="quote-quantity"
              inputMode="numeric"
              max={100}
              min={1}
              name="quantity"
              onChange={(event) => setQuantity(Number(event.target.value))}
              required
              step={1}
              type="number"
              value={quantity}
            />
          </div>
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <button
          className={styles.button}
          disabled={isSubmitting || isInspecting || !geometry}
          type="submit"
        >
          {isSubmitting ? "Calculating on the server…" : "Calculate estimate"}
        </button>
        <p className={styles.finePrint}>
          Pricing is calculated again from the STL on the server. Uploading a
          file does not place an order.
        </p>
      </form>

      {estimate ? (
        <article className={styles.result} aria-live="polite">
          <div className={styles.resultHeader}>
            <div>
              <p className={styles.eyebrow}>{estimate.estimateLabel}</p>
              <h3>Your print estimate</h3>
            </div>
            <span className={styles.price}>
              {formatCents(estimate.breakdown.totalCents)}
            </span>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.metric}>
              <span>Material</span>
              <strong>{estimate.estimatedMaterialGrams} g</strong>
            </div>
            <div className={styles.metric}>
              <span>Machine time</span>
              <strong>{estimate.estimatedMachineHours} hr</strong>
            </div>
            <div className={styles.metric}>
              <span>Quantity</span>
              <strong>{estimate.selection.quantity}</strong>
            </div>
          </div>

          <dl className={styles.breakdown}>
            <div>
              <dt>Material</dt>
              <dd>{formatCents(estimate.breakdown.materialCents)}</dd>
            </div>
            <div>
              <dt>Machine</dt>
              <dd>{formatCents(estimate.breakdown.machineCents)}</dd>
            </div>
            <div>
              <dt>Labor + packaging</dt>
              <dd>
                {formatCents(
                  estimate.breakdown.laborCents +
                    estimate.breakdown.packagingCents,
                )}
              </dd>
            </div>
            <div>
              <dt>Failure reserve</dt>
              <dd>{formatCents(estimate.breakdown.failureReserveCents)}</dd>
            </div>
            <div>
              <dt>Operations margin</dt>
              <dd>{formatCents(estimate.breakdown.marginAllowanceCents)}</dd>
            </div>
            <div>
              <dt>Estimated card fee</dt>
              <dd>{formatCents(estimate.breakdown.paymentProcessingCents)}</dd>
            </div>
          </dl>

          <div className={styles.notes}>
            <h4>Before we print</h4>
            <ul>
              {[...estimate.assumptions, ...estimate.warnings].map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </article>
      ) : null}
    </section>
  );
}

export default QuoteBuilder;

