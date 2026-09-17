import { prisma } from '../../../infrastructure/postgres/client';

export class CreativeService {
  static async createCreative(organizationId: string, data: any) {
    return await prisma.creative.create({
      data: {
        organizationId,
        name: data.name,
        mediaType: data.mediaType,
        storageKey: data.storageKey,
        headline: data.headline,
        description: data.description,
        ctaText: data.ctaText,
        destinationUrl: data.destinationUrl
      }
    });
  }

  static async getCreatives(organizationId: string) {
    return await prisma.creative.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
