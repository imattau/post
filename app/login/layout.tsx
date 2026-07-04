import LoginLayout from "@/components/LoginLayout";

export default function LoginRootLayout({ children }: { children: React.ReactNode }) {
  return <LoginLayout>{children}</LoginLayout>;
}
