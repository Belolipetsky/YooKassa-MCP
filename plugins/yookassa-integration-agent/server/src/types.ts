export type JsonObject = Record<string, unknown>;

export type Operation = {
  id: string;
  method: "GET" | "POST";
  path: string;
  summary: string;
  description: string;
  write: boolean;
  idempotenceKey: boolean;
  required: string[];
  documentationUrl: string;
};

export type SafeError = {
  ok: false;
  error: {
    code: string;
    message: string;
    nextStep: string;
    httpStatus?: number;
    parameter?: string;
  };
};

export type SafeSuccess<T> = {
  ok: true;
  data: T;
};

export type SafeResult<T> = SafeSuccess<T> | SafeError;
