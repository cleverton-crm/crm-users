import mongodb = require('mongodb');
import mongoose = require('mongoose');


declare module 'mongoose' {

  interface CustomLabels {
    totalDocs?: string | undefined;
    limit?: string | undefined;
    page?: string | undefined;
    totalPages?: string | undefined;
    docs?: string | undefined;
    nextPage?: string | undefined;
    prevPage?: string | undefined;
  }
  interface QueryFindOptions extends mongoose.QueryOptions{}
  interface CollationOptions extends mongodb.CollationOptions{}

  interface ReadOptions {
    pref: string;
    tags?: any[] | undefined;
  }

  interface PaginateOptions {
    select?: object | string | undefined;
    sort?: object | string | undefined;
    customLabels?: CustomLabels | undefined;
    collation?: CollationOptions | undefined;
    populate?: object[] | string[] | object | string | QueryPopulateOptions | undefined;
    lean?: boolean | undefined;
    leanWithId?: boolean | undefined;
    offset?: number | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    read?: ReadOptions | undefined;
    /* If pagination is set to `false`, it will return all docs without adding limit condition. (Default: `true`) */
    pagination?: boolean | undefined;
    projection?: any;
    options?: QueryFindOptions | undefined;
  }

  interface QueryPopulateOptions {
    /** space delimited path(s) to populate */
    path: string;
    /** optional fields to select */
    select?: any;
    /** optional query conditions to match */
    match?: any;
    /** optional model to use for population */
    model?: string | Model<any> | undefined;
    /** optional query options like sort, limit, etc */
    options?: any;
    /** deep populate */
    populate?: QueryPopulateOptions | QueryPopulateOptions[] | undefined;
  }

  interface PaginateResult<T> {
    docs: T[];
    totalDocs: number;
    limit: number;
    page?: number | undefined;
    totalPages: number;
    nextPage?: number | null | undefined;
    prevPage?: number | null | undefined;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    meta?: any;
    [customLabel: string]: T[] | number | boolean | null | undefined;
  }



  export interface PaginateModel<T extends Document> extends Model<T> {
    paginate(
      query?: FilterQuery<T>,
      options?: PaginateOptions,
      callback?: (err: any, result: PaginateResult<T>) => void,
    ): Promise<PaginateResult<T>>;
  }

  function model(name: string, schema?: Schema, collection?: string, skipInit?: boolean): PaginateModel<any>;
}


declare function _(schema: mongoose.Schema): void;
export = _;
declare namespace _ {
  const paginate: { options: mongoose.PaginateOptions };
}
