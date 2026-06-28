import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";
import { demoHistory } from "@/lib/mock-data";
import type { Itinerary, PreferenceHistory } from "@/lib/types";

const tableName = process.env.DYNAMODB_TABLE || "TripletAI";

function isDynamoConfigured() {
  return Boolean(process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

function getClient() {
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1"
  });

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true
    }
  });
}

export async function saveItinerary(itinerary: Itinerary) {
  if (!isDynamoConfigured()) {
    return { persisted: false, itinerary };
  }

  const db = getClient();
  await db.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        pk: `USER#${itinerary.userId}`,
        sk: `TRIP#${itinerary.createdAt}#${itinerary.id}`,
        entityType: "itinerary",
        gsi1pk: `CITY#${itinerary.city.toLowerCase()}`,
        gsi1sk: itinerary.createdAt,
        ...itinerary
      }
    })
  );

  await upsertPreferenceHistory(itinerary);
  return { persisted: true, itinerary };
}

export async function listItineraries(userId: string): Promise<Itinerary[]> {
  if (!isDynamoConfigured()) {
    return [];
  }

  const db = getClient();
  const result = await db.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":prefix": "TRIP#"
      },
      ScanIndexForward: false,
      Limit: 20
    })
  );

  return (result.Items || []) as Itinerary[];
}

export async function getPreferenceHistory(userId: string): Promise<PreferenceHistory | null> {
  if (!isDynamoConfigured()) {
    return userId === "demo-user" ? demoHistory : null;
  }

  const db = getClient();
  const result = await db.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        pk: `USER#${userId}`,
        sk: "PREF#PROFILE"
      }
    })
  );

  return (result.Item as PreferenceHistory | undefined) || null;
}

export async function upsertPreferenceHistory(itinerary: Itinerary) {
  if (!isDynamoConfigured()) {
    return { persisted: false };
  }

  const db = getClient();
  const categories = itinerary.stops.map((stop) => stop.category);
  const vibes = itinerary.memoryUpdate.preferredVibes;

  await db.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        pk: `USER#${itinerary.userId}`,
        sk: "PREF#PROFILE"
      },
      UpdateExpression:
        "SET entityType = :type, userId = :userId, preferredVibes = :vibes, preferredCategories = :categories, averageBudget = :budget, lastCity = :city, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":type": "preferences",
        ":userId": itinerary.userId,
        ":vibes": vibes,
        ":categories": categories,
        ":budget": itinerary.totalEstimatedCost,
        ":city": itinerary.city,
        ":updatedAt": new Date().toISOString()
      }
    })
  );

  return { persisted: true };
}
