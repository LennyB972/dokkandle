import { Component, OnInit } from '@angular/core';
import { CardService } from '../../services/card.service';
import { Card } from '../../models/card.model';

@Component({
  selector: 'app-card-list',
  templateUrl: './card-list.component.html',
  styleUrls: ['./card-list.component.css']
})
export class CardListComponent implements OnInit {
  cards: Card[] = [];
  filteredCards: Card[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  error: string | null = null;

  constructor(private cardService: CardService) { }

  ngOnInit(): void {
    this.loadCards();
  }

  loadCards(): void {
    this.loading = true;
    this.cardService.getCards().subscribe({
      next: (data) => {
        this.cards = data;
        this.filteredCards = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des cartes';
        this.loading = false;
        console.error(err);
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.filteredCards = this.cards.filter(card => 
      card.name.toLowerCase().includes(term.toLowerCase())
    );
  }
}