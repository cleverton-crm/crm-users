/** Not found */
export const USER_NOT_FOUND = '404001: User not found';
export const EMAIL_NOT_FOUND = '404002: Email not found';
export const BAD_REQUEST = 'Bad Request';

/** Invalid data */
export const INVALID_CREDENTIALS = '401001: Invalid credentials';
export const INVALID_MFA_CODE = '401002: Invalid one-time code';
export const INVALID_TOKEN = '401003: Invalid token';
export const UNVERIFIED_EMAIL = '401004: Email is not verified';
export const UNVERIFIED_LOCATION = '401005: Location is not verified';
export const MFA_BACKUP_CODE_USED = '401007: Backup code is already used';

export const EMAIL_DELETE_PRIMARY = '400016: Cannot delete primary email';
export const EMAIL_OR_PASSWORD_INCORRECT =
  '401008: Email or password are incorrect';

/** */
export const EMAIL_USER_CONFLICT =
  '409001: User with this email already exists';
export const EMAIL_VERIFIED_CONFLICT = '409002: This email is already verified';
