import './App.css';
import { useState } from 'react';
import { Seat, SeatData } from './Artemy components/Seat';
import { Canvas } from './Artemy components/Canvas';
import { seatConfig } from './Artemy components/seatConfig.ts';

function App() {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [seats, setSeats] = useState<SeatData[]>(seatConfig);

  const handleSeatClick = (seatId: number) => {
    setSelectedSeat(seatId);
  };

  const getSelectedSeatInfo = () => {
    if (!selectedSeat) return null;
    const seat = seats.find(s => s.id === selectedSeat);
    return seat ? `Selected seat: ${seat.label} (ID: ${seat.id}, X: ${seat.x}, Y: ${seat.y})` : null;
  };

  return (
    <div className="app-container">
      <h1>Select Seat update3 test</h1>
      
      <Canvas width={400} height={300}>
        {seats.map(seat => (
          <Seat 
            key={seat.id}
            seat={seat}
            isSelected={selectedSeat === seat.id}
            onClick={() => handleSeatClick(seat.id)}
          />
        ))}
      </Canvas>
      
      {selectedSeat && (
        <p className="selected-seat-info">
          {getSelectedSeatInfo()}
        </p>
      )}
    </div>
  );
}

export default App;
