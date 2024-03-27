import * as data from '@/lambda/api/data'
import { type APIGatewayEvent, type APIGatewayProxyResult, type Context } from 'aws-lambda'
import { type LoginPayload, validate } from '@/lambda/api/login/validator'
import { ZodError } from 'zod'

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const unsafePayload: LoginPayload = JSON.parse(String(event.body))

  const payload = validate(unsafePayload)
  if (!('username' in payload)) {
    if (payload instanceof ZodError) {
      return {
        statusCode: 422,
        body: JSON.stringify(payload.format())
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong.' })
    }
  }

  const user = await data.validateCredentials(payload.username, payload.password)
  if (user === null) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid credentials.' })
    }
  }

  const sessionToken = await data.createSessionToken(user)
  if (sessionToken === null) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong.' })
    }
  }

  return {
    statusCode: 201,
    body: JSON.stringify(sessionToken.toJSON())
  }
}
