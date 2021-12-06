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

    /**
     * Changing the user password when the master password is available
     */
    export interface ChangePassword {
      password: string;
      password_new: string;
      password_confirm: string;
    }
  }

  export type IUserRolesName = 'Admin' | 'Guest' | 'Customer';

  export interface IUserRoles {
    name: string;
    permissions?: string;
  }

  export type IUserRolesArray = IUserRoles[];

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
    /** Используется при правильном ответе */
    export interface Success {
      statusCode: number;
      message: string;
      status?: boolean;
    }
    /** Используется при не правильном ответе */
    export interface Failure {
      statusCode: number;
      message: string;
      status?: boolean;
    }

    /** Ошибочные данные - объект не найден*/
    export interface NotFound {
      statusCode: number;
      message: string | string[];
      error: string;
    }

    /** Ошибочные данные - не правильный запрос */
    export interface BadRequest {
      statusCode: number;
      message: string | string[];
      error: string;
    }

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
