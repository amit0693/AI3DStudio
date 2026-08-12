import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DEFAULT_API_BASE_URL, fetchProducts, normalizeBaseUrl } from '@/lib/api';
import { fallbackProducts } from '@/lib/catalog';
import type { CartItem, Product } from '@/lib/types';

const CART_KEY = 'baylayer.cart.v1';
const API_KEY = 'baylayer.apiBaseUrl.v1';

type AppContextValue = {
  apiBaseUrl: string;
  setApiBaseUrl: (value: string) => Promise<void>;
  products: Product[];
  catalogSource: 'live' | 'fallback';
  catalogError: string | null;
  catalogLoading: boolean;
  refreshCatalog: () => Promise<void>;
  cart: CartItem[];
  cartCount: number;
  subtotalCents: number;
  addToCart: (product: Product) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

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
        if (savedCart) setCart(JSON.parse(savedCart) as CartItem[]);
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
      setProducts(liveProducts);
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

  const addToCart = useCallback((product: Product) => setCart((items) => {
    const found = items.find((item) => item.product.id === product.id);
    return found
      ? items.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...items, { product, quantity: 1 }];
  }), []);

  const updateQuantity = useCallback((productId: string, delta: number) => setCart((items) =>
    items.map((item) => item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item)
      .filter((item) => item.quantity > 0)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const value = useMemo(() => ({
    apiBaseUrl, setApiBaseUrl, products, catalogSource, catalogError, catalogLoading, refreshCatalog,
    cart, cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    subtotalCents: cart.reduce((sum, item) => sum + item.product.price.amountCents * item.quantity, 0),
    addToCart, updateQuantity, clearCart,
  }), [apiBaseUrl, setApiBaseUrl, products, catalogSource, catalogError, catalogLoading, refreshCatalog, cart, addToCart, updateQuantity, clearCart]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
