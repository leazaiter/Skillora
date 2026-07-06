import { Module } from '@nestjs/common';
import { Pool } from 'pg';

export const DATABASE_POOL = 'DATABASE_POOL';

const databasePool = {
  provide: DATABASE_POOL,
  useFactory: () => {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  },
};

@Module({
  providers: [databasePool],
  exports: [databasePool],
})
export class DatabaseModule {}