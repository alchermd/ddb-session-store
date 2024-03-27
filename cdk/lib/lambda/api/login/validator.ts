import { z as zod } from 'zod'

export const loginPayloadSchema = zod.object({
  username: zod.string().min(6).max(15),
  password: zod.string().min(6)
})

export type LoginPayload = zod.infer<typeof loginPayloadSchema>

export function validate (unsafePayload: LoginPayload): LoginPayload | Error {
  try {
    return loginPayloadSchema.parse(unsafePayload)
  } catch (e) {
    return e as Error
  }
}
