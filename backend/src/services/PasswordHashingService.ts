import bcrypt from 'bcrypt';

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

export class BcryptHasher implements IPasswordHasher {
  constructor(private saltRounds: number = 10) {}

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

export const passwordHasher: IPasswordHasher = new BcryptHasher();
