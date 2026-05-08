import { z } from "zod";

export const RoleSchema = z.enum(["system", "user", "assistant", "tool"]);
export type Role = z.infer<typeof RoleSchema>;

export const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  args: z.record(z.unknown()),
  status: z.enum(["pending", "running", "ok", "error"]).default("pending"),
  result: z.unknown().optional(),
  error: z.string().optional(),
  startedAt: z.number().optional(),
  endedAt: z.number().optional(),
});
export type ToolCall = z.infer<typeof ToolCallSchema>;

export const AttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(["file", "image", "audio", "url"]),
  mime: z.string().optional(),
  size: z.number().optional(),
  path: z.string().optional(),
  url: z.string().optional(),
  textPreview: z.string().optional(),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  role: RoleSchema,
  content: z.string(),
  toolCalls: z.array(ToolCallSchema).default([]),
  attachments: z.array(AttachmentSchema).default([]),
  createdAt: z.number(),
  provider: z.string().optional(),
  model: z.string().optional(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(""),
  systemPrompt: z.string().default(""),
  workspacePath: z.string(),
  memory: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  mcpServers: z.array(z.string()).default([]),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const SessionSchema = z.object({
  id: z.string(),
  projectId: z.string().nullable(),
  title: z.string().default("New chat"),
  messages: z.array(MessageSchema).default([]),
  pinnedModel: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Session = z.infer<typeof SessionSchema>;

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  trigger: z.string().default(""),
  systemPrompt: z.string(),
  toolWhitelist: z.array(z.string()).default([]),
  createdAt: z.number(),
});
export type Skill = z.infer<typeof SkillSchema>;

export const ScheduledTaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  cron: z.string(),
  prompt: z.string(),
  projectId: z.string().nullable(),
  enabled: z.boolean().default(true),
  lastRun: z.number().nullable().default(null),
  nextRun: z.number().nullable().default(null),
  createdAt: z.number(),
});
export type ScheduledTask = z.infer<typeof ScheduledTaskSchema>;

export const ArtifactSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  kind: z.enum(["code", "html", "markdown", "image", "json", "csv"]),
  language: z.string().optional(),
  title: z.string(),
  content: z.string(),
  createdAt: z.number(),
});
export type Artifact = z.infer<typeof ArtifactSchema>;
