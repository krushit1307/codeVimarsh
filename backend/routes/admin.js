const express = require('express');
const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary');

const requireAdmin = require('../middleware/requireAdmin');

const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const { DEFAULT_EVENT_SLUGS } = require('../services/eventSeeder');

const router = express.Router();

const slugify = (value) => {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

router.use(requireAdmin);

router.get('/cloudinary/signature', async (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary credentials are not configured on the server',
      });
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'codevimarsh';
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      apiSecret
    );

    return res.json({
      success: true,
      data: {
        timestamp,
        signature,
        apiKey,
        cloudName,
        folder,
      },
    });
  } catch (error) {
    console.error('Admin cloudinary signature error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while generating cloudinary signature',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.delete('/events/seeded', async (req, res) => {
  try {
    const result = await Event.deleteMany({ slug: { $in: DEFAULT_EVENT_SLUGS } });
    return res.json({ success: true, data: { deletedCount: result.deletedCount || 0 } });
  } catch (error) {
    console.error('Admin delete seeded events error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting seeded events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// List endpoints for dashboard
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find({}).sort({ date: 1, createdAt: -1 }).lean();
    return res.json({ success: true, data: events });
  } catch (error) {
    console.error('Admin list events error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.get('/teams', async (req, res) => {
  try {
    const teams = await Team.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: teams });
  } catch (error) {
    console.error('Admin list teams error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching teams',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.get('/teams/:teamId/members', async (req, res) => {
  try {
    const { teamId } = req.params;
    if (!mongoose.isValidObjectId(teamId)) {
      return res.status(400).json({ success: false, message: 'Invalid team id' });
    }

    const members = await TeamMember.find({ team: teamId })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.json({ success: true, data: members });
  } catch (error) {
    console.error('Admin list members error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching team members',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Events CRUD
router.post('/events', async (req, res) => {
  try {
    const { slug, title, description, date, time, mode, location, image } = req.body || {};

    if (!slug || !title || !description || !date || !time || !mode || !location || !image) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const event = await Event.create({
      slug: String(slug).toLowerCase().trim(),
      title: String(title).trim(),
      description: String(description).trim(),
      date: new Date(date),
      time: String(time).trim(),
      mode,
      location: String(location).trim(),
      image: String(image).trim(),
      registeredCount: 0,
    });

    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('Admin create event error:', error);
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Event slug already exists' });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error while creating event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.put('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event id' });
    }

    const update = {};
    const fields = ['slug', 'title', 'description', 'date', 'time', 'mode', 'location', 'image'];
    for (const f of fields) {
      if (req.body?.[f] !== undefined) {
        update[f] = req.body[f];
      }
    }
    if (update.slug) update.slug = String(update.slug).toLowerCase().trim();
    if (update.title) update.title = String(update.title).trim();
    if (update.description) update.description = String(update.description).trim();
    if (update.location) update.location = String(update.location).trim();
    if (update.image) update.image = String(update.image).trim();
    if (update.time) update.time = String(update.time).trim();
    if (update.date) update.date = new Date(update.date);

    const event = await Event.findByIdAndUpdate(eventId, { $set: update }, { new: true });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    return res.json({ success: true, data: event });
  } catch (error) {
    console.error('Admin update event error:', error);
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Event slug already exists' });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error while updating event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.delete('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event id' });
    }

    const event = await Event.findByIdAndDelete(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await EventRegistration.deleteMany({ event: event._id });

    return res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('Admin delete event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Registrations by event
router.get('/events/:eventId/registrations', async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event id' });
    }

    const regs = await EventRegistration.find({ event: eventId })
      .select('firstName lastName userEmail createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const data = regs.map((r) => ({
      firstName: r.firstName || '',
      lastName: r.lastName || '',
      email: r.userEmail,
      registeredAt: r.createdAt,
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Admin registrations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching registrations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   GET /api/admin/users/profile?email=...
// @desc    Admin: fetch full user profile data (User + UserProfile)
// @access  Private (Admin)
router.get('/users/profile', async (req, res) => {
  try {
    const email = String(req.query?.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const profile = await UserProfile.findOne({ user: user._id }).lean();

    return res.json({
      success: true,
      data: {
        user,
        profile,
      },
    });
  } catch (error) {
    console.error('Admin get user profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Teams CRUD
router.post('/teams', async (req, res) => {
  try {
    const { slug, title, description, color, icon } = req.body || {};
    if (!slug || !title || !description || !color || !icon) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const team = await Team.create({
      slug: slugify(slug),
      title: String(title).trim(),
      description: String(description).trim(),
      color: String(color).trim(),
      icon: String(icon).trim(),
      isActive: true,
    });

    return res.status(201).json({ success: true, data: team });
  } catch (error) {
    console.error('Admin create team error:', error);
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Team slug already exists' });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error while creating team',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.put('/teams/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    if (!mongoose.isValidObjectId(teamId)) {
      return res.status(400).json({ success: false, message: 'Invalid team id' });
    }

    const update = {};
    const fields = ['slug', 'title', 'description', 'color', 'icon', 'isActive'];
    for (const f of fields) {
      if (req.body?.[f] !== undefined) update[f] = req.body[f];
    }
    if (update.slug) update.slug = slugify(update.slug);
    if (update.title) update.title = String(update.title).trim();
    if (update.description) update.description = String(update.description).trim();
    if (update.color) update.color = String(update.color).trim();
    if (update.icon) update.icon = String(update.icon).trim();

    const team = await Team.findByIdAndUpdate(teamId, { $set: update }, { new: true });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    return res.json({ success: true, data: team });
  } catch (error) {
    console.error('Admin update team error:', error);
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Team slug already exists' });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error while updating team',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.delete('/teams/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    if (!mongoose.isValidObjectId(teamId)) {
      return res.status(400).json({ success: false, message: 'Invalid team id' });
    }

    const team = await Team.findByIdAndDelete(teamId);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    await TeamMember.deleteMany({ team: team._id });

    return res.json({ success: true, message: 'Team deleted' });
  } catch (error) {
    console.error('Admin delete team error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting team',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Team Members CRUD
router.post('/teams/:teamId/members', async (req, res) => {
  try {
    const { teamId } = req.params;
    if (!mongoose.isValidObjectId(teamId)) {
      return res.status(400).json({ success: false, message: 'Invalid team id' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    const { firstName, lastName, role, linkedin, image, order } = req.body || {};
    if (!firstName || !lastName || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const member = await TeamMember.create({
      team: team._id,
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      role: String(role).trim(),
      linkedin: linkedin ? String(linkedin).trim() : null,
      image: image ? String(image).trim() : null,
      order: typeof order === 'number' ? order : 0,
      isActive: true,
    });

    return res.status(201).json({ success: true, data: member });
  } catch (error) {
    console.error('Admin create member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.put('/members/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    if (!mongoose.isValidObjectId(memberId)) {
      return res.status(400).json({ success: false, message: 'Invalid member id' });
    }

    const update = {};
    const fields = ['firstName', 'lastName', 'role', 'linkedin', 'image', 'order', 'isActive'];
    for (const f of fields) {
      if (req.body?.[f] !== undefined) update[f] = req.body[f];
    }
    if (update.firstName) update.firstName = String(update.firstName).trim();
    if (update.lastName) update.lastName = String(update.lastName).trim();
    if (update.role) update.role = String(update.role).trim();
    if (update.linkedin !== undefined) update.linkedin = update.linkedin ? String(update.linkedin).trim() : null;
    if (update.image !== undefined) update.image = update.image ? String(update.image).trim() : null;

    const member = await TeamMember.findByIdAndUpdate(memberId, { $set: update }, { new: true });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    return res.json({ success: true, data: member });
  } catch (error) {
    console.error('Admin update member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.delete('/members/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    if (!mongoose.isValidObjectId(memberId)) {
      return res.status(400).json({ success: false, message: 'Invalid member id' });
    }

    const member = await TeamMember.findByIdAndDelete(memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    return res.json({ success: true, message: 'Member deleted' });
  } catch (error) {
    console.error('Admin delete member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;
