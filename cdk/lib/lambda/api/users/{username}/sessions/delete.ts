import { type APIGatewayEvent, type APIGatewayProxyResult, type Context } from 'aws-lambda'

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 501,
    body: JSON.stringify({ error: 'Not implemented.' })
  }
}
