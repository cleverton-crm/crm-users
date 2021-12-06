import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, model, PaginateModel } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class Roles extends Document {
  @Prop({ type: String, default: uuidv4 })
  _id: string;

  @Prop({ type: String, default: null, unique: true, index: true })
  name: string;

  @Prop({ type: String, default: null })
  permissions: string;
}
export const RolesSchema = SchemaFactory.createForClass(Roles);
export type RolesModel<T extends Document> = PaginateModel<T>;
export const RolesModel: RolesModel<Roles> = model<Roles>(
  'Roles',
  RolesSchema,
) as RolesModel<Roles>;
