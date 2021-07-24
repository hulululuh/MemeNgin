// [GPLv3] modified 2021 by jaemoon choi as a part of MemeNgin(https://github.com/hulululuh/MemeNgin)
// [GPLv3] created 2020 by nicolas brown for texturelab(https://github.com/njbrown/texturelab)

import fs from "fs";
import path from "path";
import { WorkshopManager } from "@/community/workshop";

export const MY_WORKS_PATH = path.join(
  path.resolve("."),
  "/projects/my_works/"
);

export const PUBLISH_TEMP_PATH = path.join(
  path.resolve("."),
  "/projects/my_works/temp"
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

  get isValid() {
    return (
      this.name && this.name.length > 0 && this.path && fs.existsSync(this.path)
    );
  }
}

export class ProjectManager {
  static load(projpath: string): Project {
    if (path.parse(projpath).ext != ".mmng") return null;
    let project = new Project();
    if (!fs.existsSync(projpath)) return null;
    project.path = projpath;
    project.name = projpath.replace(/^.*[\\]/, "");
    try {
      project.data = JSON.parse(fs.readFileSync(projpath).toString());
    } catch (err) {
      console.warn(`Project [${project.name}] has failed to parse`);
      return null;
    }

    return project.isValid ? project : null;
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
