import { Repository } from "typeorm";
import { User } from "../entities/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class AuthService {
  constructor(private userRepository: Repository<User>) {}

  async register(name: string, email: string, password: string): Promise<User> {
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error("Email already registered");
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    return { user, token };
  }

  verifyToken(token: string): { id: string; email: string } {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as {
        id: string;
        email: string;
      };
      return decoded;
    } catch {
      throw new Error("Invalid token");
    }
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }
}
