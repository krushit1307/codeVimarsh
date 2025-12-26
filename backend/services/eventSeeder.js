const Event = require('../models/Event');

const DEFAULT_EVENTS = [
  {
    slug: 'dsa-bootcamp',
    title: 'DSA Bootcamp',
    description: 'Intensive 3-day workshop covering arrays, linked lists, trees, and dynamic programming.',
    date: new Date('2024-02-15T00:00:00.000Z'),
    time: '10:00 AM',
    mode: 'Offline',
    location: 'Main Auditorium',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
  },
  {
    slug: 'web-dev-hackathon',
    title: 'Web Dev Hackathon',
    description: '24-hour hackathon to build innovative web applications using modern technologies.',
    date: new Date('2024-02-20T00:00:00.000Z'),
    time: '9:00 AM',
    mode: 'Hybrid',
    location: 'Tech Lab',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=250&fit=crop',
  },
  {
    slug: 'competitive-programming',
    title: 'Competitive Programming',
    description: 'Weekly CP session focusing on problem-solving techniques and contest strategies.',
    date: new Date('2024-02-25T00:00:00.000Z'),
    time: '5:00 PM',
    mode: 'Online',
    location: 'Discord',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop',
  },
  {
    slug: 'ai-ml-workshop',
    title: 'AI/ML Workshop',
    description: 'Hands-on workshop covering machine learning fundamentals and neural networks.',
    date: new Date('2024-03-01T00:00:00.000Z'),
    time: '2:00 PM',
    mode: 'Hybrid',
    location: 'Innovation Center',
    image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=250&fit=crop',
  },
  {
    slug: 'mobile-app-development',
    title: 'Mobile App Development',
    description: 'Learn to build cross-platform mobile apps using React Native.',
    date: new Date('2024-03-05T00:00:00.000Z'),
    time: '11:00 AM',
    mode: 'Online',
    location: 'Zoom',
    image: 'https://images.unsplash.com/photo-1512941937609-b56c5baeb8d8?w=400&h=250&fit=crop',
  },
  {
    slug: 'cloud-computing-basics',
    title: 'Cloud Computing Basics',
    description: 'Introduction to cloud services, deployment, and scalability concepts.',
    date: new Date('2024-03-10T00:00:00.000Z'),
    time: '3:00 PM',
    mode: 'Offline',
    location: 'Computer Lab',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop',
  },
];

const DEFAULT_EVENT_SLUGS = DEFAULT_EVENTS.map((e) => e.slug);

const ensureDefaultEvents = async () => {
  await Event.updateMany(
    { registeredCount: { $exists: false } },
    { $set: { registeredCount: 0 } }
  );

  const shouldSeed = String(process.env.SEED_DEFAULT_EVENTS || '').toLowerCase() === 'true';
  if (!shouldSeed) return;

  for (const ev of DEFAULT_EVENTS) {
    await Event.updateOne({ slug: ev.slug }, { $setOnInsert: { ...ev, registeredCount: 0 } }, { upsert: true });
  }
};

module.exports = {
  ensureDefaultEvents,
  DEFAULT_EVENT_SLUGS,
};
