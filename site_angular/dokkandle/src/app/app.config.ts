import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    // Utiliser withHashLocation pour que les routes fonctionnent sur GitHub Pages
    provideRouter(routes, withHashLocation()), 
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch())
  ]
};