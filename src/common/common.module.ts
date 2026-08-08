import { Global, Module } from '@nestjs/common';
import { OwnerResolverService } from './services/owner-resolver.service';

@Global()
@Module({
  providers: [OwnerResolverService],
  exports: [OwnerResolverService],
})
export class CommonModule {}
