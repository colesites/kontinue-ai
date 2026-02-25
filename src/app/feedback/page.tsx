import { redirect } from "next/navigation";

type FeedbackAliasPageProps = {
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function FeedbackAliasPage({
  searchParams,
}: FeedbackAliasPageProps) {
  const params = await searchParams;
  const returnTo = params.returnTo;

  if (
    typeof returnTo === "string" &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//")
  ) {
    redirect(`/feeback?returnTo=${encodeURIComponent(returnTo)}`);
  }

  redirect("/feeback");
}
