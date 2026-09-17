import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { optionalAuth, requireAuth, type AuthRequest } from '../middleware/auth';
import { imageUpload } from '../middleware/upload';
import { deleteEventImageIfManaged, uploadEventImage } from '../config/azureStorage';

const router = Router();

const getRouteParamId = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
};

const runSerializableTransaction = async <T>(operation: (tx: any) => Promise<T>): Promise<T> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034' || attempt === 2) throw error;
    }
  }

  throw new Error('Transaction retry limit exceeded');
};

// ==================== MIDDLEWARE & HELPERS ====================

// Helper to calculate event status
const getEventStatus = (startAt: Date, endAt: Date): 'LIVE' | 'FUTURE' | 'ENDED' => {
  const now = new Date();
  if (now < startAt) return 'FUTURE';
  if (now < endAt) return 'LIVE';
  return 'ENDED';
};

// Helper to calculate attendee count
const getAttendeeCount = (attendees: any[]) => {
  return attendees.filter(a => a.rsvpStatus === 'GOING').length;
};

// Rank of a waitlist entry (1-based) without loading the whole list.
const getWaitlistPosition = async (
  eventId: string,
  entry: { createdAt: Date; id: string },
): Promise<number> => {
  const before = await prisma.eventWaitlist.count({
    where: {
      eventId,
      OR: [
        { createdAt: { lt: entry.createdAt } },
        { createdAt: entry.createdAt, id: { lt: entry.id } },
      ],
    },
  });
  return before + 1;
};

// Light include for list/detail reads at scale: true GOING count + only the
// caller's own rows. Never loads the full attendee/waitlist tables per event.
const lightIncludes = (userId?: string): any => ({
  _count: { select: { attendees: { where: { rsvpStatus: 'GOING' } } } },
  ...(userId
    ? { attendees: { where: { userId }, select: { userId: true, rsvpStatus: true } } }
    : {}),
  ...(userId
    ? { waitlist: { where: { userId }, select: { id: true, userId: true, createdAt: true } } }
    : {}),
  interests: true,
});

// Shape a light-loaded event for the formatter (resolves waitlist rank only
// for users actually holding a waitlist entry — the rare case).
const shapeLightEvent = async (event: any) => {
  const entry = (event.waitlist ?? [])[0] ?? null;
  return {
    ...event,
    attendeeCount: event._count?.attendees ?? 0,
    userAttendance: (event.attendees ?? [])[0]?.rsvpStatus ?? null,
    userWaitlistEntry: entry,
    waitlistPosition: entry ? await getWaitlistPosition(event.id, entry) : null,
  };
};

// Helper to format event response without cross-database relations.
// Accepts light-loaded events (attendeeCount/userAttendance/userWaitlistEntry
// precomputed) or legacy full includes — both shapes work.
const formatEventResponse = (event: any, currentUserId?: string) => {
  const attendeeCount =
    typeof event.attendeeCount === 'number'
      ? event.attendeeCount
      : getAttendeeCount(event.attendees || []);
  const userAttendance =
    event.userAttendance !== undefined
      ? event.userAttendance
      : currentUserId
        ? event.attendees?.find((a: any) => a.userId === currentUserId)?.rsvpStatus || null
        : null;
  const userWaitlistEntry =
    event.userWaitlistEntry !== undefined
      ? event.userWaitlistEntry
      : currentUserId
        ? (event.waitlist ?? []).find((entry: any) => entry.userId === currentUserId) ?? null
        : null;
  const waitlistPosition =
    event.waitlistPosition !== undefined
      ? event.waitlistPosition
      : userWaitlistEntry && Array.isArray(event.waitlist)
        ? event.waitlist.filter((entry: any) => entry.createdAt < userWaitlistEntry.createdAt || (entry.createdAt.getTime() === userWaitlistEntry.createdAt.getTime() && entry.id < userWaitlistEntry.id)).length + 1
        : null;

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    organizer: {
      id: event.organizerId,
      username: 'Organizer',
      firstName: null,
    },
    startAt: event.startAt,
    endAt: event.endAt,
    status: getEventStatus(event.startAt, event.endAt),
    mode: event.mode,
    meetingUrl: event.meetingUrl || null,
    joinUrl: event.joinUrl || event.meetingUrl || null,
    platform: event.platform || null,
    venue: event.venue || null,
    location: event.location || null,
    capacity: event.capacity,
    bannerImageUrl: event.bannerImageUrl || null,
    attendeeCount,
    isFull: event.capacity !== null && attendeeCount >= event.capacity,
    waitlistStatus: userWaitlistEntry ? 'WAITLISTED' : null,
    waitlistPosition,
    userAttendanceStatus: userAttendance,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    subInterests: event.interests?.map((link: any) => ({ id: link.subInterestId })) ?? [],
  };
};

