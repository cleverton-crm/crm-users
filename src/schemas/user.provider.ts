import { UserSchema } from './user.schema';

export const UserProvider = {
  name: 'User',
  useFactory: () => {
    UserSchema.set('toJSON', { virtuals: true });
    UserSchema.set('toObject', { virtuals: true });
    return UserSchema;
  },
};
