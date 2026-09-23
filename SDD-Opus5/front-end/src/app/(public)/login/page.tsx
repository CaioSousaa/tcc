import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar · Kanbo" };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  return (
    <AuthShell title="Entrar na sua conta" subtitle="Acesse seus quadros com sessão persistente entre visitas.">
      <LoginForm redirect={single(params.redirect)} expired={single(params.expired) === "1"} />
    </AuthShell>
  );
}
