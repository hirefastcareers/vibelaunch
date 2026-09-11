/**
 * Shared prose-style guidance for user-facing LLM content generation.
 *
 * Apply via `withDirectProseInstruction` on system (preferred) or user prompts.
 * Do NOT apply to structured classifiers (e.g. Phase 5 sentiment JSON).
 */

export const ANTI_MANNERED_PROSE_INSTRUCTION = `Mannered prose substitutes metaphor and flourish for direct statement. Instead of 'a parameter worth varying,' the mannered writer produces 'a dial worth turning.' Instead of 'this point still matters,' they write 'this point earns its keep.' The phrases exist to display the writer, not to convey the idea, and readers can tell. That is why mannered prose irritates: it makes the reader work harder so the writer can perform. It is also imprecise. Metaphors drag in connotations the writer did not choose and cannot control. The fix is to say what you mean. When a literal phrase is available, use it.`;

/** Append the anti-mannered-prose instruction to a system or user prompt. */
export function withDirectProseInstruction(prompt: string): string {
  const base = prompt.trimEnd();
  if (base.includes(ANTI_MANNERED_PROSE_INSTRUCTION)) {
    return base;
  }
  return `${base}\n\n${ANTI_MANNERED_PROSE_INSTRUCTION}`;
}
