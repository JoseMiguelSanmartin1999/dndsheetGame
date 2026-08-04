import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RaceDocument = RaceMongooseEntity & Document;

@Schema({ collection: 'races', timestamps: true })
export class RaceMongooseEntity {
  @Prop({ required: true, unique: true, index: true })
  name: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  bonus: string;

  @Prop({ required: true })
  speed: string;

  @Prop({ required: true })
  language: string;

  @Prop({ required: true })
  trait: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Map, of: Number, required: true })
  statModifiers: Map<string, number>;
}

export const RaceSchema = SchemaFactory.createForClass(RaceMongooseEntity);
export const RaceSchemaName = RaceMongooseEntity.name;
