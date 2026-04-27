import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

const backend = defineBackend({
  auth,
  data,
});

// Register Bedrock as an HTTP data source with SigV4 auth.
// The endpoint stays in us-east-1; cross-region routing is handled by the
// "us." model prefix in bedrock.js. The signing region must be us-east-1
// (the region where the AppSync API lives and where the request originates).
const bedrockDataSource = backend.data.addHttpDataSource(
  "BedrockDataSource",
  "https://bedrock-runtime.us-east-1.amazonaws.com",
  {
    authorizationConfig: {
      signingRegion: "us-east-1",
      signingServiceName: "bedrock",
    },
  }
);

// Grant the AppSync HTTP data source role permission to invoke Bedrock models.
// The "us." cross-region inference prefix causes AWS to internally route the
// call through foundation models in us-east-1, us-east-2, OR us-west-2 — so
// the region wildcard (*) is required. Both foundation-model and
// inference-profile ARN types are needed depending on how AWS routes it.
const bedrockPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ["bedrock:InvokeModel"],
  resources: [
    "arn:aws:bedrock:*::foundation-model/*",
    "arn:aws:bedrock:*:*:inference-profile/*",
  ],
});

bedrockDataSource.grantPrincipal.addToPrincipalPolicy(bedrockPolicy);

// Also grant to authenticated and unauthenticated Cognito roles
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["bedrock:InvokeModel"],
    resources: [
      "arn:aws:bedrock:*::foundation-model/*",
      "arn:aws:bedrock:*:*:inference-profile/*",
    ],
  })
);

backend.auth.resources.unauthenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["bedrock:InvokeModel"],
    resources: [
      "arn:aws:bedrock:*::foundation-model/*",
      "arn:aws:bedrock:*:*:inference-profile/*",
    ],
  })
);