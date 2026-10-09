import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  TransactWriteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { UserRow } from "./client";
import { EmailTakenError, type UserStore } from "./userStore";

/**
 * Single-key table (`pk`). Each user is two items: `user#<id>` holds the row and
 * `email#<lowercased email>` points at the id so email lookups and uniqueness
 * work without a GSI.
 */
const userKey = (id: string) => `user#${id}`;
const emailKey = (email: string) => `email#${email.toLowerCase()}`;

function toRow(item: Record<string, unknown> | undefined): UserRow | null {
  if (!item) return null;
  const row = { ...item };
  delete row.pk;
  return row as UserRow;
}

function isConditionalFailure(err: unknown) {
  const name = (err as { name?: string } | null)?.name;
  return name === "ConditionalCheckFailedException" || name === "TransactionCanceledException";
}

export function createDynamoUserStore(tableName: string): UserStore {
  const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: { removeUndefinedValues: true },
  });

  const getById = async (id: string) => {
    const res = await doc.send(new GetCommand({ TableName: tableName, Key: { pk: userKey(id) } }));
    return toRow(res.Item);
  };

  return {
    async list() {
      const rows: UserRow[] = [];
      let startKey: Record<string, unknown> | undefined;
      do {
        const res = await doc.send(
          new ScanCommand({
            TableName: tableName,
            FilterExpression: "begins_with(pk, :p)",
            ExpressionAttributeValues: { ":p": "user#" },
            ExclusiveStartKey: startKey,
          }),
        );
        for (const item of res.Items ?? []) {
          const row = toRow(item);
          if (row) rows.push(row);
        }
        startKey = res.LastEvaluatedKey;
      } while (startKey);
      return rows.sort((a, b) => a.full_name.localeCompare(b.full_name));
    },
    getById,
    async getByEmail(email) {
      const res = await doc.send(new GetCommand({ TableName: tableName, Key: { pk: emailKey(email) } }));
      const userId = res.Item?.user_id;
      return typeof userId === "string" ? getById(userId) : null;
    },
    async insert(row) {
      try {
        await doc.send(
          new TransactWriteCommand({
            TransactItems: [
              {
                Put: {
                  TableName: tableName,
                  Item: { pk: emailKey(row.email), user_id: row.id },
                  ConditionExpression: "attribute_not_exists(pk)",
                },
              },
              {
                Put: {
                  TableName: tableName,
                  Item: { pk: userKey(row.id), ...row },
                  ConditionExpression: "attribute_not_exists(pk)",
                },
              },
            ],
          }),
        );
      } catch (err) {
        if (isConditionalFailure(err)) throw new EmailTakenError();
        throw err;
      }
    },
    async update(id, patch) {
      const names: Record<string, string> = {};
      const values: Record<string, unknown> = {};
      const sets = Object.entries(patch).map(([field, value], i) => {
        names[`#f${i}`] = field;
        values[`:v${i}`] = value;
        return `#f${i} = :v${i}`;
      });
      try {
        const res = await doc.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { pk: userKey(id) },
            UpdateExpression: `SET ${sets.join(", ")}`,
            ConditionExpression: "attribute_exists(pk)",
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,
            ReturnValues: "ALL_NEW",
          }),
        );
        return toRow(res.Attributes);
      } catch (err) {
        if (isConditionalFailure(err)) return null;
        throw err;
      }
    },
    async delete(id) {
      const row = await getById(id);
      if (!row) return;
      await doc.send(
        new TransactWriteCommand({
          TransactItems: [
            { Delete: { TableName: tableName, Key: { pk: userKey(id) } } },
            { Delete: { TableName: tableName, Key: { pk: emailKey(row.email) } } },
          ],
        }),
      );
    },
  };
}
