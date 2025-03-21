const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { v4: uuidv4 } = require("uuid");

const dynamoDB = new DynamoDBClient({ region: process.env.region });
const TABLE_NAME = process.env.table;

module.exports.handler = async (event, context) => {
    const logger = context.logger || console;
    try {
        logger.log("Received event:", JSON.stringify(event));

        const input = event.body ? JSON.parse(event.body) : event;
        const { principalId, content } = input;

        const eventId = uuidv4();
        const createdAt = new Date().toISOString();

        const item = {
            id: { S: eventId },
            principalId: { N: principalId.toString() },
            createdAt: { S: createdAt },
            body: { M: Object.fromEntries(Object.entries(content).map(([key, value]) => [key, { S: value }])) }
        };

        await dynamoDB.send(new PutItemCommand({
            TableName: TABLE_NAME,
            Item: item,
        }));

        return {
            statusCode: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: item }),
        };
    } catch (error) {
        logger.error("Error in processing request:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};
