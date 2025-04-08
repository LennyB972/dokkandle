import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardService } from '../../services/card.service';
import { Card } from '../../models/card.model';

@Component({
  selector: 'app-card-detail',
  templateUrl: './card-detail.component.html',
  styleUrls: ['./card-detail.component.css']
})
export class CardDetailComponent implements OnInit {
  card: Card | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cardService: CardService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        const id = +idParam;
        this.loadCard(id);
      } else {
        this.router.navigate(['/cards']);
      }
    });
  }

  loadCard(id: number): void {
    this.loading = true;
    this.cardService.getCardById(id).subscribe({
      next: (data) => {
        this.card = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des détails de la carte';
        this.loading = false;
        console.error(err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/cards']);
  }

  // Cette fonction transforme le texte brut en HTML pour l'affichage des passives
  formatPassiveSkill(text: string): string {
    if (!text) return '';
    
    // Remplacer les retours à la ligne par des balises BR
    let formatted = text.replace(/\n/g, '<br>');
    
    // Mettre en gras les titres d'effets entre *
    formatted = formatted.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    
    return formatted;
  }
}