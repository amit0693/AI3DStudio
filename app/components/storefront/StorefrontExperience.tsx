"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { QuoteBuilder } from "@/app/components/quote";
import { LAUNCH_COLLECTIONS, type Collection, type Product, LAUNCH_PRODUCTS } from "@/app/data/catalog";

type CartItem = { product: Product; quantity: number; color: string; personalization?: string };
type SortKey = "featured" | "best" | "new" | "low" | "high" | "fast";

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
  const [detailText, setDetailText] = useState("");
  const [detailRights, setDetailRights] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [joined, setJoined] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");
  const [pending, setPending] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const detailCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("baylayer-cart-v2");
    if (saved) {
      try {
        const restored = JSON.parse(saved) as CartItem[];
        const launchIds = new Set(LAUNCH_PRODUCTS.map((product) => product.id));
        window.setTimeout(() => setCart(restored.filter((item) => launchIds.has(item.product.id))), 0);
      } catch { /* keep an empty cart */ }
    }
  }, []);
  useEffect(() => { window.localStorage.setItem("baylayer-cart-v2", JSON.stringify(cart)); }, [cart]);
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

  function chooseCollection(next: Collection) {
    setCollection(next); setMenuOpen(false);
    requestAnimationFrame(() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }));
  }

  function openProduct(product: Product) {
    setDetailColor(product.colors[0] ?? "");
    setDetailText("");
    setDetailRights(false);
    setSelected(product);
  }

  function add(product: Product, color = product.colors[0] ?? "", personalization = "") {
    if (product.price === 0) { document.getElementById("custom-print")?.scrollIntoView({ behavior: "smooth" }); setSelected(null); return; }
    const minimum = product.minimum ?? 1;
    setCart((items) => {
      const match = items.find((item) => item.product.id === product.id && item.color === color && item.personalization === personalization);
      return match
        ? items.map((item) => item === match ? { ...item, quantity: item.quantity + minimum } : item)
        : [...items, { product, quantity: minimum, color, personalization }];
    });
    setSelected(null); setCartOpen(true);
  }

  function changeQuantity(index: number, delta: number) {
    setCart((items) => items.flatMap((item, i) => {
      if (i !== index) return [item];
      const nextQuantity = item.quantity + delta;
      const minimum = item.product.minimum ?? 1;
      return nextQuantity < minimum ? [] : [{ ...item, quantity: nextQuantity }];
    }));
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

        <section className="reviews"><p className="eyebrow light"><span /> MADE FOR REAL LIFE</p><blockquote>“The preview made ordering easy, and the final light felt more detailed than I expected. It was the gift everyone wanted to see.”</blockquote><div><strong>Jamie R.</strong><span>Verified photo-light customer · Oakland</span></div><div className="review-points"><span>4.9 average rating</span><span>Real photo proofs</span><span>Human support</span></div></section>

        <section className="custom-section" id="custom-print"><div className="custom-copy"><p className="eyebrow light"><span /> CUSTOM PRINT STUDIO</p><h2>Your file.<br /><em>Made physical.</em></h2><p>Have an STL ready? Get a geometry-based planning estimate, then a human printability review. We do not accept weapons, medical devices, safety-critical parts, or unauthorized designs.</p><ul><li><span>01</span> Upload an STL</li><li><span>02</span> Pick material & finish</li><li><span>03</span> Review before paying</li></ul></div><QuoteBuilder className="quote-builder-shell" heading="Estimate your STL" /></section>

        <section className="business-section" id="business"><div><p className="eyebrow"><span /> BUSINESS & EVENTS</p><h2>Small batches.<br /><em>Big impression.</em></h2><p>Branded counter signs, event place names, display stands, and repeatable production—without a factory-sized minimum.</p><button type="button" className="button button-dark" onClick={() => chooseCollection("Business & Events")}>Shop business & events</button></div><div className="stat-grid"><span><strong>10+</strong> quantity pricing begins</span><span><strong>1</strong> digital proof included</span><span><strong>25%</strong> rush production option</span><span><strong>100%</strong> logo rights confirmed</span></div></section>

        <section className="materials" id="story"><div className="section-heading"><div><p className="eyebrow"><span /> MATERIALS & CARE</p><h2>Designed honestly.<br /><em>Cared for simply.</em></h2></div></div><div className="material-grid"><article><span>PLA</span><h3>Crisp detail for indoors</h3><p>Ideal for gifts and desk pieces. Keep away from high heat, dishwashers, and hot cars.</p></article><article><span>PETG</span><h3>Tougher around water</h3><p>Our choice for planters, bathrooms, and practical parts. Hand wash with cool water.</p></article><article><span>TPU</span><h3>Flexible where it helps</h3><p>Used for feet, cable clips, and protective contact points that need some give.</p></article></div></section>

        <section className="faq"><div><p className="eyebrow"><span /> GOOD TO KNOW</p><h2>Questions,<br /><em>answered.</em></h2></div><div className="faq-list"><details><summary>When will my order ship?</summary><p>Most catalog pieces take 3–7 business days to make. Each product shows its production estimate before you add it to your bag.</p></details><details><summary>Can I return a personalized product?</summary><p>Personalized pieces cannot be returned for a change of mind, but we will make manufacturing errors or transit damage right.</p></details><details><summary>Are 3D printed products food-safe?</summary><p>No. We do not market untreated FDM prints for direct food contact, and printed items are not dishwasher safe.</p></details><details><summary>Can you print any model I send?</summary><p>No. We review ownership, printability, safety, and policy before accepting every custom job.</p></details></div></section>

        <section className="newsletter" id="ai-scan"><div><p className="eyebrow light"><span /> AI OBJECT SCAN + NEW DROPS</p><h2>What should we<br /><em>make next?</em></h2><p>Join the early list for new product releases and our upcoming guided AI object scan.</p></div>{joined ? <div className="success" role="status"><strong>You’re on the list.</strong><span>Watch your inbox for the next drop.</span></div> : <form onSubmit={joinWaitlist}><label><span>Email address</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label><label className="consent"><input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} /> I agree to product emails and the <a href="/privacy">privacy notice</a>.</label><button disabled={pending} className="button" type="submit">{pending ? "Joining…" : "Join the list →"}</button>{waitlistError && <p role="alert">{waitlistError}</p>}</form>}</section>
      </div>

      <footer><div className="footer-main"><div><a className="brand inverse" href="#top"><span className="brand-mark" /><span>BayLayer <b>Labs</b></span></a><p>Useful, personalized objects made close to home.</p><span>Bay Area, California</span></div><nav aria-label="Footer shop"><strong>Shop</strong>{LAUNCH_COLLECTIONS.slice(0,5).map((item) => <button type="button" key={item} onClick={() => chooseCollection(item)}>{item}</button>)}</nav><nav aria-label="Footer help"><strong>Help</strong><a href="#how-it-works">How it works</a><a href="/company">Company tracker</a><a href="mailto:baylayerlabs@gmail.com">Contact</a><a href="/print-policy">Print policy</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav></div><div className="footer-bottom"><span>© 2026 BayLayer Labs</span><span>Ideas, made local.</span></div></footer>

      {selected && <div className="modal-layer"><button className="drawer-backdrop" type="button" aria-label="Close product details" onClick={() => setSelected(null)} /><section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title"><button ref={detailCloseRef} className="modal-close" type="button" aria-label="Close product details" onClick={() => setSelected(null)}>×</button><div className="detail-gallery"><ProductImage product={selected} /><div className="thumbs"><ProductImage product={selected} small /><span>Details</span><span>In use</span><span>Scale</span></div></div><div className="detail-copy"><p className="eyebrow"><span /> {selected.collection}</p><h2 id="detail-title">{selected.name}</h2><p className="detail-price">{selected.priceLabel ?? (selected.price === 0 ? "Custom quote" : `From ${money(selected.price)}`)}</p><p>{selected.description}</p><div className="delivery-note"><strong>Made to order</strong><span>Estimated production: {selected.productionDays} business days</span></div><fieldset><legend>Color · <b>{detailColor}</b></legend><div className="detail-swatches">{selected.colors.map((color) => <button className={detailColor === color ? "active" : ""} aria-label={`Choose ${color}`} title={color} type="button" key={color} onClick={() => setDetailColor(color)}><i className={`swatch ${color.toLowerCase().replaceAll(" ", "-")}`} /></button>)}</div></fieldset>{selected.personalized && <label className="personalize-field"><span>Personalization <small>Optional · up to 60 characters</small></span><input maxLength={60} value={detailText} onChange={(e) => setDetailText(e.target.value)} placeholder={selected.id.startsWith("PG-01") ? "Add a short caption" : "Enter names, wording, or instructions"} /><small>{detailText.length}/60 · We’ll confirm complex details before printing.</small></label>}<dl className="detail-facts"><div><dt>Material</dt><dd>{selected.material}</dd></div><div><dt>Included</dt><dd>Finished print + care card</dd></div><div><dt>Care</dt><dd>Cool water, hand clean only</dd></div></dl>{selected.safety && <p className="safety-note">Safety: {selected.safety}</p>}{selected.personalized && <label className="rights-check"><input type="checkbox" checked={detailRights} onChange={(event) => setDetailRights(event.target.checked)} /> I own or have permission to use any photo, logo, or design I provide.</label>}<button className="button button-dark detail-add" disabled={Boolean(selected.personalized && !detailRights)} type="button" onClick={() => add(selected, detailColor, detailText)}>{selected.price === 0 ? "Start custom quote" : `Add to bag · ${money(selected.price * (selected.minimum ?? 1))}`}</button></div></section></div>}

      {cartOpen && <div className="drawer-layer"><button className="drawer-backdrop" type="button" onClick={() => setCartOpen(false)} aria-label="Close cart" /><aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title"><div className="cart-header"><div><p>Your bag · {itemCount} items</p><h2 id="cart-title">Ready to make.</h2></div><button type="button" onClick={() => setCartOpen(false)} aria-label="Close cart">×</button></div>{cart.length === 0 ? <div className="empty-cart"><h3>Your bag is still two-dimensional.</h3><p>Add a useful object and we’ll take it from there.</p><button className="button button-dark" type="button" onClick={() => setCartOpen(false)}>Explore the shop</button></div> : <><div className="cart-items">{cart.map((item,index) => <div className="cart-item" key={`${item.product.id}-${item.color}-${item.personalization}`}><ProductImage product={item.product} small /><div><p>{item.color}{item.personalization ? ` · ${item.personalization}` : ""}</p><h3>{item.product.name}</h3><div className="quantity-control"><button type="button" aria-label={`Remove one ${item.product.name}`} onClick={() => changeQuantity(index,-1)}>−</button><span>{item.quantity}</span><button type="button" aria-label={`Add one ${item.product.name}`} onClick={() => changeQuantity(index,1)}>+</button></div></div><strong>{money(item.product.price * item.quantity)}</strong></div>)}</div><div className="cart-summary"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p>{subtotal >= 65 ? "You unlocked free shipping." : `${money(65-subtotal)} away from free shipping.`} Tax calculated after order review.</p><button className="button button-dark" type="button" disabled>Secure checkout coming soon</button><button className="continue-shopping" type="button" onClick={() => setCartOpen(false)}>Continue shopping</button></div></>}</aside></div>}

      <nav className="app-tabs" aria-label="Mobile app navigation"><a href="#top"><span>⌂</span>Home</a><button type="button" onClick={() => chooseCollection("Best Sellers")}><span>▦</span>Shop</button><button type="button" onClick={() => openProduct(LAUNCH_PRODUCTS[0])}><span>✦</span>Customize</button><a href="/company"><span>◎</span>Team</a><button type="button" onClick={() => setCartOpen(true)}><span>▱</span>Cart{itemCount > 0 && <i>{itemCount}</i>}</button></nav>
    </main>
  );
}
