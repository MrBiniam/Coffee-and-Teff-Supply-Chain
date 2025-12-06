import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-uchain-homes',
    templateUrl: './uchain-homes.component.html',
    styleUrls: ['./uchain-homes.component.scss'],
    standalone: false
})
export class UChainHomesComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Initialize any animations or behaviors here
  }

  // Navigation methods
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
