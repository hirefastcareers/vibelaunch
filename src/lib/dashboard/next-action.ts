export type NextAction = {
  title: string;
  description: string;
  href: string;
  cta: string;
};

export type NextActionInput = {
  projectCount: number;
  draftCount: number;
  publishedCount: number;
  articleCount: number;
};

export function displayHandle(user: {
  name: string | null;
  xUsername: string | null;
}): string | null {
  if (user.xUsername) return `@${user.xUsername}`;
  if (user.name) return user.name;
  return null;
}

export function getNextAction(input: NextActionInput): NextAction {
  if (input.projectCount === 0) {
    return {
      title: "Create your first project",
      description: "Add a product URL and tone so Xoopa can track citations and draft citeable posts.",
      href: "/onboard",
      cta: "Set up a project",
    };
  }

  if (input.draftCount > 0) {
    const n = input.draftCount;
    return {
      title: n === 1 ? "1 draft is waiting" : `${n} drafts are waiting`,
      description: "Review pending posts and publish to X when you are ready.",
      href: "/dashboard/queue",
      cta: "Open posts",
    };
  }

  if (input.publishedCount === 0) {
    return {
      title: "Ship your first update",
      description:
        "Paste what you shipped. Xoopa drafts the X post, publishes the article, captures a screenshot, and checks AI citations.",
      href: "/dashboard?ship=true",
      cta: "Ship update",
    };
  }

  if (input.articleCount === 0) {
    return {
      title: "Ship a changelog article",
      description:
        "Turn a product update into a public page that search and AI engines can cite.",
      href: "/dashboard?ship=true",
      cta: "Ship update",
    };
  }

  return {
    title: "Keep the loop going",
    description:
      "Ship another update, or check whether AI search is citing you.",
    href: "/dashboard?ship=true",
    cta: "Ship update",
  };
}
