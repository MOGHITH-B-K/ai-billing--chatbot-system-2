import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';



// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Admin authentication tables
export const adminUsers = sqliteTable('admin_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => adminUsers.id),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});

// Shop billing system tables
export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  address: text('address'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  rate: real('rate').notNull(),
  category: text('category'),
  productType: text('product_type').notNull(),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  minStockLevel: integer('min_stock_level').notNull().default(5),
  totalSales: integer('total_sales').notNull().default(0),
  totalRentals: integer('total_rentals').notNull().default(0),
  lastRestocked: text('last_restocked'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const salesBills = sqliteTable('sales_bills', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serialNo: integer('serial_no').notNull(),
  billDate: text('bill_date').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerAddress: text('customer_address'),
  items: text('items', { mode: 'json' }).notNull(),
  subtotal: real('subtotal').notNull(),
  taxPercentage: real('tax_percentage').notNull().default(0),
  taxAmount: real('tax_amount').notNull(),
  taxType: text('tax_type'),
  advanceAmount: real('advance_amount').notNull(),
  totalAmount: real('total_amount').notNull(),
  isPaid: integer('is_paid', { mode: 'boolean' }).notNull(),
  customerFeedback: text('customer_feedback'),
  shopName: text('shop_name'),
  shopAddress: text('shop_address'),
  shopPhone1: text('shop_phone_1'),
  shopPhone2: text('shop_phone_2'),
  shopLogoUrl: text('shop_logo_url'),
  shopQrUrl: text('shop_qr_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const rentalBills = sqliteTable('rental_bills', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serialNo: integer('serial_no').notNull(),
  fromDate: text('from_date').notNull(),
  toDate: text('to_date'),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerAddress: text('customer_address'),
  items: text('items', { mode: 'json' }).notNull(),
  subtotal: real('subtotal').notNull(),
  transportFees: real('transport_fees').notNull(),
  taxPercentage: real('tax_percentage').notNull().default(0),
  taxAmount: real('tax_amount').notNull(),
  taxType: text('tax_type'),
  advanceAmount: real('advance_amount').notNull(),
  totalAmount: real('total_amount').notNull(),
  isPaid: integer('is_paid', { mode: 'boolean' }).notNull(),
  customerFeedback: text('customer_feedback'),
  shopName: text('shop_name'),
  shopAddress: text('shop_address'),
  shopPhone1: text('shop_phone_1'),
  shopPhone2: text('shop_phone_2'),
  shopLogoUrl: text('shop_logo_url'),
  shopQrUrl: text('shop_qr_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const calendarBookings = sqliteTable('calendar_bookings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bookingDate: text('booking_date').notNull(),
  billType: text('bill_type').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

export const shopSettings = sqliteTable('shop_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  shopName: text('shop_name').notNull(),
  shopAddress: text('shop_address'),
  phoneNumber1: text('phone_number_1'),
  phoneNumber2: text('phone_number_2'),
  logoUrl: text('logo_url'),
  paymentQrUrl: text('payment_qr_url'),
  language: text('language').notNull().default('english'),
  theme: text('theme').notNull().default('light'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const stockHistory = sqliteTable('stock_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id),
  changeType: text('change_type').notNull(),
  quantityChange: integer('quantity_change').notNull(),
  previousQuantity: integer('previous_quantity').notNull(),
  newQuantity: integer('new_quantity').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});