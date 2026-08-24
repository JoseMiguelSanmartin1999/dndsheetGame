import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClassMongooseEntity, ClassSchemaName } from './class.schema';
import { BackgroundMongooseEntity, BackgroundSchemaName } from './background.schema';
import { OriginMongooseEntity, OriginSchemaName } from './origin.schema';
import { RaceMongooseEntity, RaceSchemaName } from './race.schema';

@Injectable()
export class GameDataSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(GameDataSeeder.name);

  constructor(
    @InjectModel(ClassSchemaName) private readonly classModel: Model<ClassMongooseEntity>,
    @InjectModel(BackgroundSchemaName) private readonly backgroundModel: Model<BackgroundMongooseEntity>,
    @InjectModel(OriginSchemaName) private readonly originModel: Model<OriginMongooseEntity>,
    @InjectModel(RaceSchemaName) private readonly raceModel: Model<RaceMongooseEntity>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Iniciando verificación de siembra de datos de juego...');
    try {
      await this.seedClasses();
      await this.seedBackgrounds();
      await this.seedOrigins();
      await this.seedRaces();
      this.logger.log('Verificación de siembra de datos de juego completada con éxito.');
    } catch (error) {
      this.logger.error('Error durante la siembra de datos de juego:', error);
    }
  }

  private async seedClasses() {
    const count = await this.classModel.countDocuments();
    if (count > 0) {
      this.logger.log('Las clases de D&D ya se encuentran sembradas.');
      return;
    }

    this.logger.log('Sembrando 12 clases de D&D en la base de datos...');
    const classes = [
      {
        name: 'Bárbaro',
        icon: '🪓',
        preference: 'Batalla',
        primaryStat: 'Fuerza',
        complexity: 'Media',
        image: 'Barbaros.png',
        hitDie: 'd12',
        quote: 'Entra en una furia berserker desatando el caos y la violencia.',
        description: 'Un fiero guerrero de trasfondo primitivo que puede entrar en una furia de combate física brutal. Resiste grandes cantidades de daño y domina el uso de armas de gran tamaño para sembrar la devastación en primera línea.'
      },
      {
        name: 'Bardo',
        icon: '🎵',
        preference: 'Actuación',
        primaryStat: 'Carisma',
        complexity: 'Alta',
        image: 'Bardo.png',
        hitDie: 'd8',
        quote: 'La música es el lenguaje primordial del multiverso.',
        description: 'Un músico y erudito que inspira a sus aliados con música y arte. Puede conjurar ilusiones, sanar heridas y manipular los pensamientos de otros gracias a la magia sónica que fluye a través de sus acordes y poemas.'
      },
      {
        name: 'Brujo',
        icon: '👁️',
        preference: 'Ocultismo',
        primaryStat: 'Carisma',
        complexity: 'Alta',
        image: 'Brujo.png',
        hitDie: 'd8',
        quote: 'Pactar con la oscuridad es el precio a pagar por el conocimiento.',
        description: 'Un taumaturgo que pacta con entidades de otros mundos, como señores demoníacos o arcanos antiguos, a cambio de poderes mágicos oscuros. Utiliza trucos muy potentes y posee dones misticos únicos conferidos por su patrón.'
      },
      {
        name: 'Clérigo',
        icon: '☀️',
        preference: 'Dioses',
        primaryStat: 'Sabiduría',
        complexity: 'Media',
        image: 'Clerigo.png',
        hitDie: 'd8',
        quote: 'Mi fe es el escudo de mi pueblo y el martillo de mi señor.',
        description: 'Un sacerdote consagrado que canaliza el poder divino de su deidad para curar a sus aliados, expulsar a los no-muertos o golpear a los infieles con fuegos y rayos divinos en el campo de batalla.'
      },
      {
        name: 'Druida',
        icon: '🌿',
        preference: 'Naturaleza',
        primaryStat: 'Sabiduría',
        complexity: 'Alta',
        image: 'Druida.png',
        hitDie: 'd8',
        quote: 'El bosque reclama lo que el hombre le ha robado.',
        description: 'Un guardián del mundo natural capaz de conjurar las fuerzas elementales del viento, la tormenta o las plantas. Su don más célebre es la Forma Salvaje, que le permite transformarse en animales temibles.'
      },
      {
        name: 'Explorador',
        icon: '🏹',
        preference: 'Supervivencia',
        primaryStat: 'Destreza y Sabiduría',
        complexity: 'Media',
        image: 'Explorador.png',
        hitDie: 'd10',
        quote: 'Ningún rastro se me escapa, ninguna presa vive para contarlo.',
        description: 'Un cazador y rastreador letal especializado en la supervivencia salvaje y el combate a distancia o con dos armas. Domina técnicas de emboscada y utiliza un vínculo espiritual sutil con el entorno natural.'
      },
      {
        name: 'Guerrero',
        icon: '⚔️',
        preference: 'Armas',
        primaryStat: 'Fuerza o Destreza',
        complexity: 'Baja',
        image: 'Guerrero.png',
        hitDie: 'd10',
        quote: 'El acero y la táctica deciden el destino de los reinos.',
        description: 'Un maestro táctico experto en el combate armado y el uso de armaduras de todo tipo. Versátil, letal y resistente, el guerrero es capaz de realizar múltiples ataques en un solo instante y sostener el combate frontal.'
      },
      {
        name: 'Hechicero',
        icon: '✨',
        preference: 'Poderes',
        primaryStat: 'Carisma',
        complexity: 'Alta',
        image: 'Hechicero.png',
        hitDie: 'd6',
        quote: 'La magia no es algo que estudio, es lo que soy.',
        description: 'Un taumaturgo innato que manipula la magia a través de un don de nacimiento (como sangre de dragón o magia salvaje). Utiliza su Metamagia para alterar la duración, alcance o potencia de sus conjuros al vuelo.'
      },
      {
        name: 'Mago',
        icon: '📖',
        preference: 'Libros de conjuros',
        primaryStat: 'Inteligencia',
        complexity: 'Media',
        image: 'Mago.png',
        hitDie: 'd6',
        quote: 'El conocimiento absoluto aguarda en las páginas correctas.',
        description: 'Un estudiante erudito que memoriza, estudia y cataloga conjuros en su grimorio personal. Al aprender magia a través de fórmulas y la ciencia, posee el catálogo de conjuros más versátil y letal del juego.'
      },
      {
        name: 'Monje',
        icon: '🥊',
        preference: 'Combate sin armas, Destreza y Sabiduría',
        primaryStat: 'Destreza y Sabiduría',
        complexity: 'Alta',
        image: 'Monje.png',
        hitDie: 'd8',
        quote: 'El cuerpo es el arma definitiva, la mente su único maestro.',
        description: 'Un artista marcial que canaliza la concentración y la disciplina mental para acelerar sus movimientos, esquivar ataques sin armadura y ejecutar letales golpes sin armas o con armas de monje.'
      },
      {
        name: 'Paladín',
        icon: '🛡️',
        preference: 'Defensa, Fuerza y Carisma',
        primaryStat: 'Fuerza y Carisma',
        complexity: 'Media',
        image: 'Paladin.png',
        hitDie: 'd10',
        quote: 'Mi fe es mi escudo, mi juramento mi espada indestructible.',
        description: 'Un guerrero sagrado vinculado a un juramento inquebrantable que combina la maestría en el combate con la magia divina para castigar enemigos, sanar aliados e irradiar auras protectoras.'
      },
      {
        name: 'Pícaro',
        icon: '🗡️',
        preference: 'Sigilo y Daño de Precisión',
        primaryStat: 'Destreza',
        complexity: 'Fácil',
        image: 'Rogue.png',
        hitDie: 'd8',
        quote: 'Las sombras son mis aliadas, un golpe certero mi respuesta.',
        description: 'Un combatiente astuto e infalible que utiliza el sigilo, la agilidad y los puntos débiles de sus enemigos para asestar devastadores Ataques Furtivos y maniobras astutas.'
      }
    ];
    await this.classModel.insertMany(classes);
    this.logger.log('¡12 Clases sembradas correctamente en MongoDB!');
  }

  private async seedBackgrounds() {
    const count = await this.backgroundModel.countDocuments();
    if (count > 0) {
      this.logger.log('Los trasfondos de D&D ya se encuentran sembrados.');
      return;
    }

    this.logger.log('Sembrando 16 trasfondos en la base de datos...');
    const backgrounds = [
      {
        name: 'Acólito',
        icon: '⛪',
        concept: 'Servías en un templo, estudiando religión y realizando ceremonias.',
        statImprovement: 'Inteligencia, Sabiduría, Carisma',
        keyFeat: 'Iniciado en la Magia (Clérigo)',
        skills: 'Perspicacia, Religión',
        tools: 'Suministros de calígrafo',
        recommendations: 'Clérigo (encaje perfecto), Paladín (para un trasfondo devoto), o Monje (formación en un monasterio).',
        image: 'image_34.png'
      },
      {
        name: 'Animador',
        icon: '🎭',
        concept: 'Pasaste tu juventud actuando en ferias y festivales como músico o acróbata.',
        statImprovement: 'Fuerza, Destreza, Carisma',
        keyFeat: 'Músico',
        skills: 'Acrobacias, Interpretación',
        tools: 'Un tipo de instrumento musical',
        recommendations: 'Bardo (la opción obvia), Pícaro (para un artista ágil), o un Guerrero (espadachín vistoso).',
        image: 'image_35.png'
      },
      {
        name: 'Artesano',
        icon: '🛠️',
        concept: 'Comenzaste como aprendiz en un taller, creando objetos y tratando con clientes.',
        statImprovement: 'Fuerza, Destreza, Inteligencia',
        keyFeat: 'Crafter (Fabricante)',
        skills: 'Investigación, Persuasión',
        tools: 'Un tipo de herramientas de artesano',
        recommendations: 'Artífice (temáticamente ideal), un Guerrero o Paladín (que forja su propio equipo), o un Pícaro (ingenioso fabricante de trampas).',
        image: 'image_36.png'
      },
      {
        name: 'Campesino',
        icon: '🌾',
        concept: 'Te criaste cultivando la tierra y cuidando animales, ganando paciencia y salud.',
        statImprovement: 'Fuerza, Constitución, Sabiduría',
        keyFeat: 'Duro',
        skills: 'Naturaleza, Trato con Animales',
        tools: 'Herramientas de carpintero',
        recommendations: 'Bárbaro o Guerrero (un héroe del pueblo simple y fuerte), o un Druida o Explorador (con conexión simple con la tierra).',
        image: 'image_37.png'
      },
      {
        name: 'Charlatán',
        icon: '🃏',
        concept: 'Un embaucador de taberna experto en engañar a la gente con mentiras y trucos.',
        statImprovement: 'Destreza, Constitución, Carisma',
        keyFeat: 'Skilled (Habilidoso)',
        skills: 'Engaño, Juego de Manos',
        tools: 'Útiles para falsificar',
        recommendations: 'Pícaro (encaje perfecto), Bardo (un narrador manipulador), o incluso un Brujo (que engaña para obtener poder).',
        image: 'image_38.png'
      },
      {
        name: 'Comerciante',
        icon: '💰',
        concept: 'Aprendiz de tendero o caravanero que viajaba comprando y vendiendo mercancías.',
        statImprovement: 'Constitución, Inteligencia, Carisma',
        keyFeat: 'Afortunado',
        skills: 'Persuasión, Trato con Animales',
        tools: 'Herramientas de navegante',
        recommendations: 'Bardo (el negociador del grupo), Pícaro (mente astuta para los negocios), o un Explorador (un guía de caravanas).',
        image: 'image_39.png'
      },
      {
        name: 'Criminal',
        icon: '👣',
        concept: 'Te buscabas la vida en callejones oscuros, ya sea en una banda o en solitario.',
        statImprovement: 'Destreza, Constitución, Inteligencia',
        keyFeat: 'Alerta',
        skills: 'Juego de Manos, Sigilo',
        tools: 'Herramientas de ladrón',
        recommendations: 'Pícaro (arquetipo clásico), Bardo (un espía astuto), o un Explorador (un cazador urbano).',
        image: 'image_40.png'
      },
      {
        name: 'Ermitaño',
        icon: '⛺',
        concept: 'Viviste en soledad en la naturaleza o en un monasterio, reflexionando sobre el mundo.',
        statImprovement: 'Constitución, Sabiduría, Carisma',
        keyFeat: 'Healer (Sanador)',
        skills: 'Medicina, Religión',
        tools: 'Útiles de herborista',
        recommendations: 'Druida o Guardabosques (un solitario de la naturaleza), Monje (formación ascética), o un Clérigo (sirviente en aislamiento).',
        image: 'image_41.png'
      },
      {
        name: 'Erudito',
        icon: '📖',
        concept: 'Viajabas entre bibliotecas, estudiando libros para adquirir conocimientos arcanos e históricos.',
        statImprovement: 'Constitución, Inteligencia, Sabiduría',
        keyFeat: 'Magic Initiate (Mago)',
        skills: 'Conocimiento Arcano, Historia',
        tools: 'Suministros de calígrafo',
        recommendations: 'Mago (la opción principal), un Artífice (investigador), o un Brujo (que busca conocimientos prohibidos).',
        image: 'image_42.png'
      },
      {
        name: 'Escriba',
        icon: '✒️',
        concept: 'Trabajabas en un scriptorium, copiando textos con precisión y atención al detalle.',
        statImprovement: 'Destreza, Inteligencia, Sabiduría',
        keyFeat: 'Skilled (Habilidoso)',
        skills: 'Investigación, Percepción',
        tools: 'Suministros de calígrafo',
        recommendations: 'Mago (copiando hechizos), Artífice (diseños técnicos), o un Pícaro (un falsificador meticuloso).',
        image: 'image_43.png'
      },
      {
        name: 'Guardia',
        icon: '💂',
        concept: 'Pasaste innumerables horas ojo avisor en tu puesto de la torre, vigilando intrusos y rateros.',
        statImprovement: 'Fuerza, Inteligencia, Sabiduría',
        keyFeat: 'Alerta',
        skills: 'Atletismo, Percepción',
        tools: 'Un tipo de juego',
        recommendations: 'Guerrero (un soldado de ciudad), Paladín (un protector devoto), o incluso un Pícaro (un "vigilante" urbano).',
        image: 'image_44.png'
      },
      {
        name: 'Guía',
        icon: '🗺️',
        concept: 'Te criaste en plena naturaleza lejana, sirviendo de guía a sacerdotes de la tierra.',
        statImprovement: 'Destreza, Constitución, Sabiduría',
        keyFeat: 'Iniciado en la Magia (Druida)',
        skills: 'Sigilo, Supervivencia',
        tools: 'Herramientas de cartógrafo',
        recommendations: 'Druida (encaje temático), Explorador (maestro de la supervivencia), o un Bárbaro (guía tribal).',
        image: 'image_45.png'
      },
      {
        name: 'Marinero',
        icon: '⚓',
        concept: 'Llevaste una vida en la mar, enfrentándote a tormentas y visitando tabernas de puertos.',
        statImprovement: 'Fuerza, Destreza, Sabiduría',
        keyFeat: 'Matón de taberna',
        skills: 'Acrobacias, Percepción',
        tools: 'Herramientas de navegante',
        recommendations: 'Guerrero (un luchador curtido en el mar), Pícaro (pirata ágil), o un Bárbaro (un corsario tribal).',
        image: 'image_46.png'
      },
      {
        name: 'Noble',
        icon: '👑',
        concept: 'Te criaste en un castillo entre riqueza y poder, recibiendo una educación sobre liderazgo.',
        statImprovement: 'Fuerza, Inteligencia, Carisma',
        keyFeat: 'Skilled (Habilidoso)',
        skills: 'Historia, Persuasión',
        tools: 'Un tipo de juego',
        recommendations: 'Paladín (encaje clásico), Bardo (un diplomático refinado), o un Guerrero (un oficial de noble cuna).',
        image: 'image_47.png'
      },
      {
        name: 'Soldado',
        icon: '🛡️',
        concept: 'Te entrenaron para la guerra desde la edad adulta, protegiendo el reino en el campo de batalla.',
        statImprovement: 'Fuerza, Destreza, Constitución',
        keyFeat: 'Atacante salvaje',
        skills: 'Atletismo, Intimidación',
        tools: 'Un tipo de juego',
        recommendations: 'Guerrero (el arquetipo de soldado), Paladín (un cruzado sagrado), o un Bárbaro (un guerrero de vanguardia).',
        image: 'image_48.png'
      },
      {
        name: 'Vagabundo',
        icon: '👣',
        concept: 'Creciste en las calles, durmiendo donde podías y recurriendo al robo por hambre.',
        statImprovement: 'Destreza, Sabiduría, Carisma',
        keyFeat: 'Afortunado',
        skills: 'Perspicacia, Sigilo',
        tools: 'Herramientas de ladrón',
        recommendations: 'Pícaro (la opción obvia), Bardo (un artista callejero que sobrevive), o un Brujo (que pacta por necesidad).',
        image: 'image_49.png'
      }
    ];
    await this.backgroundModel.insertMany(backgrounds);
    this.logger.log('¡16 Trasfondos sembrados correctamente en MongoDB!');
  }

  private async seedOrigins() {
    const count = await this.originModel.countDocuments();
    if (count > 0) {
      if (count < 11) {
        await this.originModel.deleteMany({});
        this.logger.log('Reiniciando orígenes para sembrar los nuevos linajes (10 en total)...');
      } else {
        this.logger.log('Los orígenes de D&D ya se encuentran sembrados.');
        return;
      }
    }

    this.logger.log('Sembrando 10 orígenes en la base de datos...');
    const origins = [
      {
        name: 'Humano',
        icon: '👤',
        bonus: '+1 a todas las puntuaciones',
        speed: '30 pies (9m)',
        language: 'Común y un idioma extra',
        trait: 'Versatilidad Humana (Competencias extra).',
        image: 'Humano.png',
        description: 'Los humanos son los más adaptables y diversos de todos los pueblos. No tienen una inclinación extrema hacia la magia o la fuerza, sino que destacan en todas las disciplinas por su inmensa ambición y resiliencia.',
        statModifiers: { FUE: 1, DES: 1, CON: 1, INT: 1, SAB: 1, CAR: 1 }
      },
      {
        name: 'Elfo',
        icon: '🧝',
        bonus: '+2 Destreza, +1 Inteligencia',
        speed: '30 pies (9m)',
        language: 'Común y Élfico',
        trait: 'Ancestros Feéricos (Inmunidad al sueño mágico, ventaja contra encantamientos).',
        image: 'Elfo.png',
        description: 'Seres mágicos de gracia sobrenatural, los elfos viven en comunión con la naturaleza y la magia antigua. Tienen vidas extremadamente largas y dominan el tiro con arco, la agilidad y las artes arcanas.',
        statModifiers: { FUE: 0, DES: 2, CON: 0, INT: 1, SAB: 0, CAR: 0 }
      },
      {
        name: 'Enano',
        icon: '🧔',
        bonus: '+2 Constitución, +1 Fuerza',
        speed: '25 pies (7.5m)',
        language: 'Común y Enano',
        trait: 'Resistencia Enana (Resistencia al daño por veneno).',
        image: 'Enano.png',
        description: 'Fuertes, tenaces y orgullosos, los enanos son conocidos por su destreza en la herrería, su maestría con las hachas y su resistencia inquebrantable a las adversidades físicas.',
        statModifiers: { FUE: 1, DES: 0, CON: 2, INT: 0, SAB: 0, CAR: 0 }
      },
      {
        name: 'Mediano',
        icon: '🍀',
        bonus: '+2 Destreza, +1 Carisma',
        speed: '25 pies (7.5m)',
        language: 'Común y Mediano',
        trait: 'Afortunado (Puedes repetir un 1 natural en dados de d20).',
        image: 'Mediano.png',
        description: 'Los medianos prefieren una vida tranquila, pero su tamaño pequeño, agilidad innata y sorprendente suerte los convierte en increíbles pícaros y aventureros.',
        statModifiers: { FUE: 0, DES: 2, CON: 0, INT: 0, SAB: 0, CAR: 1 }
      },
      {
        name: 'Dracónido',
        icon: '🐲',
        bonus: '+2 Fuerza, +1 Carisma',
        speed: '30 pies (9m)',
        language: 'Común y Dracónico',
        trait: 'Arma de Aliento (Exhalas energía elemental destructiva de dragón).',
        image: 'Draconidos.png',
        description: 'Orgullosos descendientes de los dragones, caminan con honor. Poseen escamas gruesas que resisten un elemento y exhalan aliento elemental destructivo.',
        statModifiers: { FUE: 2, DES: 0, CON: 0, INT: 0, SAB: 0, CAR: 1 }
      },
      {
        name: 'Tiflin',
        icon: '😈',
        bonus: '+2 Carisma, +1 Inteligencia',
        speed: '30 pies (9m)',
        language: 'Común e Infernal',
        trait: 'Resistencia Elemental (Resistente al fuego) y Magia Innata.',
        image: 'Tiefling.png',
        description: 'Portadores de un linaje infernal antiguo debido a pactos pasados en sus familias. Son astutos, carismáticos y poseen un control innato sobre la magia de las sombras.',
        statModifiers: { FUE: 0, DES: 0, CON: 0, INT: 1, SAB: 0, CAR: 2 }
      },
      {
        name: 'Gnomo',
        icon: '🧙',
        bonus: '+2 Inteligencia, +1 Destreza',
        speed: '30 pies (9m)',
        language: 'Común y Gnomo',
        trait: 'Astucia Gnoma (Ventaja en tiradas de salvación de Inteligencia, Sabiduría y Carisma).',
        image: 'Gnomo.png',
        description: 'Los gnomos son un pueblo mágico creado por los dioses de la inventiva, las ilusiones y la vida en el subsuelo. Destacan por su ingenio técnico y su agudeza mental.',
        statModifiers: { FUE: 0, DES: 1, CON: 0, INT: 2, SAB: 0, CAR: 0 }
      },
      {
        name: 'Goliat',
        icon: '🏔️',
        bonus: '+2 Fuerza, +1 Constitución',
        speed: '35 pies (10.5m)',
        language: 'Común y Gigante',
        trait: 'Constitución Poderosa (Ventaja en salvaciones contra agarre, doble capacidad de carga).',
        image: 'Goliath.png',
        description: 'Los goliats son descendientes lejanos de los gigantes y sobrepasan en altura a la mayoría de especies. Poseen una increíble resistencia física y la herencia elemental de los gigantes.',
        statModifiers: { FUE: 2, DES: 0, CON: 1, INT: 0, SAB: 0, CAR: 0 }
      },
      {
        name: 'Orco',
        icon: '🐗',
        bonus: '+2 Fuerza, +1 Constitución',
        speed: '30 pies (9m)',
        language: 'Común y Orco',
        trait: 'Aguante Incansable (Cuando caes a 0 HP, te recuperas a 1 HP de forma gratuita).',
        image: 'Orco.png',
        description: 'Fuertes y corpulentos, los orcos son guerreros natos que poseen una vitalidad incansable y ráfagas de adrenalina que les permiten arremeter con fiereza en el fragor de la batalla.',
        statModifiers: { FUE: 2, DES: 0, CON: 1, INT: 0, SAB: 0, CAR: 0 }
      },
      {
        name: 'Aasimar',
        icon: '👼',
        bonus: '+2 Carisma, +1 Sabiduría',
        speed: '30 pies (9m)',
        language: 'Común y Celestial',
        trait: 'Manos Curativas, Resistencia Celestial (Daño Necrótico y Radiante) y Revelación Celestial.',
        image: 'Aasimar.png',
        description: 'Los aasimars son mortales cuyas almas albergan una chispa de los Planos Superiores. Descendientes de ángeles o bendecidos por poderes divinos, pueden canalizar su herencia celestial para sanar o desatar la revelación celestial.',
        statModifiers: { FUE: 0, DES: 0, CON: 0, INT: 0, SAB: 1, CAR: 2 }
      }
    ];
    await this.originModel.insertMany(origins);
    this.logger.log('¡10 Orígenes sembrados correctamente en MongoDB!');
  }

  private async seedRaces() {
    const count = await this.raceModel.countDocuments();
    if (count > 0) {
      if (count < 10) {
        await this.raceModel.deleteMany({});
        this.logger.log('Reiniciando razas para sembrar los nuevos linajes (10 en total)...');
      } else {
        this.logger.log('Las razas de D&D ya se encuentran sembradas.');
        return;
      }
    }

    this.logger.log('Sembrando 10 razas en la base de datos...');
    const races = [
      {
        name: 'Humano',
        icon: '👤',
        bonus: '+1 a todas las puntuaciones',
        speed: '30 pies (9m)',
        language: 'Común y un idioma extra',
        trait: 'Versatilidad Humana (Competencias extra).',
        image: 'Humano.png',
        description: 'Los humanos son los más adaptables y diversos de todos los pueblos. No tienen una inclinación extrema hacia la magia o la fuerza, sino que destacan en todas las disciplinas por su inmensa ambición y resiliencia.',
        statModifiers: { FUE: 1, DES: 1, CON: 1, INT: 1, SAB: 1, CAR: 1 }
      },
      {
        name: 'Elfo',
        icon: '🧝',
        bonus: '+2 Destreza, +1 Inteligencia',
        speed: '30 pies (9m)',
        language: 'Común y Élfico',
        trait: 'Ancestros Feéricos (Inmunidad al sueño mágico, ventaja contra encantamientos).',
        image: 'Elfo.png',
        description: 'Seres mágicos de gracia sobrenatural, los elfos viven en comunión con la naturaleza y la magia antigua. Tienen vidas extremadamente largas y dominan el tiro con arco, la agilidad y las artes arcanas.',
        statModifiers: { FUE: 0, DES: 2, CON: 0, INT: 1, SAB: 0, CAR: 0 }
      },
      {
        name: 'Enano',
        icon: '🧔',
        bonus: '+2 Constitución, +1 Fuerza',
        speed: '25 pies (7.5m)',
        language: 'Común y Enano',
        trait: 'Resistencia Enana (Resistencia al daño por veneno).',
        image: 'Enano.png',
        description: 'Fuertes, tenaces y orgullosos, los enanos son conocidos por su destreza en la herrería, su maestría con las hachas y su resistencia inquebrantable a las adversidades físicas.',
        statModifiers: { FUE: 1, DES: 0, CON: 2, INT: 0, SAB: 0, CAR: 0 }
      },
      {
        name: 'Mediano',
        icon: '🍀',
        bonus: '+2 Destreza, +1 Carisma',
        speed: '25 pies (7.5m)',
        language: 'Común y Mediano',
        trait: 'Afortunado (Puedes repetir un 1 natural en dados de d20).',
        image: 'Mediano.png',
        description: 'Los medianos prefieren una vida tranquila, pero su tamaño pequeño, agilidad innata y sorprendente suerte los convierte en increíbles pícaros y aventureros.',
        statModifiers: { FUE: 0, DES: 2, CON: 0, INT: 0, SAB: 0, CAR: 1 }
      },
      {
        name: 'Dracónido',
        icon: '🐲',
        bonus: '+2 Fuerza, +1 Carisma',
        speed: '30 pies (9m)',
        language: 'Común y Dracónico',
        trait: 'Arma de Aliento (Exhalas energía elemental destructiva de dragón).',
        image: 'Draconidos.png',
        description: 'Orgullosos descendientes de los dragones, caminan con honor. Poseen escamas gruesas que resisten un elemento y exhalan aliento elemental destructivo.',
        statModifiers: { FUE: 2, DES: 0, CON: 0, INT: 0, SAB: 0, CAR: 1 }
      },
      {
        name: 'Tiflin',
        icon: '😈',
        bonus: '+2 Carisma, +1 Inteligencia',
        speed: '30 pies (9m)',
        language: 'Común e Infernal',
        trait: 'Resistencia Elemental (Resistente al fuego) y Magia Innata.',
        image: 'Tiefling.png',
        description: 'Portadores de un linaje infernal antiguo debido a pactos pasados en sus familias. Son astutos, carismáticos y poseen un control innato sobre la magia de las sombras.',
        statModifiers: { FUE: 0, DES: 0, CON: 0, INT: 1, SAB: 0, CAR: 2 }
      },
      {
        name: 'Gnomo',
        icon: '🧙',
        bonus: '+2 Inteligencia, +1 Destreza',
        speed: '30 pies (9m)',
        language: 'Común y Gnomo',
        trait: 'Astucia Gnoma (Ventaja en tiradas de salvación de Inteligencia, Sabiduría y Carisma).',
        image: 'Gnomo.png',
        description: 'Los gnomos son un pueblo mágico creado por los dioses de la inventiva, las ilusiones y la vida en el subsuelo. Destacan por su ingenio técnico y su agudeza mental.',
        statModifiers: { FUE: 0, DES: 1, CON: 0, INT: 2, SAB: 0, CAR: 0 }
      },
      {
        name: 'Goliat',
        icon: '🏔️',
        bonus: '+2 Fuerza, +1 Constitución',
        speed: '35 pies (10.5m)',
        language: 'Común y Gigante',
        trait: 'Constitución Poderosa (Ventaja en salvaciones contra agarre, doble capacidad de carga).',
        image: 'Goliath.png',
        description: 'Los goliats son descendientes lejanos de los gigantes y sobrepasan en altura a la mayoría de especies. Poseen una increíble resistencia física y la herencia elemental de los gigantes.',
        statModifiers: { FUE: 2, DES: 0, CON: 1, INT: 0, SAB: 0, CAR: 0 }
      },
      {
        name: 'Orco',
        icon: '🐗',
        bonus: '+2 Fuerza, +1 Constitución',
        speed: '30 pies (9m)',
        language: 'Común y Orco',
        trait: 'Aguante Incansable (Cuando caes a 0 HP, te recuperas a 1 HP de forma gratuita).',
        image: 'Orco.png',
        description: 'Fuertes y corpulentos, los orcos son guerreros natos que poseen una vitalidad incansable y ráfagas de adrenalina que les permiten arremeter con fiereza en el fragor de la batalla.',
        statModifiers: { FUE: 2, DES: 0, CON: 1, INT: 0, SAB: 0, CAR: 0 }
      },
      {
        name: 'Aasimar',
        icon: '👼',
        bonus: '+2 Carisma, +1 Sabiduría',
        speed: '30 pies (9m)',
        language: 'Común y Celestial',
        trait: 'Manos Curativas, Resistencia Celestial (Daño Necrótico y Radiante) y Revelación Celestial.',
        image: 'Aasimar.png',
        description: 'Los aasimars son mortales cuyas almas albergan una chispa de los Planos Superiores. Descendientes de ángeles o bendecidos por poderes divinos, pueden canalizar su herencia celestial para sanar o desatar la revelación celestial.',
        statModifiers: { FUE: 0, DES: 0, CON: 0, INT: 0, SAB: 1, CAR: 2 }
      }
    ];
    await this.raceModel.insertMany(races);
    this.logger.log('¡10 Razas sembradas correctamente en MongoDB!');
  }
}
