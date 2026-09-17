import { prisma } from '../../../infrastructure/postgres/client';

export class BillingService {
  static async getBillingProfile(organizationId: string) {
    let profile = await prisma.billingProfile.findUnique({
      where: { organizationId }
    });

    if (!profile) {
      profile = await prisma.billingProfile.create({
        data: {
          organizationId,
          balance: 0.00,
          currency: 'INR'
        }
      });
    }

    return profile;
  }

  static async addFunds(organizationId: string, amount: number) {
    // In a real implementation, this would happen AFTER a successful Stripe/Razorpay webhook
    return await prisma.billingProfile.upsert({
      where: { organizationId },
      update: {
        balance: {
          increment: amount
        }
      },
      create: {
        organizationId,
        balance: amount,
        currency: 'INR'
      }
    });
  }
}
