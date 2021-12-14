import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ForgotPasswordDocument = ForgotPassword & Document;

@Schema({
  timestamps: true,
})
export class ForgotPassword extends Document {
  @Prop({
    type: String,
    default: null,
    index: true,
    require: true,
    unique: true,
    lowercase: true,
  })
  email: string;

  @Prop({ type: String, default: null })
  verificationKey: string;

  @Prop({ type: String, default: null })
  password: string;

  @Prop({ type: Boolean, default: false })
  stepVerification: boolean;

  @Prop({ type: Boolean, default: false })
  stepReset: boolean;

  @Prop({ type: Map, default: {} })
  location: Map<string, any>;
}

export const ForgotPasswordSchema =
  SchemaFactory.createForClass(ForgotPassword);
