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
    /** Создание пользователя
     * @memberOf User.Params
     * @param email
     * @param password
     * @param isAdmin
     * */
    export interface CreateData {
      email: string;
      password: string;
      isAdmin: boolean;
    }

    export interface PasswordData {
      password: string;
    }

    export interface EmailData {
      email: string;
    }

    export interface VerificationLink {
      verification: string;
    }

    export interface TokenData {
      email: string;
    }

    export interface ArchiveData {
      id: string;
      request: User.Params.TokenData;
      active: boolean;
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

  export type IUserRolesName = 'Admin' | 'Guest' | 'Manager';

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

  /** Роли пользователей */
  export namespace Roles {
    /** Параметры для роли */
    export namespace Params {
      export interface CreateData {
        name: string;
        permissions: string;
      }

      /** Параметры для обновления */
      export interface UpdateData {
        id: string;
        permissions?: string;
        priority: number;
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

    export interface RolesData {
      _id: string;
      id?: string;
      name: string;
      permissions: string;
      priority: number;
    }
  }
}
