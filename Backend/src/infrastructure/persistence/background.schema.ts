import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BackgroundDocument = BackgroundMongooseEntity & Document;

@Schema({ collection: 'backgrounds', timestamps: true })
export class BackgroundMongooseEntity {
  @Prop({ required: true, unique: true, index: true })
  name: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  concept: string;

  @Prop({ required: true })
  statImprovement: string;

  @Prop({ required: true })
  keyFeat: string;

  @Prop({ required: true })
  skills: string;

  @Prop({ required: true })
  tools: string;

  @Prop({ required: true })
  recommendations: string;

  @Prop({ required: true })
  image: string;
}

export const BackgroundSchema = SchemaFactory.createForClass(BackgroundMongooseEntity);
export const BackgroundSchemaName = BackgroundMongooseEntity.name;
