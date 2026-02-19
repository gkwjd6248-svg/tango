import { Controller, Get, Query } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { ProductsService } from './products.service';

@Controller('affiliates')
export class AffiliatesController {
  constructor(
    private readonly hotelsService: HotelsService,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * GET /affiliates/hotels
   * Search hotels near a tango event location.
   *
   * Query params:
   *   eventId  - UUID of the event
   *   lat      - Latitude of event venue
   *   lng      - Longitude of event venue
   *   checkIn  - Check-in date (YYYY-MM-DD)
   *   checkOut - Check-out date (YYYY-MM-DD)
   *   radius   - Search radius in km (default: 5)
   */
  @Get('hotels')
  async searchHotels(
    @Query('eventId') eventId: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
    @Query('radius') radius?: string,
  ) {
    return this.hotelsService.searchNearEvent(
      eventId,
      parseFloat(lat),
      parseFloat(lng),
      checkIn,
      checkOut,
      radius ? parseFloat(radius) : undefined,
    );
  }

  /**
   * GET /affiliates/products
   * Retrieve active tango product deals.
   *
   * Query params:
   *   category - Optional category filter (shoes | clothing | accessories | music | other)
   *   page     - Page number (default: 1)
   *   limit    - Items per page (default: 20)
   */
  @Get('products')
  async getDeals(
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.getDeals(
      category,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }
}
