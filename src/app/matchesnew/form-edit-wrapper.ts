export enum FormAction {
  Add = 'add',
  Edit = 'edit',
  EMPTY = '',
};

export type FormActionWrapper<T> = {
  action: FormAction;
} & T;
