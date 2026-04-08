import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "../../backend");
const frontendDir = path.resolve(__dirname, "../../frontend");

export class FreeFitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // -----------------------------------------------------------------------
    // SSM Parameters (must be created beforehand via CLI)
    // -----------------------------------------------------------------------
    const databaseUrl = ssm.StringParameter.valueForStringParameter(
      this, "/freefit/database-url"
    );
    const freefitToken = ssm.StringParameter.valueForStringParameter(
      this, "/freefit/freefit-token"
    );
    const freefitPhone = ssm.StringParameter.valueForStringParameter(
      this, "/freefit/freefit-phone"
    );
    const freefitId = ssm.StringParameter.valueForStringParameter(
      this, "/freefit/freefit-id"
    );
    const freefitBinId = ssm.StringParameter.valueForStringParameter(
      this, "/freefit/freefit-binid"
    );
    const mapboxToken = ssm.StringParameter.valueForStringParameter(
      this, "/freefit/mapbox-token"
    );

    // Shared Lambda environment
    const lambdaEnv = {
      DATABASE_URL: databaseUrl,
      FREEFIT_TOKEN: freefitToken,
      FREEFIT_PHONE: freefitPhone,
      FREEFIT_ID: freefitId,
      FREEFIT_BINID: freefitBinId,
      NODE_OPTIONS: "--enable-source-maps",
    };

    // Shared bundling options
    const bundlingOptions: nodejs.BundlingOptions = {
      format: nodejs.OutputFormat.ESM,
      mainFields: ["module", "main"],
      minify: true,
      sourceMap: true,
      banner:
        'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
    };

    // -----------------------------------------------------------------------
    // API Lambda
    // -----------------------------------------------------------------------
    const apiFunction = new nodejs.NodejsFunction(this, "ApiFunction", {
      entry: path.join(backendDir, "src/lambda.ts"),
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: lambdaEnv,
      bundling: bundlingOptions,
    });

    // -----------------------------------------------------------------------
    // Sync Lambda (daily cron)
    // -----------------------------------------------------------------------
    const syncFunction = new nodejs.NodejsFunction(this, "SyncFunction", {
      entry: path.join(backendDir, "src/lambda-sync.ts"),
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: cdk.Duration.seconds(120),
      environment: lambdaEnv,
      bundling: bundlingOptions,
    });

    // Daily sync at 1:00 AM UTC (3:00 AM Israel time)
    new events.Rule(this, "DailySyncRule", {
      schedule: events.Schedule.cron({ minute: "0", hour: "1" }),
      targets: [new targets.LambdaFunction(syncFunction)],
    });

    // -----------------------------------------------------------------------
    // API Gateway HTTP API
    // -----------------------------------------------------------------------
    const httpApi = new apigatewayv2.HttpApi(this, "HttpApi", {
      apiName: "freefit-api",
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [apigatewayv2.CorsHttpMethod.GET],
        allowHeaders: ["Content-Type"],
      },
    });

    httpApi.addRoutes({
      path: "/api/{proxy+}",
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration(
        "ApiIntegration",
        apiFunction
      ),
    });

    // -----------------------------------------------------------------------
    // S3 Bucket for frontend
    // -----------------------------------------------------------------------
    const frontendBucket = new s3.Bucket(this, "FrontendBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // -----------------------------------------------------------------------
    // CloudFront Distribution
    // -----------------------------------------------------------------------
    const apiOrigin = new origins.HttpOrigin(
      `${httpApi.httpApiId}.execute-api.${this.region}.amazonaws.com`
    );

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        "/api/*": {
          origin: apiOrigin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.seconds(0),
        },
      ],
    });

    // -----------------------------------------------------------------------
    // Deploy frontend to S3
    // -----------------------------------------------------------------------
    new s3deploy.BucketDeployment(this, "DeployFrontend", {
      sources: [s3deploy.Source.asset(path.join(frontendDir, "dist"))],
      destinationBucket: frontendBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    // -----------------------------------------------------------------------
    // Outputs
    // -----------------------------------------------------------------------
    new cdk.CfnOutput(this, "CloudFrontUrl", {
      value: `https://${distribution.distributionDomainName}`,
      description: "CloudFront distribution URL",
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: httpApi.url ?? "",
      description: "API Gateway URL",
    });
  }
}
