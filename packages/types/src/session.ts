export interface SessionResponse {
  id: string;
  appointmentId: string;
  dailyRoomName: string;
  dailyRoomUrl: string;
  token: string;
  startedAt?: string | null;
  endedAt?: string | null;
}
