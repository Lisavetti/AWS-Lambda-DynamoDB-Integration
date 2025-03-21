const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const { v4: uuidv4 } = require("uuid");

const dynamoDB = new DynamoDBClient({ region: process.env.region });
const TABLE_NAME = process.env.table_name;

module.exports.handler = async (event, context) => {
    const logger = context.logger || console;
    try {
        logger.log("Received event:", JSON.stringify(event));

        if (!TABLE_NAME) {
            throw new Error("TABLE_NAME is not defined in environment variables");
        }

        const input = event.body ? JSON.parse(event.body) : event;
        const { principalId, content } = input;

        const eventId = uuidv4();
        const createdAt = new Date().toISOString();

        const dynamoItem = {
            id: eventId,
            principalId: principalId,
            createdAt: createdAt,
            body: content
        };

        logger.log("Saving item to DynamoDB:", JSON.stringify(dynamoItem));

        await dynamoDB.send(new PutItemCommand({
            TableName: TABLE_NAME,
            Item: marshall(dynamoItem),
        }));

        const responseBody = {
            statusCode: 201,
            event: dynamoItem, // Обычный JSON, без AttributeValue
        };

        return {
            statusCode: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(responseBody),
        };
    } catch (error) {
        logger.error("Error in processing request:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Internal server error", error: error.message }),
        };
    }
};
