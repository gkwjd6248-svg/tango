import { Controller, Get, Query } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { ProductsService } from './products.service';

@Controller('affiliates')
export class AffiliatesController {
  constructor(
    private readonly hotelsService: HotelsService,
    private readonly productsService: ProductsService,
  ) {}

  @Get('hotels')
  async searchHotels(
    @Query('eventId') eventId: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
  ) {
    return this.hotelsService.searchNearEvent(
      eventId,
      parseFloat(lat),
      parseFloat(lng),
      checkIn,
      checkOut,
    );
  }

  @Get('products')
  async getDeals(@Query('category') category?: string) {
    return this.productsService.getDeals(category);
  }
}
