import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as dynamodb from '@aws-cdk/aws-dynamodb';


// Properties defined where we determine if this is a prod stack or not
interface EnvStackProps extends cdk.StackProps {
  prod: boolean;
}

export class CdkServerlessFuntimesStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: EnvStackProps) {
    super(scope, id, props);

      // Defining the prod or no prod
      if (props && props.prod) { // prod
        var dynamoDbReadWrite = 200;
        var apiGatewayName = 'PROD_cdk_api';
				var tableName = 'PROD_cdk_users';
				var lambdaVars = { 'TABLE_NAME': tableName};
				var concurrency = 100;
      } else { // not prod 
				var tableName = 'STAGING_cdk_users';
        var apiGatewayName = 'STAGING_cdk_api';
        var dynamoDbReadWrite = 5;
				var lambdaVars = { 'TABLE_NAME': tableName};
				var concurrency = 5;
      }

			// here be code
		
			// --- the dynamo db ---
			const table = new dynamodb.Table(this, 'people', {
				partitionKey: { name: 'name', type: dynamodb.AttributeType.STRING},
				tableName: tableName,
				readCapacity: dynamoDbReadWrite,
				billingMode: dynamodb.BillingMode.PROVISIONED
			});


			// --- our first api gateway --- 
			const api = new apigw.RestApi(this, apiGatewayName);

			// --- greeter lambda ---
			const welcomeLambda = new lambda.Function(this, 'HelloHandler', {
				runtime: lambda.Runtime.NODEJS_10_X,
				code: lambda.Code.fromAsset('lambda'),
				environment: lambdaVars,
				reservedConcurrentExecutions: concurrency,
				handler: 'hello.handler'
			});

			// greeter lambda integration
			const apiHelloInteg = new apigw.LambdaIntegration(welcomeLambda);
			const apiHello = api.root.addResource('hello');
			apiHello.addMethod('GET', apiHelloInteg);

			// --- user input lambda ---
			const createLambda = new lambda.Function(this, 'CreateHandler', {
				runtime: lambda.Runtime.NODEJS_10_X,
				code: lambda.Code.fromAsset('lambda'),
				environment: lambdaVars,
				reservedConcurrentExecutions: concurrency,
				handler: 'createUser.handler'
			});

			// user input lambda integration
			const apiCreateInteg = new apigw.LambdaIntegration(createLambda);
			const apiCreate = api.root.addResource('create');
			apiCreate.addMethod('POST', apiCreateInteg);

			// --- table permissions ---
			table.grantReadWriteData(createLambda);

			// --- user read lambda ---
			const readLambda = new lambda.Function(this, 'ReadHandler', {
				runtime: lambda.Runtime.NODEJS_10_X,
				code: lambda.Code.fromAsset('lambda'),
				environment: lambdaVars,
				reservedConcurrentExecutions: concurrency,
				handler: 'readUser.handler'
			});

			// user read lambda integration
			const apiReadInteg = new apigw.LambdaIntegration(readLambda);
			const apiRead = api.root.addResource('read');
			apiRead.addMethod('GET', apiReadInteg);

			// --- table permissions ---
      table.grantReadData(readLambda);
  }
}

