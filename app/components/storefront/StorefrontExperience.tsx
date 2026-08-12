"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { QuoteBuilder } from "@/app/components/quote";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  badge?: string;
  color: string;
  art: string;
};

type CartItem = Product & { quantity: number };

const products: Product[] = [
  {
    id: "desk-sign",
    name: "Contour Name Sign",
    category: "Personalized",
    description: "A layered desk sign, sized and colored for your space.",
    price: 24,
    badge: "Launch collection",
    color: "mint",
    art: "name-sign",
  },
  {
    id: "qr-stand",
    name: "Counter QR Stand",
    category: "For business",
    description: "A sturdy, custom-color stand for menus, reviews, or Wi-Fi.",
    price: 34,
    badge: "For local business",
    color: "orange",
    art: "qr-stand",
  },
  {
    id: "cable-kit",
    name: "Cable Tidy Kit",
    category: "Desk & home",
    description: "Six low-profile clips that keep a busy desk under control.",
    price: 18,
    color: "blue",
    art: "cable-kit",
  },
  {
    id: "lithophane",
    name: "Memory Light Panel",
    category: "Gifts",
    description: "Turn a favorite photo into a softly glowing keepsake panel.",
    price: 39,
    badge: "Gift-ready",
    color: "yellow",
    art: "light-panel",
  },
  {
    id: "prototype",
    name: "Prototype Starter",
    category: "Custom",
    description: "One functional PLA prototype with a human printability review.",
    price: 29,
    badge: "From $29",
    color: "violet",
    art: "prototype",
  },
];

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

function ProductArt({ product }: { product: Product }) {
  return (
    <div className={`product-art ${product.color}`} aria-hidden="true">
      <span className={`model model-${product.art}`}>
        <i />
        <b />
        <em />
      </span>
      <span className="art-shadow" />
      <span className="art-axis">BAY / 01</span>
    </div>
  );
}

