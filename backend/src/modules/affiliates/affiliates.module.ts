import { Module } from '@nestjs/common';
import { AffiliatesController } from './affiliates.controller';
import { HotelsService } from './hotels.service';
import { ProductsService } from './products.service';

@Module({
  controllers: [AffiliatesController],
  providers: [HotelsService, ProductsService],
  exports: [HotelsService, ProductsService],
})
export class AffiliatesModule {}
