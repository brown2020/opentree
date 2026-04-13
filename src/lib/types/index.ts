export * from './person';
export * from './tree';
export * from './relationship';
export * from './event';
export * from './media';
export * from './activity';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
