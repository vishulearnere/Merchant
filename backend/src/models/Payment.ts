import mongoose, { Schema, Document, Types } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface IPayment extends Document {
  paymentId: string;
  linkId: string;
  link: Types.ObjectId; // Foreign key referencing PaymentLink
  amount: number; // Stored in integer paise (e.g. 50000 = ₹500)
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    linkId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    link: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentLink',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v > 0,
        message: 'Amount must be a positive integer in paise',
      },
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

PaymentSchema.index({ linkId: 1, createdAt: -1 });
PaymentSchema.index(
  { linkId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'SUCCESS' },
  }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
