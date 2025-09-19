import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { Homepage } from './app/features/homepage/homepage';

bootstrapApplication(Homepage, appConfig)
  .catch((err) => console.error(err));
