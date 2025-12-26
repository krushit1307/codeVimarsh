const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Event slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Event title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      maxlength: [2000, 'Event description cannot exceed 2000 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
      index: true,
    },
    time: {
      type: String,
      required: [true, 'Event time is required'],
      trim: true,
    },
    mode: {
      type: String,
      required: [true, 'Event mode is required'],
      enum: ['Online', 'Offline', 'Hybrid'],
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Event image is required'],
      trim: true,
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: [0, 'registeredCount cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ slug: 1 }, { unique: true });
eventSchema.index({ date: 1, createdAt: -1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
