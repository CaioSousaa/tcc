export class ValidationService {
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password: string): boolean {
    return password.length >= 8;
  }

  sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  validateBoardName(name: string): boolean {
    return !!(name && name.length > 0 && name.length <= 100);
  }

  sanitizeBoardName(name: string): string {
    return name || "";
  }

  validateColumnName(name: string): boolean {
    return !!(name && name.length > 0 && name.length <= 100);
  }

  sanitizeColumnName(name: string): string {
    return name || "";
  }

  validateCardTitle(title: string): boolean {
    return !!(title && title.length > 0 && title.length <= 255);
  }

  sanitizeCardTitle(title: string): string {
    return title || "";
  }

  validateCardDescription(description: string | undefined | null): boolean {
    if (!description) return true;
    return description.length <= 5000;
  }

  sanitizeCardDescription(description: string | undefined | null): string {
    return description || "";
  }

  validateDateFormat(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return false;
    }
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  }
}
