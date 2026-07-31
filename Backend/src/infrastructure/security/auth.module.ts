import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from '../../presentation/controllers/auth.controller';
import { AuthService, USER_REPOSITORY_TOKEN } from '../../application/services/auth.service';
import { MongoUserRepository } from '../persistence/mongo-user.repository';
import { UserMongooseEntity, UserSchema } from '../persistence/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserMongooseEntity.name, schema: UserSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: MongoUserRepository,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
