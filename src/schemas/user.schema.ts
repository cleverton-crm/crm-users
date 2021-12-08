import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, model, PaginateModel } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({
  collation: { locale: 'en_US', strength: 1, caseLevel: true },
  timestamps: true,
})
export class User extends Document {
  @Prop({ type: String, default: uuidv4 })
  _id: string; // UUID v4

  @Prop({ type: Boolean, default: true })
  active: boolean; // Active or archive user

  @Prop({ type: String, default: 'member' })
  type: string; // Type objects: member

  @Prop({ type: String, default: null, index: true, unique: true })
  email: string; // User email

  @Prop({ type: String, default: null })
  password: string; // User password

  @Prop({ type: Array, default: [] })
  roles: User.IUserRolesArray; // Roles

  @Prop({ type: String, default: 'Guest' })
  permissions: string; // Permission in dashboard. Default: Guest

  @Prop({ type: String, default: null, index: true })
  verification: string; //  Verification link JWT key for 3 days

  @Prop({ type: Boolean, default: false })
  isVerify: boolean; // JWT Key verification

  @Prop({ type: Boolean, default: false })
  ban: boolean; // Ban

  @Prop({ type: String, default: null })
  banReason: string; // Ban reason

  @Prop({ type: String, default: null })
  accessToken: string;

  @Prop({ type: String, default: null })
  refreshToken: string;

  @Prop({ type: Number, default: 0 })
  attemptsLogin?: number;

  @Prop({ type: Date, default: Date.now })
  blockExpires: Date;

  @Prop({ type: Map, default: {} })
  register: Map<string, string>; // Registration data: IP, Location, Address, City and more
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserModel<T extends Document> = PaginateModel<T>;
export const UserModel: UserModel<User> = model<User>(
  'User',
  UserSchema,
) as UserModel<User>;
