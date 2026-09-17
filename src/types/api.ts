export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiPaginated<T> = {
  success: true;
  message: string;
  data: T[];
  pagination: Pagination;
};

export type ApiError = {
  success: false;
  message: string;
  data: null;
  errors?: unknown;
};

export type Jsonified<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Jsonified<U>[]
    : T extends object
      ? { [K in keyof T]: Jsonified<T[K]> }
      : T;

export type ApiResult<T> = ApiSuccess<Jsonified<T>> | ApiError;
export type ApiPaginatedResult<T> = ApiPaginated<Jsonified<T>> | ApiError;
