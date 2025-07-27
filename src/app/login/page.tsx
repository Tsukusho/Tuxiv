import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div className="mt-16">
      <AuthForm isRegister={false} />
    </div>
  );
}