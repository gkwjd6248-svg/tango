import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliatesController } from './affiliates.controller';
import { HotelsService } from './hotels.service';
import { ProductsService } from './products.service';
import { HotelAffiliate } from './entities/hotel-affiliate.entity';
import { ProductDeal } from './entities/product-deal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HotelAffiliate, ProductDeal])],
  controllers: [AffiliatesController],
  providers: [HotelsService, ProductsService],
  exports: [HotelsService, ProductsService],
})
export class AffiliatesModule {}
