
export interface Result<T> {
  data?: T;
  error?: string;
};

export function Result_Ok<T>(data: T): Result<T> {
  return { data: data };
}

export function Result_Err<T>(error: string): Result<T> {
  return { error: error };
}


