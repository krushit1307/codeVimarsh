const express = require('express');

const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');

const router = express.Router();

const slugify = (value) => {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const normalizeTeamSlug = async (team) => {
  const normalized = slugify(team?.slug);
  if (team && normalized && team.slug !== normalized) {
    await Team.updateOne({ _id: team._id }, { $set: { slug: normalized } }).catch(() => null);
    return { ...team, slug: normalized };
  }
  return team;
};

// @route   GET /api/teams
// @desc    List active teams (public)
router.get('/', async (req, res) => {
  try {
    const teamsRaw = await Team.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    const teams = await Promise.all(teamsRaw.map((t) => normalizeTeamSlug(t)));
    const teamIds = teams.map((t) => t._id);

    const counts = await TeamMember.aggregate([
      { $match: { team: { $in: teamIds }, isActive: true } },
      { $group: { _id: '$team', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    const data = teams.map((t) => ({
      ...t,
      membersCount: countMap.get(String(t._id)) || 0,
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Public list teams error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching teams',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   GET /api/teams/:slug
// @desc    Get a single team by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const rawSlug = String(req.params.slug || '').toLowerCase().trim();
    const slug = slugify(rawSlug);
    if (!slug) {
      return res.status(400).json({ success: false, message: 'Invalid team slug' });
    }

    let team = await Team.findOne({ slug, isActive: true }).lean();
    if (!team && rawSlug && rawSlug !== slug) {
      // Fallback for legacy slugs saved with spaces
      team = await Team.findOne({ slug: rawSlug, isActive: true }).lean();
    }
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    team = await normalizeTeamSlug(team);

    const membersCount = await TeamMember.countDocuments({ team: team._id, isActive: true });

    return res.json({ success: true, data: { ...team, membersCount } });
  } catch (error) {
    console.error('Public get team error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching team',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   GET /api/teams/:slug/members
// @desc    List active members for a team (public)
router.get('/:slug/members', async (req, res) => {
  try {
    const rawSlug = String(req.params.slug || '').toLowerCase().trim();
    const slug = slugify(rawSlug);
    if (!slug) {
      return res.status(400).json({ success: false, message: 'Invalid team slug' });
    }

    let team = await Team.findOne({ slug, isActive: true }).lean();
    if (!team && rawSlug && rawSlug !== slug) {
      team = await Team.findOne({ slug: rawSlug, isActive: true }).lean();
    }
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    team = await normalizeTeamSlug(team);

    const members = await TeamMember.find({ team: team._id, isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.json({ success: true, data: members });
  } catch (error) {
    console.error('Public list team members error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching team members',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;
