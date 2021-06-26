import fs from "fs";
import path from "path";
import { WorkshopManager } from "@/community/workshop";

export const MY_WORKS_PATH = path.join(
  path.resolve("."),
  "/projects/my_works/"
);

export class Project {
  name: string = null;
  path: string = null;
  data: object = null;

  get localPath() {
    if (fs.existsSync(this.path)) {
      return this.path;
    } else {
      const name = path.parse(this.path).name;
      const base = path.parse(this.path).base;
      return path.join(MY_WORKS_PATH, `/${name}/${base}`);
    }
  }
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

  static async fromCloud(filePath: string): Promise<any> {
    let project = new Project();

    let contents = JSON.parse(
      await WorkshopManager.getInstance().ReadTextFromFile(filePath)
    );

    project.path = filePath;
    project.name = path.parse(filePath).name;
    project.data = contents;

    return project;
  }

  static save(targetPath: string, project: Project) {
    // make directory if not exists
    const targetDir = path.parse(targetPath).dir;
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(targetPath, JSON.stringify(project.data));
  }
}
