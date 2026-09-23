import type { NextFunction, Request, Response } from "express";
import { boardIdSchema } from "../schemas/board.schema";
import {
  createLabelSchema,
  labelIdSchema,
  updateLabelSchema,
} from "../schemas/label.schema";
import { labelService } from "../services/LabelService";
import { validate } from "../utils/validation";

function boardIdFrom(req: Request): string {
  return validate(boardIdSchema, req.params["boardId"]);
}

export class LabelController {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const labels = await labelService.list(req.userId!, boardIdFrom(req));

      res.status(200).json({ labels });
    } catch (error) {
      next(error);
    }
  }

  async store(req: Request, res: Response, next: NextFunction) {
    try {
      const input = validate(createLabelSchema, req.body);
      const label = await labelService.create(
        req.userId!,
        boardIdFrom(req),
        input,
      );

      res.status(201).json({ label });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const labelId = validate(labelIdSchema, req.params["labelId"]);
      const input = validate(updateLabelSchema, req.body);
      const label = await labelService.update(
        req.userId!,
        boardIdFrom(req),
        labelId,
        input,
      );

      res.status(200).json({ label });
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      const labelId = validate(labelIdSchema, req.params["labelId"]);
      await labelService.remove(req.userId!, boardIdFrom(req), labelId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const labelController = new LabelController();
