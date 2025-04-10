import { Component, OnInit, ElementRef, ViewChild, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CharacterService, DokkanCharacter } from '../character.service';

interface GuessHint {
  class: boolean;
  type: boolean;
  hp: 'equal' | 'higher' | 'lower';
  atk: 'equal' | 'higher' | 'lower';
  def: 'equal' | 'higher' | 'lower';
  rarity: boolean;
  releaseYear: boolean;
}

interface Guess {
  character: DokkanCharacter;
  isCorrect: boolean;
  hints: GuessHint;
}

@Component({
  selector: 'app-guess-character',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HttpClientModule],
  templateUrl: './guess-character.component.html',
  styleUrl: './guess-character.component.css'
})
export class GuessCharacterComponent implements OnInit {
  @ViewChild('characterInput') characterInput!: ElementRef;
  
  characterGuess: string = '';
  selectedCharacterId: number | null = null;
  attempts: number = 0;
  isGameOver: boolean = false;
  isLoading: boolean = true;
  errorMessage: string = '';
  
  // Variables pour le statut de chargement
  dataLoadingStatus: string = 'Chargement des données...';
  loadingProgress: number = 0;
  
  targetCharacter!: DokkanCharacter;
  suggestions: DokkanCharacter[] = [];
  showSuggestions: boolean = false;
  guesses: Guess[] = [];
  
  // Nouvel indicateur pour l'abandon
  hasGivenUp: boolean = false;
  
