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
// Drag & Drop Interfaces
interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}

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
type Listener<T> = (items: T[]) => void;

class State<T> {
  protected listeners: Listener<T>[] = [];

  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn);
  }
}

class ProjectState extends State<Project> {
  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor() {
    super();
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }

  addProject(title: string, description: string, numOfPeople: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      numOfPeople,
      ProjectStatus.Active
    );
    this.projects.push(newProject);
    this.updateListeners();
  }

  moveProject(projectId: string, newStatus: ProjectStatus) {
    const project = this.projects.find((prj) => prj.id === projectId);
    if (project && project.status !== newStatus) {
      project.status = newStatus;
      this.updateListeners();
    }
  }

  private updateListeners() {
    for (const listenerFn of this.listeners) {
      listenerFn(this.projects.slice());
    }
  }
}

const projectState = ProjectState.getInstance();

// Component Base Class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T;
  element: U;

  constructor(
    templateId: string,
    hostElementId: string,
    insertAtStart: boolean,
    newElementId?: string
  ) {
    this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElementId)! as T;

    const importedNode = document.importNode(this.templateElement.content, true);
    this.element = importedNode.firstElementChild as U;
    if (newElementId) {
      this.element.id = newElementId;
    }

    this.attach(insertAtStart);
  }

  private attach(insertAtBeginning: boolean) {
    this.hostElement.insertAdjacentElement(
      insertAtBeginning ? "afterbegin" : "beforeend",
      this.element
    );
  }

  abstract configure(): void;
  abstract renderContent(): void;
}

// ProjectItem Class
class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {
  private project: Project;

  get persons() {
    if (this.project.people === 1) {
      return "1 person";
    } else {
      return `${this.project.people} persons`;
    }
  }

  constructor(hostId: string, project: Project) {
    super("single-project", hostId, false, project.id);
    this.project = project;

    this.configure();
    this.renderContent();
  }

  @AutoBindThis
  dragStartHandler(event: DragEvent) {
    event.dataTransfer!.setData("text/plain", this.project.id);
    event.dataTransfer!.effectAllowed = "move";
  }

  dragEndHandler(_: DragEvent) {
    console.log("DragEnd");
  }

  configure() {
    this.element.addEventListener("dragstart", this.dragStartHandler);
    this.element.addEventListener("dragend", this.dragEndHandler);
  }

  renderContent() {
    this.element.querySelector("h2")!.textContent = this.project.title;
    this.element.querySelector("h3")!.textContent = this.persons + " assigned";
    this.element.querySelector("p")!.textContent = this.project.description;
  }
}

// ProjectList Class
class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {
  assignedProjects: Project[];

  constructor(private type: "active" | "finished") {
    super("project-list", "app", false, `${type}-projects`);
    this.assignedProjects = [];

    this.configure();
    this.renderContent();
  }

  @AutoBindThis
  dragOverHandler(event: DragEvent) {
    if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
      event.preventDefault();
      const listEl = this.element.querySelector("ul")!;
      listEl.classList.add("droppable");
    }
  }

  @AutoBindThis
  dropHandler(event: DragEvent) {
    const prjId = event.dataTransfer!.getData("text/plain");
    projectState.moveProject(
      prjId,
      this.type === "active" ? ProjectStatus.Active : ProjectStatus.Finished
    );
  }

  @AutoBindThis
  dragLeaveHandler(_: DragEvent) {
    const listEl = this.element.querySelector("ul")!;
    listEl.classList.remove("droppable");
  }

  configure() {
    this.element.addEventListener("dragover", this.dragOverHandler);
    this.element.addEventListener("dragleave", this.dragLeaveHandler);
    this.element.addEventListener("drop", this.dropHandler);

    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter((prj) => {
        if (this.type === "active") {
          return prj.status === ProjectStatus.Active;
        }
        return prj.status === ProjectStatus.Finished;
      });
      this.assignedProjects = relevantProjects;
      this.renderProjects();
    });
  }

  renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector("h2")!.textContent = this.type.toUpperCase() + " PROJECTS";
  }

  private renderProjects() {
    const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
    listEl.innerHTML = "";
    for (const prjItem of this.assignedProjects) {
      new ProjectItem(this.element.querySelector("ul")!.id, prjItem);
    }
  }
}

// ProjectInput Class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
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
        { name: "title", maxLength: 10, minLength: 5 },
        { name: "people", max: 5, min: 5, required: true },
        { name: "description", required: true },
      ],
      this.inputElements
    );
    for (let valid of validation) {
      console.log(valid);
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

const prjInput = new ProjectInput();
const activePrjList = new ProjectList("active");
const finishedPrjList = new ProjectList("finished");
