import { Router, Request, Response, NextFunction } from "express";
import { UserService } from "../services/UserService";
import { SessionService } from "../services/SessionService";
import { ValidationService } from "../services/ValidationService";
import { AppError, ValidationError, ConflictError, UnauthorizedError } from "../types/errors";
import { requireAuth } from "../middlewares";

const router = Router();
const userService = new UserService();
const sessionService = new SessionService();
const validationService = new ValidationService();

router.post("/signup", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError("Preencha todos os campos");
    }

    const user = await userService.createUser(email, password);
    const session = await sessionService.createSession(user.id);

    res.setHeader(
      "Set-Cookie",
      `sessionId=${session.id}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`
    );

    res.status(201).json({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Email já cadastrado") {
        next(new ConflictError("Email já cadastrado"));
      } else if (error.message === "Email inválido") {
        next(new ValidationError("Email inválido"));
      } else if (error.message === "Senha não atende requisitos mínimos") {
        next(new ValidationError("Senha não atende requisitos mínimos"));
      } else {
        next(error);
      }
    } else {
      next(error);
    }
  }
});

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError("Preencha todos os campos");
    }

    const user = await userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError("Email ou senha inválidos");
    }

    const isPasswordValid = await userService.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Email ou senha inválidos");
    }

    await sessionService.invalidateUserPreviousSessions(user.id);
    const session = await sessionService.createSession(user.id);
    await userService.updateLastLogin(user.id);

    res.setHeader(
      "Set-Cookie",
      `sessionId=${session.id}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`
    );

    res.status(200).json({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.sessionId) {
      throw new UnauthorizedError("Sessão não encontrada");
    }

    await sessionService.invalidateSession(req.sessionId);

    res.setHeader("Set-Cookie", "sessionId=; Max-Age=0; Path=/");

    res.status(200).json({
      message: "Logout realizado",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/session", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.sessionId;

    if (!sessionId) {
      throw new UnauthorizedError("Sessão não encontrada");
    }

    const session = await sessionService.validateSession(sessionId);
    if (!session) {
      throw new UnauthorizedError("Sessão expirada");
    }

    const user = await userService.findById(session.user_id);
    if (!user) {
      throw new UnauthorizedError("Usuário não encontrado");
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
