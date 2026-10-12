import { fairshare } from "../apps/fairshare/domain";
export const projects = [fairshare];
export const findProject = (id: string) =>
  projects.find((project) => project.id === id);
