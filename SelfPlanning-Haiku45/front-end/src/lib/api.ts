import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem("token", data.token);
          api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export async function register(email: string, nome: string, senha: string) {
  return api.post("/auth/register", { email, nome, senha });
}

export async function login(email: string, senha: string) {
  return api.post("/auth/login", { email, senha });
}

export async function getMe() {
  return api.get("/auth/me");
}

export async function logout() {
  return api.post("/auth/logout");
}

export async function getBoards() {
  return api.get("/boards");
}

export async function getBoardById(id: string) {
  return api.get(`/boards/${id}`);
}

export async function createBoard(titulo: string, descricao?: string, corFundo?: string) {
  return api.post("/boards", { titulo, descricao, corFundo });
}

export async function updateBoard(
  id: string,
  titulo?: string,
  descricao?: string,
  corFundo?: string
) {
  return api.patch(`/boards/${id}`, { titulo, descricao, corFundo });
}

export async function deleteBoard(id: string) {
  return api.delete(`/boards/${id}`);
}

export async function getLists(boardId: string) {
  return api.get(`/boards/${boardId}/lists`);
}

export async function createList(boardId: string, titulo: string) {
  return api.post(`/boards/${boardId}/lists`, { titulo });
}

export async function updateList(boardId: string, listId: string, titulo: string) {
  return api.patch(`/boards/${boardId}/lists/${listId}`, { titulo });
}

export async function reorderList(boardId: string, listId: string, novaOrdem: number) {
  return api.patch(`/boards/${boardId}/lists/${listId}/reorder`, { novaOrdem });
}

export async function deleteList(boardId: string, listId: string) {
  return api.delete(`/boards/${boardId}/lists/${listId}`);
}

export async function getCards(boardId: string, listId: string) {
  return api.get(`/boards/${boardId}/lists/${listId}/cards`);
}

export async function getCardById(boardId: string, listId: string, cardId: string) {
  return api.get(`/boards/${boardId}/lists/${listId}/cards/${cardId}`);
}

export async function createCard(boardId: string, listId: string, titulo: string, descricao?: string) {
  return api.post(`/boards/${boardId}/lists/${listId}/cards`, { titulo, descricao });
}

export async function updateCard(
  boardId: string,
  listId: string,
  cardId: string,
  titulo?: string,
  descricao?: string,
  dataPrazo?: string
) {
  return api.patch(`/boards/${boardId}/lists/${listId}/cards/${cardId}`, { titulo, descricao, dataPrazo });
}

export async function moveCard(
  boardId: string,
  listId: string,
  cardId: string,
  novaListaId: string,
  novaOrdem?: number
) {
  return api.patch(`/boards/${boardId}/lists/${listId}/cards/${cardId}/move`, {
    novaListaId,
    novaOrdem,
  });
}

export async function deleteCard(boardId: string, listId: string, cardId: string) {
  return api.delete(`/boards/${boardId}/lists/${listId}/cards/${cardId}`);
}

export async function getChecklistItems(
  boardId: string,
  listId: string,
  cardId: string
) {
  return api.get(`/boards/${boardId}/lists/${listId}/cards/${cardId}/checklist-items`);
}

export async function createChecklistItem(
  boardId: string,
  listId: string,
  cardId: string,
  titulo: string
) {
  return api.post(`/boards/${boardId}/lists/${listId}/cards/${cardId}/checklist-items`, {
    titulo,
  });
}

export async function updateChecklistItem(
  boardId: string,
  listId: string,
  cardId: string,
  itemId: string,
  concluido?: boolean,
  titulo?: string
) {
  return api.patch(
    `/boards/${boardId}/lists/${listId}/cards/${cardId}/checklist-items/${itemId}`,
    { concluido, titulo }
  );
}

export async function deleteChecklistItem(
  boardId: string,
  listId: string,
  cardId: string,
  itemId: string
) {
  return api.delete(
    `/boards/${boardId}/lists/${listId}/cards/${cardId}/checklist-items/${itemId}`
  );
}

export async function getLabels(boardId: string) {
  return api.get(`/boards/${boardId}/labels`);
}

export async function createLabel(boardId: string, nome: string, cor: string) {
  return api.post(`/boards/${boardId}/labels`, { nome, cor });
}

export async function updateLabel(boardId: string, labelId: string, nome?: string, cor?: string) {
  return api.patch(`/boards/${boardId}/labels/${labelId}`, { nome, cor });
}

export async function deleteLabel(boardId: string, labelId: string) {
  return api.delete(`/boards/${boardId}/labels/${labelId}`);
}

export async function getBoardMembers(boardId: string) {
  return api.get(`/boards/${boardId}/members`);
}

export async function inviteBoardMember(boardId: string, email: string, role: string) {
  return api.post(`/boards/${boardId}/members`, { email, role });
}

export async function updateBoardMember(boardId: string, memberId: string, role: string) {
  return api.patch(`/boards/${boardId}/members/${memberId}`, { role });
}

export async function removeBoardMember(boardId: string, memberId: string) {
  return api.delete(`/boards/${boardId}/members/${memberId}`);
}

export async function getCardLabels(boardId: string, listId: string, cardId: string) {
  return api.get(`/boards/${boardId}/lists/${listId}/cards/${cardId}/labels`);
}

export async function addCardLabel(boardId: string, listId: string, cardId: string, labelId: string) {
  return api.post(`/boards/${boardId}/lists/${listId}/cards/${cardId}/labels`, { labelId });
}

export async function removeCardLabel(boardId: string, listId: string, cardId: string, labelId: string) {
  return api.delete(`/boards/${boardId}/lists/${listId}/cards/${cardId}/labels/${labelId}`);
}

export async function getCardsWithLabelFilter(boardId: string, listId: string, labelIds?: string[]) {
  const params = labelIds && labelIds.length > 0 ? { labels: labelIds.join(",") } : {};
  return api.get(`/boards/${boardId}/lists/${listId}/cards`, { params });
}

export async function getComments(boardId: string, listId: string, cardId: string) {
  return api.get(`/boards/${boardId}/lists/${listId}/cards/${cardId}/comments`);
}

export async function createComment(boardId: string, listId: string, cardId: string, texto: string) {
  return api.post(`/boards/${boardId}/lists/${listId}/cards/${cardId}/comments`, { texto });
}

export async function updateComment(
  boardId: string,
  listId: string,
  cardId: string,
  commentId: string,
  texto: string
) {
  return api.patch(`/boards/${boardId}/lists/${listId}/cards/${cardId}/comments/${commentId}`, { texto });
}

export async function deleteComment(boardId: string, listId: string, cardId: string, commentId: string) {
  return api.delete(`/boards/${boardId}/lists/${listId}/cards/${cardId}/comments/${commentId}`);
}

export async function getCardsAtrasados(boardId: string) {
  return api.get(`/boards/${boardId}/cards-atrasados`);
}
