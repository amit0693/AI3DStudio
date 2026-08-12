import { Platform } from 'react-native';

import type { CartItem, CheckoutDetails, OrderDetail, OrderSummary, PersonalizationField, Product, QuoteEstimate, SelectedFile } from './types';
import { authClient } from './auth-client';

export const DEFAULT_API_BASE_URL = 'https://baylayer-labs.amitcodecraft.chatgpt.site';

export function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, '');
}

async function readResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`);
  return payload;
}

function stringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()));
  return values.length ? values : undefined;
}

function normalizeFields(value: unknown): PersonalizationField[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object') return [];
    const raw = entry as Record<string, unknown>;
    const key = typeof raw.key === 'string' ? raw.key : typeof raw.name === 'string' ? raw.name : `field_${index + 1}`;
    const supported = new Set(['text', 'textarea', 'select', 'date', 'url', 'file']);
    const type = typeof raw.type === 'string' && supported.has(raw.type) ? raw.type as PersonalizationField['type'] : 'text';
    return [{
      key,
      label: typeof raw.label === 'string' ? raw.label : key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()),
      type,
      required: raw.required === true,
      maxLength: typeof raw.maxLength === 'number' ? raw.maxLength : undefined,
      options: stringList(raw.options),
      placeholder: typeof raw.placeholder === 'string' ? raw.placeholder : undefined,
    }];
  });
}

export function normalizeProduct(value: Product | Record<string, unknown>): Product {
  const raw = value as Product & { attributes?: Record<string, unknown> };
  const attributes = raw.attributes && typeof raw.attributes === 'object' ? raw.attributes : {};
  const colors = stringList(raw.colors) ?? stringList(attributes.colors);
  const materials = stringList(raw.materials) ?? stringList(attributes.materials) ?? (raw.material ? raw.material.split(/\s*[/+]\s*/).filter(Boolean) : undefined);
  const safety = typeof attributes.safety === 'string' ? [attributes.safety] : undefined;
  return {
    ...raw,
    colors,
    materials,
    sizes: stringList(raw.sizes) ?? stringList(attributes.sizes),
    personalization: normalizeFields(raw.personalization),
    safetyWarnings: raw.safetyWarnings ?? safety,
    minimumQuantity: Math.max(1, Number(raw.minimumQuantity) || 1),
  };
}

export async function fetchProducts(apiBaseUrl: string, signal?: AbortSignal): Promise<Product[]> {
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}/api/products?limit=100`, { signal });
  return (await readResponse<{ products: (Product | Record<string, unknown>)[] }>(response)).products.map(normalizeProduct);
}

export async function requestQuote(apiBaseUrl: string, file: { uri: string; name: string; mimeType?: string | null }, material: string, quality: string, quantity: number): Promise<QuoteEstimate> {
  const body = new FormData();
  body.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'model/stl' } as unknown as Blob);
  body.append('material', material);
  body.append('quality', quality);
  body.append('quantity', String(quantity));
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}/api/quotes`, { method: 'POST', body });
  return readResponse<QuoteEstimate>(response);
}

async function uploadPersonalizationFile(apiBaseUrl: string, file: SelectedFile) {
  const body = new FormData();
  const extension = file.name.toLowerCase().split('.').pop();
  const inferredType = ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf' } as Record<string, string>)[extension ?? ''];
  body.append('file', { uri: file.uri, name: file.name, type: file.mimeType || inferredType || 'application/octet-stream' } as unknown as Blob);
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}/api/personalization-uploads`, { method: 'POST', body });
  return readResponse<{ upload: { id: string; accessToken: string; filename: string } }>(response);
}

export async function createOrder(apiBaseUrl: string, details: CheckoutDetails, cart: CartItem[], idempotencyKey: string) {
  const items = await Promise.all(cart.map(async (item) => {
    const personalization: Record<string, string | boolean> = { ...(item.options?.values ?? {}) };
    if (item.options?.color) personalization.color = item.options.color;
    if (item.options?.material) personalization.material = item.options.material;
    await Promise.all(Object.entries(item.options?.files ?? {}).map(async ([key, file]) => {
      const { upload } = await uploadPersonalizationFile(apiBaseUrl, file);
      personalization[key] = upload.id;
      personalization[`${key}Token`] = upload.accessToken;
    }));
    if (Object.keys(item.options?.files ?? {}).length) personalization.rightsConfirmed = item.options?.rightsConfirmed === true;
    return { productId: item.product.id, quantity: item.quantity, personalization };
  }));
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      ...(normalizeBaseUrl(apiBaseUrl) === DEFAULT_API_BASE_URL && authClient.getCookie()
        ? { Cookie: authClient.getCookie() }
        : {}),
    },
    body: JSON.stringify({ ...details, idempotencyKey, items }),
  });
  return readResponse<{ order: OrderSummary; checkout: { available: boolean; paid?: boolean; url?: string | null; message?: string } }>(response);
}

export async function fetchOrder(apiBaseUrl: string, token: string): Promise<OrderDetail> {
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}/api/orders/${encodeURIComponent(token)}`);
  return (await readResponse<{ order: OrderDetail }>(response)).order;
}

export async function joinWaitlist(apiBaseUrl: string, email: string) {
  const phoneType = Platform.OS === 'ios' ? 'iphone' : Platform.OS === 'android' ? 'android' : 'other';
  const source = Platform.OS === 'ios' ? 'ios-app' : Platform.OS === 'android' ? 'android-app' : 'web-app';
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}/api/waitlist`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, feature: 'ai-scan', phoneType, marketingConsent: true, source }),
  });
  return readResponse<{ joined: true; message: string }>(response);
}

export function formatMoney(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}
