import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CharacterService, DokkanCharacter } from '../character.service';

interface GuessHint {
  type: boolean;
  color: boolean;
  category: boolean;
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
  attempts: number = 0;
  isGameOver: boolean = false;
  isLoading: boolean = true;
  errorMessage: string = '';
  
  targetCharacter!: DokkanCharacter;
  suggestions: DokkanCharacter[] = [];
  showSuggestions: boolean = false;
  guesses: Guess[] = [];
  
  constructor(private characterService: CharacterService, private elementRef: ElementRef) {}
  
  ngOnInit(): void {
    this.startNewGame();
  }
  
  startNewGame(): void {
    this.isLoading = true;
    this.characterService.getRandomCharacter().subscribe({
      next: (character) => {
        this.targetCharacter = character;
        this.resetGameState();
        this.isLoading = false;
        console.log('Personnage à deviner:', character.name); // Pour le débogage
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
    this.attempts = 0;
    this.guesses = [];
    this.isGameOver = false;
    this.showSuggestions = false;
  }
  
  onInput(): void {
    if (this.characterGuess && this.characterGuess.length > 1) {
      this.characterService.searchCharactersByName(this.characterGuess).subscribe(characters => {
        this.suggestions = characters;
        this.showSuggestions = this.suggestions.length > 0;
      });
    } else {
      this.showSuggestions = false;
    }
  }
  
  selectSuggestion(character: DokkanCharacter): void {
    this.characterGuess = character.name;
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
    
    const selectedCharacter = this.suggestions.find(char => 
      char.name.toLowerCase() === this.characterGuess.toLowerCase()
    );
    
    if (!selectedCharacter) {
      // Si le personnage n'est pas dans les suggestions, on ignore
      return;
    }
    
    this.attempts++;
    
    const isCorrect = selectedCharacter.id === this.targetCharacter.id;
    
    // Générer les indices (vrai/faux)
    const hints: GuessHint = {
      type: selectedCharacter.type === this.targetCharacter.type,
      color: selectedCharacter.color === this.targetCharacter.color,
      category: this.hasCommonCategory(selectedCharacter.categories, this.targetCharacter.categories),
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
    this.showSuggestions = false;
  }
  
  // Méthodes utilitaires pour comparer les personnages
  
  hasCommonCategory(categories1?: string[], categories2?: string[]): boolean {
    if (!categories1 || !categories2) return false;
    return categories1.some(category => 
      categories2.some(targetCategory => 
        targetCategory.toLowerCase() === category.toLowerCase()
      )
    );
  }
  
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
  
  giveUp(): void {
    this.isGameOver = true;
  }
  
  resetGame(): void {
    this.startNewGame();
  }
}