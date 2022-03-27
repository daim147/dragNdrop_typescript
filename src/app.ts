// Project Type
enum ProjectStatus {
  Active,
  Finished,
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}

// Project State Management
type Listener = (items: Project[]) => void;
// Project State Management
class ProjectState {
  private listeners: Listener[] = [];
  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor() {}

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }

  addListener(listenerFn: Listener) {
    this.listeners.push(listenerFn);
  }

  addProject(title: string, description: string, people: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      people,
      ProjectStatus.Active
    );
    this.projects.push(newProject);
    for (const listenerFn of this.listeners) {
      listenerFn(this.projects.slice());
    }
  }
}
const projectState = ProjectState.getInstance();

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
  value?: string | number | boolean;
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
  validatorFails: ValidateAble[];
}
interface inputElement {
  name: string;
  element: HTMLInputElement;
}
type Validators = {
  [Property in keyof ValidateAble]-?: (name: string) => boolean;
};
type userTuple = [string, string, number];

class Validate implements Omit<Validators, "value" | "name"> {
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
  notNull() {
    return this.value()?.toString().trim().length;
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
    const min = this.validation?.min;
    if (this.required() && min) {
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
    const max = this.validation?.max;
    if (this.required() && max) {
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
// ProjectList Class
class ProjectList {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLElement;
  assignedProjects: Project[] = [];
  constructor(private type: "active" | "finished") {
    this.templateElement = document.getElementById("project-list")! as HTMLTemplateElement;
    this.hostElement = document.getElementById("app")! as HTMLDivElement;

    const importedNode = document.importNode(this.templateElement.content, true);
    this.element = importedNode.firstElementChild as HTMLElement;
    this.element.id = `${this.type}-projects`;
    projectState.addListener((projects: Project[]) => {
      this.assignedProjects = projects;
      this.renderProjects();
    });
    this.attach();
    this.renderContent();
  }
  private renderProjects() {
    const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
    for (const prjItem of this.assignedProjects) {
      const listItem = document.createElement("li");
      listItem.textContent = prjItem.title;
      listEl.appendChild(listItem);
    }
  }

  private renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector("h2")!.textContent = this.type.toUpperCase() + " PROJECTS";
  }

  private attach() {
    this.hostElement.insertAdjacentElement("beforeend", this.element);
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
    const userInput = this.getUserInput()! as userTuple;
    console.log(userInput);
    if (Array.isArray(userInput)) {
      projectState.addProject(...userInput);
      this.clearUserInput();
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
    const validation = this.validateArray(
      [
        { name: "title", maxLength: 10, minLength: 5 },
        { name: "people", max: 5, min: 5, required: true },
        { name: "description", required: true },
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
  private config() {
    this.element.addEventListener("submit", this.submitHandler);
  }
  private attach() {
    this.hostElement.insertAdjacentElement("afterbegin", this.element);
  }
}

const a = new ProjectInput();
const activePrjList = new ProjectList("active");
const finishedPrjList = new ProjectList("finished");
