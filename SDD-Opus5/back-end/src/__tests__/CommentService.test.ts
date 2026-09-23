import { beforeEach, describe, expect, it } from "vitest";
import { COMMENTS_MAX } from "../domain/comments";
import { BRUNO, CAIO, JOAO, MARINA, code, sprintBoard } from "./helpers/sprintBoard";

/** Scenario of RF09 section 3 on top of the RF07 "Sprint" board. */
async function commentBoard() {
  const s = await sprintBoard();
  const docs = s.store.addCard(s.aFazer, "Escrever docs");
  const marina = s.store.addComment(s.card, MARINA, "Sugiro manter o filtro por etiqueta na URL.");
  const joao = s.store.addComment(s.card, JOAO, "Concordo. Já ajustei o back.");
  return { ...s, docs, C: { marina, joao } };
}

describe("CommentService (RF09)", () => {
  let s: Awaited<ReturnType<typeof commentBoard>>;

  const history = async (userId = CAIO, cardId = s.card) =>
    (await s.comments.list(userId, s.sprint, cardId)).map((c) => `${c.author.name}:${c.body}${c.edited ? " (editado)" : ""}`);

  const faceCount = async (cardId = s.card) =>
    (await s.boards.get(CAIO, s.sprint)).lists.flatMap((list) => list.cards).find((card) => card.id === cardId)?.commentCount;

  beforeEach(async () => {
    s = await commentBoard();
  });

  describe("display", () => {
    it("returns the history oldest first with author names, also inside the card (CA01)", async () => {
      expect(await history()).toEqual(["Marina Alves:Sugiro manter o filtro por etiqueta na URL.", "João Pereira:Concordo. Já ajustei o back."]);
      const card = await s.cards.get(JOAO, s.sprint, s.card);
      expect(card.comments.map((c) => c.id)).toEqual([s.C.marina, s.C.joao]);
      expect(card.comments[0]).toMatchObject({ author: { userId: MARINA }, edited: false });
      expect(card.comments[0]?.author).not.toHaveProperty("email");
    });

    it("counts comments on the face (CA02, CA03)", async () => {
      expect(await faceCount()).toBe(2);
      expect(await faceCount(s.docs)).toBe(0);
      expect(await history(CAIO, s.docs)).toEqual([]);
    });
  });

  describe("create", () => {
    it("publishes at the end with the session author and updates the count (CA06, RN02)", async () => {
      const { comment, comments } = await s.comments.create(JOAO, s.sprint, s.card, { body: "Pronto para revisão" });
      expect(comment).toMatchObject({ author: { userId: JOAO, name: "João Pereira" }, body: "Pronto para revisão", edited: false });
      expect(comments.map((c) => c.id)).toEqual([s.C.marina, s.C.joao, comment.id]);
      expect(await faceCount()).toBe(3);
    });

    it("lets members comment (CA10)", async () => {
      await expect(s.comments.create(JOAO, s.sprint, s.docs, { body: "Ok" })).resolves.toBeDefined();
    });

    it("returns comments published by others meanwhile, in order (CA30, CB09)", async () => {
      await s.comments.create(MARINA, s.sprint, s.card, { body: "Outra aba" });
      const { comments } = await s.comments.create(CAIO, s.sprint, s.card, { body: "Minha" });
      expect(comments.map((c) => c.body).slice(-2)).toEqual(["Outra aba", "Minha"]);
    });

    it("stops at 500 comments (CA32, RN08)", async () => {
      for (let i = 2; i < COMMENTS_MAX; i += 1) s.store.addComment(s.card, CAIO, `c${i}`);
      expect(await code(s.comments.create(MARINA, s.sprint, s.card, { body: "Extra" }))).toBe("COMMENT_LIMIT_REACHED");
      expect(await faceCount()).toBe(COMMENTS_MAX);
    });

    it("never goes over the limit with simultaneous publications at 499 (CB13, N189)", async () => {
      for (let i = 2; i < COMMENTS_MAX - 1; i += 1) s.store.addComment(s.card, CAIO, `c${i}`);
      const results = await Promise.allSettled([
        s.comments.create(CAIO, s.sprint, s.card, { body: "A" }),
        s.comments.create(MARINA, s.sprint, s.card, { body: "B" }),
      ]);
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      expect(await faceCount()).toBe(COMMENTS_MAX);
    });

    it("does not touch the card (RN11)", async () => {
      const before = await s.cards.get(CAIO, s.sprint, s.card);
      await s.comments.create(CAIO, s.sprint, s.card, { body: "Ok" });
      const after = await s.cards.get(CAIO, s.sprint, s.card);
      expect({ ...after, comments: before.comments }).toEqual(before);
    });
  });

  describe("update", () => {
    it("lets the author edit, keeping position and marking edited (CA14, RN06)", async () => {
      const { comment, comments } = await s.comments.update(JOAO, s.sprint, s.card, s.C.joao, { body: "Concordo. Back ajustado." });
      expect(comment).toMatchObject({ body: "Concordo. Back ajustado.", edited: true });
      expect(comments.map((c) => c.id)).toEqual([s.C.marina, s.C.joao]);
      expect(comment.createdAt).toBe(s.store.commentsOf(s.card)[1]?.createdAt);
    });

    it("does not mark as edited when the text is the same (CA15)", async () => {
      const { comment } = await s.comments.update(JOAO, s.sprint, s.card, s.C.joao, { body: "Concordo. Já ajustei o back." });
      expect(comment.edited).toBe(false);
    });

    it("keeps the edited mark when the text goes back to the original (RN06)", async () => {
      await s.comments.update(JOAO, s.sprint, s.card, s.C.joao, { body: "Outro" });
      const { comment } = await s.comments.update(JOAO, s.sprint, s.card, s.C.joao, { body: "Concordo. Já ajustei o back." });
      expect(comment.edited).toBe(true);
    });

    it("refuses anyone but the author, administrators included (CA17, RN05)", async () => {
      expect(await code(s.comments.update(CAIO, s.sprint, s.card, s.C.joao, { body: "Hack" }))).toBe("FORBIDDEN");
      expect(await code(s.comments.update(JOAO, s.sprint, s.card, s.C.marina, { body: "Hack" }))).toBe("FORBIDDEN");
      expect(await history()).toEqual(["Marina Alves:Sugiro manter o filtro por etiqueta na URL.", "João Pereira:Concordo. Já ajustei o back."]);
    });

    it("lets the last edition win (CB10)", async () => {
      await Promise.all([
        s.comments.update(JOAO, s.sprint, s.card, s.C.joao, { body: "Primeira" }),
        s.comments.update(JOAO, s.sprint, s.card, s.C.joao, { body: "Segunda" }),
      ]);
      expect((await history())[1]).toBe("João Pereira:Segunda (editado)");
    });

    it("answers COMMENT_NOT_FOUND after deletion elsewhere (CA29, CB12)", async () => {
      await s.comments.delete(CAIO, s.sprint, s.card, s.C.joao);
      expect(await code(s.comments.update(JOAO, s.sprint, s.card, s.C.joao, { body: "Tarde" }))).toBe("COMMENT_NOT_FOUND");
    });
  });

  describe("delete", () => {
    it("lets the author delete, updating the count (CA19)", async () => {
      const { comments } = await s.comments.delete(JOAO, s.sprint, s.card, s.C.joao);
      expect(comments.map((c) => c.id)).toEqual([s.C.marina]);
      expect(await faceCount()).toBe(1);
    });

    it("lets an administrator delete someone else's comment (CA21)", async () => {
      await s.comments.delete(CAIO, s.sprint, s.card, s.C.joao);
      expect(await faceCount()).toBe(1);
    });

    it("refuses a member deleting someone else's comment (CA22)", async () => {
      expect(await code(s.comments.delete(JOAO, s.sprint, s.card, s.C.marina))).toBe("FORBIDDEN");
      expect(await faceCount()).toBe(2);
    });

    it("leaves an empty history after the last comment (CA23)", async () => {
      const only = s.store.addComment(s.docs, JOAO, "Único");
      expect((await s.comments.delete(JOAO, s.sprint, s.docs, only)).comments).toEqual([]);
      expect(await faceCount(s.docs)).toBe(0);
    });

    it("answers COMMENT_NOT_FOUND for a second deletion (CB11, A65)", async () => {
      await s.comments.delete(JOAO, s.sprint, s.card, s.C.joao);
      expect(await code(s.comments.delete(JOAO, s.sprint, s.card, s.C.joao))).toBe("COMMENT_NOT_FOUND");
    });

    it("refuses moderation after a demotion (CB14)", async () => {
      await s.members.updateMember(CAIO, s.sprint, MARINA, { role: "member" });
      expect(await code(s.comments.delete(MARINA, s.sprint, s.card, s.C.joao))).toBe("FORBIDDEN");
    });

    it("changes nothing when it fails midway (CE03)", async () => {
      s.commentRepo.failOn = "listComments";
      await expect(s.comments.delete(JOAO, s.sprint, s.card, s.C.joao)).rejects.toThrow();
      s.commentRepo.failOn = null;
      expect(await faceCount()).toBe(2);
    });
  });

  describe("life cycle", () => {
    it("keeps comments when the card moves or its list is deleted moving cards (CA24)", async () => {
      await s.cards.update(CAIO, s.sprint, s.card, { title: "Refatorar filtros", description: null, listId: s.concluido, position: undefined, dueDate: null });
      await s.lists.delete(CAIO, s.sprint, s.concluido, { strategy: "move", targetListId: s.aFazer, expectedCardCount: 1 });
      expect(await history()).toHaveLength(2);
    });

    it("deletes comments with the card and with a list deleted in cascade (CA25, RN09)", async () => {
      await s.cards.delete(CAIO, s.sprint, s.card);
      expect([...s.store.comments.values()].some((row) => row.cardId === s.card)).toBe(false);
      s.store.addComment(s.docs, CAIO, "x");
      await s.lists.delete(CAIO, s.sprint, s.aFazer, { strategy: "cascade", targetListId: undefined, expectedCardCount: 1 });
      expect(s.store.comments.size).toBe(0);
    });

    it("keeps comments of an author removed from the board, deletable by administrators (CA26)", async () => {
      await s.members.removeMember(CAIO, s.sprint, JOAO);
      expect(await history(MARINA)).toContain("João Pereira:Concordo. Já ajustei o back.");
      await s.comments.delete(MARINA, s.sprint, s.card, s.C.joao);
      expect(await faceCount()).toBe(1);
    });
  });

  describe("access and order of checks", () => {
    it("answers BOARD_NOT_FOUND to non participants (CA27)", async () => {
      expect(await code(s.comments.list(BRUNO, s.sprint, s.card))).toBe("BOARD_NOT_FOUND");
      expect(await code(s.comments.create(BRUNO, s.sprint, s.card, { body: "x" }))).toBe("BOARD_NOT_FOUND");
      expect(await code(s.comments.update(BRUNO, s.sprint, s.card, s.C.joao, { body: "x" }))).toBe("BOARD_NOT_FOUND");
      expect(await code(s.comments.delete(BRUNO, s.sprint, s.card, s.C.joao))).toBe("BOARD_NOT_FOUND");
    });

    it("checks board, card, comment, then authorship (F121)", async () => {
      expect(await code(s.comments.delete(BRUNO, s.sprint, "abc", "def"))).toBe("BOARD_NOT_FOUND");
      expect(await code(s.comments.delete(JOAO, s.sprint, "abc", "def"))).toBe("CARD_NOT_FOUND");
      expect(await code(s.comments.delete(JOAO, s.sprint, s.card, "def"))).toBe("COMMENT_NOT_FOUND");
      expect(await code(s.comments.delete(JOAO, s.sprint, s.card, s.C.marina))).toBe("FORBIDDEN");
    });

    it("answers COMMENT_NOT_FOUND for a comment of another card (CA28)", async () => {
      const other = s.store.addComment(s.docs, JOAO, "Em docs");
      expect(await code(s.comments.update(JOAO, s.sprint, s.card, other, { body: "x" }))).toBe("COMMENT_NOT_FOUND");
      expect(await code(s.comments.delete(CAIO, s.sprint, s.card, other))).toBe("COMMENT_NOT_FOUND");
    });

    it("answers CARD_NOT_FOUND for a card of another board (CB07)", async () => {
      const outro = await s.boards.create(BRUNO, { name: "Outro", color: "amber", withDefaultLists: false });
      const foreignCard = s.store.addCard(s.store.addList(outro.id, "L"), "Alheio");
      expect(await code(s.comments.create(CAIO, s.sprint, foreignCard, { body: "x" }))).toBe("CARD_NOT_FOUND");
      expect(await code(s.comments.list(CAIO, s.sprint, foreignCard))).toBe("CARD_NOT_FOUND");
    });
  });
});
