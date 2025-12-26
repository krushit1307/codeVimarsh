const express = require('express');
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');

const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const getBearerToken = (req) => {
  const header = req.header('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
};

const getSupabaseUserFromRequest = async (req) => {
  const token = getBearerToken(req);
  if (!token) return null;
  if (!supabase) {
    const err = new Error('Supabase is not configured on the server');
    err.status = 500;
    throw err;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    const err = new Error('Invalid token');
    err.status = 401;
    throw err;
  }

  return data.user;
};

// @route   GET /api/events
// @desc    List events with registeredCount. If Authorization provided, also returns hasRegistered per event.
// @access  Public (hasRegistered is best-effort)
router.get('/', async (req, res) => {
  try {
    const authHeader = req.header('Authorization');

    const events = await Event.find({}).sort({ date: 1, createdAt: -1 }).lean();

    let hasRegisteredByEventId = {};
    if (authHeader) {
      try {
        const user = await getSupabaseUserFromRequest(req);
        const regs = await EventRegistration.find({ userSupabaseId: user.id })
          .select('event')
          .lean();
        hasRegisteredByEventId = regs.reduce((acc, r) => {
          acc[String(r.event)] = true;
          return acc;
        }, {});
      } catch {
        // ignore token errors for this endpoint
      }
    }

    const data = events.map((e) => ({
      ...e,
      hasRegistered: !!hasRegisteredByEventId[String(e._id)],
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('List events error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   POST /api/events/:eventId/register
// @desc    Register current user for an event, prevent duplicates, increment registeredCount
// @access  Private (Supabase auth)
router.post('/:eventId/register', async (req, res) => {
  try {
    const user = await getSupabaseUserFromRequest(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const eventId = req.params.eventId;
    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event id',
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const userEmail = (user.email || '').toLowerCase().trim();
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'Authenticated user has no email',
      });
    }

    const userName =
      req.body?.name ||
      user.user_metadata?.full_name ||
      [user.user_metadata?.firstName, user.user_metadata?.lastName].filter(Boolean).join(' ') ||
      null;

    const firstName =
      req.body?.firstName ||
      user.user_metadata?.firstName ||
      user.user_metadata?.first_name ||
      null;
    const lastName =
      req.body?.lastName ||
      user.user_metadata?.lastName ||
      user.user_metadata?.last_name ||
      null;

    let registrationDoc;
    try {
      registrationDoc = await EventRegistration.create({
        event: event._id,
        userSupabaseId: user.id,
        firstName: firstName ? String(firstName).trim() : null,
        lastName: lastName ? String(lastName).trim() : null,
        userEmail,
        userName,
      });
    } catch (createErr) {
      if (createErr?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'You have already registered for this event',
        });
      }
      throw createErr;
    }

    try {
      const updateResult = await Event.updateOne(
        { _id: event._id },
        { $inc: { registeredCount: 1 } }
      );

      if (updateResult?.matchedCount !== 1) {
        await EventRegistration.deleteOne({ _id: registrationDoc._id });
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }
    } catch (incErr) {
      await EventRegistration.deleteOne({ _id: registrationDoc._id });
      throw incErr;
    }

    const updatedEvent = await Event.findById(eventId).lean();

    return res.status(201).json({
      success: true,
      message: 'Registered successfully',
      data: {
        event: {
          ...updatedEvent,
          hasRegistered: true,
        },
        registration: registrationDoc || null,
      },
    });
  } catch (error) {
    const status = error?.status || 500;

    console.error('Event registration error:', error);

    return res.status(status).json({
      success: false,
      message: status === 401 ? 'Unauthorized' : 'Server error during event registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;
