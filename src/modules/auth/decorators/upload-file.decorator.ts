import { UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

export const UploadDriverFiles = () => {
  return UseInterceptors(
    FileFieldsInterceptor([
      { name: 'nationalId', maxCount: 1 },
      { name: 'driveLicense', maxCount: 1 },
    ]),
  );
};
