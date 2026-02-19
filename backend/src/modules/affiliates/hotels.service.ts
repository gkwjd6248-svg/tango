import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HotelAffiliate } from './entities/hotel-affiliate.entity';

export interface HotelSearchResult {
  id: string;
  hotelName: string;
  hotelAddress: string;
  latitude: number;
  longitude: number;
  distanceFromEventMeters: number;
  pricePerNightMin: number;
  currency: string;
  rating: number;
  reviewCount: number;
  affiliateProvider: string;
  affiliateUrl: string;
  imageUrl: string;
  amenities: string[];
}

@Injectable()
export class HotelsService {
  constructor(
    @InjectRepository(HotelAffiliate)
    private readonly hotelRepo: Repository<HotelAffiliate>,
  ) {}

  /**
   * Search hotels stored in hotel_affiliates near a given event location.
   * Uses PostGIS ST_DWithin for geospatial filtering and orders results by distance.
   *
   * @param eventId   - UUID of the related tango event
   * @param lat       - Latitude of the search centre (event venue)
   * @param lng       - Longitude of the search centre (event venue)
   * @param checkIn   - Check-in date string (YYYY-MM-DD); passed through for future API use
   * @param checkOut  - Check-out date string (YYYY-MM-DD); passed through for future API use
   * @param radiusKm  - Search radius in kilometres (default: 5)
   */
  async searchNearEvent(
    eventId: string,
    lat: number,
    lng: number,
    checkIn: string,
    checkOut: string,
    radiusKm: number = 5,
  ): Promise<HotelSearchResult[]> {
    const radiusMeters = radiusKm * 1000;

    // Use QueryBuilder with raw PostGIS expression for distance calculation.
    // ST_Distance returns metres when the geography type is used.
    const hotels = await this.hotelRepo
      .createQueryBuilder('hotel')
      .addSelect(
        `ST_Distance(
           hotel.location,
           ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
         )`,
        'distance_m',
      )
      .where('hotel.eventId = :eventId', { eventId })
      .andWhere(
        `ST_DWithin(
           hotel.location,
           ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
           :radius
         )`,
        { lat, lng, radius: radiusMeters },
      )
      .orderBy('distance_m', 'ASC')
      .setParameters({ lat, lng, radius: radiusMeters, eventId })
      .getMany();

    return hotels.map((h) => ({
      id: h.id,
      hotelName: h.hotelName,
      hotelAddress: h.hotelAddress,
      latitude: h.latitude,
      longitude: h.longitude,
      distanceFromEventMeters: h.distanceFromEventMeters,
      pricePerNightMin: Number(h.pricePerNightMin),
      currency: h.currency,
      rating: Number(h.rating),
      reviewCount: h.reviewCount,
      affiliateProvider: h.affiliateProvider,
      affiliateUrl: h.affiliateUrl,
      imageUrl: h.imageUrl,
      amenities: h.amenities ?? [],
    }));
  }
}
