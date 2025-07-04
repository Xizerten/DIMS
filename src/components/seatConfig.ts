import { SeatData } from './Seat';

// Interface for the JSON event structure
interface EventSeat {
  price: string;
  row_num: string;
  seat_num: string;
  horizontal_position: number;
  vertical_position: number;
  available: boolean;
}

interface Event {
  title: string;
  date: string;
  location: string;
  link: string;
  available: boolean;
  priceMin: string;
  seats: EventSeat[] | string; // Can be array of seats or string "ieejas biļetes"
}

// Interface for coordinate bounds
interface CoordinateBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Enhanced interface for event configuration
interface EventConfiguration {
  seatConfig: SeatData[];
  availabilityCounts: {
    availableCount: number;
    unavailableCount: number;
    totalCount: number;
  };
  coordinateBounds: CoordinateBounds;
  eventInfo: Event | null;
  text: boolean | null; // New parameter for events without specific seats
}

// Function to read and parse events from JSON file with cache busting
export async function loadEventsFromJson(): Promise<Event[]> {
  try {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const cacheBuster = `?v=${timestamp}`;
    
    const response = await fetch(`../../public/events.json${cacheBuster}`, {
      // Additional headers to prevent caching
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.events || data; // Handle both {events: [...]} and [...] formats
  } catch (error) {
    console.error('Error loading events from JSON:', error);
    return [];
  }
}

// Alternative function with version parameter (if you use versioning)
export async function loadEventsFromJsonWithVersion(version?: string): Promise<Event[]> {
  try {
    const versionParam = version || new Date().getTime().toString();
    const response = await fetch(`../../public/events.json?v=${versionParam}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.events || data;
  } catch (error) {
    console.error('Error loading events from JSON:', error);
    return [];
  }
}

// Function to check if event has specific seats
export function hasSpecificSeats(event: Event): boolean {
  return Array.isArray(event.seats);
}

// Function to transform event seats to SeatData format
export function transformSeatsToSeatData(eventSeats: EventSeat[]): SeatData[] {
  return eventSeats.map((seat, index) => ({
    id: index + 1, // Generate unique ID
    label: seat.seat_num, // Use only seat_num for label
    x: seat.horizontal_position,
    y: seat.vertical_position,
    color: seat.available ? '#e0e0e0' : '#ff6b6b', // Gray for available, red for unavailable
    status: seat.available ? 'available' : 'occupied',
    price: parseFloat(seat.price) // Store price as number
  }));
}

// Function to get seat availability counts
export function getSeatAvailabilityCounts(eventSeats: EventSeat[]): {
  availableCount: number;
  unavailableCount: number;
  totalCount: number;
} {
  const availableCount = eventSeats.filter(seat => seat.available === true).length;
  const unavailableCount = eventSeats.filter(seat => seat.available === false).length;
  
  return {
    availableCount,
    unavailableCount,
    totalCount: eventSeats.length
  };
}

// Function to get min/max coordinates from seats
export function getSeatCoordinateBounds(eventSeats: EventSeat[]): CoordinateBounds {
  if (eventSeats.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  const xCoordinates = eventSeats.map(seat => seat.horizontal_position);
  const yCoordinates = eventSeats.map(seat => seat.vertical_position);

  return {
    minX: Math.min(...xCoordinates),
    maxX: Math.max(...xCoordinates),
    minY: Math.min(...yCoordinates),
    maxY: Math.max(...yCoordinates)
  };
}

// Function to get all events with their configurations
export async function loadAllEventsConfiguration(): Promise<EventConfiguration[]> {
  try {
    const events = await loadEventsFromJson();
    
    if (events.length === 0) {
      console.warn('No events found');
      return [];
    }
    
    return events.map((event, index) => {
      if (hasSpecificSeats(event)) {
        // Event has specific seats
        const eventSeats = event.seats as EventSeat[];
        const seatConfig = transformSeatsToSeatData(eventSeats);
        const availabilityCounts = getSeatAvailabilityCounts(eventSeats);
        const coordinateBounds = getSeatCoordinateBounds(eventSeats);
        
        return {
          seatConfig,
          availabilityCounts,
          coordinateBounds,
          eventInfo: event,
          text: null // null for events with specific seats
        };
      } else {
        // Event has only general tickets ("ieejas biļetes")
        return {
          seatConfig: [],
          availabilityCounts: { availableCount: 0, unavailableCount: 0, totalCount: 0 },
          coordinateBounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
          eventInfo: event,
          text: event.available // true if available, false if not available
        };
      }
    });
  } catch (error) {
    console.error('Error loading all events configuration:', error);
    return [];
  }
}

// Enhanced function to load seat configuration from events.json
export async function loadSeatConfigFromJson(
  eventIndex: number = 0
): Promise<EventConfiguration> {
  try {
    const events = await loadEventsFromJson();
    
    if (events.length === 0 || !events[eventIndex]) {
      console.warn(`No event found at index ${eventIndex}`);
      return {
        seatConfig: [],
        availabilityCounts: { availableCount: 0, unavailableCount: 0, totalCount: 0 },
        coordinateBounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
        eventInfo: null,
        text: null
      };
    }
    
    const selectedEvent = events[eventIndex];
    
    if (hasSpecificSeats(selectedEvent)) {
      // Event has specific seats
      const eventSeats = selectedEvent.seats as EventSeat[];
      const seatConfig = transformSeatsToSeatData(eventSeats);
      const availabilityCounts = getSeatAvailabilityCounts(eventSeats);
      const coordinateBounds = getSeatCoordinateBounds(eventSeats);
      
      return {
        seatConfig,
        availabilityCounts,
        coordinateBounds,
        eventInfo: selectedEvent,
        text: null // null for events with specific seats
      };
    } else {
      // Event has only general tickets ("ieejas biļetes")
      return {
        seatConfig: [],
        availabilityCounts: { availableCount: 0, unavailableCount: 0, totalCount: 0 },
        coordinateBounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
        eventInfo: selectedEvent,
        text: selectedEvent.available // true if available, false if not available
      };
    }
  } catch (error) {
    console.error('Error loading seat configuration:', error);
    return {
      seatConfig: [],
      availabilityCounts: { availableCount: 0, unavailableCount: 0, totalCount: 0 },
      coordinateBounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
      eventInfo: null,
      text: null
    };
  }
}

// Function to get available events (for events without specific seats)
export async function getAvailableEventsWithoutSeats(): Promise<Event[]> {
  try {
    const events = await loadEventsFromJson();
    return events.filter(event => !hasSpecificSeats(event) && event.available);
  } catch (error) {
    console.error('Error loading available events without seats:', error);
    return [];
  }
}

// Function to get events with specific seats
export async function getEventsWithSeats(): Promise<Event[]> {
  try {
    const events = await loadEventsFromJson();
    return events.filter(event => hasSpecificSeats(event));
  } catch (error) {
    console.error('Error loading events with seats:', error);
    return [];
  }
}

// Function to force refresh data (can be called manually)
export async function forceRefreshEvents(): Promise<Event[]> {
  try {
    // Clear any potential cache first
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
    
    // Load fresh data
    return await loadEventsFromJson();
  } catch (error) {
    console.error('Error force refreshing events:', error);
    return [];
  }
}

// Export types for external use
export type { CoordinateBounds, Event, EventSeat, EventConfiguration };