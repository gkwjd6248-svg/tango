import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface HotelSearchResult {
  hotelName: string;
  address: string;
  pricePerNight: number;
  currency: string;
  rating: number;
  affiliateUrl: string;
  imageUrl: string;
  distanceMeters: number;
}

@Injectable()
export class HotelsService {
  constructor(private readonly config: ConfigService) {}

  async searchNearEvent(
    eventId: string,
    lat: number,
    lng: number,
    checkIn: string,
    checkOut: string,
  ): Promise<HotelSearchResult[]> {
    // TODO: Integrate with Booking.com / Agoda affiliate API
    // 1. Booking.com Affiliate Partner API로 근처 호텔 검색
    // 2. affiliate_id를 포함한 추적 URL 생성
    // 3. 결과를 hotel_affiliates 테이블에 캐싱
    return [];
  }
}
