import {
  pgTable,
  serial,
  text,
  date,
  integer,
  timestamp,
  customType,
} from 'drizzle-orm/pg-core'

// pgvector custom type for 768-dim Gemini embeddings
const vector768 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(768)'
  },
  fromDriver(value: string): number[] {
    return value.slice(1, -1).split(',').map(Number)
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`
  },
})

export const editions = pgTable('editions', {
  id: serial('id').primaryKey(),
  date: date('date').unique().notNull(),
  editionNumber: integer('edition_number').notNull(),
  targetCountry: text('target_country').default('South Africa').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const articles = pgTable('articles', {
  id: serial('id').primaryKey(),
  editionDate: date('edition_date').notNull().references(() => editions.date),
  slug: text('slug').unique().notNull(),
  headline: text('headline').notNull(),
  summary: text('summary').notNull(),
  category: text('category').notNull(),
  severity: text('severity').notNull(),
  section: text('section').notNull(),
  source: text('source').notNull(),
  sourceUrl: text('source_url'),
  xPostUrl: text('x_post_url'),
  imageUrl: text('image_url'),
  imagePrompt: text('image_prompt'),
  embedding: vector768('embedding'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  editionDate: date('edition_date').notNull().references(() => editions.date),
  title: text('title').notNull(),
  ansp: text('ansp').notNull(),
  location: text('location').notNull(),
  type: text('type').notNull(),
  sourceUrl: text('source_url'),
  primarySourceUrl: text('primary_source_url'),
  posted: date('posted'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const improvementReports = pgTable('improvement_reports', {
  id: serial('id').primaryKey(),
  weekOf: date('week_of').notNull(),
  reportMd: text('report_md').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
