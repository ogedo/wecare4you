import axios from "axios";
import { env } from "./env";

const isDev = env.NODE_ENV === "development";

const daily = axios.create({
  baseURL: "https://api.daily.co/v1",
  headers: {
    Authorization: `Bearer ${env.DAILY_API_KEY}`,
    "Content-Type": "application/json",
  },
});

export async function createRoom(name: string): Promise<{ url: string; name: string }> {
  if (isDev) {
    console.log(`[DEV] Mock Daily.co room created: ${name}`);
    return {
      url: `https://wecare4you.daily.co/${name}`,
      name,
    };
  }

  const { data } = await daily.post("/rooms", {
    name,
    privacy: "private",
    properties: {
      max_participants: 4,
      enable_screenshare: false,
      enable_chat: true,
      start_video_off: false,
      start_audio_off: false,
      lang: "en",
    },
  });
  return { url: data.url, name: data.name };
}

export async function createMeetingToken(params: {
  roomName: string;
  userId: string;
  userName: string;
  isOwner?: boolean;
  expirySeconds?: number;
}): Promise<string> {
  if (isDev) {
    console.log(`[DEV] Mock Daily.co token for ${params.userName} in ${params.roomName}`);
    return `dev_token_${params.userId}_${params.roomName}`;
  }

  const { data } = await daily.post("/meeting-tokens", {
    properties: {
      room_name: params.roomName,
      user_id: params.userId,
      user_name: params.userName,
      is_owner: params.isOwner ?? false,
      exp: Math.floor(Date.now() / 1000) + (params.expirySeconds ?? 3600),
    },
  });
  return data.token;
}

export async function deleteRoom(name: string): Promise<void> {
  if (isDev) {
    console.log(`[DEV] Mock Daily.co room deleted: ${name}`);
    return;
  }

  await daily.delete(`/rooms/${name}`);
}
