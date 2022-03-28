import Cmp from "./base-component";
import { AutoBindThis } from "../decorators/autobind";
import { projectState } from "../state/project-state";
import { Validate, ValidateAble, ValidStatus } from "../util/validation";

// ProjectInput Class
interface inputElement {
  name: string;
  element: HTMLInputElement;
}
export class ProjectInput extends Cmp<HTMLDivElement, HTMLFormElement> {
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;
  inputElements: inputElement[] = [];
  userTuples = ["string", "string", "number"];
  constructor() {
    super("project-input", "app", true, "user-input");
    this.titleInputElement = this.element.querySelector("#title") as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector("#description") as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector("#people") as HTMLInputElement;
    this.inputElements.push(
      { name: "title", element: this.titleInputElement },
      { name: "description", element: this.descriptionInputElement },
      { name: "people", element: this.peopleInputElement }
    );
    this.configure();
  }

  configure() {
    this.element.addEventListener("submit", this.submitHandler);
  }

  renderContent() {}
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
  private mapTuplesIntoArray(this: any, tuple: string | number | boolean, i: number) {
    if (tuple === "string") {
      return this[i].element.value.toString();
    } else if (tuple === "number") {
      return parseFloat(this[i].element.value);
    } else if (tuple === "boolean") {
      return !!this[i].element.value;
    }
  }
  private gatherUserInput() {
    const validation = this.validateArray(
      [
        { name: "title", maxLength: 15, minLength: 5 },
        { name: "description", minLength: 10, maxLength: 100 },
        { name: "people", max: 10, min: 0 },
      ],
      this.inputElements
    );
    for (let valid of validation) {
      if (!valid.valid) {
        alert(
          `Please ensure ${valid.name} to valid and fullfil ${valid.validatorFails.map(
            (valid) => `${valid.name} to ${valid.value} `
          )}`
        );
        return;
      }
    }

    return this.userTuples.map(this.mapTuplesIntoArray, this.inputElements);
  }

  private clearInputs() {
    this.titleInputElement.value = "";
    this.descriptionInputElement.value = "";
    this.peopleInputElement.value = "";
  }

  @AutoBindThis
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, desc, people] = userInput;
      projectState.addProject(title, desc, people);
      this.clearInputs();
    }
  }
}
