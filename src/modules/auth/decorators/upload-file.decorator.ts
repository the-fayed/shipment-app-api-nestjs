import { UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

export const UploadFile = (fieldName: string) => {
  return UseInterceptors(FileInterceptor(fieldName));
};
