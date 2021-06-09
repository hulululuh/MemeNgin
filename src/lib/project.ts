import fs from "fs";

export class Project {
  name: string = null;
  path: string = null;
  data: object = null;
}

export class ProjectManager {
  static load(path: string): Project {
    let project = new Project();
    if (!fs.existsSync(path)) return null;
    project.path = path;
    project.name = path.replace(/^.*[\\]/, "");
    project.data = JSON.parse(fs.readFileSync(path).toString());
    return project;
  }

  static save(path: string, project: Project) {
    fs.writeFileSync(path, JSON.stringify(project.data));
  }
}
