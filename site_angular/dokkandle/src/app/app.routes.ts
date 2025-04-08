import { Routes } from '@angular/router';
import { GuessCharacterComponent } from './guess-character/guess-character.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: 'guess-character', component: GuessCharacterComponent },
  { path: 'leader-skill', component: GuessCharacterComponent }, // À remplacer par le vrai composant quand il sera créé
  { path: 'passive', component: GuessCharacterComponent }, // À remplacer par le vrai composant quand il sera créé
  { path: 'silhouette', component: GuessCharacterComponent }, // À remplacer par le vrai composant quand il sera créé
  { path: 'daily', component: GuessCharacterComponent }, // À remplacer par le vrai composant quand il sera créé
  { path: '', component: HomeComponent },
  { path: '**', redirectTo: '' } // Redirection pour les routes inconnues
];