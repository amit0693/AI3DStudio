import { Platform } from 'react-native';

import type { Product, QuoteEstimate } from './types';

export const DEFAULT_API_BASE_URL = 'https://baylayer-labs.amitcodecraft.chatgpt.site';

export function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, '');
}

async function readResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let payload: unknown = null;
  if (text.trim()) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(`The server sent an unreadable response (${response.status}).`);
    }
  }

  const reported =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as { error?: unknown }).error
      : undefined;
  const message = typeof reported === 'string' ? reported : null;

  if (!response.ok) throw new Error(message || `Request failed (${response.status}).`);
  if (message) throw new Error(message);
  if (payload === null) throw new Error(`The server sent an empty response (${response.status}).`);
  return payload as T;
}

export async function fetchProducts(apiBaseUrl: string, signal?: AbortSignal): Promise<Product[]> {
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}/api/products?limit=50`, { signal });
  return (await readResponse<{ products: Product[] }>(response)).products;
}

export async function requestQuote(
  apiBaseUrl: string,
  file: { uri: string; name: string; mimeType?: string | null },
  material: string,
  quality: string,
  quantity: number,
): Promise<QuoteEstimate> {
  const body = new FormData();
  body.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'model/stl' } as unknown as Blob);
  body.append('material', material);
  body.append('quality', quality);
  body.append('quantity', String(quantity));
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}/api/quotes`, { method: 'POST', body });
  return readResponse<QuoteEstimate>(response);
}

export async function joinWaitlist(apiBaseUrl: string, email: string) {
  const phoneType = Platform.OS === 'ios' ? 'iphone' : Platform.OS === 'android' ? 'android' : 'other';
  const source = Platform.OS === 'ios' ? 'ios-app' : Platform.OS === 'android' ? 'android-app' : 'web-app';
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}/api/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      feature: 'ai-scan',
      phoneType,
      marketingConsent: true,
      source,
    }),
  });
  return readResponse<{ joined: true; message: string }>(response);
}

export function formatMoney(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}
