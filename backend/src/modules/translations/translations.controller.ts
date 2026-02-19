import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TranslationsService } from './translations.service';

interface TranslateBodyDto {
  postId: string;
  targetLanguage: string;
}

@Controller('translations')
export class TranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  /**
   * POST /translations
   * Translate a post into the target language.
   * Returns a cached translation if one already exists; otherwise generates a new one.
   *
   * Body:
   *   postId         - UUID of the community post
   *   targetLanguage - BCP-47 / ISO 639-1 language code (e.g. "ko", "en", "es")
   */
  @Post()
  async translate(@Body() body: TranslateBodyDto) {
    const { postId, targetLanguage } = body;

    if (!postId || !targetLanguage) {
      throw new BadRequestException('postId and targetLanguage are required');
    }

    return this.translationsService.translate(postId, targetLanguage);
  }

  /**
   * GET /translations?postId=xxx&targetLanguage=ko
   * Retrieve a cached translation for the given post and language pair.
   * Returns 404 if no cached translation is found.
   */
  @Get()
  async getTranslation(
    @Query('postId') postId?: string,
    @Query('targetLanguage') targetLanguage?: string,
  ) {
    if (!postId || !targetLanguage) {
      throw new BadRequestException('postId and targetLanguage query params are required');
    }

    const result = await this.translationsService.getTranslation(
      postId,
      targetLanguage,
    );

    if (!result) {
      throw new NotFoundException(
        `No cached translation found for post ${postId} in language ${targetLanguage}`,
      );
    }

    return result;
  }
}
