import { RolesSchema } from '../schemas/roles.schema';

export const RolesProvider = {
  name: 'Roles',
  useFactory: () => {
    RolesSchema.set('toJSON', { virtuals: true });
    RolesSchema.set('toObject', { virtuals: true });
    return RolesSchema;
  },
};
