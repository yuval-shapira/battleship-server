import express from "express";
import http from "http";
import { Server } from "socket.io";

import cors from "cors";
import log from "@ajar/marker";

const { PORT, HOST } = process.env;

const app = express();

app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
       origin: "*"
    // origin: "https://dynamic-squirrel-9219c9.netlify.app"
  },
});

io.on("connection", (socket) => {
  console.log("socket connected, ID:", socket.id);
  socket.emit("socket_id", socket.id);
  socket.on("create_a_game", (gameID) => {
    socket.join(gameID);
  });

  socket.on("check_if_can_join_game", (data) => {
    const { gameID, playerID } = data;
    socket.to(gameID).emit("check_if_can_join_game", { playerID });
  })

  socket.on("can_join_the_game", (data) => {
    const { playerID} = data;
    socket.to(playerID).emit("YOU_can_join_the_game");
  }
  );

  socket.on("join_to_existing_game", (data) => {
    const { gameID, playerName } = data;
    const playerID = socket.id;
    socket.join(gameID);
    socket.to(gameID).emit("player2_name", { gameID, playerName, playerID}); // 2 > 1
  });
  socket.on("get_host_name", (data) => {
    const { gameID, playerName, isPlayerReady } = data;
    const playerID = socket.id;
    socket.to(gameID).emit("player1_name", { gameID, playerName, playerID, isPlayerReady }); // 1 > 2
  });

  socket.on("i_am_ready", (gameID) => {
    socket.to(gameID).emit("opponent_is_ready");
  });

  socket.on("my_move", (data) => {
    const { gameID, x, y } = data;
    socket.to(gameID).emit("opponent_played", { gameID, x, y });
  });
  socket.on("my_move_response", ({ gameID, guess, x, y, shipID, isOpponentWon }) => {
    socket.to(gameID).emit("my_move_response", { gameID, guess, x, y, shipID, isOpponentWon });
  });
  socket.on("i_won", () => {
    socket.to(gameID).emit("you_lost")
  }
  );
  socket.on("new_game_request", ({gameID, playerName}) => {
    socket.to(gameID).emit("new_game_req", playerName); 
  }
  );
  socket.on("new_game_response", ({gameID, myResponse}) => {
    socket.to(gameID).emit("new_game_response", (myResponse));
  }
  );
  socket.on("disconnect", () => {
    socket.broadcast.emit("opponent disconnected", socket.id);
    console.log("socket disconnected, ID:", socket.id);
  });
});

app.use((req, res, next) => {
  res.status(404).send(` - 404 - url was not found`);
});

httpServer.listen(PORT, HOST, () => {
  log.magenta(`Server is listening on`, `http://${HOST}:${PORT}`);
});
