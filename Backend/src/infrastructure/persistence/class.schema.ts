import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClassDocument = ClassMongooseEntity & Document;

@Schema({ collection: 'classes', timestamps: true })
export class ClassMongooseEntity {
  @Prop({ required: true, unique: true, index: true })
  name: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  preference: string;

  @Prop({ required: true })
  primaryStat: string;

  @Prop({ required: true })
  complexity: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  hitDie: string;

  @Prop({ required: true })
  quote: string;

  @Prop({ required: true })
  description: string;
}

export const ClassSchema = SchemaFactory.createForClass(ClassMongooseEntity);
export const ClassSchemaName = ClassMongooseEntity.name;
