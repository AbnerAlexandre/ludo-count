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
      withViewTransitions({
        // a primeira navegação não anima: com a aba em segundo plano o navegador
        // não pinta quadros e a transição seguraria a hidratação até a aba aparecer
        skipInitialTransition: true,
        // aba em segundo plano ou navegação interrompida: a transição é abortada
        // pelo navegador — sem efeito na tela, então não vira erro no console
        onViewTransitionCreated: ({ transition }) => {
          const ignore = () => undefined;
          transition.ready.catch(ignore);
          transition.finished.catch(ignore);
          transition.updateCallbackDone.catch(ignore);
        },
      }),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
  ],
};
