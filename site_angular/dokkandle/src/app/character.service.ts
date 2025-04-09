import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, BehaviorSubject } from 'rxjs';
import { map, catchError, tap, switchMap, finalize } from 'rxjs/operators';

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
  private charactersCache: DokkanCharacter[] | null = null;
  private characterIds: number[] = [];
  private retryCount: number = 0; // Compteur pour limiter les tentatives de récursion
  
  // BehaviorSubject pour suivre l'état de chargement
  private loadingSubject = new BehaviorSubject<boolean>(true);
  public loading$ = this.loadingSubject.asObservable();
  
  // BehaviorSubject pour suivre l'état de préchargement des images
  private imagesLoadedSubject = new BehaviorSubject<boolean>(false);
  public imagesLoaded$ = this.imagesLoadedSubject.asObservable();
  
  constructor(private http: HttpClient) {
    // Préchargement des données au démarrage du service
    this.preloadAllCharacters();
  }
  
  // Préchargement des personnages
  private preloadAllCharacters(): void {
    this.loadingSubject.next(true);
    
    // Charger d'abord uniquement la liste des IDs (légère)
    this.http.get<number[]>('/data/character-ids.json').subscribe({
      next: (ids) => {
        this.characterIds = ids;
        console.log(`${ids.length} IDs de personnages chargés`);
        
        // Commencer à charger les personnages immédiatement, mais limiter le nombre
        // Nous allons charger un sous-ensemble de personnages pour que le jeu puisse démarrer rapidement
        const initialBatchSize = 50; // Nombre de personnages à charger initialement
        const randomIds = [...ids]; // Copie de la liste d'IDs
        
        // Mélanger les IDs pour une sélection aléatoire
        for (let i = randomIds.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [randomIds[i], randomIds[j]] = [randomIds[j], randomIds[i]];
        }
        
        // Sélectionner un sous-ensemble d'IDs pour le chargement initial
        const initialBatchIds = randomIds.slice(0, initialBatchSize);
        
        // Charger ce sous-ensemble de personnages
        this.loadBatchOfCharacters(initialBatchIds).subscribe({
          next: (characters) => {
            this.charactersCache = characters;
            console.log(`Chargement initial de ${characters.length} personnages terminé`);
            
            // Précharger les images des personnages
            this.preloadCharacterImages(characters);
            
            // Une fois les personnages chargés, indiquer que le chargement initial est terminé
            this.loadingSubject.next(false);
            
            // Continuer à charger le reste des personnages en arrière-plan
            setTimeout(() => {
              this.loadRemainingCharacters(ids, initialBatchIds);
            }, 3000);
          },
          error: (error) => {
            console.error('Erreur lors du chargement initial des personnages:', error);
            this.loadingSubject.next(false); // Terminer le chargement même en cas d'erreur
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des IDs des personnages:', error);
        this.loadingSubject.next(false); // Terminer le chargement en cas d'erreur
      }
    });
  }
  
  // Précharger les images des personnages
  private preloadCharacterImages(characters: DokkanCharacter[]): void {
    const imagesToLoad = characters.length;
    let loadedImages = 0;
    
    characters.forEach(character => {
      const imageId = character.id - 1;
      const img = new Image();
      
      img.onload = () => {
        loadedImages++;
        if (loadedImages >= imagesToLoad) {
          console.log('Toutes les images sont préchargées');
          this.imagesLoadedSubject.next(true);
        }
      };
      
      img.onerror = () => {
        loadedImages++;
        if (loadedImages >= imagesToLoad) {
          console.log('Préchargement des images terminé (avec erreurs)');
          this.imagesLoadedSubject.next(true);
        }
      };
      
      img.src = `/data/img/${imageId}.png`;
    });
    
    // Définir un délai maximum pour le chargement des images (5 secondes)
    setTimeout(() => {
      if (!this.imagesLoadedSubject.value) {
        console.log('Délai de chargement des images dépassé, continuation du jeu');
        this.imagesLoadedSubject.next(true);
      }
    }, 5000);
  }
  
  // Charger un lot spécifique de personnages
  private loadBatchOfCharacters(ids: number[]): Observable<DokkanCharacter[]> {
    const characterObservables = ids.map(id => 
      this.http.get<DokkanCharacter>(`/data/filtered-info/${id}.json`).pipe(
        catchError(error => {
          console.warn(`Erreur lors du chargement du personnage ID ${id}:`, error);
          return of({} as DokkanCharacter);
        })
      )
    );
    
    return forkJoin(characterObservables).pipe(
      map(results => results.filter(char => char.id)) // Filtrer les résultats vides
    );
  }
  
  // Charger le reste des personnages en arrière-plan
  private loadRemainingCharacters(allIds: number[], alreadyLoadedIds: number[]): void {
    const remainingIds = allIds.filter(id => !alreadyLoadedIds.includes(id));
    
    if (remainingIds.length === 0) {
      console.log('Tous les personnages sont déjà chargés');
      return;
    }
    
    console.log(`Chargement des ${remainingIds.length} personnages restants en arrière-plan...`);
    
    // Créer des lots de personnages à charger
    const batchSize = 20;
    const totalBatches = Math.ceil(remainingIds.length / batchSize);
    
    // Charger séquentiellement chaque lot
    let currentBatch = 0;
    
    const loadNextBatch = () => {
      if (currentBatch >= totalBatches) {
        console.log('Chargement de tous les personnages terminé');
        return;
      }
      
      const startIdx = currentBatch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, remainingIds.length);
      const batchIds = remainingIds.slice(startIdx, endIdx);
      
      this.loadBatchOfCharacters(batchIds).subscribe({
        next: (characters) => {
          if (this.charactersCache) {
            this.charactersCache = [...this.charactersCache, ...characters];
          } else {
            this.charactersCache = characters;
          }
          
          console.log(`Lot ${currentBatch + 1}/${totalBatches} chargé, ${this.charactersCache.length} personnages au total`);
          
          currentBatch++;
          setTimeout(loadNextBatch, 500); // Attendre 500ms entre chaque lot
        },
        error: (error) => {
          console.error(`Erreur lors du chargement du lot ${currentBatch + 1}:`, error);
          currentBatch++;
          setTimeout(loadNextBatch, 500); // Continuer malgré l'erreur
        }
      });
    };
    
    loadNextBatch();
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
        // Limiter le nombre de requêtes simultanées pour éviter ERR_INSUFFICIENT_RESOURCES
        const batchSize = 10; // Nombre de requêtes à effectuer en même temps
        const totalBatches = Math.ceil(ids.length / batchSize);
        const batches: Observable<DokkanCharacter[]>[] = [];
        
        // Créer des groupes de requêtes
        for (let i = 0; i < totalBatches; i++) {
          const startIdx = i * batchSize;
          const endIdx = Math.min(startIdx + batchSize, ids.length);
          const batchIds = ids.slice(startIdx, endIdx);
          
          // Créer un observable pour ce groupe
          const batchObservable = forkJoin(
            batchIds.map(id => 
              this.http.get<DokkanCharacter>(`/data/filtered-info/${id}.json`).pipe(
                catchError(error => {
                  console.warn(`Erreur lors du chargement du personnage ID ${id}:`, error);
                  // Retourner un objet vide en cas d'erreur pour ne pas bloquer le reste
                  return of({} as DokkanCharacter);
                })
              )
            )
          );
          
          batches.push(batchObservable);
        }
        
        // Traiter les groupes séquentiellement
        return batches.reduce(
          (acc, batch) => acc.pipe(
            switchMap(accResult => 
              batch.pipe(
                map(batchResult => [...accResult, ...batchResult.filter(char => char.id)])
              )
            )
          ),
          of([] as DokkanCharacter[])
        );
      }),
      catchError(error => {
        console.warn('Impossible de charger les IDs ou les personnages, utilisation des données de secours', error);
        
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
        ]);
      }),
      tap(characters => {
        this.charactersCache = characters;
      })
    );
  }
  
  // Obtenir un personnage aléatoire de façon optimisée
  getRandomCharacter(): Observable<DokkanCharacter> {
    // Si nous avons déjà des personnages en cache, utiliser le cache
    if (this.charactersCache && this.charactersCache.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.charactersCache.length);
      return of(this.charactersCache[randomIndex]);
    }
    
    // Sinon, charger juste la liste des IDs et choisir un ID aléatoire
    return this.http.get<number[]>('/data/character-ids.json').pipe(
      tap(ids => {
        if (!this.characterIds.length) {
          this.characterIds = ids;
        }
      }),
      switchMap(ids => {
        // Sélectionner un ID aléatoire
        const randomIndex = Math.floor(Math.random() * ids.length);
        const randomId = ids[randomIndex];
        
        // Charger uniquement ce personnage
        return this.http.get<DokkanCharacter>(`/data/filtered-info/${randomId}.json`).pipe(
          catchError(error => {
            console.error(`Erreur lors du chargement du personnage ID ${randomId}:`, error);
            
            // En cas d'erreur, essayer un autre personnage aléatoire (récursion limitée à 3 tentatives)
            if (this.retryCount < 3) {
              this.retryCount++;
              return this.getRandomCharacter();
            }
            
            // Si plus de 3 tentatives, utiliser une donnée de secours
            this.retryCount = 0;
            return of({
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
            });
          })
        );
      })
    );
  }
  
  // Vérifier si tout est chargé et prêt pour jouer
  isReadyToPlay(): Observable<boolean> {
    return this.loading$.pipe(
      switchMap(isLoading => {
        if (isLoading) {
          return of(false);
        }
        return this.imagesLoaded$;
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