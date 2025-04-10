import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharacterService } from '../character.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  title = 'dokkandle';
  logoPath: string = '/assets/logo.png';
  
  constructor(
    private characterService: CharacterService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  ngOnInit(): void {
    // Utiliser la méthode du service pour obtenir le bon chemin des assets
    this.logoPath = this.characterService.getAssetUrl('/assets/logo.png');
    
    // Commencer à charger quelques personnages en arrière-plan dès la page d'accueil
    // Mais uniquement dans le navigateur
    if (isPlatformBrowser(this.platformId)) {
      this.characterService.loadMoreCharactersInBackground(10);
    }
  }
}