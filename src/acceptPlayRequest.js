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

function createGame(initiator, opponent) {
  const gameId = `${initiator}vs${opponent}`;

  return ddb
    .put({
      TableName: "connect4GamesInProgress",
      Item: { gameId, initiator, opponent },
    })
    .promise();
}

function deleteConnectionId(connectionId) {
  return ddb
    .delete({ TableName: "connect4", Key: { connectionId: connectionId } })
    .promise();
}

exports.handler = (event, context, callback) => {
  init(event);

  console.log(
    "accept play requestcalled. event = ",
    JSON.stringify(event, null, 4)
  );

  const parsedBody = JSON.parse(event.body);

  let opponent;

  if (
    parsedBody.data &&
    parsedBody.data.chosenOpponent &&
    parsedBody.data.chosenOpponent !== ""
  ) {
    opponent = parsedBody.data.chosenOpponent;
  }

  const connectionId = event.requestContext.connectionId;

  if (opponent == null) {
    console.log(
      "Accept without a name? event = ",
      JSON.stringify(event, null, 4)
    );
    const payload = {
      message: "acceptPlayRequestFailed",
      errorMessage:
        "Accept Request error You need to tell us a opponentto play",
    };

    send(connectionId, JSON.stringify(payload));

    return callback(null, { statusCode: 400 });
  }

  let acceptor;

  if (
    parsedBody.data &&
    parsedBody.data.acceptor &&
    parsedBody.data.acceptor !== ""
  ) {
    acceptor = parsedBody.data.acceptor;
  }

  if (acceptor == null) {
    console.log(
      "Accept without a acceptor? event = ",
      JSON.stringify(event, null, 4)
    );
    const payload = {
      message: "acceptPlayRequestFailed",
      errorMessage: "Accept Request error You need to tell us a your name",
    };
    send(connectionId, JSON.stringify(payload));

    return callback(null, { statusCode: 400 });
  }

  // lets find the connection id for this name

  getConnections().then((data) => {
    console.log("connections ", data.Items);
    const initiator = data.Items.find((i) => i.connectionId === connectionId);
    console.log("initiator = ", initiator);

    const foundItem = data.Items.find((i) => i.name === opponent);

    console.log("foundItem = ", foundItem);

    if (foundItem != null && initiator != null) {
      //these guys are both inside the lobby so start the game
      createGame(connectionId, foundItem.connectionId).then(() => {
        console.log("after creategame");
        // remove the players from the lobby as they are about
        // to play.

        deleteConnectionId(connectionId).then(() => {
          console.log("after delete connection 1");
          deleteConnectionId(foundItem.connectionId).then(() => {
            console.log("after delete connection 2");

            let payload = {
              message: "startGame",
              data: {
                gameId: `${connectionId}vs${foundItem.connectionId}`,
                initiator: true,
              },
            };

            send(connectionId, JSON.stringify(payload));

            payload.data.initiator = false;

            send(foundItem.connectionId, JSON.stringify(payload));
          });
        });
      });
    }

    callback(null, { statusCode: 200 });
  });
};
