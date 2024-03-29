import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class Profile extends Document {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ type: String, unique: true })
  email: string;

  @Prop({ type: String, unique: true })
  owner: string;

  @Prop({ type: String, default: 'profile' })
  object: string;

  @Prop({ type: String, default: 'member' })
  type: string;

  @Prop({ type: String, default: 'active' })
  status: string;
}
export type ProfileDocument = Profile & Document;
export const ProfileSchema = SchemaFactory.createForClass(Profile);
