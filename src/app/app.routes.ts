import { Routes } from '@angular/router';
import { MenuRouteProxyComponent } from './menu-route-proxy.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'fornecedores' },
  { path: 'fornecedores', component: MenuRouteProxyComponent },
  { path: 'orcamentos', component: MenuRouteProxyComponent },
  { path: 'favoritos', component: MenuRouteProxyComponent },
  { path: 'calendario', component: MenuRouteProxyComponent },
  { path: 'financeiro', component: MenuRouteProxyComponent },
  { path: 'notificacoes', component: MenuRouteProxyComponent },
  { path: 'guia', component: MenuRouteProxyComponent },
  { path: 'personalizar', component: MenuRouteProxyComponent },
  { path: 'perfil', component: MenuRouteProxyComponent },
  { path: 'configuracoes', component: MenuRouteProxyComponent },
  { path: '**', redirectTo: 'fornecedores' },
];
