import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';

export interface DokkanCharacter {
  name: string;
  id: number;
  hp_max: number;
  atk_max: number;
  def_max: number;
  is_f2p: boolean;
  is_dokkan_fes: boolean;
  is_carnival_only: boolean;
  open_at: string;
  has_optimal_awakening_growths: boolean;
  
  // Propriétés additionnelles pour la facilité d'utilisation
  type?: string;  // Super ou Extreme
  color?: string; // AGL, TEQ, INT, STR, PHY
  categories?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  private charactersCache: DokkanCharacter[] | null = null;
  private characterIds: number[] = [];
  
  constructor(private http: HttpClient) {
    // Préchargement des données au démarrage du service
    this.preloadAllCharacters();
  }
  
  // Préchargement des personnages
  private preloadAllCharacters(): void {
    this.loadAllCharacters().subscribe({
      next: (characters) => {
        console.log(`${characters.length} personnages chargés avec succès`);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des personnages:', error);
      }
    });
  }
  
  // Chargement de tous les personnages depuis les fichiers JSON
  loadAllCharacters(): Observable<DokkanCharacter[]> {
    if (this.charactersCache) {
      return of(this.charactersCache);
    }

    // Essayer d'abord de charger la liste des IDs
    return this.http.get<number[]>('/data/character-ids.json').pipe(
      tap(ids => this.characterIds = ids),
      switchMap(ids => {
        // Créer un tableau d'observables pour chaque fichier JSON à charger
        const characterObservables = ids.map(id => 
          this.http.get<DokkanCharacter>(`/data/filtered-info/${id}.json`)
        );
        
        // Utiliser forkJoin pour attendre que tous les observables soient résolus
        return forkJoin(characterObservables);
      }),
      catchError(() => {
        console.warn('Impossible de charger les IDs ou les personnages, utilisation des données de secours');
        
        // Fallback pour le développement: créer des données simulées
        return of([
          {
            name: "Super Saiyan Goku",
            id: 1000011,
            hp_max: 8282,
            atk_max: 7136,
            def_max: 3857,
            is_f2p: false,
            is_dokkan_fes: false,
            is_carnival_only: false,
            open_at: "2015-10-30 00:00:00",
            has_optimal_awakening_growths: false,
            type: 'Super',
            color: 'AGL',
            categories: ['Pure Saiyans', 'Goku\'s Family', 'Kamehameha']
          },
          {
            name: "Goku SSJ4",
            id: 1000022,
            hp_max: 7800,
            atk_max: 7500,
            def_max: 3600,
            is_f2p: false,
            is_dokkan_fes: true,
            is_carnival_only: false,
            open_at: "2016-02-15 00:00:00",
            has_optimal_awakening_growths: true,
            type: "Super",
            color: "AGL",
            categories: ["Goku's Family", "Pure Saiyans", "GT Heroes"]
          },
          {
            name: "Vegeta SSJ4",
            id: 1000033,
            hp_max: 7600,
            atk_max: 7800,
            def_max: 3500,
            is_f2p: false,
            is_dokkan_fes: true,
            is_carnival_only: false,
            open_at: "2016-03-20 00:00:00",
            has_optimal_awakening_growths: true,
            type: "Super",
            color: "STR",
            categories: ["Vegeta's Family", "Pure Saiyans", "GT Heroes"]
          },
          {
            name: "Gogeta SSJ4",
            id: 1000044,
            hp_max: 8200,
            atk_max: 8300,
            def_max: 4100,
            is_f2p: false,
            is_dokkan_fes: true,
            is_carnival_only: false,
            open_at: "2018-02-10 00:00:00",
            has_optimal_awakening_growths: true,
            type: "Super",
            color: "TEQ",
            categories: ["Fusion", "Pure Saiyans", "GT Heroes"]
          },
          {
            name: "Golden Frieza",
            id: 1000055,
            hp_max: 7400,
            atk_max: 7600,
            def_max: 4300,
            is_f2p: false,
            is_dokkan_fes: true,
            is_carnival_only: false,
            open_at: "2017-04-15 00:00:00",
            has_optimal_awakening_growths: true,
            type: "Extreme",
            color: "TEQ",
            categories: ["Wicked Bloodline", "Universe Survival Saga"]
          },
          {
            name: "Beerus",
            id: 1000066,
            hp_max: 7900,
            atk_max: 8100,
            def_max: 3800,
            is_f2p: false,
            is_dokkan_fes: true,
            is_carnival_only: false,
            open_at: "2017-09-20 00:00:00",
            has_optimal_awakening_growths: true,
            type: "Super",
            color: "PHY",
            categories: ["Realm of Gods", "Movie Bosses"]
          }
        ]);
      }),
      tap(characters => {
        this.charactersCache = characters;
      })
    );
  }
  
  // Obtenir un personnage aléatoire
  getRandomCharacter(): Observable<DokkanCharacter> {
    return this.loadAllCharacters().pipe(
      map(characters => {
        const randomIndex = Math.floor(Math.random() * characters.length);
        return characters[randomIndex];
      })
    );
  }
  
  // Obtenir un personnage par son nom
  getCharacterByName(name: string): Observable<DokkanCharacter | undefined> {
    return this.loadAllCharacters().pipe(
      map(characters => characters.find(char => 
        char.name.toLowerCase() === name.toLowerCase()
      ))
    );
  }
  
  // Rechercher des personnages par nom (pour l'auto-complétion)
  searchCharactersByName(query: string): Observable<DokkanCharacter[]> {
    if (!query || query.trim() === '') {
      return of([]);
    }
    
    return this.loadAllCharacters().pipe(
      map(characters => {
        const lowerCaseQuery = query.toLowerCase();
        return characters.filter(character => 
          character.name.toLowerCase().includes(lowerCaseQuery)
        );
      })
    );
  }
  
  // Obtenir tous les noms de personnages pour l'auto-complétion
  getAllCharacterNames(): Observable<string[]> {
    return this.loadAllCharacters().pipe(
      map(characters => characters.map(char => char.name))
    );
  }
}