"use client";

import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { QuoteBuilder } from "@/app/components/quote";
import { LAUNCH_COLLECTIONS, type Collection, type Product, LAUNCH_PRODUCTS } from "@/app/data/catalog";
import styles from "./StorefrontExperience.module.css";

type CustomizationField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "date" | "url" | "file";
  required?: boolean;
  maxLength?: number;
  options?: string[];
  accept?: string;
  hint?: string;
};

type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  color: string;
  options: Record<string, string>;
  files: Record<string, File>;
  rightsConfirmed: boolean;
};

type CheckoutDetails = {
  name: string;
  email: string;
  phone: string;
  fulfillmentMethod: "pickup" | "shipping";
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
};

type SortKey = "featured" | "best" | "new" | "low" | "high" | "fast";

const CUSTOMIZATION_SCHEMAS: Record<string, CustomizationField[]> = {
  "PG-01": [
    { key: "photo", label: "Photo", type: "file", required: true, accept: "image/jpeg,image/png,image/webp", hint: "JPG, PNG, or WebP. The file stays on this device until secure upload at checkout." },
    { key: "orientation", label: "Orientation", type: "select", required: true, options: ["Portrait", "Landscape"] },
    { key: "caption", label: "Short caption", type: "text", maxLength: 60, hint: "Optional; we will proof it before printing." },
  ],
  "PG-05": [
    { key: "photo", label: "Pet photo", type: "file", required: true, accept: "image/jpeg,image/png,image/webp", hint: "Use a clear side-profile photo when possible." },
    { key: "petName", label: "Pet name", type: "text", required: true, maxLength: 40 },
    { key: "memorialLine", label: "Memorial line", type: "text", maxLength: 80, hint: "Optional" },
  ],
  "PD-01": [
    { key: "size", label: "Size", type: "select", required: true, options: ["Small", "Medium"] },
    { key: "drainage", label: "Inner pot", type: "select", required: true, options: ["Standard wick", "Extra drainage"] },
  ],
  "GH-04": [
    { key: "bottleDiameter", label: "Bottle diameter", type: "select", required: true, options: ["25 mm", "32 mm", "36 mm"] },
    { key: "layout", label: "Layout", type: "select", required: true, options: ["Straight", "Corner"] },
  ],
  "SE-04": [
    { key: "name", label: "Name", type: "text", required: true, maxLength: 40 },
    { key: "role", label: "Role or room", type: "text", maxLength: 60, hint: "Optional" },
  ],
  "BE-01": [
    { key: "names", label: "Guest names", type: "textarea", required: true, maxLength: 2000, hint: "One name per line. Minimum order: 20 pieces." },
    { key: "eventDate", label: "Event date", type: "date", required: true },
  ],
  "BE-03": [
    { key: "businessName", label: "Business name", type: "text", required: true, maxLength: 60 },
    { key: "destinationUrl", label: "QR destination URL", type: "url", required: true, maxLength: 160, hint: "We test the final scan before production." },
    { key: "logo", label: "Approved logo", type: "file", accept: "image/jpeg,image/png,image/webp", hint: "Optional" },
    { key: "nfc", label: "NFC option", type: "select", required: true, options: ["QR only", "QR + NFC"] },
  ],
  "CP-02": [
    { key: "partDescription", label: "Part and use", type: "textarea", required: true, maxLength: 1000 },
    { key: "dimensions", label: "Measurements", type: "text", required: true, maxLength: 200, hint: "Include units, for example 42 × 18 × 6 mm." },
    { key: "reference", label: "Reference photo", type: "file", required: true, accept: "image/jpeg,image/png,image/webp", hint: "Required. Safety-critical parts are not accepted." },
  ],
};

const EMPTY_CHECKOUT: CheckoutDetails = {
  name: "",
  email: "",
  phone: "",
  fulfillmentMethod: "pickup",
  line1: "",
  line2: "",
  city: "",
  state: "CA",
  postalCode: "",
};

const RECIPIENTS: Array<[string, Collection]> = [
  ["Plant lovers", "Plants & Decor"], ["Gamers", "Gaming & Hobbies"],
  ["Coworkers", "Desk & Tech"], ["Pet owners", "Gifts & Personalization"],
  ["Weddings", "Business & Events"],
];

