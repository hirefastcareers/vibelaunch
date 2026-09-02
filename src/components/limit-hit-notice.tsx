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

  const message = isProject
    ? "You've reached your plan's project limit — upgrade to add more"
    : "You've reached this month's post limit — upgrade to add more";

  return (
    <>
      {message}{" "}
      <Link
        href="/dashboard/billing"
        className="text-primary underline underline-offset-2 hover:text-accent"
      >
        View billing
      </Link>
    </>
  );
}
