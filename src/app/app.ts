import { Component } from '@angular/core';
import { ShellComponent } from './presentation/compartido/shell/shell.component';

@Component({
  imports: [ShellComponent],
  selector: 'app-root',
  template: `<app-shell />`,
})
export class App {}
