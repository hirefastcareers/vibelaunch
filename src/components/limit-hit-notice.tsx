import Link from "next/link";

export function LimitHitNotice({
  code,
  fallback,
}: {
  code?: string;
  fallback: string;
}) {
  const isProject = code === "PROJECT_LIMIT";
  const isPost = code === "POST_LIMIT";

  if (!isProject && !isPost) {
    return <>{fallback}</>;
  }

  if (isProject) {
    return (
      <>
        You have reached your plan&apos;s project limit.{" "}
        <Link
          href="/dashboard/projects"
          className="text-primary underline underline-offset-2 hover:text-accent"
        >
          Delete a project
        </Link>{" "}
        or{" "}
        <Link
          href="/dashboard/billing"
          className="text-primary underline underline-offset-2 hover:text-accent"
        >
          upgrade
        </Link>{" "}
        to add more.
      </>
    );
  }

  return (
    <>
      You have reached this month&apos;s post limit.{" "}
      <Link
        href="/dashboard/billing"
        className="text-primary underline underline-offset-2 hover:text-accent"
      >
        Upgrade
      </Link>{" "}
      to add more.
    </>
  );
}
