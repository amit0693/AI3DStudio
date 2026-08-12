import { calculateQuote } from "@/lib/quote/calculator";
import { inspectStl } from "@/lib/quote/stl";
import {
  parseQuoteSelection,
  QuoteValidationError,
} from "@/lib/quote/validation";
import type { QuoteErrorResponse } from "@/lib/quote/types";

export const runtime = "nodejs";

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "name" in value &&
    typeof value.name === "string"
  );
}

export async function POST(request: Request): Promise<Response> {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return json(
        { error: "Send the STL and quote options as multipart form data." },
        415,
      );
    }

    const form = await request.formData();
    const uploadedFile = form.get("file");
    if (!isUploadedFile(uploadedFile)) {
      throw new QuoteValidationError("An STL file is required.", {
        file: "Choose an STL file to quote.",
      });
    }

    const selection = parseQuoteSelection(
      form.get("material"),
      form.get("quality"),
      form.get("quantity"),
    );
    const geometry = inspectStl(
      await uploadedFile.arrayBuffer(),
      uploadedFile.name,
    );
    const estimate = calculateQuote(geometry, selection, {
      quoteId: crypto.randomUUID(),
    });

    return json(estimate, 201);
  } catch (error) {
    if (error instanceof QuoteValidationError) {
      const body: QuoteErrorResponse = {
        error: error.message,
        fieldErrors: error.fieldErrors,
      };
      return json(body, 400);
    }

    console.error("Quote calculation failed", error);
    return json(
      { error: "We could not inspect this file. Please try another STL." },
      500,
    );
  }
}