// ==================== ENDPOINTS ====================

// POST /api/events/upload-image - Upload a banner image
router.post('/upload-image', requireAuth, imageUpload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided (expected field name "image")' });
    }

    const userId = req.userId!;
    const url = await uploadEventImage(req.file.buffer, req.file.mimetype, userId);

    res.status(201).json({ success: true, data: { url } });
  } catch (error: any) {
    console.error(error);
    const message = typeof error?.message === 'string' ? error.message : 'Failed to upload image';
    const isClientError = /unsupported image type/i.test(message);
    res.status(isClientError ? 422 : 500).json({ success: false, error: message });
  }
});

// Multer error handling
router.use('/upload-image', (error: any, _req: Request, res: Response, next: NextFunction) => {
  if (!error) return next();
  const message = error?.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5MB or smaller' : (error?.message || 'Failed to upload image');
  res.status(400).json({ success: false, error: message });
});

// GET /api/events - List events with filters
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const mode = req.query.mode as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const events = await prisma.event.findMany({
      include: lightIncludes(req.userId),
      skip: offset,
      take: limit,
      orderBy: { startAt: 'desc' },
    });

    const filteredEvents = events.filter(e => {
      const matchesStatus = !status || getEventStatus(e.startAt, e.endAt) === status.toUpperCase();
      const matchesMode = !mode || e.mode === mode.toUpperCase();
      return matchesStatus && matchesMode;
    });

    const total = filteredEvents.length;
    const shaped = await Promise.all(filteredEvents.map(shapeLightEvent));
    const formattedEvents = shaped.map(e => formatEventResponse(e, req.userId));

    res.json({
      success: true,
      data: formattedEvents,
      meta: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
});

// GET /api/events/:eventId - Get single event
router.get('/:eventId', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const eventId = getRouteParamId(req.params.eventId);

    if (['me', 'personalized'].includes(eventId)) return next();

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Event ID is required' });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        ...lightIncludes(req.userId),
        // Detail shows attendee names too — capped preview, true total above.
        attendees: {
          where: { rsvpStatus: 'GOING' },
          take: 50,
          orderBy: { joinedAt: 'asc' },
          select: { userId: true, rsvpStatus: true, joinedAt: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    // Merge the caller's own row (for Going state) with the capped preview.
    const mine = req.userId
      ? (event.attendees as any[]).find((a) => a.userId === req.userId) ?? null
      : null;
    const shaped = await shapeLightEvent(event);
    shaped.userAttendance = mine?.rsvpStatus ?? shaped.userAttendance;

    const formattedEvent = {
      ...formatEventResponse(shaped, req.userId),
      attendees: (event.attendees as any[]).map(a => ({
        id: a.userId,
        userId: a.userId,
        rsvpStatus: a.rsvpStatus,
        joinedAt: a.joinedAt,
      })),
    };

    res.json({ success: true, data: formattedEvent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch event' });
  }
});

// POST /api/events - Create event
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, startAt, endAt, mode, meetingUrl, joinUrl, platform, venue, location, capacity, subInterestIds, bannerImageUrl } = req.body;
    const organizerId = req.userId!;

    if (!title || !startAt || !endAt || !mode) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title, startAt, endAt, mode' 
      });
    }

    const start = new Date(startAt);
    const end = new Date(endAt);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid date format for startAt or endAt' 
      });
    }

    if (end <= start) {
      return res.status(400).json({ 
        success: false, 
        error: 'endAt must be after startAt' 
      });
    }

    if (!['ONLINE', 'OFFLINE'].includes(mode)) {
      return res.status(400).json({ 
        success: false, 
        error: 'mode must be ONLINE or OFFLINE' 
      });
    }

    if (capacity !== undefined && capacity !== null && (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0)) {
      return res.status(400).json({ success: false, error: 'capacity must be a positive integer' });
    }

    if (bannerImageUrl !== undefined && bannerImageUrl !== null && typeof bannerImageUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'bannerImageUrl must be a string' });
    }

    if (mode === 'ONLINE') {
      if (!meetingUrl && !joinUrl) {
        return res.status(422).json({
          success: false,
          error: 'Online events require a meeting link (meetingUrl or joinUrl)'
        });
      }
    } else if (mode === 'OFFLINE') {
      if (!venue || !location) {
        return res.status(422).json({ 
          success: false, 
          error: 'Offline events require venue and location' 
        });
      }
    }

    const joinLink = typeof joinUrl === 'string' && joinUrl.trim() ? joinUrl.trim() : null;
    const meetingLink = mode === 'ONLINE'
      ? (typeof meetingUrl === 'string' && meetingUrl.trim() ? meetingUrl.trim() : joinLink)
      : null;

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        organizerId,
        startAt: start,
        endAt: end,
        mode,
        meetingUrl: meetingLink,
        joinUrl: joinLink || meetingLink,
        platform: mode === 'ONLINE' ? platform : null,
        venue: mode === 'OFFLINE' ? venue : null,
        location: mode === 'OFFLINE' ? location : null,
        capacity: capacity !== undefined && capacity !== null ? Number(capacity) : null,
        bannerImageUrl: bannerImageUrl || null,
        interests: Array.isArray(subInterestIds) ? { create: subInterestIds.map((subInterestId: string) => ({ subInterestId })) } : undefined,
      },
      include: {
        attendees: true,
        waitlist: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
        interests: true,
      },
    });

    const formattedEvent = formatEventResponse(event, organizerId);
    res.status(201).json({ success: true, data: formattedEvent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to create event' });
  }
});

