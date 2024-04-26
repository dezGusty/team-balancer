
export interface Result<T> {
  data?: T;
  error?: string;
};

function Result_Ok<T>(data: T): Result<T> {
  return { data: data };
}

function Result_Err<T>(error: string): Result<T> {
  return { error: error };
}


export namespace Result {
  export function isOk<T>(result: Result<T>): result is Result<T> {
    return result.data !== undefined;
  }

  export function isErr<T>(result: Result<T>): result is Result<T> {
    return result.error !== undefined;
  }

  export function Ok<T>(data: T): Result<T> {
    return Result_Ok(data);
  }

  export function Err<T>(error: string): Result<T> {
    return Result_Err(error);
  }
}