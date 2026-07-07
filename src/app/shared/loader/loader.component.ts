import { Component, inject } from '@angular/core';
import { LoaderService } from '@app/core/services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
})
export class LoaderComponent {
  loader = inject(LoaderService);
}
