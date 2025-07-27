import AuthForm from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <div className="mt-16">
      <AuthForm isRegister={true} />
    </div>
  );
}