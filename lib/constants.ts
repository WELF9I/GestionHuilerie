// Business constants for the Huilerie application

export const EMPLOYEE_ROLES = {
  ADMIN: "administrateur",
  MANAGER: "responsable",
  OPERATOR: "operateur",
  TECHNICIAN: "technicien",
} as const

export const EMPLOYEE_STATUS = {
  ACTIVE: "actif",
  INACTIVE: "inactif",
} as const

export const PURCHASE_QUALITY = {
  EXTRA: "extra",
  PREMIERE: "premiere",
  SECOND: "second",
} as const

export const PRESSING_TYPE = {
  FIRST: "premiere",
  SECOND: "deuxieme",
  MIXED: "mixte",
} as const

export const TANK_STATUS = {
  EMPTY: "vide",
  PARTIAL: "partiel",
  FULL: "plein",
} as const

export const OIL_QUALITY = {
  EXTRA: "extra",
  PREMIERE: "premiere",
  LAMPANTE: "lampante",
} as const

export const PAYMENT_STATUS = {
  PENDING: "en_attente",
  PARTIAL: "partiel",
  PAID: "paye",
} as const

export const CUSTOMER_TYPE = {
  BUSINESS: "entreprise",
  INDIVIDUAL: "particulier",
  WHOLESALE: "grossiste",
} as const

export const POMACE_QUALITY = {
  WET: "humide",
  DRY: "sechee",
} as const
