import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import KSUID = require('ksuid')

const client = new DynamoDBClient()
const ddb = DynamoDBDocumentClient.from(client)
const TableName = 'sessionTable'

export class User {
  username: string
  password: string

  constructor (username: string, password: string) {
    this.username = username
    this.password = password
  }
}

export class SessionToken {
  user: User
  sessionId: string
  expiresAt: Date
  ttl: number

  constructor (user: User, sessionId: string, expiresAt: Date, ttl: number) {
    this.user = user
    this.sessionId = sessionId
    this.expiresAt = expiresAt
    this.ttl = ttl
  }

  toJSON (): Record<string, unknown> {
    return {
      user: this.user.username,
      sessionId: this.sessionId,
      expiresAt: this.expiresAt.toISOString(),
      ttl: this.ttl
    }
  }
}

export async function createSessionToken (user: User): Promise<SessionToken | null> {
  const sessionId = (await KSUID.random()).string
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  const ttl = expiresAt.valueOf()

  const payload = {
    TableName,
    Item: {
      PK: `USER#${user.username}`,
      SK: `SESSION#${sessionId.toString()}`,
      user: user.username,
      sessionId,
      expiresAt: expiresAt.toISOString(),
      ttl
    }
  }
  const command = new PutCommand(payload)
  try {
    await ddb.send(command)
    return new SessionToken(user, sessionId, expiresAt, ttl)
  } catch (e) {
    console.log(e)
    return null
  }
}

export async function validateCredentials (username: string, password: string): Promise<User | null> {
  const command = new GetCommand({
    TableName,
    Key: {
      PK: `USER#${username}`,
      SK: `USER#${username}`
    }
  })
  try {
    const response = await ddb.send(command)

    if (response.Item === undefined) {
      console.log('DynamoDB returned item is undefined')
      return null
    }

    const user = new User(response.Item.username as string, response.Item.password as string)
    if (user.password !== password) {
      console.log('Incorrect password')
      return null
    }

    return user
  } catch (e) {
    console.log(e)
    return null
  }
}
