class LocationService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    this.defaultCenter = { lat: 53.8008, lng: -1.5491 }; // Leeds, UK
  }

  // Get user's current location using browser geolocation
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            };

            // Get readable address for the coordinates
            const address = await this.reverseGeocode(coords.lat, coords.lng);
            
            resolve({
              ...coords,
              display: address || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
              source: 'geolocation'
            });
          } catch (error) {
            // Still return coordinates even if reverse geocoding fails
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              display: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
              source: 'geolocation'
            });
          }
        },
        (error) => {
          let errorMessage = 'Failed to get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }

  // Geocode location string to coordinates using Nominatim
  async geocodeLocation(query) {
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid location query');
    }

    const cacheKey = `geocode_${query.toLowerCase().trim()}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Use Nominatim (OpenStreetMap) geocoding service
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        countrycodes: 'gb', // Focus on UK
        'accept-language': 'en'
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: {
            'User-Agent': 'JobTracker/1.0 (job-application-tracker)'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const results = await response.json();
      
      if (!results || results.length === 0) {
        throw new Error('No location found for this search');
      }

      // Process results
      const locations = results.map(result => ({
        display: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        importance: parseFloat(result.importance),
        type: result.type,
        address: {
          city: result.address?.city || result.address?.town || result.address?.village,
          county: result.address?.county,
          state: result.address?.state,
          postcode: result.address?.postcode,
          country: result.address?.country
        },
        boundingBox: result.boundingbox ? {
          north: parseFloat(result.boundingbox[1]),
          south: parseFloat(result.boundingbox[0]),
          east: parseFloat(result.boundingbox[3]),
          west: parseFloat(result.boundingbox[2])
        } : null
      }));

      // Cache results
      this.cache.set(cacheKey, {
        data: locations,
        timestamp: Date.now()
      });

      return locations;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error(`Failed to find location "${query}". Please try a different search term.`);
    }
  }

  // Reverse geocode coordinates to readable address
  async reverseGeocode(lat, lng) {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid coordinates');
    }

    const cacheKey = `reverse_${lat}_${lng}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1',
        'accept-language': 'en'
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params}`,
        {
          headers: {
            'User-Agent': 'JobTracker/1.0 (job-application-tracker)'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result || result.error) {
        throw new Error('No address found for these coordinates');
      }

      // Format address
      const address = this.formatAddress(result.address);
      
      // Cache result
      this.cache.set(cacheKey, {
        data: address,
        timestamp: Date.now()
      });

      return address;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null; // Return null instead of throwing for reverse geocoding
    }
  }

  // Format address from Nominatim response
  formatAddress(address) {
    if (!address) return '';

    const parts = [];
    
    // Add locality (city, town, village)
    if (address.city) {
      parts.push(address.city);
    } else if (address.town) {
      parts.push(address.town);
    } else if (address.village) {
      parts.push(address.village);
    }
    
    // Add county/state if different from city
    if (address.county && !parts.includes(address.county)) {
      parts.push(address.county);
    }
    
    // Add country if not UK
    if (address.country && address.country !== 'United Kingdom') {
      parts.push(address.country);
    }

    return parts.join(', ') || address.display_name || '';
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(point1, point2) {
    if (!point1 || !point2 || !point1.lat || !point1.lng || !point2.lat || !point2.lng) {
      return null;
    }

    const R = 6371e3; // Earth's radius in metres
    const φ1 = point1.lat * Math.PI / 180; // φ, λ in radians
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // in metres
    
    return {
      meters: Math.round(distance),
      kilometers: Math.round(distance / 1000 * 100) / 100,
      miles: Math.round(distance / 1609.34 * 100) / 100
    };
  }

  // Get popular UK locations for autocomplete
  getPopularUKLocations() {
    return [
      { display: 'London', lat: 51.5074, lng: -0.1278 },
      { display: 'Manchester', lat: 53.4808, lng: -2.2426 },
      { display: 'Birmingham', lat: 52.4862, lng: -1.8904 },
      { display: 'Leeds', lat: 53.8008, lng: -1.5491 },
      { display: 'Glasgow', lat: 55.8642, lng: -4.2518 },
      { display: 'Liverpool', lat: 53.4084, lng: -2.9916 },
      { display: 'Edinburgh', lat: 55.9533, lng: -3.1883 },
      { display: 'Sheffield', lat: 53.3811, lng: -1.4701 },
      { display: 'Bristol', lat: 51.4545, lng: -2.5879 },
      { display: 'Newcastle', lat: 54.9783, lng: -1.6178 },
      { display: 'Cardiff', lat: 51.4816, lng: -3.1791 },
      { display: 'Nottingham', lat: 52.9548, lng: -1.1581 },
      { display: 'Cambridge', lat: 52.2053, lng: 0.1218 },
      { display: 'Oxford', lat: 51.7520, lng: -1.2577 },
      { display: 'Brighton', lat: 50.8225, lng: -0.1372 }
    ];
  }

  // Search locations with autocomplete
  async searchLocations(query, includePopular = true) {
    if (!query || query.length < 2) {
      return includePopular ? this.getPopularUKLocations().slice(0, 5) : [];
    }

    try {
      // Get geocoded results
      const results = await this.geocodeLocation(query);
      
      // Combine with popular locations if requested
      if (includePopular && query.length < 4) {
        const popular = this.getPopularUKLocations().filter(loc =>
          loc.display.toLowerCase().includes(query.toLowerCase())
        );
        
        // Merge and deduplicate
        const combined = [...popular, ...results];
        const seen = new Set();
        
        return combined.filter(location => {
          const key = `${location.lat}_${location.lng}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, 10);
      }
      
      return results.slice(0, 10);
    } catch (error) {
      console.error('Location search error:', error);
      
      // Fallback to popular locations on error
      if (includePopular) {
        return this.getPopularUKLocations().filter(loc =>
          loc.display.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
      }
      
      return [];
    }
  }

  // Get bounds for multiple locations (useful for map fitting)
  getBounds(locations) {
    if (!locations || locations.length === 0) {
      return null;
    }

    const validLocations = locations.filter(loc => loc.lat && loc.lng);
    
    if (validLocations.length === 0) {
      return null;
    }

    if (validLocations.length === 1) {
      // Single location - create small bounds around it
      const loc = validLocations[0];
      const offset = 0.01;
      return {
        north: loc.lat + offset,
        south: loc.lat - offset,
        east: loc.lng + offset,
        west: loc.lng - offset
      };
    }

    // Multiple locations - find bounds
    let north = -90, south = 90, east = -180, west = 180;
    
    validLocations.forEach(loc => {
      north = Math.max(north, loc.lat);
      south = Math.min(south, loc.lat);
      east = Math.max(east, loc.lng);
      west = Math.min(west, loc.lng);
    });

    // Add small padding
    const latPadding = (north - south) * 0.1;
    const lngPadding = (east - west) * 0.1;

    return {
      north: north + latPadding,
      south: south - latPadding,
      east: east + lngPadding,
      west: west - lngPadding
    };
  }

  // Check if coordinates are within UK bounds
  isWithinUK(lat, lng) {
    // Approximate UK bounds
    const ukBounds = {
      north: 60.9,
      south: 49.9,
      east: 1.8,
      west: -8.6
    };

    return lat >= ukBounds.south && lat <= ukBounds.north &&
           lng >= ukBounds.west && lng <= ukBounds.east;
  }

  // Format distance for display
  formatDistance(distance) {
    if (!distance) return '';
    
    if (distance.miles < 1) {
      return 'Less than 1 mile';
    } else if (distance.miles < 10) {
      return `${distance.miles} miles`;
    } else {
      return `${Math.round(distance.miles)} miles`;
    }
  }

  // Get default location (Leeds, UK)
  getDefaultLocation() {
    return {
      ...this.defaultCenter,
      display: 'Leeds, UK',
      source: 'default'
    };
  }

  // Clear location cache
  clearCache() {
    this.cache.clear();
    console.log('📍 Location cache cleared');
  }

  // Get cache info for debugging
  getCacheInfo() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
      keys: Array.from(this.cache.keys())
    };
  }

  // Validate coordinates
  isValidCoordinates(lat, lng) {
    return !isNaN(lat) && !isNaN(lng) &&
           lat >= -90 && lat <= 90 &&
           lng >= -180 && lng <= 180;
  }

  // Convert postcode to coordinates (UK specific)
  async geocodePostcode(postcode) {
    if (!postcode || typeof postcode !== 'string') {
      throw new Error('Invalid postcode');
    }

    // Basic UK postcode validation
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    if (!postcodeRegex.test(postcode.trim())) {
      throw new Error('Invalid UK postcode format');
    }

    // Use standard geocoding with postcode
    const results = await this.geocodeLocation(postcode);
    
    if (results.length === 0) {
      throw new Error('Postcode not found');
    }

    return results[0];
  }

  // Get region information from coordinates
  async getRegionInfo(lat, lng) {
    try {
      const address = await this.reverseGeocode(lat, lng);
      
      if (!address) {
        return null;
      }

      // Try to parse region information
      const parts = address.split(', ');
      
      return {
        city: parts[0] || null,
        county: parts[1] || null,
        country: parts[parts.length - 1] || 'UK'
      };
    } catch (error) {
      console.error('Error getting region info:', error);
      return null;
    }
  }
}

// Create and export singleton instance
const locationService = new LocationService();
export default locationService;