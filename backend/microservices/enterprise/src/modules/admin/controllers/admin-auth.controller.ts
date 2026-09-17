import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../infrastructure/postgres/client';

const JWT_SECRET = process.env.JWT_SECRET || 'ginivibe-super-secret-key';

export class AdminAuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      const admin = await prisma.adminUser.findUnique({ where: { email } });
      if (!admin) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const isValid = await bcrypt.compare(password, admin.password);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const token = jwt.sign(
        { 
          id: admin.id, 
          email: admin.email, 
          role: admin.role,
          type: 'ADMIN' // Crucial separation from Enterprise users
        }, 
        JWT_SECRET, 
        { expiresIn: '12h' }
      );

      res.status(200).json({ token, admin: { email: admin.email, role: admin.role, firstName: admin.firstName, lastName: admin.lastName } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
