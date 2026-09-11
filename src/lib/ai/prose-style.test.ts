import { describe, expect, it } from "vitest";
import {
  ANTI_MANNERED_PROSE_INSTRUCTION,
  withDirectProseInstruction,
} from "./prose-style";

describe("withDirectProseInstruction", () => {
  it("appends the anti-mannered-prose instruction once", () => {
    const result = withDirectProseInstruction("You write content briefs.");
    expect(result).toContain("You write content briefs.");
    expect(result).toContain(ANTI_MANNERED_PROSE_INSTRUCTION);
    expect(result).toContain("say what you mean");
  });

  it("is idempotent when the instruction is already present", () => {
    const once = withDirectProseInstruction("System rules.");
    const twice = withDirectProseInstruction(once);
    expect(twice).toBe(once);
  });
});
