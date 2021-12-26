import { ProfileSchema } from '../schemas';

export const ProfileProvider = {
  name: 'Profile',
  useFactory: () => {
    return ProfileSchema;
  },
};
