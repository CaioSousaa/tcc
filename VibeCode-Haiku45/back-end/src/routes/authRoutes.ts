import { Router, Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { AppDataSource } from "../database";
import { User } from "../entities/User";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: "Passwords do not match" });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const authService = new AuthService(userRepository);

    const user = await authService.register(name, email, password);

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Registration failed";
    res.status(400).json({ error: errorMessage });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const authService = new AuthService(userRepository);

    const { user, token } = await authService.login(email, password);

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Login failed";
    res.status(401).json({ error: errorMessage });
  }
});

router.post("/verify", async (req: Request, res: Response) => {
  try {
    const token = req.cookies.auth_token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const authService = new AuthService(userRepository);

    const decoded = authService.verifyToken(token);
    const user = await authService.getUserById(decoded.id);

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, isAuthenticated: true });
  } catch (error) {
    res.status(401).json({ error: "Invalid token", isAuthenticated: false });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("auth_token");
  res.json({ message: "Logged out successfully" });
});

export default router;
