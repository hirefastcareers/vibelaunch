import { generateAdaptiveContent, type GeneratedContent } from "@/lib/generator/adaptive";

export type { GeneratedContent };

export type Tone = "professional" | "casual" | "hype" | "technical";

export interface GenerateOptions {
  projectId: string;
  topic: string;
  tone?: Tone;
}

/**
 * Adaptive dynamic prompt generator - wraps vector-informed content generation.
 */
export async function generatePost(options: GenerateOptions): Promise<GeneratedContent> {
  return generateAdaptiveContent(
    options.projectId,
    options.topic,
    options.tone ?? "casual"
  );
}

export async function generateThread(
  options: GenerateOptions & { parts?: number }
): Promise<string[]> {
  const main = await generatePost(options);
  const parts = options.parts ?? 3;
  const thread: string[] = [main.content];

  for (let i = 2; i <= parts; i++) {
    const part = await generatePost({
      ...options,
      topic: `${options.topic} (part ${i}/${parts})`,
    });
    thread.push(part.content);
  }

  return thread;
}

export { generateAdaptiveContent };
