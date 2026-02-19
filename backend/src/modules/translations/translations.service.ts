import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostTranslation } from './entities/post-translation.entity';
import { CommunityPost } from '../community/entities/post.entity';

export interface TranslationResult {
  id: string;
  postId: string;
  targetLanguage: string;
  translatedText: string;
  translationProvider: string;
  createdAt: Date;
  fromCache: boolean;
}

@Injectable()
export class TranslationsService {
  constructor(
    @InjectRepository(PostTranslation)
    private readonly translationRepo: Repository<PostTranslation>,
    @InjectRepository(CommunityPost)
    private readonly postRepo: Repository<CommunityPost>,
  ) {}

  /**
   * Translate a community post into the requested target language.
   *
   * Strategy:
   *   1. Check the post_translations cache table for an existing entry.
   *   2. If cached, return it immediately (fromCache: true).
   *   3. If not cached, call the mock translation provider, persist the result,
   *      then return it (fromCache: false).
   *
   * Real integration note: Replace mockTranslate() with a call to the
   * DeepL or Google Translate API once API keys are available.
   */
  async translate(
    postId: string,
    targetLanguage: string,
  ): Promise<TranslationResult> {
    // 1. Check cache
    const cached = await this.translationRepo.findOne({
      where: { postId, targetLanguage },
    });

    if (cached) {
      return this.toResult(cached, true);
    }

    // 2. Verify the source post exists and is not soft-deleted
    const post = await this.postRepo.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`Post ${postId} not found`);
    }

    // 3. Perform mock translation (prefix-based stub)
    const translatedText = this.mockTranslate(post.contentText, targetLanguage);

    // 4. Persist to cache
    const record = this.translationRepo.create({
      postId,
      targetLanguage,
      translatedText,
      translationProvider: 'deepl', // will be the real provider once integrated
    });

    const saved = await this.translationRepo.save(record);
    return this.toResult(saved, false);
  }

  /**
   * Return a cached translation without triggering a new translation request.
   * Returns null if no cached translation exists yet.
   */
  async getTranslation(
    postId: string,
    targetLanguage: string,
  ): Promise<TranslationResult | null> {
    const cached = await this.translationRepo.findOne({
      where: { postId, targetLanguage },
    });

    return cached ? this.toResult(cached, true) : null;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Mock translation: prepends a "[Translated to {lang}]" label to the original text.
   * Replace with a real API call (DeepL / Google) once credentials are available.
   */
  private mockTranslate(originalText: string, targetLanguage: string): string {
    return `[Translated to ${targetLanguage}] ${originalText}`;
  }

  private toResult(entity: PostTranslation, fromCache: boolean): TranslationResult {
    return {
      id: entity.id,
      postId: entity.postId,
      targetLanguage: entity.targetLanguage,
      translatedText: entity.translatedText,
      translationProvider: entity.translationProvider,
      createdAt: entity.createdAt,
      fromCache,
    };
  }
}