// PUT /api/events/:eventId - Update event (creator only)
router.put('/:eventId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = getRouteParamId(req.params.eventId);
    const userId = req.userId!;
    const { title, description, startAt, endAt, mode, meetingUrl, joinUrl, platform, venue, location, capacity, subInterestIds, bannerImageUrl } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Event ID is required' });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    if (event.organizerId !== userId) {
      return res.status(403).json({ success: false, error: 'Only event organizer can update' });
    }

    const nextStart = startAt !== undefined ? new Date(startAt) : event.startAt;
    const nextEnd = endAt !== undefined ? new Date(endAt) : event.endAt;
    if (isNaN(nextStart.getTime()) || isNaN(nextEnd.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }
    if (nextEnd <= nextStart) {
      return res.status(400).json({ success: false, error: 'endAt must be after startAt' });
    }

    const nextMode = mode !== undefined ? mode : event.mode;
    if (!['ONLINE', 'OFFLINE'].includes(nextMode)) {
      return res.status(400).json({ success: false, error: 'mode must be ONLINE or OFFLINE' });
    }
    if (nextMode === 'ONLINE' && meetingUrl !== undefined && meetingUrl !== null && typeof meetingUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'meetingUrl must be a string' });
    }
    if (joinUrl !== undefined && joinUrl !== null && typeof joinUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'joinUrl must be a string' });
    }
    if (nextMode === 'OFFLINE' && ((venue !== undefined && venue !== null && typeof venue !== 'string') || (location !== undefined && location !== null && typeof location !== 'string'))) {
      return res.status(400).json({ success: false, error: 'venue and location must be strings' });
    }
    if (capacity !== undefined && capacity !== null && (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0)) {
      return res.status(400).json({ success: false, error: 'capacity must be a positive integer' });
    }
    if (bannerImageUrl !== undefined && bannerImageUrl !== null && typeof bannerImageUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'bannerImageUrl must be a string' });
    }
    if (Array.isArray(subInterestIds) && subInterestIds.some((id: unknown) => typeof id !== 'string' || !id)) {
      return res.status(400).json({ success: false, error: 'subInterestIds must contain non-empty strings' });
    }
    const goingCount = await prisma.eventAttendee.count({ where: { eventId, rsvpStatus: 'GOING' } });
    if (capacity !== undefined && capacity !== null && Number(capacity) < goingCount) {
      return res.status(409).json({ success: false, error: `capacity cannot be lower than current attendee count (${goingCount})` });
    }

    const nextBannerImageUrl = bannerImageUrl !== undefined ? bannerImageUrl : event.bannerImageUrl;
    const replacingImage = bannerImageUrl !== undefined && event.bannerImageUrl && event.bannerImageUrl !== nextBannerImageUrl;

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: title !== undefined ? title : event.title,
        description: description !== undefined ? description : event.description,
        startAt: nextStart,
        endAt: nextEnd,
        mode: nextMode,
        meetingUrl: meetingUrl !== undefined ? meetingUrl : event.meetingUrl,
        joinUrl: joinUrl !== undefined ? joinUrl : event.joinUrl,
        platform: platform !== undefined ? platform : event.platform,
        venue: venue !== undefined ? venue : event.venue,
        location: location !== undefined ? location : event.location,
        capacity: capacity !== undefined ? (capacity === null ? null : Number(capacity)) : event.capacity,
        bannerImageUrl: nextBannerImageUrl || null,
        interests: Array.isArray(subInterestIds) ? { deleteMany: {}, create: subInterestIds.map((subInterestId: string) => ({ subInterestId })) } : undefined,
      },
      include: {
        attendees: true,
        waitlist: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
        interests: true,
      },
    });

    if (replacingImage) void deleteEventImageIfManaged(event.bannerImageUrl);

    const formattedEvent = formatEventResponse(updatedEvent, userId);
    res.json({ success: true, data: formattedEvent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to update event' });
  }
});

