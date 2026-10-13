import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Multipart wrapper for a debug frame upload. `meta` must carry a
 * class-validator decorator or the global whitelisting ValidationPipe deletes
 * it and the handler sees an empty body.
 */
export class DebugFrameBody {
  @ApiPropertyOptional({
    description:
      'JSON string: what the readers returned, camera track settings, user ' +
      'agent, timings. Stored verbatim next to the images.',
  })
  @IsOptional()
  @IsString()
  meta?: string;
}
