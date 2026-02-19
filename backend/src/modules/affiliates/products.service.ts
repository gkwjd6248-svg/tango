import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan } from 'typeorm';
import { ProductDeal } from './entities/product-deal.entity';

export interface ProductDealResult {
  id: string;
  title: string;
  description: string;
  productCategory: string;
  originalPrice: number;
  dealPrice: number;
  currency: string;
  discountPercentage: number;
  affiliateProvider: string;
  affiliateUrl: string;
  imageUrls: string[];
  expiresAt: Date | null;
  createdAt: Date;
}

export interface PaginatedDeals {
  items: ProductDealResult[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductDeal)
    private readonly dealRepo: Repository<ProductDeal>,
  ) {}

  /**
   * Retrieve active, non-expired product deals from the database.
   * Optionally filter by category; paginate results.
   *
   * @param category  - Optional product category filter
   * @param page      - Page number (1-based, default: 1)
   * @param limit     - Items per page (default: 20)
   */
  async getDeals(
    category?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedDeals> {
    const now = new Date();

    const qb = this.dealRepo
      .createQueryBuilder('deal')
      .where('deal.isActive = :active', { active: true })
      // Exclude expired deals: either no expiry or expiry in the future
      .andWhere('(deal.expiresAt IS NULL OR deal.expiresAt > :now)', { now });

    if (category) {
      qb.andWhere('deal.productCategory = :category', { category });
    }

    qb.orderBy('deal.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        productCategory: d.productCategory,
        originalPrice: Number(d.originalPrice),
        dealPrice: Number(d.dealPrice),
        currency: d.currency,
        discountPercentage: d.discountPercentage ?? 0,
        affiliateProvider: d.affiliateProvider,
        affiliateUrl: d.affiliateUrl,
        imageUrls: d.imageUrls ?? [],
        expiresAt: d.expiresAt ?? null,
        createdAt: d.createdAt,
      })),
      total,
      page,
      limit,
    };
  }
}
