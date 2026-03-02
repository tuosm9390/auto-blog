import { handleSignIn, handleSignOut } from "@/app/[locale]/actions/authActions";

export function SignIn({
  provider,
  ...props
}: { provider?: string } & React.ComponentPropsWithRef<"button">) {
  // 인자를 미리 바인딩하여 직렬화 가능한 서버 액션 형태로 전달
  const signInWithProvider = handleSignIn.bind(null, provider);

  return (
    <form action={signInWithProvider}>
      <button
        {...props}
        className="px-4 py-1.5 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors text-sm cursor-pointer"
      >
        Sign In
      </button>
    </form>
  );
}

export function SignOut({ label = "Sign Out", ...props }: { label?: string } & React.ComponentPropsWithRef<"button">) {
  return (
    <form action={handleSignOut}>
      <button
        {...props}
        className="text-xs text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
      >
        {label}
      </button>
    </form>
  );
}
