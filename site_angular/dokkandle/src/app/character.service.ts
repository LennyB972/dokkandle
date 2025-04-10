import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

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
  
  // Propriétés des nouveaux JSON
  class: string;  // Super ou Extreme
  type: string;   // AGL, TEQ, INT, STR, PHY
}

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  private charactersCache: DokkanCharacter[] = [];
  private characterIds: number[] = [];
  private basePath: string = ''; // Sera configuré selon l'environnement
  private isBrowser: boolean;
  private fallbackCharacters: DokkanCharacter[] = [];
  
  // BehaviorSubject pour suivre l'état de chargement
  private loadingSubject = new BehaviorSubject<boolean>(true);
  public loading$ = this.loadingSubject.asObservable();
  
  // BehaviorSubject pour suivre le progrès de chargement
  private progressSubject = new BehaviorSubject<number>(0);
  public progress$ = this.progressSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Vérifier si nous sommes dans le navigateur
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Configurer le chemin de base - uniquement si dans le navigateur
    this.configureBasePath();
    
    // Initialiser le fallback pour les données
    this.initFallbackData();
    
    // Charger un sous-ensemble minimal de données pour commencer
    if (this.isBrowser) {
      this.initMinimalData();
    } else {
      // En mode serveur, on utilise juste les données de secours
      this.loadingSubject.next(false);
      this.progressSubject.next(100);
    }
  }
  
  // Configure le chemin de base selon l'environnement
  private configureBasePath(): void {
    // Par défaut, le chemin est vide (pour le développement local ou SSR)
    this.basePath = '';
    
    // Vérifier si nous sommes dans le navigateur
    if (this.isBrowser) {
      try {
        // Vérifier si nous sommes sur GitHub Pages (URL contient "github.io")
        const isGitHubPages = window.location.hostname.includes('github.io');
        
        if (isGitHubPages) {
          // Obtenir le nom du repo depuis l'URL
          const pathSegments = window.location.pathname.split('/');
          const repoName = pathSegments[1]; // Le premier segment après le slash est le nom du repo
          
          // Si nous sommes sur GitHub Pages, le chemin de base inclut le nom du repo
          this.basePath = `/${repoName}`;
          
          console.log(`Chemin de base configuré pour GitHub Pages: ${this.basePath}`);
        } else {
          console.log('Chemin de base configuré pour le développement local');
        }
      } catch (error) {
        console.warn('Erreur lors de la configuration du chemin de base:', error);
      }
    }
  }
  
  // Initialiser des données de secours minimales
  private initFallbackData(): void {
    this.fallbackCharacters = [
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
        class: "Super",
        type: "AGL"
      },
      {
        name: "Super Saiyan Vegeta",
        id: 1000021,
        hp_max: 7920,
        atk_max: 6700,
        def_max: 4325,
        is_f2p: false,
        is_dokkan_fes: false,
        is_carnival_only: false,
        open_at: "2015-10-30 00:00:00",
        has_optimal_awakening_growths: false,
        class: "Extreme",
        type: "TEQ"
      },
      {
        name: "Super Saiyan Goku",
        id: 1000831,
        hp_max: 7914,
        atk_max: 7286,
        def_max: 3767,
        is_f2p: false,
        is_dokkan_fes: false,
        is_carnival_only: false,
        open_at: "2015-10-30 00:00:00",
        has_optimal_awakening_growths: false,
        class: "Super",
        type: "STR"
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
        class: "Super",
        type: "TEQ"
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
        class: "Extreme",
        type: "TEQ"
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
        class: "Super",
        type: "PHY"
      }
    ];
  }
  
  // Initialiser un ensemble minimal de données pour démarrer
  private initMinimalData(): void {
    if (!this.isBrowser) return;
    
    this.loadingSubject.next(true);
    this.progressSubject.next(5);
    
    // Essayer de charger la liste des IDs (fichier léger)
    this.http.get<number[]>(`${this.basePath}/data/character-ids.json`)
      .pipe(
        catchError(error => {
          console.warn('Erreur lors du chargement des IDs, utilisation du fallback', error);
          // Si nous ne pouvons pas charger les IDs, utiliser le fallback
          this.charactersCache = [...this.fallbackCharacters];
          this.loadingSubject.next(false);
          this.progressSubject.next(100);
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (ids) => {
          this.characterIds = ids;
          this.progressSubject.next(25);
          console.log(`${ids.length} IDs chargés`);
          
          // Au lieu de tout charger, sélectionner un petit ensemble aléatoire
          const sampleSize = 10; // Nombre de personnages à charger initialement
          
          // Sélectionner aléatoirement quelques IDs
          const selectedIds = this.getRandomSample(ids, sampleSize);
          
          // Préparer les fallbacks dans le cache
          this.charactersCache = [...this.fallbackCharacters];
          
          // Charger ces personnages
          this.loadSelectedCharacters(selectedIds);
        },
        error: (error) => {
          // Déjà géré dans le catchError
        }
      });
  }
  
  // Sélectionner un échantillon aléatoire d'IDs
  private getRandomSample(array: any[], size: number): any[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
  }
  
  // Charger un ensemble spécifique de personnages
  private loadSelectedCharacters(ids: number[]): void {
    if (!this.isBrowser || ids.length === 0) {
      this.loadingSubject.next(false);
      this.progressSubject.next(100);
      return;
    }
    
    // Charger les personnages un par un pour éviter les timeouts
    let loaded = 0;
    const totalToLoad = ids.length;
    
    const loadNext = (index: number) => {
      if (index >= ids.length) {
        this.loadingSubject.next(false);
        this.progressSubject.next(100);
        return;
      }
      
      const id = ids[index];
      this.http.get<DokkanCharacter>(`${this.basePath}/data/filtered-info/${id}.json`)
        .pipe(
          catchError(error => {
            console.warn(`Échec du chargement du personnage ${id}, passage au suivant`, error);
            return of(null);
          })
        )
        .subscribe({
          next: (character) => {
            loaded++;
            
            // Calculer la progression (25% pour les IDs + 75% pour les personnages)
            const characterProgress = 75 * (loaded / totalToLoad);
            this.progressSubject.next(25 + characterProgress);
            
            if (character) {
              // Vérifier si ce personnage n'existe pas déjà dans le cache
              if (!this.charactersCache.some(c => c.id === character.id)) {
                this.charactersCache.push(character);
              }
            }
            
            // Charger le prochain avec un délai pour éviter l'engorgement
            setTimeout(() => loadNext(index + 1), 100);
          },
          error: (error) => {
            // En cas d'erreur, passer au suivant
            loaded++;
            setTimeout(() => loadNext(index + 1), 100);
          }
        });
    };
    
    // Démarrer le chargement séquentiel
    loadNext(0);
  }
  
  // Charger plus de personnages en arrière-plan (appelé après le chargement initial)
  loadMoreCharactersInBackground(count: number = 10): void {
    if (!this.isBrowser || this.characterIds.length === 0 || this.loadingSubject.value) {
      return; // Ne pas charger si nous sommes déjà en train de charger ou sans IDs
    }
    
    // Filtrer les IDs qui ne sont pas déjà dans le cache
    const cachedIds = this.charactersCache.map(char => char.id);
    const availableIds = this.characterIds.filter(id => !cachedIds.includes(id));
    
    if (availableIds.length === 0) {
      return; // Tous les personnages sont déjà chargés
    }
    
    // Sélectionner un échantillon aléatoire
    const idsToLoad = this.getRandomSample(availableIds, Math.min(count, availableIds.length));
    
    // Charger ces personnages en arrière-plan sans bloquer l'UI
    idsToLoad.forEach(id => {
      setTimeout(() => {
        this.http.get<DokkanCharacter>(`${this.basePath}/data/filtered-info/${id}.json`)
          .pipe(
            catchError(error => {
              console.warn(`Échec du chargement en arrière-plan du personnage ${id}`, error);
              return of(null);
            })
          )
          .subscribe(character => {
            if (character && !this.charactersCache.some(c => c.id === character.id)) {
              this.charactersCache.push(character);
            }
          });
      }, Math.random() * 3000); // Répartir les requêtes sur 3 secondes
    });
  }
  
  // Retourne un personnage aléatoire du cache
  getRandomCharacter(): Observable<DokkanCharacter> {
    if (this.charactersCache.length === 0) {
      // Si le cache est vide, utiliser le fallback
      return of(this.fallbackCharacters[Math.floor(Math.random() * this.fallbackCharacters.length)]);
    }
    
    // Sélectionner un personnage aléatoire du cache
    const randomIndex = Math.floor(Math.random() * this.charactersCache.length);
    const character = this.charactersCache[randomIndex];
    
    // Charger plus de personnages en arrière-plan pendant que l'utilisateur joue
    if (this.isBrowser) {
      setTimeout(() => this.loadMoreCharactersInBackground(5), 1000);
    }
    
    return of(character);
  }
  
  // Vérifier si le service est prêt à être utilisé
  isReadyToPlay(): Observable<boolean> {
    return this.loading$.pipe(
      map(isLoading => !isLoading && this.charactersCache.length > 0)
    );
  }
  
  // Récupérer le progrès de chargement
  getLoadingProgress(): Observable<number> {
    return this.progress$;
  }
  
  // Rechercher des personnages par nom pour l'autocomplétion
  searchCharactersByName(query: string): Observable<DokkanCharacter[]> {
    if (!query || query.trim() === '') {
      return of([]);
    }
    
    const lowerCaseQuery = query.toLowerCase();
    const matchingCharacters = this.charactersCache.filter(character => 
      character.name.toLowerCase().includes(lowerCaseQuery)
    );
    
    // Si nous n'avons pas assez de résultats et que nous avons des IDs, essayer de charger plus
    if (this.isBrowser && matchingCharacters.length < 5 && this.characterIds.length > 0) {
      // Charger plus de personnages en arrière-plan
      this.loadMoreCharactersInBackground(10);
    }
    
    return of(matchingCharacters);
  }
  
  // Obtenir l'URL de l'image avec le chemin de base correct
  getCharacterImageUrl(characterId: number): string {
    const imageId = characterId - 1;
    return `${this.basePath}/data/img/${imageId}.png`;
  }
  
  // Utilitaire: Traiter correctement les URL des assets
  getAssetUrl(path: string): string {
    return `${this.basePath}${path}`;
  }
}