// @ts-nocheck
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFeedback extends Document {
  user: Types.ObjectId;
  issue?: Types.ObjectId;
  category: 'general' | 'service-quality' | 'issue-resolution' | 'suggestion' | 'complaint' | 'compliment';
  rating: number;
  message: string;
  anonymous: boolean;
  status: 'pending' | 'reviewed' | 'addressed';
  adminResponse?: string;
  reviewedAt?: Date;
  addressedAt?: Date;
  markAsReviewed(adminResponse?: string): Promise<this>;
  markAsAddressed(): Promise<this>;
}

const feedbackSchema = new Schema<IFeedback>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  issue: {
    type: Schema.Types.ObjectId,
    ref: 'Issue',
    default: null
  },
  category: {
    type: String,
    enum: ['general', 'service-quality', 'issue-resolution', 'suggestion', 'complaint', 'compliment'],
    required: [true, 'Category is required'],
    default: 'general'
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  anonymous: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'addressed'],
    default: 'pending'
  },
  adminResponse: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin response cannot exceed 1000 characters']
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  addressedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

feedbackSchema.methods.markAsReviewed = function(adminResponse = '') {
  this.status = 'reviewed';
  this.reviewedAt = new Date();
  if (adminResponse) {
    this.adminResponse = adminResponse;
  }
  return this.save();
};

feedbackSchema.methods.markAsAddressed = function() {
  this.status = 'addressed';
  this.addressedAt = new Date();
  return this.save();
};

feedbackSchema.index({ user: 1 });
feedbackSchema.index({ issue: 1 });
feedbackSchema.index({ category: 1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ createdAt: -1 });

export const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);
export default Feedback;