  constructor(
    private characterService: CharacterService, 
    private elementRef: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  ngOnInit(): void {
    // Observer le progrès de chargement depuis le service
    this.characterService.getLoadingProgress().subscribe(progress => {
      this.loadingProgress = progress;
      
      // Mettre à jour le message selon la progression
      if (progress < 25) {
        this.dataLoadingStatus = 'Initialisation du jeu...';
      } else if (progress < 75) {
        this.dataLoadingStatus = 'Chargement des personnages...';
      } else {
        this.dataLoadingStatus = 'Presque prêt...';
      }
    });
    
    // Vérifier quand le jeu est prêt
    this.characterService.isReadyToPlay().subscribe(isReady => {
      if (isReady) {
        this.loadingProgress = 100;
        this.dataLoadingStatus = 'Chargement terminé!';
        
        // Petit délai pour montrer que le chargement est terminé
        setTimeout(() => {
          this.startNewGame();
        }, 500);
      }
    });
  }
  
  startNewGame(): void {
    this.isLoading = true;
    this.dataLoadingStatus = 'Choix du personnage à deviner...';
    
    this.characterService.getRandomCharacter().subscribe({
      next: (character) => {
        this.targetCharacter = character;
        this.resetGameState();
        this.isLoading = false;
        
        // Afficher les infos du personnage à deviner dans la console (uniquement dans le navigateur)
        if (isPlatformBrowser(this.platformId)) {
          console.log('Personnage à deviner:', character.name);
          console.log('Type:', character.class, character.type);
          console.log('Stats:', 'HP:', character.hp_max, 'ATK:', character.atk_max, 'DEF:', character.def_max);
        }
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des données. Veuillez réessayer.';
        this.isLoading = false;
        console.error('Erreur:', error);
      }
    });
  }
  
  resetGameState(): void {
    this.characterGuess = '';
    this.selectedCharacterId = null;
    this.attempts = 0;
    this.guesses = [];
    this.isGameOver = false;
    this.showSuggestions = false;
    this.hasGivenUp = false; // Réinitialiser l'indicateur d'abandon
  }
  
  onInput(): void {
    // Réinitialiser l'ID sélectionné lorsque l'utilisateur modifie la saisie
    this.selectedCharacterId = null;
    
    if (this.characterGuess && this.characterGuess.length > 1) {
      this.characterService.searchCharactersByName(this.characterGuess).subscribe(characters => {
        // Filtrer les personnages déjà devinés
        const alreadyGuessedIds = this.guesses.map(guess => guess.character.id);
        const filteredCharacters = characters.filter(character => 
          !alreadyGuessedIds.includes(character.id)
        );
        
        this.suggestions = filteredCharacters;
        this.showSuggestions = this.suggestions.length > 0;
      });
    } else {
      this.showSuggestions = false;
    }
  }
  
  selectSuggestion(character: DokkanCharacter): void {
    this.characterGuess = character.name;
    this.selectedCharacterId = character.id;
    this.showSuggestions = false;
    // Focus sur l'input après sélection
    setTimeout(() => {
      this.characterInput.nativeElement.focus();
    }, 0);
  }
  
  // Pour fermer les suggestions en cliquant ailleurs
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showSuggestions = false;
    }
  }
  
  submitGuess(): void {
    if (!this.characterGuess || this.isGameOver) return;
    
    let selectedCharacter: DokkanCharacter | undefined;
    
    // Si un ID a été sélectionné, utiliser cet ID spécifique
    if (this.selectedCharacterId !== null) {
      selectedCharacter = this.suggestions.find(char => char.id === this.selectedCharacterId);
      
      if (!selectedCharacter) {
        console.warn('ID sélectionné introuvable, recherche par nom');
        selectedCharacter = this.suggestions.find(char => 
          char.name.toLowerCase() === this.characterGuess.toLowerCase()
        );
      }
    } else {
      // Si aucun ID n'a été sélectionné (l'utilisateur a tapé sans choisir une suggestion)
      const matchingCharacters = this.suggestions.filter(char => 
        char.name.toLowerCase() === this.characterGuess.toLowerCase()
      );
      
      if (matchingCharacters.length === 1) {
        selectedCharacter = matchingCharacters[0];
      } else if (matchingCharacters.length > 1) {
        // S'il y a plusieurs correspondances exactes, nous ne pouvons pas deviner
        return;
      } else {
        if (this.suggestions.length > 0) {
          selectedCharacter = this.suggestions[0];
        }
      }
    }
    
    if (!selectedCharacter) {
      return;
    }
    
    this.attempts++;
    
    const isCorrect = selectedCharacter.id === this.targetCharacter.id;
    
    // Générer les indices
    const hints: GuessHint = {
      class: selectedCharacter.class === this.targetCharacter.class,
      type: selectedCharacter.type === this.targetCharacter.type,
      hp: this.compareStatistic(selectedCharacter.hp_max, this.targetCharacter.hp_max),
      atk: this.compareStatistic(selectedCharacter.atk_max, this.targetCharacter.atk_max),
      def: this.compareStatistic(selectedCharacter.def_max, this.targetCharacter.def_max),
      rarity: this.isSameRarity(selectedCharacter, this.targetCharacter),
      releaseYear: this.isSameReleaseYear(selectedCharacter, this.targetCharacter)
    };
    
    // Ajouter cette tentative à la liste
    this.guesses.push({
      character: selectedCharacter,
      isCorrect,
      hints
    });
    
    if (isCorrect) {
      this.isGameOver = true;
    }
    
    this.characterGuess = '';
    this.selectedCharacterId = null;
    this.showSuggestions = false;
  }
  
  // Méthode pour comparer une statistique individuelle
  compareStatistic(stat1: number, stat2: number): 'equal' | 'higher' | 'lower' {
    const threshold = 200; // Marge d'erreur pour considérer les stats comme égales
    
    if (Math.abs(stat1 - stat2) < threshold) {
      return 'equal';
    } else if (stat1 > stat2) {
      return 'higher';
    } else {
      return 'lower';
    }
  }
  
  // Méthodes utilitaires pour comparer les personnages
  isSameRarity(char1: DokkanCharacter, char2: DokkanCharacter): boolean {
    // Comparer les raretés (Dokkan Festival, Carnival, F2P, Other)
    if (char1.is_dokkan_fes && char2.is_dokkan_fes) return true;
    if (char1.is_carnival_only && char2.is_carnival_only) return true;
    if (char1.is_f2p && char2.is_f2p) return true;
    if (!char1.is_dokkan_fes && !char1.is_carnival_only && !char1.is_f2p &&
        !char2.is_dokkan_fes && !char2.is_carnival_only && !char2.is_f2p) return true;
    return false;
  }
  
  isSameReleaseYear(char1: DokkanCharacter, char2: DokkanCharacter): boolean {
    try {
      const year1 = new Date(char1.open_at).getFullYear();
      const year2 = new Date(char2.open_at).getFullYear();
      return year1 === year2;
    } catch (e) {
      console.error('Erreur lors de la comparaison des dates:', e);
      return false;
    }
  }
  
  // Méthode pour obtenir la direction (flèche) pour les dates
  getYearDirection(char1: DokkanCharacter, char2: DokkanCharacter): string {
    try {
      const year1 = new Date(char1.open_at).getFullYear();
      const year2 = new Date(char2.open_at).getFullYear();
      
      if (year1 === year2) return '';
      return year1 > year2 ? '↓' : '↑'; // Flèche vers le bas si plus récent, vers le haut si plus ancien
    } catch (e) {
      return '';
    }
  }
  
  // Méthodes pour obtenir des informations formatées
  getCharacterRarity(character: DokkanCharacter): string {
    if (character.is_dokkan_fes) return 'Dokkan Festival';
    if (character.is_carnival_only) return 'Carnival';
    if (character.is_f2p) return 'F2P';
    return 'Other';
  }
  
  getCharacterReleaseYear(character: DokkanCharacter): string {
    if (!character.open_at) return '';
    try {
      return new Date(character.open_at).getFullYear().toString();
    } catch (e) {
      console.error('Erreur lors du traitement de la date:', e);
      return '';
    }
  }
  
  // Fonction pour générer l'URL de l'image du personnage
  getCharacterImageUrl(character: DokkanCharacter): string {
    return this.characterService.getCharacterImageUrl(character.id);
  }
  
  // Gestion des erreurs d'images
  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.characterService.getAssetUrl('/assets/default-character.png');
  }
  
  giveUp(): void {
    this.hasGivenUp = true; // Marquer que l'utilisateur a abandonné
    this.isGameOver = true;
  }
  
  resetGame(): void {
    this.startNewGame();
  }
  
  // Obtenir la classe du personnage pour l'affichage
  getCharacterClass(): string {
    return this.targetCharacter?.class || '';
  }
  
  // Obtenir le type du personnage pour l'affichage
  getCharacterType(): string {
    return this.targetCharacter?.type || '';
  }
}