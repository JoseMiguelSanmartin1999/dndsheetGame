import { IsEmail, IsNotEmpty, IsString, MaxLength, IsBoolean, Matches, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Validador personalizado para la edad mínima
export function IsAtLeastAge(age: number, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAtLeastAge',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [age],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return false;
          const dob = new Date(value);
          const today = new Date();
          let calculatedAge = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            calculatedAge--;
          }
          return calculatedAge >= args.constraints[0];
        },
        defaultMessage(args: ValidationArguments) {
          return `Debes tener al menos ${args.constraints[0]} años para registrarte.`;
        }
      },
    });
  };
}

export class RegisterUserDto {
  @ApiProperty({ example: 'bardo@ejemplo.com', description: 'Correo electrónico del usuario' })
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  email: string;

  @ApiProperty({ example: 'Bard01', description: 'Nombre de usuario (máximo 10 caracteres)' })
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio.' })
  @MaxLength(10, { message: 'El nombre de usuario no puede exceder las 10 letras.' })
  username: string;

  @ApiProperty({ example: '2010-05-15', description: 'Fecha de nacimiento (debe indicar edad >= 12 años)' })
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria.' })
  @IsAtLeastAge(12, { message: 'La fecha de nacimiento indica que eres menor de 12 años.' })
  dateOfBirth: string;

  @ApiProperty({ example: 'Paladin#2026', description: 'Contraseña del usuario (debe contener una mayúscula, un número y un carácter especial .@#)' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[.@#$!%*?&])[A-Za-z\d.@#$!%*?&]{6,}$/, {
    message: 'La contraseña debe tener al menos 6 caracteres y contener una letra mayúscula, un número y un carácter especial (. @ # $ ! % * ? &).',
  })
  password: string;

  @ApiProperty({ example: true, description: 'Indica si el usuario ha jugado D&D antes' })
  @IsBoolean({ message: 'La respuesta de si has jugado D&D antes debe ser verdadera o falsa.' })
  @IsNotEmpty({ message: 'Debes indicar si has jugado D&D antes.' })
  hasPlayedBefore: boolean;
}
