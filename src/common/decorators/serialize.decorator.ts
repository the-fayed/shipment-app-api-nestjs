import { UseInterceptors } from '@nestjs/common';
import {
  ClassConstructor,
  SerializationInterceptor,
} from '../interceptors/serialization.interceptor';

export function Serialize(dto: ClassConstructor) {
  return UseInterceptors(new SerializationInterceptor(dto));
}
