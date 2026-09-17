import 'dotenv/config';
import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { BlobServiceClient } from '@azure/storage-blob';
import multer from 'multer';
import jwt from 'jsonwebtoken';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const upload = multer({ storage: multer.memoryStorage() });

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username?: string;
    email?: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) throw new Error('JWT_SECRET is not set in .env');

const authenticateUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.get('authorization') || req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const resolvedUserId = decoded.id || decoded.userId || decoded.sub;

    if (!resolvedUserId) {
      return res.status(401).json({ error: 'User ID missing in token payload' });
    }

    req.user = {
      id: resolvedUserId,
      username: decoded.username,
      email: decoded.email,
    };

    next();
  } catch (error: any) {
    return res.status(401).json({ error: `Unauthorized: ${error.message}` });
  }
};

const getOptionalUserId = (req: Request): string | undefined => {
  const authHeader = req.get('authorization') || req.headers.authorization;
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return decoded.id || decoded.userId || decoded.sub;
    } catch {
      // Ignore invalid or expired token for public reads
    }
  }
  return req.query.userId as string | undefined;
};

function getAzureContainerClient() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_CONTAINER_NAME || 'media-uploads';

  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set in .env');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  return blobServiceClient.getContainerClient(containerName);
}

// 1. Upload Media
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const containerClient = getAzureContainerClient();
    const blobName = `${Date.now()}-${req.file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });

    return res.json({ url: blockBlobClient.url });
  } catch (error: any) {
    console.error('Azure Upload Error:', error);
    return res.status(500).json({ error: error.message || 'Upload to Azure Blob failed' });
  }
});

// 1b. Get Communities List (with member/post counts + requester flags)
router.get('/communities', async (req, res) => {
  try {
    const userId = getOptionalUserId(req);
    const communities = await prisma.community.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        categories: true,
        imageUrl: true,
        description: true,
        cityScope: true,
        ownerId: true,
        createdAt: true,
        owner: { select: { id: true, username: true, firstName: true, lastName: true } },
        _count: { select: { members: true, posts: true } },
        members: userId ? { where: { userId }, select: { userId: true } } : false,
      },
      orderBy: { name: 'asc' },
    });
    const formatted = communities.map((c: any) => ({
      ...c,
      memberCount: c._count.members,
      postCount: c._count.posts,
      isMember: userId ? c.members.length > 0 : false,
      isOwner: userId ? c.ownerId === userId : false,
      members: undefined,
      _count: undefined,
    }));
    return res.json(formatted);
  } catch (error: any) {
    console.error('Failed to fetch communities:', error);
    return res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

// 1c. Create a Community (creator becomes owner + first member)
router.post('/communities', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user?.id as string;
    const { name, description, category, categories, imageUrl, cityScope } = req.body ?? {};

    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanCategory = typeof category === 'string' ? category.trim() : '';
    const cleanCategories = Array.isArray(categories)
      ? [...new Set(categories.filter((c: unknown) => typeof c === 'string').map((c: string) => c.trim()).filter(Boolean))]
      : [];
    if (cleanName.length < 3 || cleanName.length > 60) {
      return res.status(400).json({ error: 'Community name must be 3-60 characters.' });
    }
    // Multi-select wins; single category kept for back-compat.
    const finalCategories = cleanCategories.length > 0 ? cleanCategories : (cleanCategory ? [cleanCategory] : []);
    if (finalCategories.length < 1 || finalCategories.length > 10) {
      return res.status(400).json({ error: 'Pick 1-10 categories.' });
    }
    if (finalCategories.some((c) => c.length < 2 || c.length > 40)) {
      return res.status(400).json({ error: 'Each category must be 2-40 characters.' });
    }
    const cleanImageUrl = typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null;
    if (description !== undefined && description !== null && (typeof description !== 'string' || description.length > 500)) {
      return res.status(400).json({ error: 'Description must be a string up to 500 characters.' });
    }

    try {
      const community = await prisma.$transaction(async (tx) => {
        const created = await tx.community.create({
          data: {
            name: cleanName,
            description: description?.trim() || null,
            category: finalCategories[0],
            categories: finalCategories,
            imageUrl: cleanImageUrl,
            cityScope: typeof cityScope === 'string' && cityScope.trim() ? cityScope.trim() : null,
            ownerId,
          },
        });
        await tx.communityMember.create({ data: { userId: ownerId, communityId: created.id } });
        return created;
      });
      return res.status(201).json({ ...community, memberCount: 1, postCount: 0, isMember: true, isOwner: true });
    } catch (txError: any) {
      if (txError?.code === 'P2002') {
        return res.status(409).json({ error: 'A community with this name already exists.' });
      }
      throw txError;
    }
  } catch (error: any) {
    console.error('Failed to create community:', error);
    return res.status(500).json({ error: 'Failed to create community' });
  }
});

// 1d. Get Community Detail
router.get('/communities/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    const userId = getOptionalUserId(req);
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true, firstName: true, lastName: true } },
        _count: { select: { members: true, posts: true } },
        members: {
          take: 12,
          orderBy: { joinedAt: 'asc' },
          include: { user: { select: { id: true, username: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!community) return res.status(404).json({ error: 'Community not found' });
    let isMember = false;
    if (userId) {
      const membership = await prisma.communityMember.findUnique({
        where: { userId_communityId: { userId, communityId: id } },
        select: { userId: true },
      });
      isMember = Boolean(membership);
    }
    return res.json({
      ...community,
      memberCount: (community as any)._count.members,
      postCount: (community as any)._count.posts,
      isMember,
      isOwner: userId ? community.ownerId === userId : false,
    });
  } catch (error: any) {
    console.error('Failed to fetch community:', error);
    return res.status(500).json({ error: 'Failed to fetch community' });
  }
});

// 1e. Join a Community (idempotent)
router.post('/communities/:id/join', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id as string;
    const community = await prisma.community.findUnique({ where: { id }, select: { id: true } });
    if (!community) return res.status(404).json({ error: 'Community not found' });
    const existing = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId, communityId: id } },
    });
    if (existing) return res.json({ success: true, alreadyMember: true });
    await prisma.communityMember.create({ data: { userId, communityId: id } });
    const memberCount = await prisma.communityMember.count({ where: { communityId: id } });
    return res.json({ success: true, alreadyMember: false, memberCount });
  } catch (error: any) {
    console.error('Failed to join community:', error);
    return res.status(500).json({ error: 'Failed to join community' });
  }
});

// 1f. Leave a Community (owner must delete instead of leaving)
router.delete('/communities/:id/leave', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id as string;
    const community = await prisma.community.findUnique({ where: { id }, select: { id: true, ownerId: true } });
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (community.ownerId === userId) {
      return res.status(403).json({ error: 'Owners cannot leave their community — delete it instead.' });
    }
    const deleted = await prisma.communityMember.deleteMany({ where: { userId, communityId: id } });
    if (deleted.count === 0) return res.status(404).json({ error: 'You are not a member of this community' });
    const memberCount = await prisma.communityMember.count({ where: { communityId: id } });
    return res.json({ success: true, memberCount });
  } catch (error: any) {
    console.error('Failed to leave community:', error);
    return res.status(500).json({ error: 'Failed to leave community' });
  }
});

// 1g. Community Posts (same shape as the main feed)
router.get('/communities/:id/posts', async (req, res) => {
  try {
    const id = req.params.id as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const skip = (page - 1) * limit;
    const userId = getOptionalUserId(req);

    const community = await prisma.community.findUnique({ where: { id }, select: { id: true } });
    if (!community) return res.status(404).json({ error: 'Community not found' });

    const posts = await prisma.post.findMany({
      where: { communityId: id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, firstName: true, lastName: true } },
        community: { select: { id: true, name: true } },
        likes: userId ? { where: { userId } } : false,
        _count: { select: { likes: true, comments: true } },
      },
    });
    const formatted = posts.map((p) => ({
      ...p,
      hasLiked: userId ? Boolean(p.likes && p.likes.length > 0) : false,
    }));
    return res.json({ data: formatted, page, limit });
  } catch (error: any) {
    console.error('Failed to fetch community posts:', error);
    return res.status(500).json({ error: 'Failed to fetch community posts' });
  }
});

// 1h. Update a Community (owner only)
router.patch('/communities/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id as string;
    const community = await prisma.community.findUnique({ where: { id } });
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (community.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the community owner can edit it.' });
    }
    const { name, description, category, categories, imageUrl, cityScope } = req.body ?? {};
    const data: Record<string, any> = {};
    if (name !== undefined) {
      const clean = typeof name === 'string' ? name.trim() : '';
      if (clean.length < 3 || clean.length > 60) return res.status(400).json({ error: 'Community name must be 3-60 characters.' });
      data.name = clean;
    }
    if (description !== undefined) {
      if (description !== null && (typeof description !== 'string' || description.length > 500)) {
        return res.status(400).json({ error: 'Description must be a string up to 500 characters.' });
      }
      data.description = description === null ? null : description.trim() || null;
    }
    if (category !== undefined || categories !== undefined) {
      const cleanList = Array.isArray(categories)
        ? [...new Set(categories.filter((c: unknown) => typeof c === 'string').map((c: string) => c.trim()).filter(Boolean))]
        : [];
      const finalList = cleanList.length > 0
        ? cleanList
        : (typeof category === 'string' && category.trim() ? [category.trim()] : []);
      if (finalList.length < 1 || finalList.length > 10) return res.status(400).json({ error: 'Pick 1-10 categories.' });
      if (finalList.some((c) => c.length < 2 || c.length > 40)) return res.status(400).json({ error: 'Each category must be 2-40 characters.' });
      data.categories = finalList;
      data.category = finalList[0];
    }
    if (imageUrl !== undefined) {
      data.imageUrl = typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null;
    }
    if (cityScope !== undefined) {
      data.cityScope = cityScope === null ? null : (typeof cityScope === 'string' && cityScope.trim() ? cityScope.trim() : null);
    }
    try {
      const updated = await prisma.community.update({ where: { id }, data });
      return res.json(updated);
    } catch (updateError: any) {
      if (updateError?.code === 'P2002') {
        return res.status(409).json({ error: 'A community with this name already exists.' });
      }
      throw updateError;
    }
  } catch (error: any) {
    console.error('Failed to update community:', error);
    return res.status(500).json({ error: 'Failed to update community' });
  }
});

// 1i. Delete a Community (owner only; posts return to the public feed)
router.delete('/communities/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id as string;
    const community = await prisma.community.findUnique({ where: { id }, select: { id: true, ownerId: true } });
    if (!community) return res.status(404).json({ error: 'Community not found' });
    if (community.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the community owner can delete it.' });
    }
    await prisma.$transaction([
      prisma.post.updateMany({ where: { communityId: id }, data: { communityId: null } }),
      prisma.communityMember.deleteMany({ where: { communityId: id } }),
      prisma.community.delete({ where: { id } }),
    ]);
    return res.json({ success: true, id });
  } catch (error: any) {
    console.error('Failed to delete community:', error);
    return res.status(500).json({ error: 'Failed to delete community' });
  }
});

// 2. Get Feed Posts (Includes viewsCount)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const userId = getOptionalUserId(req);

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, firstName: true, lastName: true },
        },
        community: {
          select: { id: true, name: true },
        },
        likes: userId ? { where: { userId } } : false,
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    const formatted = posts.map((p) => ({
      ...p,
      hasLiked: userId ? Boolean(p.likes && p.likes.length > 0) : false,
    }));

    return res.json({ data: formatted, page, limit });
  } catch (error) {
    console.error('Failed to fetch feed:', error);
    return res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// 3. Create a Post
router.post('/posts', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, body, mediaUrls, contentType = 'text', communityId } = req.body;
    const authorId = req.user?.id;

    if (!authorId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    if (communityId) {
      const community = await prisma.community.findUnique({
        where: { id: communityId },
        select: { id: true },
      });
      if (!community) {
        return res.status(404).json({ error: 'Community not found.' });
      }
      const membership = await prisma.communityMember.findUnique({
        where: { userId_communityId: { userId: authorId, communityId } },
        select: { userId: true },
      });
      if (!membership) {
        return res.status(403).json({ error: 'Join this community before posting in it.' });
      }
    }

    if (contentType === 'text') {
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required for text posts.' });
      }
    } else if (contentType === 'media' || contentType === 'image' || contentType === 'video') {
      if (!mediaUrls || !Array.isArray(mediaUrls) || mediaUrls.length === 0) {
        return res.status(400).json({ error: 'At least one photo/video URL is required.' });
      }
      if (!body || !body.trim()) {
        return res.status(400).json({ error: 'Description is required for photo/video posts.' });
      }
    }

    const post = await prisma.post.create({
      data: {
        userId: authorId,
        title: title || null,
        body: body || '',
        mediaUrls: mediaUrls || [],
        contentType,
        communityId: communityId || null,
      },
      include: {
        user: {
          select: { id: true, username: true, firstName: true, lastName: true },
        },
      },
    });

    return res.status(201).json(post);
  } catch (error) {
    console.error('Failed to create post:', error);
    return res.status(500).json({ error: 'Failed to create post' });
  }
});

// 4. Track View Count (Social Media Deduplicated View Tracking)
router.post('/posts/:id/view', async (req: Request, res: Response) => {
  try {
    const postId = req.params.id as string;
    const userId = getOptionalUserId(req);

    // Identify device or user for view deduplication
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
    const viewerKey = userId ? `user_${userId}` : `ip_${clientIp}`;

    const postExists = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!postExists) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Attempt to register view; ignore if record already exists for this viewerKey
    try {
      await prisma.postView.create({
        data: {
          postId,
          userId: userId || null,
          viewerKey,
        },
      });

      // Increment aggregate count on successful new view
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: { viewsCount: { increment: 1 } },
        select: { viewsCount: true },
      });

      return res.json({ success: true, viewsCount: updatedPost.viewsCount });
    } catch (uniqueConstraintError: any) {
      // View has already been counted for this post and viewerKey
      const current = await prisma.post.findUnique({
        where: { id: postId },
        select: { viewsCount: true },
      });
      return res.json({ success: true, viewsCount: current?.viewsCount ?? 0, alreadyViewed: true });
    }
  } catch (error: any) {
    console.error('Error tracking post view:', error);
    return res.status(500).json({ error: 'Failed to record view' });
  }
});

// 5. Like / Unlike Toggle
router.post('/posts/:id/like', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = req.params.id as string;
    const userId = req.user?.id as string;

    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated' });
    }

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    let liked = false;
    if (existing) {
      await prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      });
      liked = false;
    } else {
      await prisma.like.create({
        data: { userId, postId },
      });
      liked = true;
    }

    const likesCount = await prisma.like.count({
      where: { postId },
    });

    return res.json({ liked, likesCount });
  } catch (error) {
    console.error('Failed to toggle like:', error);
    return res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// 5b. Recent likers preview (public, newest first, capped)
router.get('/posts/:id/likes', async (req, res) => {
  try {
    const { id: postId } = req.params;
    const likes = await prisma.like.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        user: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    });
    return res.json({ data: likes.map((like) => like.user) });
  } catch (error) {
    console.error('Failed to fetch likers:', error);
    return res.status(500).json({ error: 'Failed to fetch likers' });
  }
});

// 5b. Get a single Post (for search result deep-view)
router.get('/posts/:id', async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = getOptionalUserId(req);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: { id: true, username: true, firstName: true, lastName: true },
        },
        community: {
          select: { id: true, name: true },
        },
        likes: userId ? { where: { userId } } : false,
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    if (!post) return res.status(404).json({ error: 'Post not found' });

    return res.json({
      ...post,
      hasLiked: userId ? Boolean(post.likes && post.likes.length > 0) : false,
    });
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// 6. Get Post Comments
router.get('/posts/:id/comments', async (req, res) => {  try {
    const { id: postId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, username: true, firstName: true, lastName: true },
        },
      },
    });

    return res.json(comments);
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// 7. Create Comment
router.post('/posts/:id/comments', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postId = req.params.id as string;
    const userId = req.user?.id as string;
    const { text } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const commentBody = text?.trim();
    if (!commentBody) {
      return res.status(400).json({ error: 'Comment text cannot be empty' });
    }

    const postExists = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!postExists) {
      return res.status(404).json({ error: `Post ${postId} does not exist.` });
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        body: commentBody,
      },
      include: {
        user: {
          select: { id: true, username: true, firstName: true, lastName: true },
        },
      },
    });

    return res.status(201).json(comment);
  } catch (error: any) {
    console.error('Error posting comment:', error);
    return res.status(500).json({ error: error.message || 'Failed to post comment' });
  }
});

// PATCH /api/feed/comments/:id
router.patch('/comments/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const commentId = req.params.id as string;
    const userId = req.user?.id as string;
    const { text } = req.body;

    const newBody = text?.trim();
    if (!newBody) {
      return res.status(400).json({ error: 'Comment text cannot be empty' });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ error: 'You are not allowed to edit this comment.' });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { body: newBody },
      include: {
        user: {
          select: { id: true, username: true, firstName: true, lastName: true },
        },
      },
    });

    return res.json(updatedComment);
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return res.status(500).json({ error: error.message || 'Failed to update comment' });
  }
});

// DELETE /api/feed/comments/:id
router.delete('/comments/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const commentId = req.params.id as string;
    const userId = req.user?.id as string;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: { select: { userId: true } },
      },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const isCommentAuthor = comment.userId === userId;
    const isPostAuthor = comment.post?.userId === userId;

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ error: 'You do not have permission to delete this comment.' });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return res.json({ success: true, message: 'Comment deleted successfully', id: commentId });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete comment' });
  }
});

export default router;