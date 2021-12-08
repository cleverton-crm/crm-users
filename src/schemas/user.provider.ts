import { User, UserSchema } from './user.schema';
import * as bcrypt from 'bcryptjs';

export const UserProvider = {
  name: 'User',
  useFactory: () => {
    UserSchema.set('toJSON', { virtuals: true });
    UserSchema.set('toObject', { virtuals: true });
    UserSchema.pre<User>('save', async function (next) {
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
