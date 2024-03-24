export enum FormAction {
  Add = 'add',
  Edit = 'edit',
  EMPTY = '',
};

export type Action<T> = {
  action: FormAction;
} & T;
