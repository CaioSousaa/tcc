import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Criar conta · Kanbo" };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const { redirect } = await searchParams;

  return (
    <AuthShell title="Criar conta" subtitle="Leva menos de um minuto. Depois você já cria seu primeiro quadro.">
      <RegisterForm redirect={Array.isArray(redirect) ? redirect[0] : redirect} />
    </AuthShell>
  );
}
