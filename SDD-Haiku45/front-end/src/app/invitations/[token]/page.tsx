"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface InvitationDetails {
  id: string;
  board_name: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}

export default function InvitationPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/invitations/${token}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        setInvitation(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Falha ao carregar convite"
        );
        setInvitation(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      // Redirect to board
      const data = await response.json();
      router.push(`/boards/${data.board_id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao aceitar convite"
      );
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;

    setRejecting(true);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${token}/reject`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      // Redirect to dashboard
      router.push("/boards");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao rejeitar convite"
      );
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-6 rounded-lg border border-gray-200 shadow">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Convite inválido
          </h1>
          <p className="text-gray-600 mb-4">
            {error || "Este convite não é válido ou expirou."}
          </p>
          <a
            href="/boards"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Voltar aos quadros
          </a>
        </div>
      </div>
    );
  }

  const expiresDate = new Date(invitation.expires_at);
  const isExpired = expiresDate < new Date();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg border border-gray-200 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Você foi convidado!
        </h1>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="mb-3">
            <p className="text-xs text-gray-500">Quadro</p>
            <p className="text-lg font-semibold text-gray-900">
              {invitation.board_name}
            </p>
          </div>

          <div className="mb-3">
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-gray-700">{invitation.email}</p>
          </div>

          <div className="mb-3">
            <p className="text-xs text-gray-500">Papel</p>
            <p className="text-gray-700 capitalize">
              {invitation.role === "admin"
                ? "Administrador"
                : invitation.role === "editor"
                ? "Editor"
                : "Visualizador"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Expira em</p>
            <p className={isExpired ? "text-red-600" : "text-gray-700"}>
              {expiresDate.toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        {isExpired && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            Este convite expirou.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleReject}
            disabled={isExpired || rejecting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {rejecting ? "Rejeitando..." : "Rejeitar"}
          </button>
          <button
            onClick={handleAccept}
            disabled={isExpired || accepting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {accepting ? "Aceitando..." : "Aceitar"}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Você precisa estar logado para aceitar o convite.
        </p>
      </div>
    </div>
  );
}
