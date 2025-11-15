import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { Room } from '../types';

export function useRoomNavigation(
  roomCode: string | undefined,
  room: Room | null,
  isConnected: boolean
) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomCode) {
      navigate('/');
      return;
    }

    if (isConnected && (!room || room.code !== roomCode)) {
      navigate('/join-room', { state: { roomCode } });
    }
  }, [roomCode, room, isConnected, navigate]);
}

