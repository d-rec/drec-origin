import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DocumentUploadsService {
  private readonly logger = new Logger(DocumentUploadsService.name);

  // constructor(
  //   // @InjectRepository(DocumentUploadsEntity)
  //   // private readonly documentUploadsRepository: Repository<DocumentUploadsEntity>,
  // ) {}

  uploadDocuments(): any {
    return;
  }
}
