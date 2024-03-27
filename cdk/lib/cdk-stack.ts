import * as cdk from 'aws-cdk-lib'
import * as ddb from 'aws-cdk-lib/aws-dynamodb'
import * as apigw from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { type Construct } from 'constructs'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as path from 'node:path'

export class CdkStack extends cdk.Stack {
  constructor (scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const sessionTable = new ddb.TableV2(this, 'Table', {
      tableName: 'sessionTable',
      partitionKey: {
        name: 'PK',
        type: ddb.AttributeType.STRING
      },
      sortKey: {
        name: 'SK',
        type: ddb.AttributeType.STRING
      },
      timeToLiveAttribute: 'ttl'
    })

    const api = new apigw.RestApi(this, 'SessionAPI')

    const login = api.root.addResource('login')
    const loginHandler = new NodejsFunction(this, 'LoginHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambda/api/login/post.ts')
    })
    sessionTable.grantReadWriteData(loginHandler)
    login.addMethod('POST', new apigw.LambdaIntegration(loginHandler))

    const userSessions = api.root.addResource('users').addResource('{username}').addResource('sessions')
    const deleteSessionsHandler = new NodejsFunction(this, 'DeleteSessionsHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambda/api/users/{username}/sessions/delete.ts')
    })
    sessionTable.grantReadWriteData(deleteSessionsHandler)
    userSessions.addMethod('DELETE', new apigw.LambdaIntegration(deleteSessionsHandler))
  }
}
