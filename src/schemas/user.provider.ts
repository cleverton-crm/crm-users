import { Users, UserSchema } from './user.schema';
import * as bcrypt from 'bcryptjs';
import mongoosePaginator = require('mongoose-paginate-v2');
import {Core} from "crm-core";

export const UserProvider = {
  name: 'User',
  useFactory: () => {

    mongoosePaginator.paginate.options = {
      limit: 25,
      customLabels: Core.ResponseDataLabels,
    };
    UserSchema.plugin(mongoosePaginator);
    UserSchema.set('toJSON', { virtuals: true });
    UserSchema.set('toObject', { virtuals: true });
    UserSchema.pre<Users>('save', async function (next) {
      try {
        if (!this.isModified('password')) {
          return next();
        }
        this.password = await bcrypt.hash(this.password, 10);
        return next();
      } catch (e) {
        return next(e.message);
      }
    });
    return UserSchema;
  },
};
