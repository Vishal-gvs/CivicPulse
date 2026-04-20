// @ts-nocheck
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IIssue extends Document {
  title: string;
  description: string;
  category: 'infrastructure' | 'sanitation' | 'water' | 'electricity' | 'roads' | 'public-safety' | 'environment' | 'other';
  location: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reportedBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  images: string[];
  votes: { user: Types.ObjectId; votedAt: Date }[];
  comments: { user: Types.ObjectId; text: string; createdAt: Date }[];
  resolveRequests: {
    _id: Types.ObjectId;
    manager: Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected';
    note?: string;
    requestedAt: Date;
    handledAt?: Date;
  }[];
  estimatedResolution?: Date;
  actualResolution?: Date;
  tags: string[];
  voteCount: number;
  commentCount: number;
  hasUserVoted(userId: string | Types.ObjectId): boolean;
  addVote(userId: string | Types.ObjectId): Promise<this>;
  removeVote(userId: string | Types.ObjectId): Promise<this>;
  addComment(userId: string | Types.ObjectId, text: string): Promise<this>;
  updateStatus(newStatus: 'open' | 'in-progress' | 'resolved', assignedTo?: Types.ObjectId | null): Promise<this>;
}

const issueSchema = new Schema<IIssue>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [20, 'Description must be at least 20 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['infrastructure', 'sanitation', 'water', 'electricity', 'roads', 'public-safety', 'environment', 'other']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    minlength: [3, 'Location must be at least 3 characters'],
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reported by is required']
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  images: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(v) || /^uploads\/.+\.(jpg|jpeg|png|gif)$/i.test(v);
      },
      message: 'Invalid image URL format'
    }
  }],
  votes: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  estimatedResolution: { type: Date, default: null },
  actualResolution: { type: Date, default: null },
  resolveRequests: [{
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters']
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    handledAt: {
      type: Date,
      default: null
    }
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }]
}, {
  timestamps: true
});

issueSchema.virtual('voteCount').get(function() {
  return this.votes ? this.votes.length : 0;
});

issueSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

issueSchema.methods.hasUserVoted = function(userId: Types.ObjectId | string) {
  return this.votes.some((vote: any) => vote.user.toString() === userId.toString());
};

issueSchema.methods.addVote = function(userId: Types.ObjectId | string) {
  if (!this.hasUserVoted(userId)) {
    this.votes.push({ user: userId as Types.ObjectId, votedAt: new Date() });
    return this.save();
  }
  throw new Error('User has already voted on this issue');
};

issueSchema.methods.removeVote = function(userId: Types.ObjectId | string) {
  this.votes = this.votes.filter((vote: any) => vote.user.toString() !== userId.toString());
  return this.save();
};

issueSchema.methods.addComment = function(userId: Types.ObjectId | string, text: string) {
  this.comments.push({ user: userId as Types.ObjectId, text, createdAt: new Date() });
  return this.save();
};

issueSchema.methods.updateStatus = function(newStatus: 'open' | 'in-progress' | 'resolved', assignedTo: Types.ObjectId | null = null) {
  this.status = newStatus;
  if (assignedTo) {
    this.assignedTo = assignedTo;
  }
  if (newStatus === 'resolved') {
    this.actualResolution = new Date();
  }
  return this.save();
};

issueSchema.index({ title: 'text', description: 'text', location: 'text' });
issueSchema.index({ category: 1 });
issueSchema.index({ status: 1 });
issueSchema.index({ reportedBy: 1 });
issueSchema.index({ assignedTo: 1 });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ priority: 1 });

issueSchema.set('toJSON', { virtuals: true });

export const Issue = mongoose.model<IIssue>('Issue', issueSchema);
export default Issue;
