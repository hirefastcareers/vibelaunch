import { Client } from "@upstash/qstash";

let qstashClient: Client | null = null;

function getQStashClient(): Client {
  if (!qstashClient) {
    const token = process.env.QSTASH_TOKEN;
    if (!token) {
      throw new Error("QSTASH_TOKEN is not configured");
    }
    qstashClient = new Client({ token });
  }
  return qstashClient;
}

export interface QueuePostPayload {
  postId: string;
  projectId: string;
  userId: string;
}

/**
 * Enqueue a post for publishing via QStash.
 */
export async function enqueuePost(
  payload: QueuePostPayload,
  options?: { delay?: number; notBefore?: Date }
): Promise<string> {
  const client = getQStashClient();
  const callbackUrl =
    process.env.QSTASH_CALLBACK_URL ?? `${process.env.APP_URL}/api/queue/process`;

  const result = await client.publishJSON({
    url: callbackUrl,
    body: payload,
    delay: options?.delay,
    notBefore: options?.notBefore ? Math.floor(options.notBefore.getTime() / 1000) : undefined,
    retries: 3,
  });

  return result.messageId;
}

/**
 * Verify QStash webhook signature.
 */
export async function verifyQStashSignature(
  signature: string,
  body: string
): Promise<boolean> {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (!currentKey) return false;

  try {
    const { Receiver } = await import("@upstash/qstash");
    const receiver = new Receiver({
      currentSigningKey: currentKey,
      nextSigningKey: nextKey ?? currentKey,
    });
    await receiver.verify({ signature, body });
    return true;
  } catch {
    return false;
  }
}
