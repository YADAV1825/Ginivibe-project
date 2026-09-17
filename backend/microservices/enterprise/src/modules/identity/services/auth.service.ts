import { prisma } from '../../../infrastructure/postgres/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthService {
  private static JWT_SECRET = process.env.JWT_SECRET || 'super_secret_enterprise_key_change_me';
  private static JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

  static async register(data: any) {
    const existingUser = await prisma.enterpriseUser.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.enterpriseUser.create({
      data: {
        ...data,
        password: hashedPassword
      }
    });

    return this.generateToken(user);
  }

  static async login(data: any) {
    const user = await prisma.enterpriseUser.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return this.generateToken(user);
  }

  private static generateToken(user: any) {
    const payload = {
      id: user.id,
      email: user.email
    };
    const token = jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRATION as any });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token
    };
  }
}
