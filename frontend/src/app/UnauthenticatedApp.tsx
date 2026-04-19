import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/context/AuthContext";

export function UnauthenticatedApp() {
  const { loading } = useAuth();

  return (
    <>
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-[9999]">
          <div className="h-[3px] bg-gradient-to-r from-[var(--purple)] via-blue-400 to-[var(--purple)] animate-pulse w-full" />
        </div>
      )}
      <LoginForm />
    </>
  );
}