// DELETE /api/events/:eventId - Delete event (creator only)
router.delete('/:eventId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = getRouteParamId(req.params.eventId);
    const userId = req.userId!;

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Event ID is required' });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    if (event.organizerId !== userId) {
      return res.status(403).json({ success: false, error: 'Only event organizer can delete' });
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    void deleteEventImageIfManaged(event.bannerImageUrl);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to delete event' });
  }
});

// POST /api/events/:eventId/rsvp - RSVP to event
router.post('/:eventId/rsvp', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = getRouteParamId(req.params.eventId);
    const userId = req.userId!;
    const { status } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Event ID is required' });
    }

    if (!status || !['GOING', 'INTERESTED', 'DECLINED'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'status must be GOING, INTERESTED, or DECLINED' 
      });
    }

    const result = await runSerializableTransaction(async tx => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) return null;

      const existingAttendee = await tx.eventAttendee.findUnique({ where: { eventId_userId: { eventId, userId } } });
      const existingWaitlist = await tx.eventWaitlist.findUnique({ where: { eventId_userId: { eventId, userId } } });

      if (status === 'GOING') {
        if (existingAttendee?.rsvpStatus === 'GOING') {
          if (existingWaitlist) await tx.eventWaitlist.delete({ where: { eventId_userId: { eventId, userId } } });
          return { status: 'GOING' as const, attendee: existingAttendee, event };
        }
        if (existingWaitlist) {
          return { status: 'WAITLISTED' as const, waitlist: existingWaitlist, event };
        }

        const goingCount = await tx.eventAttendee.count({ where: { eventId, rsvpStatus: 'GOING' } });
        if (event.capacity !== null && goingCount >= event.capacity) {
          const waitlist = await tx.eventWaitlist.create({ data: { eventId, userId } });
          return { status: 'WAITLISTED' as const, waitlist, event };
        }

        const attendee = existingAttendee
          ? await tx.eventAttendee.update({ where: { eventId_userId: { eventId, userId } }, data: { rsvpStatus: 'GOING' } })
          : await tx.eventAttendee.create({ data: { eventId, userId, rsvpStatus: 'GOING' } });
        return { status: 'GOING' as const, attendee, event };
      }

      if (existingWaitlist) {
        await tx.eventWaitlist.delete({ where: { eventId_userId: { eventId, userId } } });
      }
      const attendee = existingAttendee
        ? await tx.eventAttendee.update({ where: { eventId_userId: { eventId, userId } }, data: { rsvpStatus: status } })
        : await tx.eventAttendee.create({ data: { eventId, userId, rsvpStatus: status } });
      return { status, attendee, event };
    });

    if (!result) return res.status(404).json({ success: false, error: 'Event not found' });

    const attendeeCount = await prisma.eventAttendee.count({ where: { eventId, rsvpStatus: 'GOING' } });
    const waitlist = await prisma.eventWaitlist.findMany({ where: { eventId }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
    res.json({ success: true, data: {
      status: result.status,
      event: { id: result.event.id, capacity: result.event.capacity },
      eventId,
      userId,
      attendeeCount,
      capacity: result.event.capacity,
      isFull: result.event.capacity !== null && attendeeCount >= result.event.capacity,
      waitlistPosition: result.status === 'WAITLISTED' ? waitlist.findIndex(entry => entry.userId === userId) + 1 : null,
      ...(result.status === 'WAITLISTED' ? { waitlistStatus: 'WAITLISTED' } : { userAttendanceStatus: 'GOING', rsvpStatus: result.attendee?.rsvpStatus }),
    } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to RSVP to event' });
  }
});

// DELETE /api/events/:eventId/rsvp - Cancel RSVP
router.delete('/:eventId/rsvp', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = getRouteParamId(req.params.eventId);
    const userId = req.userId!;

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Event ID is required' });
    }

    const result = await runSerializableTransaction(async tx => {
      const attendee = await tx.eventAttendee.findUnique({ where: { eventId_userId: { eventId, userId } } });
      if (!attendee) return null;

      await tx.eventAttendee.delete({ where: { eventId_userId: { eventId, userId } } });
      if (attendee.rsvpStatus !== 'GOING') return { promoted: null };
      const promoted = await tx.eventWaitlist.findFirst({
        where: { eventId },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });
      if (!promoted) return { promoted: null };

      const promotedAttendee = await tx.eventAttendee.create({ data: { eventId, userId: promoted.userId, rsvpStatus: 'GOING' } });
      await tx.eventWaitlist.delete({ where: { id: promoted.id } });
      return { promoted: promotedAttendee };
    });

    if (!result) return res.status(404).json({ success: false, error: 'RSVP not found' });
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, capacity: true } });
    const attendeeCount = await prisma.eventAttendee.count({ where: { eventId, rsvpStatus: 'GOING' } });
    const waitlist = await prisma.eventWaitlist.findMany({ where: { eventId }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
    res.json({ success: true, data: {
      event,
      cancelledUserId: userId,
      promotedUserId: result.promoted?.userId ?? null,
      promoted: Boolean(result.promoted),
      attendeeCount,
      capacity: event?.capacity ?? null,
      isFull: event?.capacity !== null && event !== null && attendeeCount >= event.capacity,
      waitlist: waitlist.map((entry, index) => ({ userId: entry.userId, position: index + 1 })),
    } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to cancel RSVP' });
  }
});

// DELETE /api/events/:eventId/waitlist - Leave the waiting list
router.delete('/:eventId/waitlist', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = getRouteParamId(req.params.eventId);
    const userId = req.userId!;
    if (!eventId) return res.status(400).json({ success: false, error: 'Event ID is required' });

    const deleted = await prisma.eventWaitlist.deleteMany({ where: { eventId, userId } });
    if (deleted.count === 0) return res.status(404).json({ success: false, error: 'Waitlist entry not found' });

    const waitlist = await prisma.eventWaitlist.findMany({ where: { eventId }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
    res.json({ success: true, data: { status: null, waitlist: waitlist.map((entry, index) => ({ userId: entry.userId, position: index + 1 })) } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to cancel waitlist entry' });
  }
});

// GET /api/events/me/organized - My organized events
router.get('/me/organized', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const status = req.query.status as string | undefined;

    const events = await prisma.event.findMany({
      where: { organizerId: userId },
      include: lightIncludes(userId),
      orderBy: { startAt: 'desc' },
    });

    let filtered = events;
    if (status) {
      filtered = events.filter(e => {
        const eventStatus = getEventStatus(e.startAt, e.endAt);
        return eventStatus === status.toUpperCase();
      });
    }

    const shaped = await Promise.all(filtered.map(shapeLightEvent));
    const formattedEvents = shaped.map(e => formatEventResponse(e, userId));
    res.json({ success: true, data: formattedEvents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch organized events' });
  }
});

// GET /api/events/me/attending - My attended events
router.get('/me/attending', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const status = req.query.status as string | undefined;

    const attendances = await prisma.eventAttendee.findMany({
      where: { userId },
      include: {
        event: {
          include: lightIncludes(userId),
        },
      },
      orderBy: { event: { startAt: 'desc' } },
    });

    let events = attendances.map(a => a.event);
    if (status) {
      events = events.filter(e => {
        const eventStatus = getEventStatus(e.startAt, e.endAt);
        return eventStatus === status.toUpperCase();
      });
    }

    const shaped = await Promise.all(events.map(shapeLightEvent));
    const formattedEvents = shaped.map(e => formatEventResponse(e, userId));
    res.json({ success: true, data: formattedEvents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch attended events' });
  }
});

// GET /api/events/personalized - Events matching the caller's existing sub-interests
router.get('/personalized', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const preferences = await prisma.eventInterest.findMany({
      where: { event: { attendees: { some: { userId } } } },
      select: { subInterestId: true },
    });
    const subInterestIds = preferences.map(preference => preference.subInterestId);
    if (subInterestIds.length === 0) return res.json({ success: true, data: [] });

    const events = await prisma.event.findMany({
      where: { interests: { some: { subInterestId: { in: subInterestIds } } } },
      include: lightIncludes(userId),
      orderBy: { startAt: 'desc' },
    });
    const shaped = await Promise.all(events.map(shapeLightEvent));
    res.json({ success: true, data: shaped.map(event => formatEventResponse(event, userId)) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch personalized events' });
  }
});

export default router;