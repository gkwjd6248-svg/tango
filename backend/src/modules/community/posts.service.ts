import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityPost } from './entities/post.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(CommunityPost)
    private readonly postRepo: Repository<CommunityPost>,
  ) {}

  async findAll(query: { countryScope?: string; page?: number; limit?: number }) {
    const qb = this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .where('post.deletedAt IS NULL')
      .andWhere('post.isHidden = :hidden', { hidden: false });

    if (query.countryScope) {
      qb.andWhere('(post.countryScope = :scope OR post.countryScope IS NULL)', {
        scope: query.countryScope,
      });
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('post.createdAt', 'DESC');

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async create(userId: string, data: {
    contentText: string;
    mediaUrls?: string[];
    mediaType?: string;
    postType?: string;
    countryScope?: string;
  }) {
    const post = this.postRepo.create({ ...data, userId });
    return this.postRepo.save(post);
  }
}
