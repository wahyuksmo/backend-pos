import { Module } from '@nestjs/common';
import { PasswordPoliciesController } from './password-policies.controller';
import { PasswordPoliciesService } from './password-policies.service';

@Module({
  controllers: [PasswordPoliciesController],
  providers: [PasswordPoliciesService],
  exports: [PasswordPoliciesService],
})
export class PasswordPoliciesModule {}
