import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(500).optional(),
  tagline: z.string().max(200).optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(["DRAFT", "ACTIVE", "LAUNCHED", "ARCHIVED"]).optional(),
});

export const createPostSchema = z.object({
  content: z.string().min(1).max(280),
  mediaUrls: z.array(z.string().url()).max(4).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const updatePostSchema = createPostSchema.partial();

export const seoPublishSchema = z.object({
  projectId: z.string().cuid(),
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(500),
  body: z.string().min(1),
  keywords: z.array(z.string()).max(20).optional(),
});

export const generateContentSchema = z.object({
  projectId: z.string().cuid(),
  topic: z.string().min(1).max(200),
  tone: z.enum(["professional", "casual", "hype", "technical"]).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type SeoPublishInput = z.infer<typeof seoPublishSchema>;
export type GenerateContentInput = z.infer<typeof generateContentSchema>;
