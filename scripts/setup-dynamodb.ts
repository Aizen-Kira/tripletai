import {
  BillingMode,
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException
} from "@aws-sdk/client-dynamodb";

const tableName = process.env.DYNAMODB_TABLE || "TripletAI";
const region = process.env.AWS_REGION || "us-east-1";

async function main() {
  const client = new DynamoDBClient({ region });

  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`DynamoDB table "${tableName}" already exists.`);
    return;
  } catch (error) {
    if (!(error instanceof ResourceNotFoundException)) {
      throw error;
    }
  }

  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      BillingMode: BillingMode.PAY_PER_REQUEST,
      AttributeDefinitions: [
        { AttributeName: "pk", AttributeType: "S" },
        { AttributeName: "sk", AttributeType: "S" },
        { AttributeName: "gsi1pk", AttributeType: "S" },
        { AttributeName: "gsi1sk", AttributeType: "S" }
      ],
      KeySchema: [
        { AttributeName: "pk", KeyType: "HASH" },
        { AttributeName: "sk", KeyType: "RANGE" }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "gsi1",
          KeySchema: [
            { AttributeName: "gsi1pk", KeyType: "HASH" },
            { AttributeName: "gsi1sk", KeyType: "RANGE" }
          ],
          Projection: { ProjectionType: "ALL" }
        }
      ]
    })
  );

  console.log(`Created DynamoDB table "${tableName}" in ${region}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
