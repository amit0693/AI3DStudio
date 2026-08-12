import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    productType: text("product_type").notNull().default("made_to_order"),
    basePriceCents: integer("base_price_cents").notNull(),
    compareAtPriceCents: integer("compare_at_price_cents"),
    currency: text("currency").notNull().default("USD"),
    material: text("material").notNull().default("PLA"),
    imageUrl: text("image_url"),
    galleryJson: text("gallery_json").notNull().default("[]"),
    personalizationSchemaJson: text("personalization_schema_json")
      .notNull()
      .default("[]"),
    attributesJson: text("attributes_json").notNull().default("{}"),
    leadTimeMinDays: integer("lead_time_min_days").notNull().default(2),
    leadTimeMaxDays: integer("lead_time_max_days").notNull().default(5),
    minimumQuantity: integer("minimum_quantity").notNull().default(1),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    isFeatured: integer("is_featured", { mode: "boolean" })
      .notNull()
      .default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("idx_products_slug_unique").on(table.slug),
    uniqueIndex("idx_products_sku_unique").on(table.sku),
    index("idx_products_active_category_sort").on(
      table.isActive,
      table.category,
      table.sortOrder,
    ),
    index("idx_products_active_featured_sort").on(
      table.isActive,
      table.isFeatured,
      table.sortOrder,
    ),
    check("products_base_price_nonnegative", sql`${table.basePriceCents} >= 0`),
    check(
      "products_lead_time_valid",
      sql`${table.leadTimeMinDays} >= 0 AND ${table.leadTimeMaxDays} >= ${table.leadTimeMinDays}`,
    ),
    check(
      "products_minimum_quantity_valid",
      sql`${table.minimumQuantity} BETWEEN 1 AND 100`,
    ),
  ],
);

export const uploads = sqliteTable(
  "uploads",
  {
    id: text("id").primaryKey(),
    objectKey: text("object_key").notNull(),
    accessTokenHash: text("access_token_hash").notNull(),
    originalFilename: text("original_filename").notNull(),
    format: text("format").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    sha256: text("sha256").notNull(),
    status: text("status").notNull().default("received"),
    customerEmail: text("customer_email"),
    clientEstimatesJson: text("client_estimates_json").notNull().default("{}"),
    rejectionReason: text("rejection_reason"),
    expiresAt: text("expires_at"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("idx_uploads_object_key_unique").on(table.objectKey),
    index("idx_uploads_status_created").on(table.status, table.createdAt),
    index("idx_uploads_customer_created").on(
      table.customerEmail,
      table.createdAt,
    ),
    check("uploads_byte_size_positive", sql`${table.byteSize} > 0`),
    check(
      "uploads_format_allowed",
      sql`${table.format} IN ('stl', 'obj', '3mf')`,
    ),
  ],
);

export const personalizationUploads = sqliteTable(
  "personalization_uploads",
  {
    id: text("id").primaryKey(),
    objectKey: text("object_key").notNull(),
    accessTokenHash: text("access_token_hash").notNull(),
    originalFilename: text("original_filename").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    sha256: text("sha256").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_personalization_uploads_object_key_unique").on(table.objectKey),
    index("idx_personalization_uploads_expires").on(table.expiresAt),
    check("personalization_uploads_byte_size_positive", sql`${table.byteSize} > 0`),
  ],
);

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    orderNumber: text("order_number").notNull(),
    publicToken: text("public_token").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone"),
    status: text("status").notNull().default("awaiting_payment"),
    paymentStatus: text("payment_status").notNull().default("unpaid"),
    paymentProvider: text("payment_provider"),
    paymentReference: text("payment_reference"),
    fulfillmentMethod: text("fulfillment_method").notNull(),
    shippingAddressJson: text("shipping_address_json"),
    customerNotes: text("customer_notes"),
    currency: text("currency").notNull().default("USD"),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    discountCents: integer("discount_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("idx_orders_order_number_unique").on(table.orderNumber),
    uniqueIndex("idx_orders_public_token_unique").on(table.publicToken),
    uniqueIndex("idx_orders_idempotency_key_unique").on(table.idempotencyKey),
    index("idx_orders_customer_created").on(
      table.customerEmail,
      table.createdAt,
    ),
    index("idx_orders_status_created").on(table.status, table.createdAt),
    check(
      "orders_fulfillment_allowed",
      sql`${table.fulfillmentMethod} IN ('pickup', 'shipping')`,
    ),
    check(
      "orders_amounts_nonnegative",
      sql`${table.subtotalCents} >= 0 AND ${table.shippingCents} >= 0 AND ${table.taxCents} >= 0 AND ${table.discountCents} >= 0 AND ${table.totalCents} >= 0`,
    ),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    uploadId: text("upload_id").references(() => uploads.id, {
      onDelete: "set null",
    }),
    skuSnapshot: text("sku_snapshot").notNull(),
    nameSnapshot: text("name_snapshot").notNull(),
    quantity: integer("quantity").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
    personalizationJson: text("personalization_json").notNull().default("{}"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_order_items_order_id").on(table.orderId),
    index("idx_order_items_product_id").on(table.productId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    check(
      "order_items_amounts_nonnegative",
      sql`${table.unitPriceCents} >= 0 AND ${table.lineTotalCents} >= 0`,
    ),
  ],
);

export const quotes = sqliteTable(
  "quotes",
  {
    id: text("id").primaryKey(),
    uploadId: text("upload_id")
      .notNull()
      .references(() => uploads.id, { onDelete: "cascade" }),
    orderId: text("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("pending_review"),
    material: text("material").notNull().default("PLA"),
    color: text("color"),
    quality: text("quality").notNull().default("standard"),
    infillPercent: integer("infill_percent").notNull().default(20),
    quantity: integer("quantity").notNull().default(1),
    estimatedMassGrams: real("estimated_mass_grams"),
    estimatedPrintMinutes: integer("estimated_print_minutes"),
    quotedPriceCents: integer("quoted_price_cents"),
    currency: text("currency").notNull().default("USD"),
    pricingBreakdownJson: text("pricing_breakdown_json"),
    expiresAt: text("expires_at"),
    ...timestamps,
  },
  (table) => [
    index("idx_quotes_upload_created").on(table.uploadId, table.createdAt),
    index("idx_quotes_status_created").on(table.status, table.createdAt),
    check(
      "quotes_request_values_valid",
      sql`${table.infillPercent} BETWEEN 0 AND 100 AND ${table.quantity} BETWEEN 1 AND 100`,
    ),
    check(
      "quotes_price_nonnegative",
      sql`${table.quotedPriceCents} IS NULL OR ${table.quotedPriceCents} >= 0`,
    ),
  ],
);

export const orderStatusHistory = sqliteTable(
  "order_status_history",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    note: text("note"),
    actor: text("actor").notNull().default("system"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_order_status_history_order_created").on(
      table.orderId,
      table.createdAt,
    ),
  ],
);

export const paymentEvents = sqliteTable(
  "payment_events",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("stripe"),
    eventType: text("event_type").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_payment_events_order_created").on(table.orderId, table.createdAt),
  ],
);

export const waitlistEntries = sqliteTable(
  "waitlist_entries",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    feature: text("feature").notNull().default("ai-scan"),
    city: text("city"),
    phoneType: text("phone_type"),
    intendedObject: text("intended_object"),
    marketingConsent: integer("marketing_consent", { mode: "boolean" })
      .notNull()
      .default(false),
    source: text("source").notNull().default("website"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_waitlist_email_feature_unique").on(
      table.email,
      table.feature,
    ),
    index("idx_waitlist_feature_created").on(table.feature, table.createdAt),
  ],
);
