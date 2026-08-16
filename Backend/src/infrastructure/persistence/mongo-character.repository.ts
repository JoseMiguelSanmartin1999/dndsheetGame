import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Character } from '../../domain/models/character.model';
import { ICharacterRepository } from '../../domain/repositories/character.repository.interface';
import { CharacterDocument, CharacterMongooseEntity } from './character.schema';

@Injectable()
export class MongoCharacterRepository implements ICharacterRepository {
  constructor(
    @InjectModel(CharacterMongooseEntity.name)
    private readonly characterModel: Model<CharacterDocument>,
  ) {}

  async create(character: Character): Promise<Character> {
    const created = new this.characterModel({
      userId: character.userId,
      name: character.name,
      class: character.class,
      race: character.race,
      level: character.level,
      avatar: character.avatar,
      hp: character.hp,
      stats: character.stats,
      baseStats: character.baseStats,
      backgroundStatsAllocation: character.backgroundStatsAllocation,
      background: character.background,
      originLineage: character.originLineage,
      subclass: character.subclass,
      classSkills: character.classSkills,
      skilledFeatSelection: character.skilledFeatSelection,
      preparedSpells: character.preparedSpells,
      warlockInvocations: character.warlockInvocations,
      clericDivineOrder: character.clericDivineOrder,
      druidPrimalOrder: character.druidPrimalOrder,
      rangerFeyGift: character.rangerFeyGift,
      rangerPrimalCompanion: character.rangerPrimalCompanion,
      history: character.history,
      physicalDesc: character.physicalDesc,
      height: character.height,
      sizeClass: character.sizeClass,
      personalNotes: character.personalNotes || '',
    });
    const saved = await created.save();
    return this.toDomain(saved);
  }

  async findByUserId(userId: string): Promise<Character[]> {
    const docs = await this.characterModel.find({ userId }).sort({ createdAt: -1 }).exec();
    return docs.map(doc => this.toDomain(doc));
  }

  async findById(id: string): Promise<Character | null> {
    const doc = await this.characterModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async update(character: Character): Promise<Character> {
    const updated = await this.characterModel.findByIdAndUpdate(
      character.id,
      {
        name: character.name,
        class: character.class,
        race: character.race,
        level: character.level,
        avatar: character.avatar,
        hp: character.hp,
        stats: character.stats,
        baseStats: character.baseStats,
        backgroundStatsAllocation: character.backgroundStatsAllocation,
        background: character.background,
        originLineage: character.originLineage,
        subclass: character.subclass,
        classSkills: character.classSkills,
        skilledFeatSelection: character.skilledFeatSelection,
        preparedSpells: character.preparedSpells,
        warlockInvocations: character.warlockInvocations,
        clericDivineOrder: character.clericDivineOrder,
        druidPrimalOrder: character.druidPrimalOrder,
        rangerFeyGift: character.rangerFeyGift,
        rangerPrimalCompanion: character.rangerPrimalCompanion,
        history: character.history,
        physicalDesc: character.physicalDesc,
        height: character.height,
        sizeClass: character.sizeClass,
        personalNotes: character.personalNotes,
      },
      { new: true }
    ).exec();
    if (!updated) {
      throw new Error('Personaje no encontrado para actualizar.');
    }
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.characterModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async countByUserId(userId: string): Promise<number> {
    return this.characterModel.countDocuments({ userId }).exec();
  }

  private toDomain(doc: CharacterDocument): Character {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      name: doc.name,
      class: doc.class,
      race: doc.race,
      level: doc.level,
      avatar: doc.avatar,
      hp: doc.hp,
      stats: doc.stats,
      baseStats: doc.baseStats,
      backgroundStatsAllocation: doc.backgroundStatsAllocation,
      background: doc.background,
      originLineage: doc.originLineage,
      subclass: doc.subclass,
      classSkills: doc.classSkills,
      skilledFeatSelection: doc.skilledFeatSelection,
      preparedSpells: doc.preparedSpells,
      warlockInvocations: doc.warlockInvocations,
      clericDivineOrder: doc.clericDivineOrder,
      druidPrimalOrder: doc.druidPrimalOrder,
      rangerFeyGift: doc.rangerFeyGift,
      rangerPrimalCompanion: doc.rangerPrimalCompanion,
      history: doc.history,
      physicalDesc: doc.physicalDesc,
      height: doc.height,
      sizeClass: doc.sizeClass,
      personalNotes: doc.personalNotes || '',
      createdAt: (doc as any).createdAt,
    };
  }
}
