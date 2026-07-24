import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

/**
 * Configuração usada apenas na geração estática (prerender). O app continua
 * 100% client-side em produção — o prerender só existe para que buscadores e
 * previews de link recebam HTML com conteúdo real em vez de <app-root> vazio.
 */
const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
