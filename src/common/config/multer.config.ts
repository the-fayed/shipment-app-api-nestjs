import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';

export const multerConfig: MulterOptions = {
  dest: './uploads', // upload directory
  storage: diskStorage({
    filename(req, file, cb) {
      cb(null, file.originalname);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Only images allowed!'), false);
    }
  },
};