function money(value: number) {
  if (value === 0) return "Custom quote";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function ProductImage({ product, small = false }: { product: Product; small?: boolean }) {
  return (
    <div className={`catalog-image tone-${product.id.charCodeAt(0) % 4} ${small ? "small" : ""}`}>
      {/* Product renders live in public/ and intentionally fall back to CSS while assets are generated. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        loading="lazy"
        src={`/products/${product.imageSlug ?? product.slug}.png`}
        onError={(event) => { event.currentTarget.hidden = true; }}
      />
      <span className="fallback-object" aria-hidden="true"><i /><b /><em /></span>
      <small aria-hidden="true">{product.id}</small>
    </div>
  );
}

function initialOptions(product: Product) {
  return Object.fromEntries(
    (CUSTOMIZATION_SCHEMAS[product.id] ?? []).map((field) => [
      field.key,
      field.type === "select" ? field.options?.[0] ?? "" : "",
    ]),
  );
}

function itemOptionSummary(item: CartItem) {
  const labels = new Map(
    (CUSTOMIZATION_SCHEMAS[item.product.id] ?? []).map((field) => [field.key, field.label]),
  );
  return Object.entries(item.options)
    .filter(([, value]) => value)
    .map(([key, value]) => `${labels.get(key) ?? key}: ${value}`);
}

function hasPendingProductFile(item: CartItem) {
  return (CUSTOMIZATION_SCHEMAS[item.product.id] ?? []).some(
    (field) => field.type === "file" && Boolean(item.options[field.key]),
  );
}

function CustomizationControl({
  field,
  value,
  error,
  onValue,
  onFile,
}: {
  field: CustomizationField;
  value: string;
  error?: string;
  onValue: (value: string) => void;
  onFile: (file: File | null) => void;
}) {
  const id = `custom-${field.key}`;
  const common = {
    id,
    required: field.required,
    value,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onValue(event.target.value),
    "aria-invalid": Boolean(error),
    "aria-describedby": `${id}-help`,
  };
  return (
    <label className={styles.customField} htmlFor={id}>
      <span>{field.label}{field.required ? " *" : ""}</span>
      {field.type === "textarea" ? <textarea {...common} maxLength={field.maxLength} rows={4} />
        : field.type === "select" ? <select {...common}>{field.options?.map((option) => <option key={option}>{option}</option>)}</select>
          : field.type === "file" ? <input
              id={id}
              type="file"
              required={field.required && !value}
              accept={field.accept}
              aria-invalid={Boolean(error)}
              aria-describedby={`${id}-help`}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                onFile(file);
                onValue(file?.name ?? "");
              }}
            />
            : <input {...common} type={field.type} maxLength={field.maxLength} />}
      <small id={`${id}-help`} className={error ? styles.fieldError : undefined}>{error || field.hint || (field.maxLength ? `${value.length}/${field.maxLength}` : "")}</small>
    </label>
  );
}

export function StorefrontExperience() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [collection, setCollection] = useState<Collection>("Best Sellers");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("featured");
  const [material, setMaterial] = useState("All materials");
  const [priceLimit, setPriceLimit] = useState(100);
  const [personalizedOnly, setPersonalizedOnly] = useState(false);
  const [fastOnly, setFastOnly] = useState(false);
  const [detailColor, setDetailColor] = useState("");
  const [detailOptions, setDetailOptions] = useState<Record<string, string>>({});
  const [detailFiles, setDetailFiles] = useState<Record<string, File>>({});
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const [detailRights, setDetailRights] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkout, setCheckout] = useState<CheckoutDetails>(EMPTY_CHECKOUT);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [joined, setJoined] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");
  const [pending, setPending] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const detailCloseRef = useRef<HTMLButtonElement>(null);
  const checkoutAttemptRef = useRef({ signature: "", key: "" });

  useEffect(() => {
    const saved = window.localStorage.getItem("baylayer-cart-v2");
    if (saved) {
      try {
        const restored = JSON.parse(saved) as Array<Partial<CartItem>>;
        const launchById = new Map(LAUNCH_PRODUCTS.map((product) => [product.id, product]));
        const safeItems = restored.flatMap((item) => {
          if (!item.product) return [];
          const product = launchById.get(item.product.id);
          if (!product) return [];
          const schema = CUSTOMIZATION_SCHEMAS[product.id] ?? [];
          const allowed = new Set(schema.map((field) => field.key));
          const restoredOptions = { ...initialOptions(product), ...Object.fromEntries(Object.entries(item.options ?? {}).filter(([key]) => allowed.has(key))) };
          for (const field of schema) {
            if (field.type === "file") restoredOptions[field.key] = "";
          }
          return [{
            id: item.id ?? crypto.randomUUID(),
            product,
            quantity: Math.max(product.minimum ?? 1, Number(item.quantity) || product.minimum || 1),
            color: item.color ?? product.colors[0] ?? "",
            options: restoredOptions,
            files: {},
            rightsConfirmed: false,
          } satisfies CartItem];
        });
        window.setTimeout(() => setCart(safeItems), 0);
      } catch { /* keep an empty cart */ }
    }
  }, []);
  useEffect(() => {
    const persisted = cart.map((item) => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      color: item.color,
      options: item.options,
      rightsConfirmed: item.rightsConfirmed,
    }));
    window.localStorage.setItem("baylayer-cart-v2", JSON.stringify(persisted));
  }, [cart]);
  useEffect(() => {
    document.body.style.overflow = menuOpen || cartOpen || selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen, cartOpen, selected]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const editing = ["INPUT", "SELECT", "TEXTAREA"].includes((event.target as HTMLElement).tagName);
      if (event.key === "/" && !editing) { event.preventDefault(); searchRef.current?.focus(); }
      if (event.key === "Escape") { setSelected(null); setCartOpen(false); setMenuOpen(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!selected) return;
    detailCloseRef.current?.focus();
  }, [selected]);

  const materials = useMemo(() => ["All materials", ...Array.from(new Set(LAUNCH_PRODUCTS.map((p) => p.material)))], []);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = LAUNCH_PRODUCTS.filter((product) => {
      const inCollection = collection === "Best Sellers" || product.collection === collection;
      return inCollection && (!q || `${product.name} ${product.description} ${product.collection} ${product.material}`.toLowerCase().includes(q))
        && product.price <= priceLimit && (material === "All materials" || product.material === material)
        && (!personalizedOnly || product.personalized) && (!fastOnly || product.productionDays <= 4);
    });
    return [...rows].sort((a, b) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      if (sort === "fast") return a.productionDays - b.productionDays;
      if (sort === "new") return b.id.localeCompare(a.id);
      if (sort === "best") return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.id.localeCompare(b.id);
    });
  }, [collection, fastOnly, material, personalizedOnly, priceLimit, query, sort]);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const selectedSchema = selected ? CUSTOMIZATION_SCHEMAS[selected.id] ?? [] : [];
  const selectedHasFile = selectedSchema.some((field) => field.type === "file" && Boolean(detailOptions[field.key]));
  const cartHasPendingFiles = cart.some(hasPendingProductFile);

  function chooseCollection(next: Collection) {
    setCollection(next); setMenuOpen(false);
    requestAnimationFrame(() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }));
  }

  function clearCheckoutNotices() {
    setCheckoutError("");
    setCheckoutMessage("");
  }

  function openProduct(product: Product) {
    clearCheckoutNotices();
    setDetailColor(product.colors[0] ?? "");
    setDetailOptions(initialOptions(product));
    setDetailFiles({});
    setDetailErrors({});
    setDetailRights(false);
    setEditingLineId(null);
    setSelected(product);
  }

  function editCartLine(item: CartItem) {
    clearCheckoutNotices();
    setDetailColor(item.color);
    setDetailOptions(item.options);
    setDetailFiles(item.files);
    setDetailErrors({});
    setDetailRights(item.rightsConfirmed);
    setEditingLineId(item.id);
    setCartOpen(false);
    setSelected(item.product);
  }

  function validateCustomization(product: Product) {
    const errors: Record<string, string> = {};
    for (const field of CUSTOMIZATION_SCHEMAS[product.id] ?? []) {
      const value = detailOptions[field.key]?.trim() ?? "";
      if (field.required && !value) errors[field.key] = `${field.label} is required.`;
      if (field.maxLength && value.length > field.maxLength) errors[field.key] = `${field.label} is too long.`;
      if (field.type === "url" && value) {
        try {
          const parsed = new URL(value);
          if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error();
        } catch {
          errors[field.key] = "Enter a complete http:// or https:// URL.";
        }
      }
    }
    const hasFile = (CUSTOMIZATION_SCHEMAS[product.id] ?? []).some(
      (field) => field.type === "file" && Boolean(detailOptions[field.key]),
    );
    if (hasFile && !detailRights) errors.rights = "Confirm that you have permission to use each selected file.";
    setDetailErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function add(product: Product) {
    if (product.price === 0) {
      document.getElementById("custom-print")?.scrollIntoView({ behavior: "smooth" });
      setSelected(null);
      return;
    }
    if (!validateCustomization(product)) return;
    clearCheckoutNotices();
    const minimum = product.minimum ?? 1;
    const normalizedOptions = Object.fromEntries(
      Object.entries(detailOptions).map(([key, value]) => [key, value.trim()]),
    );
    if (editingLineId) {
      setCart((items) => items.map((item) => item.id === editingLineId
        ? { ...item, color: detailColor, options: normalizedOptions, files: detailFiles, rightsConfirmed: detailRights, quantity: Math.max(minimum, item.quantity) }
        : item));
      setEditingLineId(null);
      setSelected(null);
      setCartOpen(true);
      return;
    }
    setCart((items) => {
      const signature = JSON.stringify(normalizedOptions);
      const match = items.find((item) => item.product.id === product.id && item.color === detailColor && JSON.stringify(item.options) === signature);
      return match
        ? items.map((item) => item === match ? { ...item, quantity: item.quantity + minimum } : item)
        : [...items, {
            id: crypto.randomUUID(),
            product,
            quantity: minimum,
            color: detailColor,
            options: normalizedOptions,
            files: detailFiles,
            rightsConfirmed: detailRights,
          }];
    });
    setSelected(null); setCartOpen(true);
  }

  function changeQuantity(id: string, delta: number) {
    clearCheckoutNotices();
    setCart((items) => items.map((item) => {
      if (item.id !== id) return item;
      const minimum = item.product.minimum ?? 1;
      return { ...item, quantity: Math.max(minimum, Math.min(100, item.quantity + delta)) };
    }));
  }

  function removeCartLine(id: string) {
    clearCheckoutNotices();
    setCart((items) => items.filter((item) => item.id !== id));
  }

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckoutError("");
    setCheckoutMessage("");
    setCheckoutPending(true);
    try {
      const preparedItems = [];
      for (const item of cart) {
        const personalization: Record<string, string | boolean> = { color: item.color, ...item.options };
        for (const [fieldKey, file] of Object.entries(item.files)) {
          const uploadForm = new FormData();
          uploadForm.append("file", file);
          const uploadResponse = await fetch("/api/personalization-uploads", { method: "POST", body: uploadForm });
          const uploadResult = await uploadResponse.json() as {
            error?: string;
            upload?: { id: string; accessToken: string; filename: string };
          };
          if (!uploadResponse.ok || !uploadResult.upload) {
            throw new Error(uploadResult.error || `We could not securely upload ${file.name}.`);
          }
          personalization[fieldKey] = uploadResult.upload.id;
          personalization[`${fieldKey}Token`] = uploadResult.upload.accessToken;
        }
        if (Object.keys(item.files).length > 0) personalization.rightsConfirmed = item.rightsConfirmed;
        preparedItems.push({
          productId: item.product.id,
          quantity: Math.max(item.product.minimum ?? 1, item.quantity),
          personalization,
        });
      }

      const body = {
        name: checkout.name.trim(),
        email: checkout.email.trim(),
        phone: checkout.phone.trim() || undefined,
        fulfillmentMethod: checkout.fulfillmentMethod,
        shippingAddress: checkout.fulfillmentMethod === "shipping" ? {
          line1: checkout.line1.trim(),
          line2: checkout.line2.trim() || undefined,
          city: checkout.city.trim(),
          state: checkout.state.trim().toUpperCase(),
          postalCode: checkout.postalCode.trim(),
          country: "US",
        } : undefined,
        items: preparedItems,
      };
      const signature = JSON.stringify({ ...body, items: cart.map((item) => ({ id: item.id, quantity: item.quantity, options: item.options })) });
      if (checkoutAttemptRef.current.signature !== signature) {
        checkoutAttemptRef.current = { signature, key: crypto.randomUUID() };
      }
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": checkoutAttemptRef.current.key,
        },
        body: JSON.stringify(body),
      });
      const result = await response.json() as {
        error?: string;
        order?: { orderNumber?: string; trackingToken?: string };
        checkout?: { available?: boolean; url?: string; message?: string };
      };
      if (!response.ok) throw new Error(result.error || "We could not prepare this order.");
      if (result.checkout?.url) {
        window.location.assign(result.checkout.url);
        return;
      }
      const orderLabel = result.order?.orderNumber ? `Order request ${result.order.orderNumber} was saved. ` : "Your order request was saved. ";
      setCheckoutMessage(`${orderLabel}${result.checkout?.message || "Payment is not configured, so no payment details were collected."}`);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "We could not prepare this order.");
    } finally {
      setCheckoutPending(false);
    }
  }

  async function joinWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setWaitlistError("");
    try {
      const response = await fetch("/api/waitlist", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ email, feature:"product-drops", marketingConsent:consent, source:"storefront" }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || "We couldn’t save that email yet.");
      setJoined(true);
    } catch (error) { setWaitlistError(error instanceof Error ? error.message : "Please try again."); }
    finally { setPending(false); }
  }

  return (
    <main id="top">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="announcement"><span>Designed and printed to order in the USA</span><span>Free shipping over $65</span><a href="#custom-print">Have a file? Get a quote →</a></div>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="BayLayer Labs home"><span className="brand-mark" /><span>BayLayer <b>Labs</b></span></a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <button type="button" onClick={() => chooseCollection("Best Sellers")}>Shop</button>
          <button type="button" onClick={() => chooseCollection("Gifts & Personalization")}>Personalized</button>
          <a href="#business">Business & Events</a><a href="#custom-print">Custom 3D Print</a><a href="#story">About</a><a href="/company">Company tracker</a>
        </nav>
        <div className="header-actions">
          <button className="icon-button search-jump" type="button" onClick={() => searchRef.current?.focus()} aria-label="Search products">⌕</button>
          <button className="menu-button" type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu"><span /><span /></button>
          <button className="cart-button" type="button" onClick={() => setCartOpen(true)} aria-label={`Open cart with ${itemCount} items`}>Bag <span>{itemCount}</span></button>
        </div>
        {menuOpen && <div className="mobile-menu"><nav aria-label="Mobile navigation">{LAUNCH_COLLECTIONS.map((item) => <button type="button" key={item} onClick={() => chooseCollection(item)}>{item}<span>→</span></button>)}<a href="#story" onClick={() => setMenuOpen(false)}>About <span>→</span></a><a href="/company" onClick={() => setMenuOpen(false)}>Company tracker <span>→</span></a></nav></div>}
      </header>

      <div id="main-content">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span /> PERSONAL, USEFUL, MADE TO ORDER</p>
            <h1>Eight useful ideas.<br /><em>Made personally.</em></h1>
            <p className="hero-intro">Our focused launch collection brings together personalized gifts, business signs, event pieces, practical parts, and modular tools—printed and human-checked in the Bay Area.</p>
            <div className="hero-actions"><button className="button button-dark" type="button" onClick={() => chooseCollection("Best Sellers")}>Shop the launch collection <span>↗</span></button><button className="button button-quiet" type="button" onClick={() => openProduct(LAUNCH_PRODUCTS[0])}>Create yours <span>→</span></button></div>
            <div className="hero-proof"><div><strong>Made to order</strong><span>Less inventory waste</span></div><div><strong>Personalized</strong><span>Preview before print</span></div><div><strong>Human checked</strong><span>Every single piece</span></div></div>
          </div>
          <div className="hero-stage">
            <div className="hero-product"><ProductImage product={LAUNCH_PRODUCTS[0]} /><span>Light on</span></div>
            <div className="hero-caption"><small>OUR #1 GIFT</small><strong>Photo Lithophane<br />Night Light</strong><span>$39.99 · made in 3–5 days</span></div>
          </div>
        </section>

        <section className="trust-strip" aria-label="Service benefits"><span>✦ Upload-safe personalization</span><span>✦ Small-batch quality checked</span><span>✦ Local pickup available</span><span>✦ Clear production times</span></section>

        <section className="shop-section" id="catalog">
          <div className="section-heading"><div><p className="eyebrow"><span /> THE FOCUSED FIRST DROP</p><h2>Eight launch offers.<br /><em>Each with a job.</em></h2></div><p>We narrowed the shelf to {LAUNCH_PRODUCTS.length} high-value products for gifting, business, events, hobbies, plants, and practical repairs. Every order is made only after you choose it.</p></div>

          <div className="catalog-tabs" role="tablist" aria-label="Product collections">{LAUNCH_COLLECTIONS.map((item) => <button role="tab" aria-selected={collection === item} className={collection === item ? "active" : ""} key={item} type="button" onClick={() => setCollection(item)}>{item}</button>)}</div>

          <div className="catalog-tools">
            <label className="search-field"><span aria-hidden="true">⌕</span><span className="sr-only">Search products</span><input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder="Search gifts, planters, desk tools…" />{query && <button type="button" onClick={() => setQuery("")}>Clear</button>}</label>
            <div className="filter-row">
              <label>Material<select value={material} onChange={(e) => setMaterial(e.target.value)}>{materials.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Max price<select value={priceLimit} onChange={(e) => setPriceLimit(Number(e.target.value))}><option value="20">Under $20</option><option value="35">Under $35</option><option value="50">Under $50</option><option value="100">Any price</option></select></label>
              <label>Sort<select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}><option value="featured">Featured</option><option value="best">Best selling</option><option value="new">Newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="fast">Fastest production</option></select></label>
              <label className="check-filter"><input type="checkbox" checked={personalizedOnly} onChange={(e) => setPersonalizedOnly(e.target.checked)} /> Personalized</label>
              <label className="check-filter"><input type="checkbox" checked={fastOnly} onChange={(e) => setFastOnly(e.target.checked)} /> Ready in 4 days</label>
            </div>
          </div>

          <div className="result-line"><strong>{collection}</strong><span>{visible.length} {visible.length === 1 ? "product" : "products"}</span></div>
          {visible.length ? <div className="product-grid">{visible.map((product) => <article className="product-card" key={product.id}>
            <button className="product-visual" type="button" onClick={() => openProduct(product)} aria-label={`View ${product.name}`}><ProductImage product={product} />{product.badge && <span className="product-badge">{product.badge}</span>}<span className="quick-view">Quick customize</span></button>
            <div className="product-info"><p>{product.collection}</p><button type="button" onClick={() => openProduct(product)}><h3>{product.name}</h3></button><p className="product-description">{product.description}</p><div className="swatch-row" aria-label={`Available colors: ${product.colors.join(", ")}`}>{product.colors.slice(0,5).map((color) => <i key={color} title={color} className={`swatch ${color.toLowerCase().replaceAll(" ", "-")}`} />)}</div><div><strong>{product.priceLabel ?? (product.price === 0 ? "Request a quote" : `${product.badge?.startsWith("From") ? "" : "From "}${money(product.price)}`)}</strong><span>{product.productionDays} day production</span></div></div>
          </article>)}</div> : <div className="empty-results"><h3>No exact match—yet.</h3><p>Reset a filter or share your own model for a custom quote.</p><button className="button button-dark" type="button" onClick={() => { setQuery(""); setMaterial("All materials"); setPriceLimit(100); setPersonalizedOnly(false); setFastOnly(false); }}>Reset filters</button></div>}
        </section>

        <section className="process-section" id="how-it-works"><div className="section-heading"><div><p className="eyebrow"><span /> HOW CUSTOMIZATION WORKS</p><h2>Yours in<br /><em>three clear steps.</em></h2></div></div><div className="process-grid"><article><span>01</span><h3>Choose your piece</h3><p>Pick a proven product, color, size, and the personal details you want.</p></article><article><span>02</span><h3>Preview & confirm</h3><p>We review uploaded photos, logos, and wording before anything prints.</p></article><article><span>03</span><h3>Printed for you</h3><p>Your order is made, cleaned, checked, packed, and sent from the Bay Area.</p></article></div></section>

        <section className="before-after"><div className="before-card"><span>YOUR PHOTO</span><div className="photo-placeholder">Photo<br />upload</div></div><div className="transform-arrow">→</div><div className="after-card"><span>YOUR LIGHT</span><ProductImage product={LAUNCH_PRODUCTS[0]} /></div><div className="transform-copy"><p className="eyebrow"><span /> FROM MEMORY TO OBJECT</p><h2>A personal photo,<br /><em>made luminous.</em></h2><p>We crop, translate, and proof your image for the best relief detail—then print a piece that only comes alive when the light turns on.</p><button type="button" className="button button-dark" onClick={() => openProduct(LAUNCH_PRODUCTS[0])}>Create a photo light</button></div></section>

        <section className="recipient-section"><div className="section-heading"><div><p className="eyebrow"><span /> SHOP BY PERSON</p><h2>A useful gift feels<br /><em>more personal.</em></h2></div></div><div className="recipient-grid">{RECIPIENTS.map(([label, target], index) => <button key={label} type="button" className={`recipient-card recipient-${index}`} onClick={() => chooseCollection(target)}><span>For</span><strong>{label}</strong><i>Explore →</i></button>)}</div></section>

        <section className="reviews"><p className="eyebrow light"><span /> PILOT PROMISE</p><blockquote>Useful products, clear limits, and a human review before personalized work reaches the printer.</blockquote><div><strong>BayLayer Labs</strong><span>Eight focused launch offers · Bay Area</span></div><div className="review-points"><span>No fabricated ratings</span><span>File rights confirmed</span><span>Human support</span></div></section>

        <section className="custom-section" id="custom-print"><div className="custom-copy"><p className="eyebrow light"><span /> CUSTOM PRINT STUDIO</p><h2>Your file.<br /><em>Made physical.</em></h2><p>Have an STL ready? Get a geometry-based planning estimate, then a human printability review. We do not accept weapons, medical devices, safety-critical parts, or unauthorized designs.</p><ul><li><span>01</span> Upload an STL</li><li><span>02</span> Pick material & finish</li><li><span>03</span> Review before paying</li></ul></div><QuoteBuilder className="quote-builder-shell" heading="Estimate your STL" /></section>

        <section className="business-section" id="business"><div><p className="eyebrow"><span /> BUSINESS & EVENTS</p><h2>Small batches.<br /><em>Big impression.</em></h2><p>Branded counter signs and event place names with clear minimums, customer-approved files, and human review before production.</p><button type="button" className="button button-dark" onClick={() => chooseCollection("Business & Events")}>Shop business & events</button></div><div className="stat-grid"><span><strong>20</strong> place-name minimum</span><span><strong>1</strong> review before production</span><span><strong>US</strong> pickup and shipping</span><span><strong>100%</strong> logo rights confirmed</span></div></section>

        <section className="materials" id="story"><div className="section-heading"><div><p className="eyebrow"><span /> MATERIALS & CARE</p><h2>Designed honestly.<br /><em>Cared for simply.</em></h2></div></div><div className="material-grid"><article><span>PLA</span><h3>Crisp detail for indoors</h3><p>Ideal for gifts and desk pieces. Keep away from high heat, dishwashers, and hot cars.</p></article><article><span>PETG</span><h3>Tougher around water</h3><p>Our choice for planters, bathrooms, and practical parts. Hand wash with cool water.</p></article><article><span>TPU</span><h3>Flexible where it helps</h3><p>Used for feet, cable clips, and protective contact points that need some give.</p></article></div></section>

        <section className="faq"><div><p className="eyebrow"><span /> GOOD TO KNOW</p><h2>Questions,<br /><em>answered.</em></h2></div><div className="faq-list"><details><summary>When will my order ship?</summary><p>Most catalog pieces take 3–7 business days to make. Each product shows its production estimate before you add it to your bag.</p></details><details><summary>Can I return a personalized product?</summary><p>Personalized pieces cannot be returned for a change of mind, but we will make manufacturing errors or transit damage right.</p></details><details><summary>Are 3D printed products food-safe?</summary><p>No. We do not market untreated FDM prints for direct food contact, and printed items are not dishwasher safe.</p></details><details><summary>Can you print any model I send?</summary><p>No. We review ownership, printability, safety, and policy before accepting every custom job.</p></details></div></section>

        <section className="newsletter" id="ai-scan"><div><p className="eyebrow light"><span /> AI OBJECT SCAN + NEW DROPS</p><h2>What should we<br /><em>make next?</em></h2><p>Join the early list for new product releases and our upcoming guided AI object scan.</p></div>{joined ? <div className="success" role="status"><strong>You’re on the list.</strong><span>Watch your inbox for the next drop.</span></div> : <form onSubmit={joinWaitlist}><label><span>Email address</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label><label className="consent"><input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} /> I agree to product emails and the <a href="/privacy">privacy notice</a>.</label><button disabled={pending} className="button" type="submit">{pending ? "Joining…" : "Join the list →"}</button>{waitlistError && <p role="alert">{waitlistError}</p>}</form>}</section>
      </div>

      <footer><div className="footer-main"><div><a className="brand inverse" href="#top"><span className="brand-mark" /><span>BayLayer <b>Labs</b></span></a><p>Useful, personalized objects made close to home.</p><span>Bay Area, California</span></div><nav aria-label="Footer shop"><strong>Shop</strong>{LAUNCH_COLLECTIONS.slice(0,5).map((item) => <button type="button" key={item} onClick={() => chooseCollection(item)}>{item}</button>)}</nav><nav aria-label="Footer help"><strong>Help</strong><a href="#how-it-works">How it works</a><a href="/company">Company tracker</a><a href="mailto:baylayerlabs@gmail.com">Contact</a><a href="/print-policy">Print policy</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav></div><div className="footer-bottom"><span>© 2026 BayLayer Labs</span><span>Ideas, made local.</span></div></footer>

      {selected && <div className="modal-layer">
        <button className="drawer-backdrop" type="button" aria-label="Close product details" onClick={() => setSelected(null)} />
        <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
          <button ref={detailCloseRef} className="modal-close" type="button" aria-label="Close product details" onClick={() => setSelected(null)}>×</button>
          <div className="detail-gallery"><ProductImage product={selected} /><div className="thumbs"><ProductImage product={selected} small /><span>Details</span><span>In use</span><span>Scale</span></div></div>
          <div className="detail-copy">
            <p className="eyebrow"><span /> {selected.collection}</p><h2 id="detail-title">{selected.name}</h2>
            <p className="detail-price">{selected.priceLabel ?? (selected.price === 0 ? "Custom quote" : `From ${money(selected.price)}`)}</p>
            <p>{selected.description}</p><div className="delivery-note"><strong>Made to order</strong><span>Estimated production: {selected.productionDays} business days</span></div>
            <fieldset><legend>Color · <b>{detailColor}</b></legend><div className="detail-swatches">{selected.colors.map((color) => <button className={detailColor === color ? "active" : ""} aria-label={`Choose ${color}`} title={color} type="button" key={color} onClick={() => setDetailColor(color)}><i className={`swatch ${color.toLowerCase().replaceAll(" ", "-")}`} /></button>)}</div></fieldset>
            {selectedSchema.length > 0 && <div className={styles.customizationGrid}>{selectedSchema.map((field) => <CustomizationControl
              key={field.key}
              field={field}
              value={detailOptions[field.key] ?? ""}
              error={detailErrors[field.key]}
              onValue={(value) => { setDetailOptions((options) => ({ ...options, [field.key]: value })); setDetailErrors((errors) => ({ ...errors, [field.key]: "" })); }}
              onFile={(file) => setDetailFiles((files) => { const next = { ...files }; if (file) next[field.key] = file; else delete next[field.key]; return next; })}
            />)}</div>}
            {selectedHasFile && <label className="rights-check"><input type="checkbox" checked={detailRights} onChange={(event) => { setDetailRights(event.target.checked); setDetailErrors((errors) => ({ ...errors, rights: "" })); }} /> I own or have permission to use every photo, drawing, logo, or design selected here.</label>}
            {detailErrors.rights && <p className={styles.formError} role="alert">{detailErrors.rights}</p>}
            {selectedHasFile && <p className={styles.uploadNote}>Selected files stay on this device until checkout. Checkout uploads them securely before creating the order; selecting a file here does not claim it has been uploaded.</p>}
            <dl className="detail-facts"><div><dt>Material</dt><dd>{selected.material}</dd></div><div><dt>Included</dt><dd>Finished print + care card</dd></div><div><dt>Care</dt><dd>Cool water, hand clean only</dd></div></dl>
            {selected.safety && <p className="safety-note">Safety: {selected.safety}</p>}
            <button className="button button-dark detail-add" type="button" onClick={() => add(selected)}>{selected.price === 0 ? "Start custom quote" : editingLineId ? "Save cart changes" : `Add to bag · ${money(selected.price * (selected.minimum ?? 1))}`}</button>
          </div>
        </section>
      </div>}

      {cartOpen && <div className="drawer-layer">
        <button className="drawer-backdrop" type="button" onClick={() => setCartOpen(false)} aria-label="Close cart" />
        <aside className={`cart-drawer ${styles.checkoutDrawer}`} role="dialog" aria-modal="true" aria-labelledby="cart-title">
          <div className="cart-header"><div><p>Your bag · {itemCount} items</p><h2 id="cart-title">Ready to make.</h2></div><button type="button" onClick={() => setCartOpen(false)} aria-label="Close cart">×</button></div>
          {cart.length === 0 ? <div className="empty-cart"><h3>Your bag is still two-dimensional.</h3><p>Add a useful object and we’ll take it from there.</p><button className="button button-dark" type="button" onClick={() => setCartOpen(false)}>Explore the shop</button></div> : <>
            <div className="cart-items">{cart.map((item) => <div className={`cart-item ${styles.cartLine}`} key={item.id}>
              <ProductImage product={item.product} small />
              <div><p>{item.color}</p><h3>{item.product.name}</h3><ul className={styles.optionList}>{itemOptionSummary(item).map((summary) => <li key={summary}>{summary}</li>)}</ul>
                <div className="quantity-control"><button type="button" disabled={item.quantity <= (item.product.minimum ?? 1)} aria-label={`Remove one ${item.product.name}`} onClick={() => changeQuantity(item.id,-1)}>−</button><span>{item.quantity}</span><button type="button" disabled={item.quantity >= 100} aria-label={`Add one ${item.product.name}`} onClick={() => changeQuantity(item.id,1)}>+</button></div>
                <div className={styles.lineActions}><button type="button" onClick={() => editCartLine(item)}>Edit options</button><button type="button" onClick={() => removeCartLine(item.id)}>Remove</button></div>
              </div><strong>{money(item.product.price * item.quantity)}</strong>
            </div>)}</div>
            <form className={styles.checkoutForm} onSubmit={submitCheckout}>
              <div className={styles.totalRow}><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
              <p>{subtotal >= 65 ? "Eligible carts receive free shipping after server review." : `${money(65-subtotal)} away from the advertised free-shipping threshold.`} Final shipping and tax are returned by checkout.</p>
              {cartHasPendingFiles && <p className={styles.uploadNote}>Product files will be uploaded securely when you continue. Keep this page open until checkout responds.</p>}
              <h3>Customer details</h3>
              <div className={styles.checkoutGrid}>
                <label><span>Name *</span><input required autoComplete="name" value={checkout.name} onChange={(event) => setCheckout((value) => ({ ...value, name: event.target.value }))} /></label>
                <label><span>Email *</span><input required type="email" autoComplete="email" value={checkout.email} onChange={(event) => setCheckout((value) => ({ ...value, email: event.target.value }))} /></label>
                <label><span>Phone</span><input type="tel" autoComplete="tel" value={checkout.phone} onChange={(event) => setCheckout((value) => ({ ...value, phone: event.target.value }))} /></label>
              </div>
              <fieldset className={styles.fulfillment}><legend>Fulfillment *</legend><label><input type="radio" name="fulfillment" checked={checkout.fulfillmentMethod === "pickup"} onChange={() => setCheckout((value) => ({ ...value, fulfillmentMethod: "pickup" }))} /> Local pickup</label><label><input type="radio" name="fulfillment" checked={checkout.fulfillmentMethod === "shipping"} onChange={() => setCheckout((value) => ({ ...value, fulfillmentMethod: "shipping" }))} /> US shipping</label></fieldset>
              {checkout.fulfillmentMethod === "shipping" && <div className={styles.addressGrid}>
                <label className={styles.fullWidth}><span>Address *</span><input required autoComplete="shipping address-line1" value={checkout.line1} onChange={(event) => setCheckout((value) => ({ ...value, line1: event.target.value }))} /></label>
                <label className={styles.fullWidth}><span>Apartment, suite, etc.</span><input autoComplete="shipping address-line2" value={checkout.line2} onChange={(event) => setCheckout((value) => ({ ...value, line2: event.target.value }))} /></label>
                <label><span>City *</span><input required autoComplete="shipping address-level2" value={checkout.city} onChange={(event) => setCheckout((value) => ({ ...value, city: event.target.value }))} /></label>
                <label><span>State *</span><input required pattern="[A-Za-z]{2}" maxLength={2} autoComplete="shipping address-level1" value={checkout.state} onChange={(event) => setCheckout((value) => ({ ...value, state: event.target.value }))} /></label>
                <label><span>ZIP code *</span><input required pattern="[0-9]{5}(-[0-9]{4})?" autoComplete="shipping postal-code" value={checkout.postalCode} onChange={(event) => setCheckout((value) => ({ ...value, postalCode: event.target.value }))} /></label>
              </div>}
              {checkoutError && <p className={styles.formError} role="alert">{checkoutError}</p>}
              {checkoutMessage && <p className={styles.formSuccess} role="status">{checkoutMessage}</p>}
              <button className="button button-dark" disabled={checkoutPending} type="submit">{checkoutPending ? (cartHasPendingFiles ? "Uploading & preparing…" : "Preparing secure checkout…") : "Continue to secure checkout"}</button>
              <small>We create and price the order on the server. Payment is collected only if the order API returns a hosted checkout link.</small>
            </form>
          </>}
        </aside>
      </div>}

      <nav className="app-tabs" aria-label="Mobile app navigation"><a href="#top"><span>⌂</span>Home</a><button type="button" onClick={() => chooseCollection("Best Sellers")}><span>▦</span>Shop</button><button type="button" onClick={() => openProduct(LAUNCH_PRODUCTS[0])}><span>✦</span>Customize</button><a href="/company"><span>◎</span>Team</a><button type="button" onClick={() => setCartOpen(true)}><span>▱</span>Cart{itemCount > 0 && <i>{itemCount}</i>}</button></nav>
    </main>
  );
}
