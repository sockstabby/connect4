const AWS = require("aws-sdk");
const ddb = new AWS.DynamoDB.DocumentClient();

let send = undefined;

function init(event) {
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint:
      //event.requestContext.domainName + "/" + event.requestContext.stage,
      event.requestContext.domainName,
  });
  send = async (connectionId, data) => {
    try {
      await apigwManagementApi
        .postToConnection({ ConnectionId: connectionId, Data: `${data}` })
        //.postToConnection({ ConnectionId: connectionId, payload: `${data}` })
        .promise();
    } catch (e) {
      console.log("post to connection error. e = ", e);
    }
  };
}

function getConnections() {
  return ddb.scan({ TableName: "connect4" }).promise();
}

function addConnectionId(connectionId, name) {
  return ddb
    .put({
      TableName: "connect4",
      Item: { connectionId: connectionId, name, state: "waiting" },
    })
    .promise();
}

exports.handler = (event, context, callback) => {
  init(event);

  console.log(
    "send play requestcalled. event = ",
    JSON.stringify(event, null, 4)
  );

  const parsedBody = JSON.parse(event.body);

  let name;

  if (
    parsedBody.data &&
    parsedBody.data.chosenOpponent &&
    parsedBody.data.chosenOpponent !== ""
  ) {
    name = parsedBody.data.name;
  }

  const connectionId = event.requestContext.connectionId;

  if (name == null) {
    console.log(
      "Connect without a name. event = ",
      JSON.stringify(event, null, 4)
    );
    const payload = {
      message: "sendPlayRequestFailed",
      errorMessage: "You need to tell us a player name to play",
    };

    send(connectionId, JSON.stringify(payload));

    name = "no_name";
    return callback(null, { statusCode: 400 });
  }

  console.log("we have a name. name = ", name);

  // lets find the connection id for this name

  getConnections().then((data) => {
    console.log("connections ", data.Items);
    const initiator = data.Items.find((i) => i.connectionId === connectionId);
    console.log("initiator = ", initiator);

    const foundItem = data.Items.find((i) => i.name === name);

    console.log("foundItem = ", foundItem);

    if (foundItem != null) {
      console.log("notifying recipient");

      const payload = {
        message: "playRequested",
        data: initiator.name,
      };

      send(foundItem.connectionId, JSON.stringify(payload));
    }

    callback(null, { statusCode: 200 });
  });
};
