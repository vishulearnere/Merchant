import mongoose, { Schema, Document, Types } from 'mongoose';

export type PaymentLinkStatus = 'ACTIVE' | 'EXPIRED' | 'PAID';

export interface IPaymentLink extends Document {
  linkId: string;
  link: string; // Customer URL string
  amount: number; // Stored in integer paise (e.g. 50000 = ₹500)
  description: string;
  status: PaymentLinkStatus;
  merchant: Types.ObjectId; // Foreign key referencing Merchant
  latestPayment?: Types.ObjectId | null; // Foreign key referencing Payment
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentLinkSchema = new Schema<IPaymentLink>(
  {
    linkId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    link: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v > 0,
        message: 'Amount must be a positive integer in paise (e.g. 50000 for ₹500)',
      },
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'PAID'],
      default: 'ACTIVE',
      index: true,
    },
    merchant: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    latestPayment: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
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

PaymentLinkSchema.virtual('merchantId').get(function () {
  if (this.merchant && typeof this.merchant === 'object' && 'uuid' in (this.merchant as any)) {
    return (this.merchant as any).uuid;
  }
  return this.merchant ? this.merchant.toString() : '';
});

PaymentLinkSchema.index({ merchant: 1, createdAt: -1 });
PaymentLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export const PaymentLink = mongoose.model<IPaymentLink>('PaymentLink', PaymentLinkSchema);
