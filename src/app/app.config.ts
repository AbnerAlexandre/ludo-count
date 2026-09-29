import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // Reaproveita o HTML prerenderizado em vez de descartá-lo e re-renderizar,
    // o que eliminava o layout shift (CLS) no primeiro carregamento.
    provideClientHydration(),
    // Animações: entrada/saída de diálogos com animate.enter/leave nativo;
    // movimento dinâmico (molas, placar, revelações) com Motion.
    provideRouter(
      routes,
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
  ],
};
