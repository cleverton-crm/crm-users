import { ForgotPasswordSchema } from '../schemas/forgot.schema';

export const ForgotPasswordProvider = {
  name: 'ForgotPassword',
  useFactory: () => {
    ForgotPasswordSchema.set('toJSON', { virtuals: true });
    ForgotPasswordSchema.set('toObject', { virtuals: true });
    ForgotPasswordSchema.index({ createdAt: 1 }, { expireAfterSeconds: 43200 });
    return ForgotPasswordSchema;
  },
};
