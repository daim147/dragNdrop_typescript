//! Decorator for autoBindThis

const AutoBindThis = (_: any, __: string, property: PropertyDescriptor) => {
  let { value, writable, ...object } = property;

  let returnObj = {
    ...object,
    get() {
      return value.bind(this);
    },
    set() {},
  };

  return returnObj;
};

interface ValidateAble {
  value?: string | number;
  name: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

interface ValidStatus {
  name: string;
  valid: boolean;
  validatorFails: string[];
}
interface inputElement {
  name: string;
  element: HTMLInputElement;
}
type Validators = {
  [Property in keyof ValidateAble]-?: (name: string) => boolean;
};
class Validate implements Omit<Validators, "value" | "name"> {
  valid: boolean = true;
  validatorFails: string[] = [];
  constructor(public validation: ValidateAble) {
    for (let validator in this.validation) {
      const check = this[validator as keyof ValidateAble](validator);
      if (typeof check === "boolean") {
        console.log(check, validator);
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
  required() {
    return !!this.notNull();
  }
  notNull() {
    return this.value()?.toString().trim().length;
  }
  minLength(name: string) {
    const length = this.notNull();
    const minLength = this.validation.minLength;
    // console.log(length, minLength, name);
    if (typeof length === "number" && typeof minLength === "number" && length >= minLength) {
      return true;
    }
    this.validatorFails.push(name);
    return false;
  }
  maxLength(name: string) {
    const length = this.notNull();
    const maxLength = this.validation.maxLength;
    // console.log(length, maxLength, name);
    if (typeof length === "number" && typeof maxLength === "number" && length <= maxLength) {
      return true;
    }
    this.validatorFails.push(name);
    return false;
  }
  min(name: string) {
    let valid: boolean = false;
    const min = this.validation?.min;
    if (this.required() && min) {
      console.log(min, name, this.type());
      if (this.type() === "string") {
        const stringNumber = parseFloat(this.value() as string);
        console.log(min, name, this.type(), stringNumber);

        if (!isNaN(stringNumber) && stringNumber >= min) {
          valid = true;
        } else {
          this.validatorFails.push(name);
          valid = false;
        }
      } else if (this.type() === "number" && (this.value() as number) >= min) {
        valid = true;
      } else {
        this.validatorFails.push(name);
        valid = false;
      }
    }
    return valid;
  }
  max(name: string) {
    let valid: boolean = false;
    const max = this.validation?.max;
    if (this.required() && max) {
      console.log(max, name, this.type());

      if (this.type() === "string") {
        const stringNumber = parseFloat(this.value() as string);
        console.log(max, name, this.type(), stringNumber);

        if (!isNaN(stringNumber) && stringNumber <= max) {
          valid = true;
        } else {
          this.validatorFails.push(name);
          valid = false;
        }
      } else if (this.type() === "number" && (this.value() as number) <= max) {
        valid = true;
      } else {
        this.validatorFails.push(name);
        valid = false;
      }
    }
    return valid;
  }
}
class ProjectInput {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLElement;
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;
  inputElements: inputElement[] = [];
  userTuples = ["string", "string", "number"];

  constructor() {
    this.templateElement = document.getElementById("project-input")! as HTMLTemplateElement;
    this.hostElement = document.getElementById("app")! as HTMLDivElement;
    // this.element = this.templateElement.content.firstElementChild! as HTMLElement;
    const importedNode = document.importNode(this.templateElement.content, true);
    this.element = importedNode.firstElementChild! as HTMLElement;
    this.element.id = "user-input";

    this.titleInputElement = this.element.querySelector("#title")! as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector("#description")! as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector("#people")! as HTMLInputElement;
    this.inputElements.push(
      { name: "title", element: this.titleInputElement },
      { name: "description", element: this.descriptionInputElement },
      { name: "people", element: this.peopleInputElement }
    );
    this.config();
    this.attach();
  }
  //fixing this by decorator
  @AutoBindThis
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.getUserInput();
    if (Array.isArray(userInput)) {
      // this.clearUserInput();
    }
  }
  private clearUserInput() {
    this.inputElements.forEach((input) => (input.element.value = ""));
  }
  private mapTuplesIntoArray(this: any, tuple: string | number | boolean, i: number) {
    if (tuple === "string") {
      return this[i].element.value.toString();
    } else if (tuple === "number") {
      return parseFloat(this[i].element.value);
    } else if (tuple === "boolean") {
      return !!this[i].element.value;
    }
  }
  validate(obj: ValidateAble) {
    const { validatorFails, valid } = new Validate(obj);

    return { validatorFails, valid };
  }
  validateArray<K>(arr: ValidateAble[], data: K & inputElement[]): ValidStatus[] {
    let validStatus: ValidStatus[] = [];
    arr.forEach((obj) => {
      const {
        name,
        element: { value },
      } = data.find((dt: any) => dt.name === obj.name)!;
      let valid = this.validate({ ...obj, value });
      validStatus.push({ name, ...valid });
    });
    return validStatus;
  }
  private getUserInput() {
    console.log(
      this.validateArray(
        [
          { name: "title", maxLength: 10, minLength: 5 },
          { name: "people", maxLength: 5, minLength: 2 },
        ],
        this.inputElements
      )
    );
    return this.userTuples.map(this.mapTuplesIntoArray, this.inputElements);
  }
  private config() {
    this.element.addEventListener("submit", this.submitHandler);
  }
  private attach() {
    this.hostElement.insertAdjacentElement("afterbegin", this.element);
  }
}

const a = new ProjectInput();
