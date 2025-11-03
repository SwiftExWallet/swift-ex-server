import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

// Pass the enum as argument
export function KeysFromEnum(
  enumObj: object,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'keysFromEnum',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [enumObj],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [enumObject] = args.constraints;
          const validKeys = Object.values(enumObject);
          if (typeof value !== 'object' || value === null) return false;
          return Object.keys(value).every((key) => validKeys.includes(key));
        },
        defaultMessage(validationArguments?: ValidationArguments): string {
          if (!validationArguments || !validationArguments.constraints) {
            return 'Invalid key(s) in the object.'; // fallback error
          }
          const [enumObject] = validationArguments.constraints;
          return `All keys must be one of: ${Object.values(enumObject).join(', ')}`;
        },
      },
    });
  };
}
