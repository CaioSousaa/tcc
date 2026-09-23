import bcrypt from "bcrypt";
import { UserRepository } from "../repositories/UserRepository";
import { ValidationService } from "./ValidationService";
import { User } from "../entities/User";

export class UserService {
  private userRepository: UserRepository;
  private validationService: ValidationService;

  constructor() {
    this.userRepository = new UserRepository();
    this.validationService = new ValidationService();
  }

  async createUser(email: string, password: string): Promise<User> {
    const sanitizedEmail = this.validationService.sanitizeEmail(email);

    if (!this.validationService.validateEmail(sanitizedEmail)) {
      throw new Error("Email inválido");
    }

    if (!this.validationService.validatePassword(password)) {
      throw new Error("Senha não atende requisitos mínimos");
    }

    const existingUser = await this.userRepository.findByEmail(sanitizedEmail);
    if (existingUser) {
      throw new Error("Email já cadastrado");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    return this.userRepository.insert({
      email: sanitizedEmail,
      password_hash: passwordHash,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const sanitizedEmail = this.validationService.sanitizeEmail(email);
    return this.userRepository.findByEmail(sanitizedEmail);
  }

  async verifyPassword(inputPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(inputPassword, hashedPassword);
  }

  async findById(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }

  async updateLastLogin(userId: string): Promise<void> {
    return this.userRepository.updateLastLogin(userId, new Date());
  }
}
