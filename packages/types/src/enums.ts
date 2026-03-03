export enum Role {
  PATIENT = "PATIENT",
  THERAPIST = "THERAPIST",
  TALK_BUDDY = "TALK_BUDDY",
  ADMIN = "ADMIN",
}

export enum AppointmentStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

export enum AppointmentType {
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  REFUNDED = "REFUNDED",
  FAILED = "FAILED",
}
