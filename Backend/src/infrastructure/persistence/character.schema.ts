import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CharacterDocument = CharacterMongooseEntity & Document;

@Schema({ _id: false })
class StatsSubSchema {
  @Prop({ required: true })
  strength: number;

  @Prop({ required: true })
  dexterity: number;

  @Prop({ required: true })
  constitution: number;

  @Prop({ required: true })
  intelligence: number;

  @Prop({ required: true })
  wisdom: number;

  @Prop({ required: true })
  charisma: number;
}

@Schema({ collection: 'characters', timestamps: true })
export class CharacterMongooseEntity {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  class: string;

  @Prop({ required: true })
  race: string;

  @Prop({ required: true, default: 1 })
  level: number;

  @Prop({ required: true })
  avatar: string;

  @Prop({ required: true })
  hp: number;

  @Prop({ type: StatsSubSchema, required: true })
  stats: StatsSubSchema;

  @Prop({ type: StatsSubSchema, required: true })
  baseStats: StatsSubSchema;

  @Prop({ type: StatsSubSchema, required: true })
  backgroundStatsAllocation: StatsSubSchema;

  @Prop({ required: true })
  background: string;

  @Prop({ required: false })
  originLineage?: string;

  @Prop({ type: [String], required: true, default: [] })
  classSkills: string[];

  @Prop({ type: [String], required: false, default: [] })
  skilledFeatSelection?: string[];

  @Prop({ required: false, default: '' })
  history: string;

  @Prop({ required: false, default: '' })
  physicalDesc: string;

  @Prop({ required: true })
  height: number;

  @Prop({ required: true })
  sizeClass: string;
}

export const CharacterSchema = SchemaFactory.createForClass(CharacterMongooseEntity);
export const CharacterSchemaName = CharacterMongooseEntity.name;
