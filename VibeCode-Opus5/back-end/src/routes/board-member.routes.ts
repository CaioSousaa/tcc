import { Router } from "express";
import { boardMemberController } from "../controllers/BoardMemberController";

/** Mounted under /boards/:boardId/members, so board params must be inherited. */
export const boardMemberRoutes = Router({ mergeParams: true });

boardMemberRoutes.get("/", (req, res, next) =>
  boardMemberController.index(req, res, next),
);
boardMemberRoutes.post("/", (req, res, next) =>
  boardMemberController.store(req, res, next),
);
boardMemberRoutes.patch("/:memberId", (req, res, next) =>
  boardMemberController.update(req, res, next),
);
boardMemberRoutes.delete("/:memberId", (req, res, next) =>
  boardMemberController.destroy(req, res, next),
);
