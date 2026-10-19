// Ошибка предметной области: её message безопасно показывать пользователю.
// field — поле формы, к которому относится ошибка (например, "email" для занятого адреса).
export abstract class DomainError<Code extends string = string> extends Error {
  constructor(
    readonly code: Code,
    message: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
