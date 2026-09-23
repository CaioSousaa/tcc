import { Router, Request, Response } from "express";
import { AppDataSource } from "../database";
import { User } from "../entities/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { verifyToken, AuthRequest } from "../middleware/auth";

const router = Router();
const userRepository = AppDataSource.getRepository(User);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

interface AuthPayload {
  id: string;
  email: string;
}

export function generateToken(payload: AuthPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(payload: AuthPayload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, nome, senha } = req.body;

    if (!email || !nome || !senha) {
      res.status(400).json({ error: "Email, nome e senha são obrigatórios" });
      return;
    }

    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: "Email já cadastrado" });
      return;
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const user = userRepository.create({
      email,
      nome,
      senha: hashedPassword,
    });

    await userRepository.save(user);

    const token = generateToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

    res.status(201).json({
      user: { id: user.id, email: user.email, nome: user.nome },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao registrar usuário" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      res.status(400).json({ error: "Email e senha são obrigatórios" });
      return;
    }

    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Email ou senha inválidos" });
      return;
    }

    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      res.status(401).json({ error: "Email ou senha inválidos" });
      return;
    }

    const token = generateToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

    res.json({
      user: { id: user.id, email: user.email, nome: user.nome },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

router.get("/me", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const user = await userRepository.findOne({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    res.json({
      user: { id: user.id, email: user.email, nome: user.nome },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar dados do usuário" });
  }
});

router.post("/refresh", (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token não fornecido" });
      return;
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string; email: string };
    const newToken = generateToken({ id: decoded.id, email: decoded.email });

    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ error: "Refresh token inválido" });
  }
});

router.post("/logout", verifyToken, (req: AuthRequest, res: Response) => {
  res.json({ message: "Logout realizado com sucesso" });
});

export default router;
