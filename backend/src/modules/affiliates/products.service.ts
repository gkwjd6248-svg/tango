import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ProductDeal {
  title: string;
  originalPrice: number;
  dealPrice: number;
  currency: string;
  discountPercentage: number;
  affiliateUrl: string;
  imageUrl: string;
  provider: string;
}

@Injectable()
export class ProductsService {
  constructor(private readonly config: ConfigService) {}

  async getDeals(category?: string): Promise<ProductDeal[]> {
    // TODO: Aggregate deals from multiple affiliate APIs
    // 1. Coupang Partners API: 탱고 신발/의류 검색
    // 2. Amazon Product Advertising API: tango shoes/clothing 검색
    // 3. AliExpress Affiliate API: 탱고 관련 상품 검색
    // 4. 결과를 product_deals 테이블에 캐싱
    return [];
  }
}
