import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DEFAULT_API_BASE_URL, fetchProducts, normalizeBaseUrl } from '@/lib/api';
import { fallbackProducts } from '@/lib/catalog';
import type { CartItem, Product, ProductOptions } from '@/lib/types';

const CART_KEY = 'baylayer.cart.v1';
const API_KEY = 'baylayer.apiBaseUrl.v1';

type AppContextValue = {
  apiBaseUrl: string;
  setApiBaseUrl: (value: string) => Promise<void>;
  products: Product[];
  catalogSource: 'live' | 'fallback';
  catalogError: string | null;
  catalogLoading: boolean;
  hydrated: boolean;
  refreshCatalog: () => Promise<void>;
  cart: CartItem[];
  cartCount: number;
  subtotalCents: number;
  addToCart: (product: Product, options?: ProductOptions, quantity?: number) => void;
  updateQuantity: (key: string, delta: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function cartKey(product: Product, options?: ProductOptions) {
  const fingerprint = JSON.stringify(options ?? {});
  return `${product.id}:${fingerprint}`;
}

function hydrateCart(value: string | null): CartItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as Partial<CartItem>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item.product?.id || typeof item.quantity !== 'number' || item.quantity < 1) return [];
      return [{
        key: typeof item.key === 'string' ? item.key : cartKey(item.product, item.options),
        product: item.product,
        quantity: Math.min(100, Math.floor(item.quantity)),
        options: item.options,
      }];
    });
  } catch {
    return [];
  }
}

function mergeLiveCatalog(live: Product[]) {
  const liveKeys = new Set(live.flatMap((product) => [product.id, product.slug]));
  return [...live, ...fallbackProducts.filter((product) => !liveKeys.has(product.id) && !liveKeys.has(product.slug))];
}

export function AppProvider({ children }: PropsWithChildren) {
  const [apiBaseUrl, setApiBaseUrlState] = useState(DEFAULT_API_BASE_URL);
  const [products, setProducts] = useState(fallbackProducts);
  const [catalogSource, setCatalogSource] = useState<'live' | 'fallback'>('fallback');
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(API_KEY), AsyncStorage.getItem(CART_KEY)])
      .then(([savedUrl, savedCart]) => {
        if (savedUrl) setApiBaseUrlState(savedUrl);
        setCart(hydrateCart(savedCart));
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(CART_KEY, JSON.stringify(cart)).catch(() => undefined);
  }, [cart, hydrated]);

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const liveProducts = await fetchProducts(apiBaseUrl);
      if (!liveProducts.length) throw new Error('The live catalog is empty.');
      setProducts(mergeLiveCatalog(liveProducts));
      setCatalogSource('live');
    } catch (error) {
      setProducts(fallbackProducts);
      setCatalogSource('fallback');
      setCatalogError(error instanceof Error ? error.message : 'The live catalog is unavailable.');
    } finally {
      setCatalogLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!hydrated) return;
    const task = setTimeout(() => void refreshCatalog(), 0);
    return () => clearTimeout(task);
  }, [hydrated, refreshCatalog]);

  const setApiBaseUrl = useCallback(async (value: string) => {
    const normalized = normalizeBaseUrl(value) || DEFAULT_API_BASE_URL;
    setApiBaseUrlState(normalized);
    await AsyncStorage.setItem(API_KEY, normalized);
  }, []);

  const addToCart = useCallback((product: Product, options?: ProductOptions, quantity = 1) => {
    const key = cartKey(product, options);
    setCart((items) => {
      const found = items.find((item) => item.key === key);
      return found
        ? items.map((item) => item.key === key ? { ...item, quantity: Math.min(100, item.quantity + quantity) } : item)
        : [...items, { key, product, quantity: Math.max(product.minimumQuantity ?? 1, quantity), options }];
    });
  }, []);

  const updateQuantity = useCallback((key: string, delta: number) => setCart((items) =>
    items.map((item) => item.key === key
      ? { ...item, quantity: Math.max(item.product.minimumQuantity ?? 1, Math.min(100, item.quantity + delta)) }
      : item)), []);
  const removeFromCart = useCallback((key: string) => setCart((items) => items.filter((item) => item.key !== key)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const value = useMemo(() => ({
    apiBaseUrl, setApiBaseUrl, products, catalogSource, catalogError, catalogLoading, hydrated, refreshCatalog,
    cart, cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    subtotalCents: cart.reduce((sum, item) => sum + item.product.price.amountCents * item.quantity, 0),
    addToCart, updateQuantity, removeFromCart, clearCart,
  }), [apiBaseUrl, setApiBaseUrl, products, catalogSource, catalogError, catalogLoading, hydrated, refreshCatalog, cart, addToCart, updateQuantity, removeFromCart, clearCart]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
