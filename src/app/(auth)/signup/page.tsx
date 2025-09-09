import SignupForm from "./SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const initialEmail = typeof sp.email === "string" ? sp.email : "";
  const reason = typeof sp.reason === "string" ? sp.reason : null;

  return <SignupForm initialEmail={initialEmail} reason={reason} />;
}