export function StorefrontExperience() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [waitlistPending, setWaitlistPending] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");
  const [waitlistConsent, setWaitlistConsent] = useState(false);
  const cartCloseRef = useRef<HTMLButtonElement>(null);
  const cartOpenerRef = useRef<HTMLElement | null>(null);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  useEffect(() => {
    document.body.style.overflow = cartOpen || menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, menuOpen]);

  useEffect(() => {
    if (!cartOpen) return;
    cartOpenerRef.current = document.activeElement as HTMLElement | null;
    cartCloseRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCartOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      cartOpenerRef.current?.focus();
    };
  }, [cartOpen]);

  function addToCart(product: Product) {
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id);
      if (existing) {
        return items.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...items, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function updateQuantity(id: string, amount: number) {
    setCart((items) =>
      items
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + amount }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  async function joinWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWaitlistPending(true);
    setWaitlistError("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: waitlistEmail,
          feature: "ai-scan",
          marketingConsent: waitlistConsent,
          source: "storefront",
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "We could not save your email yet.");
      }
      setWaitlistJoined(true);
    } catch (error) {
      setWaitlistError(
        error instanceof Error ? error.message : "We could not save your email yet.",
      );
    } finally {
      setWaitlistPending(false);
    }
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <main>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <div className="announcement">
        <span>Made in the Bay Area</span>
        <span aria-hidden="true">◆</span>
        <span>Small-batch, human-checked</span>
        <a href="#custom-print">Request a custom print&nbsp; →</a>
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="BayLayer Labs home">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            BayLayer <b>Labs</b>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#shop">Shop</a>
          <a href="#custom-print">Custom print</a>
          <a href="#how-it-works">How it works</a>
          <a href="#ai-scan">AI Scan <small>SOON</small></a>
        </nav>

        <div className="header-actions">
          <button
            className="menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
          <button
            className="cart-button"
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart with ${itemCount} items`}
          >
            Cart <span>{itemCount}</span>
          </button>
        </div>

        <div
          id="mobile-menu"
          className={`mobile-menu ${menuOpen ? "open" : ""}`}
          aria-hidden={!menuOpen}
        >
          <nav aria-label="Mobile navigation">
            <a href="#shop" onClick={closeMenu}>Shop <span>01</span></a>
            <a href="#custom-print" onClick={closeMenu}>Custom print <span>02</span></a>
            <a href="#how-it-works" onClick={closeMenu}>How it works <span>03</span></a>
            <a href="#ai-scan" onClick={closeMenu}>AI Scan <span>Coming soon</span></a>
          </nav>
          <p>Useful objects, made close to home.</p>
        </div>
      </header>

      <div id="main-content">
        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow"><span /> 3D PRINTING, REIMAGINED LOCALLY</p>
            <h1>
              Good ideas deserve<br />
              <em>another dimension.</em>
            </h1>
            <p className="hero-intro">
              Shop useful, personality-filled prints—or bring us the file for
              something entirely your own. Printed and checked in the Bay Area.
            </p>
            <div className="hero-actions">
              <a className="button button-dark" href="#shop">
                Shop the first drop <span>↗</span>
              </a>
              <a className="text-link" href="#custom-print">
                I have a 3D file <span>→</span>
              </a>
            </div>
            <div className="hero-proof" aria-label="Service highlights">
              <div><strong>LOCAL</strong><span>Bay Area production</span></div>
              <div><strong>PLA</strong><span>Thoughtful material choices</span></div>
              <div><strong>REVIEW</strong><span>Human printability check</span></div>
            </div>
          </div>

          <div className="hero-stage" aria-label="Layered 3D printed name sign illustration">
            <span className="stage-label top">LAYER BY LAYER</span>
            <span className="stage-label side">MADE LOCAL</span>
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="hero-object">
              <span className="hero-object-face">BAY</span>
              <span className="hero-object-edge" />
              <span className="hero-object-base" />
            </div>
            <span className="hero-dot dot-one" />
            <span className="hero-dot dot-two" />
            <span className="hero-dot dot-three" />
            <p><b>01</b> CONTOUR SERIES<br />PERSONALIZED DESK OBJECT</p>
          </div>
          <p className="hero-note">*Final timing depends on size, queue, and design review.</p>
        </section>

        <section className="ticker" aria-label="Product categories">
          <span>PERSONALIZED GIFTS</span><i>✦</i>
          <span>DESK ESSENTIALS</span><i>✦</i>
          <span>SMALL-BATCH BUSINESS</span><i>✦</i>
          <span>PROTOTYPES</span><i>✦</i>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><span /> THE FIRST DROP</p>
              <h2>Small objects.<br /><em>Big usefulness.</em></h2>
            </div>
            <p>
              Designed for real desks, homes, and businesses. Every piece is
              printed to order so you can choose the finish that feels yours.
            </p>
          </div>

          <div className="product-grid">
            {products.map((product, index) => (
              <article className={`product-card product-${index + 1}`} key={product.id}>
                <div className="product-visual">
                  {product.badge && <span className="product-badge">{product.badge}</span>}
                  <ProductArt product={product} />
                  <button
                    type="button"
                    className="quick-add"
                    onClick={() => addToCart(product)}
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <span>+</span> Quick add
                  </button>
                </div>
                <div className="product-info">
                  <p>{product.category}</p>
                  <h3>{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <div>
                    <strong>{formatPrice(product.price)}</strong>
                    <button type="button" onClick={() => addToCart(product)}>
                      Add <span>→</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="custom-section" id="custom-print">
          <div className="custom-copy">
            <p className="eyebrow light"><span /> CUSTOM PRINT STUDIO</p>
            <h2>Your file.<br /><em>Made physical.</em></h2>
            <p>
              Have an STL ready to go? Share it for a printability review and a
              clear quote. A real person checks every custom job before the
              printer starts.
            </p>
            <ul>
              <li><span>01</span> Upload your STL</li>
              <li><span>02</span> Pick material, color & finish</li>
              <li><span>03</span> Review quote before paying</li>
            </ul>
            <p className="custom-note">Need design help? Tell us what you’re making in the notes.</p>
          </div>

          <QuoteBuilder className="quote-builder-shell" heading="Estimate your STL" />
        </section>

        <section className="process-section" id="how-it-works">
          <div className="section-heading process-heading">
            <div>
              <p className="eyebrow"><span /> FROM CLICK TO OBJECT</p>
              <h2>A short path to<br /><em>something real.</em></h2>
            </div>
            <p>We keep the process visible, the choices simple, and the quality check human.</p>
          </div>
          <div className="process-grid">
            <article>
              <span className="process-number">01</span>
              <div className="process-icon choose" aria-hidden="true"><i /><i /><i /></div>
              <h3>Choose or upload</h3>
              <p>Pick a proven design from the shop or bring your own 3D file.</p>
            </article>
            <article>
              <span className="process-number">02</span>
              <div className="process-icon review" aria-hidden="true"><i /><i /></div>
              <h3>We review it</h3>
              <p>We check size, material, printability, timing, and your final price.</p>
            </article>
            <article>
              <span className="process-number">03</span>
              <div className="process-icon make" aria-hidden="true"><i /><i /><i /></div>
              <h3>Made layer by layer</h3>
              <p>Your piece is printed, cleaned, and quality checked in the Bay Area.</p>
            </article>
            <article>
              <span className="process-number">04</span>
              <div className="process-icon deliver" aria-hidden="true"><i /><i /></div>
              <h3>Pickup or delivery</h3>
              <p>Choose local pickup when available or have it shipped to your door.</p>
            </article>
          </div>
        </section>

        <section className="local-section">
          <div className="local-map" aria-hidden="true">
            <span className="map-ring ring-one" />
            <span className="map-ring ring-two" />
            <span className="map-pin pin-sf"><i />SF</span>
            <span className="map-pin pin-oak"><i />OAK</span>
            <span className="map-pin pin-sj"><i />SJ</span>
            <span className="map-route route-one" />
            <span className="map-route route-two" />
            <strong>THE<br />BAY</strong>
          </div>
          <div className="local-copy">
            <p className="eyebrow"><span /> BUILT NEARBY</p>
            <h2>Less factory.<br /><em>More neighbor.</em></h2>
            <p>
              BayLayer Labs is growing from one local print queue. That means
              honest lead times, fewer miles, and a maker you can actually reach.
            </p>
            <div className="local-points">
              <span><b>Local</b> Bay Area production</span>
              <span><b>Small batch</b> No warehouse waste</span>
              <span><b>Direct</b> Talk to the person making it</span>
            </div>
          </div>
        </section>

        <section className="scan-section" id="ai-scan">
          <div className="scan-visual" aria-hidden="true">
            <div className="phone-frame">
              <div className="phone-top" />
              <div className="scan-grid" />
              <div className="scan-object"><i /><b /><em /></div>
              <span className="scan-corner c1" />
              <span className="scan-corner c2" />
              <span className="scan-corner c3" />
              <span className="scan-corner c4" />
              <span className="scan-line" />
              <small>CAPTURE 18 / 40</small>
            </div>
            <span className="scan-orbit" />
          </div>
          <div className="scan-copy">
            <span className="coming-pill">COMING SOON · EARLY ACCESS</span>
            <p className="eyebrow light"><span /> AI OBJECT SCAN</p>
            <h2>See it. Scan it.<br /><em>Make it yours.</em></h2>
            <p>
              We’re exploring a guided camera experience that turns a set of
              object photos into a print-ready starting point—then checks the
              result with a human before quoting.
            </p>
            {waitlistJoined ? (
              <div className="waitlist-success" role="status">
                <span>✓</span>
                <div><strong>You’re on the preview list.</strong><br />We’ll share updates before public launch.</div>
              </div>
            ) : (
              <form
                className="waitlist-form"
                onSubmit={joinWaitlist}
              >
                <label className="sr-only" htmlFor="waitlist-email">Email address</label>
                <input
                  id="waitlist-email"
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={(event) => setWaitlistEmail(event.target.value)}
                  placeholder="you@example.com"
                />
                <button type="submit" disabled={waitlistPending}>
                  {waitlistPending ? "Joining…" : "Join early access"} <span>→</span>
                </button>
                <label className="consent-control">
                  <input
                    type="checkbox"
                    required
                    checked={waitlistConsent}
                    onChange={(event) => setWaitlistConsent(event.target.checked)}
                  />
                  <span>I agree to receive AI Scan preview updates and accept the <a href="/privacy">privacy notice</a>.</span>
                </label>
              </form>
            )}
            {waitlistError ? <p className="form-error" role="alert">{waitlistError}</p> : null}
            <p className="form-note">No spam. Just product updates and an invitation when it’s ready.</p>
          </div>
        </section>

        <section className="cta-section">
          <p className="eyebrow"><span /> HAVE SOMETHING IN MIND?</p>
          <h2>Let’s make the idea<br /><em>you keep thinking about.</em></h2>
          <div>
            <a className="button button-dark" href="#shop">Start with the shop <span>↗</span></a>
            <a className="button button-outline" href="#custom-print">Bring your own file <span>→</span></a>
          </div>
        </section>
      </div>

      <footer>
        <div className="footer-brand">
          <a className="brand inverse" href="#top" aria-label="BayLayer Labs home">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <span>BayLayer <b>Labs</b></span>
          </a>
          <p>Useful objects, made close to home.</p>
          <span>Bay Area, California</span>
        </div>
        <div className="footer-links">
          <div><strong>Explore</strong><a href="#shop">Shop</a><a href="#custom-print">Custom print</a><a href="#ai-scan">AI Scan</a></div>
          <div><strong>Help</strong><a href="#how-it-works">How it works</a><a href="mailto:baylayerlabs@gmail.com">Contact</a><a href="/print-policy">Print policy</a></div>
          <div><strong>Launch</strong><a href="#ai-scan">AI Scan preview</a><a href="mailto:baylayerlabs@gmail.com?subject=BayLayer%20Labs%20partnership">Partner with us</a><a href="mailto:baylayerlabs@gmail.com?subject=BayLayer%20Labs%20updates">Email updates</a></div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 BayLayer Labs</span>
          <span><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/print-policy">Print policy</a></span>
          <span>Ideas, made local.</span>
        </div>
      </footer>

      {cartOpen && (
        <div className="drawer-layer">
          <button
            className="drawer-backdrop"
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
          />
          <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <div className="cart-header">
              <div><p>Your cart</p><h2 id="cart-title">Ready to make.</h2></div>
              <button ref={cartCloseRef} type="button" onClick={() => setCartOpen(false)} aria-label="Close cart">×</button>
            </div>
            {cart.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-object" aria-hidden="true"><i /><i /><i /></div>
                <h3>Your cart is still two-dimensional.</h3>
                <p>Add something from the first drop and we’ll take it from there.</p>
                <button type="button" className="button button-dark" onClick={() => setCartOpen(false)}>Explore the shop</button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <ProductArt product={item} />
                      <div>
                        <p>{item.category}</p>
                        <h3>{item.name}</h3>
                        <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
                          <button type="button" onClick={() => updateQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}>−</button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}>+</button>
                        </div>
                      </div>
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                  <p>Shipping, tax, and personalization confirmed at checkout.</p>
                  <button className="button button-dark" type="button" disabled>
                    Checkout connection coming next
                  </button>
                  <button className="continue-shopping" type="button" onClick={() => setCartOpen(false)}>Continue shopping</button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
