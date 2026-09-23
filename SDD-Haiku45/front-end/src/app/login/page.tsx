import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <LoginForm />
      </div>
      <div className="flex-1 bg-blue-950 text-white flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Quadros, listas e cards em um fluxo só</h2>
          <p className="text-lg opacity-90">Checklists, prazos, etiquetas e comentários no mesmo lugar.</p>
        </div>
      </div>
    </div>
  );
}
