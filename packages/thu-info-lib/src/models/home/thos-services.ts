export type ThosTaskKind = "active" | "todo" | "completed";
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
  url: string;
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
