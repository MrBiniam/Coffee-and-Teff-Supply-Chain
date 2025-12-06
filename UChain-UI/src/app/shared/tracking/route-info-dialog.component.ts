import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { TrackingService, RoutePoint } from './tracking.service';

@Component({
    selector: 'app-route-info-dialog',
    templateUrl: './route-info-dialog.component.html',
    styleUrls: ['./route-info-dialog.component.scss'],
    standalone: false
})
export class RouteInfoDialogComponent implements OnInit {
  routeForm: UntypedFormGroup;
  loading = false;
  searchResults: any[] = [];
  useCurrentPositionAsStart = true;
  currentPosition: { latitude: number, longitude: number } = null;

  constructor(
    private fb: UntypedFormBuilder,
    private trackingService: TrackingService,
    public dialogRef: MatDialogRef<RouteInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { orderId: string }
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.setupLocationSearch();
    this.getCurrentPosition();
  }

  initForm(): void {
    this.routeForm = this.fb.group({
      startAddress: ['', Validators.required],
      endAddress: ['', Validators.required],
      startLat: [null, Validators.required],
      startLng: [null, Validators.required],
      endLat: [null, Validators.required],
      endLng: [null, Validators.required]
    });
  }

  setupLocationSearch(): void {
    // Setup search for end address
    this.routeForm.get('endAddress').valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(query => {
          if (query.length < 3) return of([]);
          
          // Use a local hardcoded set of Ethiopian locations to avoid CSP issues
          const ethiopianLocations = [
            { display_name: 'Addis Ababa, Ethiopia', lat: '9.0222', lon: '38.7468' },
            { display_name: 'Dilla, Ethiopia', lat: '6.4107', lon: '38.3087' },
            { display_name: 'Hawassa, Ethiopia', lat: '7.0504', lon: '38.4955' },
            { display_name: 'Dire Dawa, Ethiopia', lat: '9.5930', lon: '41.8650' },
            { display_name: 'Bahir Dar, Ethiopia', lat: '11.5742', lon: '37.3614' },
            { display_name: 'Gondar, Ethiopia', lat: '12.6030', lon: '37.4521' },
            { display_name: 'Jimma, Ethiopia', lat: '7.6780', lon: '36.8368' },
            { display_name: 'Mekelle, Ethiopia', lat: '13.4967', lon: '39.4667' },
            { display_name: 'Dessie, Ethiopia', lat: '11.1333', lon: '39.6333' },
            { display_name: 'Debre Birhan, Ethiopia', lat: '9.6792', lon: '39.5410' }
          ];
          
          // Filter the hardcoded locations based on the query
          const filteredResults = ethiopianLocations.filter(location => 
            location.display_name.toLowerCase().includes(query.toLowerCase())
          );
          
          return of(filteredResults);
        })
      )
      .subscribe(results => {
        this.searchResults = results;
      }, error => {
        console.error('Search error:', error);
        // Return empty results on error
        this.searchResults = [];
      });
  }

  getCurrentPosition(): void {
    this.loading = true;
    this.trackingService.getCurrentPosition()
      .then(position => {
        this.currentPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        if (this.useCurrentPositionAsStart) {
          this.routeForm.patchValue({
            startLat: this.currentPosition.latitude,
            startLng: this.currentPosition.longitude,
            startAddress: 'Current Position (Driver Location)'
          });
        }
        this.loading = false;
      })
      .catch(error => {
        console.error('Error getting current position:', error);
        this.loading = false;
        this.useCurrentPositionAsStart = false;
      });
  }

  selectLocation(location: any, type: 'end'): void {
    if (type === 'end') {
      this.routeForm.patchValue({
        endAddress: location.display_name,
        endLat: parseFloat(location.lat),
        endLng: parseFloat(location.lon)
      });
      this.searchResults = [];
    }
  }

  onSubmit(): void {
    if (this.routeForm.invalid) return;

    const formValue = this.routeForm.value;
    
    const startPoint: RoutePoint = {
      latitude: formValue.startLat,
      longitude: formValue.startLng,
      name: 'Starting Point',
      address: formValue.startAddress
    };

    const endPoint: RoutePoint = {
      latitude: formValue.endLat,
      longitude: formValue.endLng,
      name: 'Destination',
      address: formValue.endAddress
    };

    this.loading = true;
    
    // Calculate route using OpenRouteService
    this.trackingService.calculateRoute(startPoint, endPoint)
      .subscribe(
        routeData => {
          const route = {
            orderId: this.data.orderId,
            startPoint,
            endPoint,
            routeGeometry: routeData.features[0].geometry,
            estimatedTime: routeData.features[0].properties.summary.duration / 60, // Convert to minutes
            distance: routeData.features[0].properties.summary.distance / 1000, // Convert to km
            createdAt: new Date()
          };
          
          this.dialogRef.close(route);
          this.loading = false;
        },
        error => {
          console.error('Error calculating route:', error);
          this.loading = false;
          // If route calculation fails, still return points
          this.dialogRef.close({
            orderId: this.data.orderId,
            startPoint,
            endPoint,
            createdAt: new Date()
          });
        }
      );
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
