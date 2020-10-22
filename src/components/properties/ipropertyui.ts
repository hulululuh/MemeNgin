export interface IProperyUi {
  refresh();
}

export class PropertyChangeComplete {
  propName: string;
  oldValue: any;
  newValue: any;
}
