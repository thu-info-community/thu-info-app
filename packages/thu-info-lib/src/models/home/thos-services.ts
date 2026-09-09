export type ThosTaskKind =
  | "active"
  | "todo"
  | "completed"
  | "drafts"
  | "unread"
  | "phases";
export interface ThosCounts {
  active: number;
  todo: number;
  completed?: number;
  drafts?: number;
  returned?: number;
  unread?: number;
}
export interface ThosTask {
  serviceId?: string;
  id: string;
  key: string;
  title: string;
  kind: ThosTaskKind;
  status: string;
  node: string;
  date: string;
  progress?: number;
  summary?: string;
  workflowStatus?: string;
  phaseSteps?: ThosPhaseStep[];
  relatedServices?: ThosRelatedService[];
  url: string;
}
export interface ThosRelatedService {
  id: string;
  name: string;
  url: string;
}
export interface ThosPhaseStepItem {
  id: string;
  name: string;
  state: string;
  serviceId?: string;
  url?: string;
}
export interface ThosPhaseStep {
  order: string;
  name: string;
  state: string;
  items: ThosPhaseStepItem[];
}
export interface ThosService {
  id: string;
  name: string;
  department: string;
  url: string;
  kind?: "form" | "guide" | "integration" | "group";
  inOpenPeriod?: boolean;
}
export interface ThosPage<T> {
  items: T[];
  total: number;
  complete: boolean;
}
