namespace User {
  export interface IUser {
    _id: string;
    id?: string;
    active: string;
    email: string;
    password: string;
    isVerify: boolean;
    verification: string;
  }

  /**
   * @namespace User.Params
   *
   */
  export namespace Params {
    export interface CreateData {
      email: string;
      password: string;
    }

    export interface PasswordData {
      password: string;
    }

    export interface UpdatedData {
      userId: string;
      data: User.Params.PasswordData;
    }
    export interface EmailData {
      email: string;
    }

    export interface VerificationLink {
      verification: string;
    }
  }
  export namespace Password {
    /**
     * Changing the user password when the master password is available
     */
    export interface ChangePassword {
      email: string;
      password: string;
      password_new: string;
      password_confirm: string;
      access: string;
    }

    export interface ResetPassword {
      password_new: string;
      password_confirm: string;
      verificationKey: string;
    }
  }

  export type IUserRolesName = 'Admin' | 'Guest' | 'Customer';

  export interface IUserRoles {
    name: string;
    permissions?: string;
  }

  export type IUserRolesArray = IUserRoles[];

  export namespace TokenKeys {
    export interface Authorization {
      access: string;
      refresh: string;
    }
  }

  export namespace Roles {
    export namespace Params {
      export interface CreateData {
        name: string;
        permissions: string;
      }
    }
  }

  /**
   * @namespace User.Response
   * Answers in User methods.
   * Allows you to quickly navigate the structure of responses.
   */
  export namespace Response {
    /**
     *  User response data
     */
    export interface UserData {
      _id: string;
      id?: string;
      email: string;
      password: string;
      roles: User.IUserRolesArray;
    }
  }
}
