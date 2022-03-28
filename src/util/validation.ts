// Validation
export interface ValidateAble {
  value?: string | number | boolean;
  name: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

export interface ValidStatus {
  name: string;
  valid: boolean;
  validatorFails: ValidateAble[];
}
export type Validators = {
  [Property in keyof ValidateAble]-?: (name: string) => boolean;
};

export class Validate implements Omit<Validators, "value" | "name"> {
  valid: boolean = true;
  validatorFails: ValidateAble[] = [];
  constructor(public validation: ValidateAble) {
    for (let validator in this.validation) {
      const check = this[validator as keyof ValidateAble](validator);
      if (typeof check === "boolean") {
        if (!check) {
          this.valid = check;
        }
      }
    }
  }

  value(_: string = "value") {
    return this.validation.value;
  }
  name() {
    return this.validation.name;
  }
  type() {
    return typeof this.validation.value;
  }
  required(name?: string) {
    if (name) {
      return !!this.notNull() || !!this.sendError(name);
    } else {
      return !!this.notNull();
    }
  }
  notNull(value?: string | number | boolean) {
    return (typeof value !== "undefined" ? value : this.value())?.toString().trim().length;
  }
  minLength(name: string) {
    const length = this.notNull();
    const minLength = this.validation.minLength;
    if (typeof length === "number" && typeof minLength === "number" && length >= minLength) {
      return true;
    }
    this.sendError(name);
    return false;
  }
  maxLength(name: string) {
    const length = this.notNull();
    const maxLength = this.validation.maxLength;
    if (typeof length === "number" && typeof maxLength === "number" && length <= maxLength) {
      return true;
    }
    this.sendError(name);
    return false;
  }
  min(name: string) {
    let valid: boolean = false;
    const min = this.validation?.min!;
    if (this.required() && this.notNull(min)) {
      if (this.type() === "string") {
        const stringNumber = parseFloat(this.value() as string);
        if (!isNaN(stringNumber) && stringNumber >= min) {
          valid = true;
        } else {
          this.sendError(name);

          valid = false;
        }
      } else if (this.type() === "number" && (this.value() as number) >= min) {
        valid = true;
      } else {
        this.sendError(name);
        valid = false;
      }
    }
    return valid;
  }
  max(name: string) {
    let valid: boolean = false;
    const max = this.validation?.max!;
    if (this.required() && this.notNull(max)) {
      if (this.type() === "string") {
        const stringNumber = parseFloat(this.value() as string);

        if (!isNaN(stringNumber) && stringNumber <= max) {
          valid = true;
        } else {
          this.sendError(name);
          valid = false;
        }
      } else if (this.type() === "number" && (this.value() as number) <= max) {
        valid = true;
      } else {
        this.sendError(name);
        valid = false;
      }
    }
    return valid;
  }
  sendError(name: string) {
    this.validatorFails.push({ name, value: this.validation[name as keyof ValidateAble]! });
    return false;
  }
}
